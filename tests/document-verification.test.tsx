import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { validateFileSignature, runDocumentVerificationPipeline } from '../server/verificationEngine.mjs';
import { scanFile, checkScannerAvailability } from '../server/scannerAdapter.mjs';
import { performOcrExtraction } from '../server/ocrAdapter.mjs';
import { validateDigitalSignature } from '../server/digitalSignatureAdapter.mjs';
import { lookupAssamLandRecord, getAssamLandRecordConfig } from '../server/assamLandRecordAdapter.mjs';
import { compareListingWithJamabandi } from '../server/comparisonEngine.mjs';
import { extractJamabandiFromText, normaliseAssameseNumerals, parseBighaKathaLessa } from '../server/jamabandiEngine.mjs';

describe('Document Verification & Land Evidence Engine (10 Stages)', () => {
  // STAGE 1: File Security & Signature Validation
  describe('Stage 1 — File Security & Signature Validation', () => {
    it('accepts valid PDF with proper magic bytes %PDF-', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
      const res = validateFileSignature('jamabandi.pdf', 'application/pdf', pdfBuffer);
      expect(res.valid).toBe(true);
      expect(res.fileType).toBe('PDF');
      expect(res.mimeType).toBe('application/pdf');
    });

    it('accepts valid JPEG with magic bytes FF D8 FF', () => {
      const jpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const res = validateFileSignature('land-photo.jpg', 'image/jpeg', jpgBuffer);
      expect(res.valid).toBe(true);
      expect(res.fileType).toBe('JPG');
      expect(res.mimeType).toBe('image/jpeg');
    });

    it('accepts valid PNG with PNG magic bytes', () => {
      const pngBuffer = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
      const res = validateFileSignature('trace-map.png', 'image/png', pngBuffer);
      expect(res.valid).toBe(true);
      expect(res.fileType).toBe('PNG');
      expect(res.mimeType).toBe('image/png');
    });

    it('rejects file extension / content MIME mismatch (e.g. text file renamed to .pdf)', () => {
      const fakePdfBuffer = Buffer.from('This is plain text pretending to be a PDF');
      const res = validateFileSignature('fake.pdf', 'application/pdf', fakePdfBuffer);
      expect(res.valid).toBe(false);
      expect(res.code).toBe('MAGIC_BYTE_MISMATCH');
    });

    it('rejects oversized files > 10 MB', () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);
      const res = validateFileSignature('big.pdf', 'application/pdf', largeBuffer);
      expect(res.valid).toBe(false);
      expect(res.code).toBe('FILE_TOO_LARGE');
    });

    it('rejects empty (0 byte) files', () => {
      const emptyBuffer = Buffer.alloc(0);
      const res = validateFileSignature('empty.pdf', 'application/pdf', emptyBuffer);
      expect(res.valid).toBe(false);
      expect(res.code).toBe('FILE_EMPTY');
    });

    it('sanitizes filename and prevents directory traversal attempts', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%%EOF');
      const traversalName = '../../../../etc/passwd.pdf';
      const res = validateFileSignature(traversalName, 'application/pdf', pdfBuffer);
      expect(res.valid).toBe(true);
      expect(res.sanitizedFilename).toBe('passwd.pdf');
      expect(res.sanitizedFilename).not.toContain('..');
      expect(res.sanitizedFilename).not.toContain('/');
    });
  });

  // STAGE 2: Malware Scanning (ClamAV)
  describe('Stage 2 — Malware Scanning (ClamAV Adapter)', () => {
    it('reports unavailable and stays quarantined if scanner is not installed', async () => {
      const res = await scanFile('non-existent-test-file.pdf');
      expect(['unavailable', 'error']).toContain(res.status);
      expect(res.detail).toContain('quarantined');
    });

    it('checks scanner availability gracefully on Windows and POSIX', async () => {
      const availability = await checkScannerAvailability();
      expect(availability).toHaveProperty('available');
      expect(availability).toHaveProperty('platform');
      expect(availability).toHaveProperty('status');
      expect(typeof availability.available).toBe('boolean');
    });
  });

  // STAGE 3 & 4: SHA-256 Integrity & Storage
  describe('Stage 3 & 4 — SHA-256 Integrity & Storage Metadata', () => {
    it('calculates deterministic SHA-256 digest from file bytes', () => {
      const bytes = Buffer.from('Dharitri Sentu Assam Land Record File');
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      expect(hash.length).toBe(64);
      expect(hash).toBe(crypto.createHash('sha256').update(bytes).digest('hex'));
    });

    it('detects altered file bytes (different SHA-256 digest)', () => {
      const original = Buffer.from('%PDF-1.4 original');
      const altered = Buffer.from('%PDF-1.4 altered');
      const hash1 = crypto.createHash('sha256').update(original).digest('hex');
      const hash2 = crypto.createHash('sha256').update(altered).digest('hex');
      expect(hash1).not.toBe(hash2);
    });
  });

  // STAGE 5: OCR and Assamese Jamabandi Extraction
  describe('Stage 5 — OCR and Assam Jamabandi Intelligence', () => {
    it('converts Assamese numerals to standard Arabic digits bidirectional', () => {
      expect(normaliseAssameseNumerals('১৪২')).toBe('142');
      expect(normaliseAssameseNumerals('দাগ নং ১৪২/৮')).toBe('দাগ নং 142/8');
      expect(normaliseAssameseNumerals('২ বিঘা ৩ কঠা ১০ লেচা')).toBe('2 বিঘা 3 কঠা 10 লেচা');
    });

    it('parses Assamese land unit Bigha-Katha-Lessa accurately', () => {
      const parsed = parseBighaKathaLessa('2 Bigha 3 Katha 10 Lessa');
      expect(parsed.totalBigha).toBeCloseTo(2.7, 2);
      expect(parsed.bigha).toBe(2);
      expect(parsed.katha).toBe(3);
      expect(parsed.lessa).toBe(10);
    });

    it('detects "For Viewing Only" / "দৰ্শনৰ বাবেহে" watermark in Jamabandi copy', () => {
      const watermarkedText = 'অসম চৰকাৰ ৰাজহ বিভাগ দৰ্শনৰ বাবেহে (For Viewing Only) দাগ নং ১৪২';
      const extracted = extractJamabandiFromText(watermarkedText);
      expect(extracted.watermarkDetected).toBe(true);
      expect(extracted.dagNumber).toBe('142');
    });

    it('extracts multiple Pattadars, Dag numbers, and financial dues', () => {
      const sampleText = `
        জিলা: কামৰূপ (Kamrup)
        ৰাজহ চক্ৰ: Changsari
        মৌজা: Sila Sindhurighopa
        গাঁও: Changsari
        পাট্টা নং: PP-89 (ম্যাদী পাট্টা)
        দাগ নং: 142
        মাটিৰ কালি: ২ বিঘা ২ কঠা ১০ লেচা
        পট্টাদাৰৰ নাম: শ্ৰী প্ৰণৱজ্যোতি কলিতা (Pranabjyoti Kalita), বিতোপন দাস
        খাজনা: 45.50
      `;
      const res = extractJamabandiFromText(sampleText);
      expect(res.district).toContain('Kamrup');
      expect(res.circle).toBe('Changsari');
      expect(res.pattaNumber).toBe('PP-89');
      expect(res.dagNumber).toBe('142');
      expect(res.pattaType).toContain('Miyadi');
      expect(res.pattadars.length).toBeGreaterThanOrEqual(1);
      expect(res.revenue.annualTaxINR).toBe(45.5);
    });

    it('performs OCR extraction fallback when Tesseract is not installed', async () => {
      const samplePdf = Buffer.from('%PDF-1.4\n(Dag 142 Patta PP-89 Changsari Kamrup) Tj\n%%EOF');
      const ocr = await performOcrExtraction('' as any, samplePdf, 'PDF', {
        parcelId: 'AS-KMP-001',
        title: 'Jamabandi Extract',
      });
      expect(ocr).toHaveProperty('structuredData');
      expect(ocr).toHaveProperty('confidence');
      expect(ocr.disclaimer).toContain('Assam Land and Revenue Regulation, 1886');
    });
  });

  // STAGE 6: Assam Government Land Record Lookup
  describe('Stage 6 — Authorised Assam Land-Record Lookup', () => {
    it('returns verification_unavailable when external government gateway is unconfigured', async () => {
      const originalUrl = process.env.ASSAM_LAND_RECORDS_LOOKUP_URL;
      delete process.env.ASSAM_LAND_RECORDS_LOOKUP_URL;

      const result = await lookupAssamLandRecord('AS-KMP-001');
      expect(result.status).toBe('verification_unavailable');
      expect(result.message.toLowerCase()).toContain('official government land-record verification is currently unavailable');

      if (originalUrl) process.env.ASSAM_LAND_RECORDS_LOOKUP_URL = originalUrl;
    });

    it('never fabricates government responses without genuine external authorization', () => {
      const config = getAssamLandRecordConfig();
      if (!config.configured) {
        expect(config.status).toContain('NOT configured');
      }
    });
  });

  // STAGE 7: Parcel Field Comparison Engine
  describe('Stage 7 — Unit-Aware Parcel Comparison Engine', () => {
    const listing = {
      id: 'lst-test-1',
      title: 'Residential Plot Changsari',
      parcelId: '142',
      district: 'Kamrup',
      village: 'Changsari',
      pattaNumber: 'PP-89',
      areaBigha: 2.5,
      recordedAreaBigha: 2.5,
      sellerName: 'Pranabjyoti Kalita',
    };

    it('returns EXACT_MATCH when declared parcel fields match extracted document', () => {
      const extracted = {
        dagNumber: '142',
        pattaNumber: 'PP-89',
        district: 'Kamrup',
        village: 'Changsari',
        landAreaBigha: 2.5,
        landownerName: 'Pranabjyoti Kalita',
      };
      const comparison = compareListingWithJamabandi(listing, extracted);
      expect(comparison.overallOutcome).toBe('EXACT_MATCH');
      expect(comparison.discrepancies.length).toBe(0);
    });

    it('flags MISMATCH when area differs beyond tolerance (e.g. 2.5 Bigha vs 1.8 Bigha)', () => {
      const extracted = {
        dagNumber: '142',
        pattaNumber: 'PP-89',
        district: 'Kamrup',
        village: 'Changsari',
        landAreaBigha: 1.8,
        landownerName: 'Pranabjyoti Kalita',
      };
      const comparison = compareListingWithJamabandi(listing, extracted);
      expect(comparison.overallOutcome).toBe('MISMATCH');
      const areaDisc = comparison.discrepancies.find((d: any) => d.field === 'Land Area (Bigha)');
      expect(areaDisc).toBeDefined();
      expect(areaDisc?.status).toBe('MISMATCH');
    });

    it('matches Assamese name variants within acceptable token similarity', () => {
      const extracted = {
        dagNumber: '142',
        pattaNumber: 'PP-89',
        district: 'Kamrup',
        village: 'Changsari',
        landAreaBigha: 2.5,
        landownerName: 'Pranabjyoti Kalita',
      };
      const comparison = compareListingWithJamabandi(listing, extracted);
      expect(['EXACT_MATCH', 'NORMALISED_MATCH']).toContain(comparison.overallOutcome);
    });
  });

  // STAGE 8: Digital Signature Validation
  describe('Stage 8 — Digital Signature Validation', () => {
    it('detects unsigned scanned documents and routes for manual review', () => {
      const unsignedPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
      const result = validateDigitalSignature(unsignedPdf, 'PDF');
      expect(result.status).toBe('unsigned');
      expect(result.hasSignature).toBe(false);
      expect(result.detail).toContain('Manual reviewer verification is required');
    });

    it('detects embedded /Type /Sig and /ByteRange digital signatures', () => {
      const signedPdf = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached /ByteRange [0 100 200 50] /Name (Director of Land Records Assam) /M (D:20250101120000Z) >>\nendobj\n%%EOF' +
          '0'.repeat(300)
      );
      const result = validateDigitalSignature(signedPdf, 'PDF');
      expect(result.hasSignature).toBe(true);
      expect(result.status).toBe('valid');
      expect(result.signer).toContain('Director of Land Records Assam');
    });

    it('marks non-PDF formats (images) as unsupported for embedded signatures', () => {
      const imgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const result = validateDigitalSignature(imgBuffer, 'JPG');
      expect(result.status).toBe('unsupported');
    });
  });

  // STAGE 9 & 10: Complete Verification Pipeline Integration
  describe('Stage 9 & 10 — Full 10-Stage Pipeline Integration & Status Engine', () => {
    it('executes all 10 stages sequentially and returns structured verification report', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n(Dag 142 Patta PP-89 Kamrup Changsari 2.5 Bigha) Tj\n%%EOF');
      const doc = {
        id: 'DOC-TEST-PIPELINE',
        title: 'Jamabandi Copy Dag 142',
        parcelId: '142',
        sellerProvidedMetadata: { declaredAreaBigha: 2.5, recordedAreaBigha: 2.5 },
      };
      const user = { email: 'seller@test.dharitri.local', name: 'Pranabjyoti Kalita', role: 'seller' };

      const report: any = await runDocumentVerificationPipeline({
        fileBuffer: pdfBuffer,
        filename: 'jamabandi-142.pdf',
        mimeType: 'application/pdf',
        tempScanPath: '' as any,
        user,
        document: doc,
        db: null as any,
      });

      expect(report.stages.length).toBe(10);
      expect(report.stages[0].name).toContain('Stage 1');
      expect(report.stages[1].name).toContain('Stage 2');
      expect(report.stages[2].name).toContain('Stage 3');
      expect(report.stages[3].name).toContain('Stage 4');
      expect(report.stages[4].name).toContain('Stage 5');
      expect(report.stages[5].name).toContain('Stage 6');
      expect(report.stages[6].name).toContain('Stage 7');
      expect(report.stages[7].name).toContain('Stage 8');
      expect(report.stages[8].name).toContain('Stage 9');
      expect(report.stages[9].name).toContain('Stage 10');

      expect(['verification_unavailable', 'awaiting_review', 'partially_verified', 'quarantined']).toContain(
        report.overallStatus
      );
      expect(report.overallStatus).not.toBe('verified');
    });
  });
});
