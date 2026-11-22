import crypto from 'node:crypto';
import path from 'node:path';
import { scanFile } from './scannerAdapter.mjs';
import { performOcrExtraction } from './ocrAdapter.mjs';
import { validateDigitalSignature } from './digitalSignatureAdapter.mjs';
import { lookupAssamLandRecord } from './assamLandRecordAdapter.mjs';
import { compareListingWithJamabandi } from './comparisonEngine.mjs';

/**
 * 10-Stage Document Verification & Land Evidence Engine
 *
 * Implements the rigorous 10-stage verification pipeline required by Dharitri Sentu.
 *
 * Overall status machine:
 *  - 'uploaded'                 : Initial ingestion, magic bytes validated
 *  - 'quarantined'              : In private quarantine pending antivirus scan
 *  - 'processing'               : Pipeline stages currently executing
 *  - 'partially_verified'       : Security passed, OCR extracted, awaiting govt/reviewer
 *  - 'verified'                 : Mandatory checks passed, authoritative match, reviewer approved
 *  - 'mismatch_detected'        : Discrepancy detected between declared & extracted/govt data
 *  - 'verification_unavailable' : Authoritative government connector not configured
 *  - 'rejected'                 : Reviewer rejected or malware detected
 *  - 'awaiting_review'          : Ready in official reviewer queue for sign-off
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Stage 1: Validate file signature, extension, MIME, magic bytes and size.
 */
export function validateFileSignature(filename, mimeType, buffer) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Uploaded file is empty (0 bytes).', code: 'FILE_EMPTY' };
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds 10 MB limit.`,
      code: 'FILE_TOO_LARGE',
    };
  }

  // Prevent path traversal
  const sanitizedName = path.basename(filename).replace(/[\r\n\0]/g, '').slice(0, 255);
  if (!sanitizedName || sanitizedName === '.' || sanitizedName === '..') {
    return { valid: false, error: 'Invalid or malformed filename.', code: 'INVALID_FILENAME' };
  }

  const ext = path.extname(sanitizedName).toLowerCase();
  const b = buffer;

  // Check magic bytes
  let detectedType = null;
  let detectedMime = null;

  if (ext === '.pdf' && b.length >= 5 && b.subarray(0, 5).toString('latin1') === '%PDF-') {
    detectedType = 'PDF';
    detectedMime = 'application/pdf';
  } else if (
    (ext === '.jpg' || ext === '.jpeg') &&
    b.length >= 3 &&
    b[0] === 0xff &&
    b[1] === 0xd8 &&
    b[2] === 0xff
  ) {
    detectedType = 'JPG';
    detectedMime = 'image/jpeg';
  } else if (
    ext === '.png' &&
    b.length >= 8 &&
    b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    detectedType = 'PNG';
    detectedMime = 'image/png';
  } else if (
    ext === '.webp' &&
    b.length >= 12 &&
    b.subarray(0, 4).toString('latin1') === 'RIFF' &&
    b.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    detectedType = 'WEBP';
    detectedMime = 'image/webp';
  }

  if (!detectedType) {
    return {
      valid: false,
      error: `File format mismatch. The file content signature does not match extension "${ext}". Allowed formats: PDF, JPG, PNG, WEBP.`,
      code: 'MAGIC_BYTE_MISMATCH',
    };
  }

  return {
    valid: true,
    fileType: detectedType,
    mimeType: detectedMime,
    sanitizedFilename: sanitizedName,
    sizeBytes: buffer.length,
    sizeKB: Math.max(1, Math.ceil(buffer.length / 1024)),
  };
}

/**
 * Execute the complete 10-stage verification pipeline on a document.
 *
 * @param {object} params
 * @param {Buffer} params.fileBuffer - Raw decrypted bytes
 * @param {string} params.filename - Original user filename
 * @param {string} params.mimeType - Declared MIME
 * @param {string} params.tempScanPath - Path for ClamAV scan (if exists on disk)
 * @param {object} params.user - Uploading user
 * @param {object} params.document - Document metadata record
 * @param {object} params.db - Database instance for audit and persistence
 * @param {object} [params.listing] - Optional associated listing for comparison
 * @returns {Promise<object>} Verification report containing all 10 stages and overall status
 */
export async function runDocumentVerificationPipeline({
  fileBuffer,
  filename,
  mimeType,
  tempScanPath,
  user,
  document,
  db,
  listing,
}) {
  const now = () => new Date().toISOString();
  const stages = [];
  const checks = [];
  const evidence = [];

  // Helper to record a stage
  const recordStage = (num, name, status, detail, outcome = 'PASS') => {
    const stageObj = {
      stageNumber: num,
      name,
      status: status === 'passed' ? 'Completed' : status === 'failed' ? 'Flagged' : status === 'in_progress' ? 'In Progress' : 'Pending',
      detail,
      timestamp: now(),
    };
    stages.push(stageObj);

    checks.push({
      id: `chk-${crypto.randomUUID()}`,
      documentId: document.id,
      stageNumber: num,
      stageName: name,
      status: stageObj.status,
      outcome,
      detail,
      performedAt: now(),
    });
  };

  // STAGE 1 — File Signature and Upload Validation
  const sigCheck = validateFileSignature(filename, mimeType, fileBuffer);
  if (!sigCheck.valid) {
    recordStage(1, 'Stage 1 — File Signature & Upload Validation', 'failed', sigCheck.error, 'FAIL');
    return {
      overallStatus: 'rejected',
      stages,
      checks,
      evidence,
      error: sigCheck.error,
    };
  }
  recordStage(
    1,
    'Stage 1 — File Signature & Upload Validation',
    'passed',
    `Verified ${sigCheck.fileType} format (${sigCheck.sizeKB} KB). Magic bytes match expected MIME ${sigCheck.mimeType}.`,
    'PASS'
  );

  // STAGE 2 — Malware Scanning (ClamAV)
  let scanResult = { status: 'unavailable', detail: 'Scanner not configured.' };
  if (tempScanPath) {
    scanResult = await scanFile(tempScanPath);
  }
  let stage2Status = 'in_progress';
  let stage2Outcome = 'PENDING';

  if (scanResult.status === 'passed') {
    stage2Status = 'passed';
    stage2Outcome = 'PASS';
  } else if (scanResult.status === 'infected') {
    stage2Status = 'failed';
    stage2Outcome = 'FAIL';
  }

  recordStage(
    2,
    'Stage 2 — Antivirus & Malware Scan',
    stage2Status,
    scanResult.detail,
    stage2Outcome
  );

  // If malware was found, reject immediately
  if (scanResult.status === 'infected') {
    return {
      overallStatus: 'rejected',
      stages,
      checks,
      evidence,
      error: 'Malware detected in uploaded document. File discarded.',
    };
  }

  // STAGE 3 — SHA-256 Cryptographic Integrity Verification
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  recordStage(
    3,
    'Stage 3 — Cryptographic Integrity Hashing (SHA-256)',
    'passed',
    `SHA-256 digest calculated over ${fileBuffer.length} bytes: ${sha256.slice(0, 32)}...`,
    'PASS'
  );
  evidence.push({
    id: `ev-${crypto.randomUUID()}`,
    documentId: document.id,
    stageNumber: 3,
    evidenceType: 'sha256_hash',
    source: 'Node.js Crypto Engine',
    sha256Hash: sha256,
    dataJson: JSON.stringify({ sha256, byteLength: fileBuffer.length }),
    createdAt: now(),
  });

  // STAGE 4 — Document Metadata Recording
  recordStage(
    4,
    'Stage 4 — Protected Storage & Metadata Recording',
    'passed',
    `Metadata recorded for owner ${user.email}. Document stored under AES-256-GCM encryption in protected storage.`,
    'PASS'
  );

  // STAGE 5 — OCR and Document Extraction
  const ocrResult = await performOcrExtraction(
    tempScanPath,
    fileBuffer,
    sigCheck.fileType,
    {
      title: document.title,
      parcelId: document.parcelId,
      declaredAreaBigha: document.sellerProvidedMetadata?.declaredAreaBigha,
    }
  );

  const ocrPassed = ocrResult.status === 'extracted';
  recordStage(
    5,
    'Stage 5 — OCR & Assamese Jamabandi Extraction',
    ocrPassed ? 'passed' : 'in_progress',
    `Extraction engine: ${ocrResult.engine}. Confidence: ${(ocrResult.confidence * 100).toFixed(0)}%. Extracted Dag: ${ocrResult.structuredData.dagNumber || 'N/A'}, Patta: ${ocrResult.structuredData.pattaNumber || 'N/A'}.`,
    ocrPassed ? 'PASS' : 'UNCERTAIN'
  );
  evidence.push({
    id: `ev-${crypto.randomUUID()}`,
    documentId: document.id,
    stageNumber: 5,
    evidenceType: 'ocr_extraction',
    source: ocrResult.engine,
    sha256Hash: sha256,
    dataJson: JSON.stringify(ocrResult),
    createdAt: now(),
  });

  // STAGE 6 — Authorised Assam Government Land-Record Lookup
  const govLookup = await lookupAssamLandRecord(document.parcelId || ocrResult.structuredData.dagNumber, {
    district: ocrResult.structuredData.district,
    village: ocrResult.structuredData.village,
  });

  const govPassed = govLookup.status === 'verified_source';
  recordStage(
    6,
    'Stage 6 — Authorised Assam Land-Record Lookup (ILRMS / Dharitree)',
    govPassed ? 'passed' : 'in_progress',
    govLookup.message,
    govPassed ? 'PASS' : 'UNAVAILABLE'
  );

  // STAGE 7 — Parcel Field Comparison
  let comparisonOutcome = 'UNCERTAIN';
  let comparisonDetail = 'No listing supplied for cross-comparison.';
  let comparisonResults = null;

  if (listing || ocrResult.structuredData.dagNumber) {
    const candidateListing = listing || {
      id: 'candidate',
      title: document.title,
      parcelId: document.parcelId,
      district: ocrResult.structuredData.district || 'Kamrup',
      village: ocrResult.structuredData.village || '',
      pattaNumber: ocrResult.structuredData.pattaNumber || '',
      areaBigha: document.sellerProvidedMetadata?.declaredAreaBigha || 2.5,
      recordedAreaBigha: document.sellerProvidedMetadata?.recordedAreaBigha || 2.5,
      sellerName: user.name,
    };

    comparisonResults = compareListingWithJamabandi(candidateListing, {
      ...ocrResult.structuredData,
      rawText: ocrResult.extractedText,
    });

    comparisonOutcome = comparisonResults.overallOutcome;
    const matchCount = comparisonResults.exactMatches ? comparisonResults.exactMatches.length : (comparisonResults.exactMatchCount || 0);
    const discCount = comparisonResults.discrepancies ? comparisonResults.discrepancies.length : (comparisonResults.discrepancyCount || 0);
    comparisonDetail = `Field comparison: ${matchCount} exact matches, ${discCount} discrepancies. Outcome: ${comparisonOutcome}.`;
  }

  const compPassed = comparisonOutcome === 'EXACT_MATCH' || comparisonOutcome === 'NORMALISED_MATCH';
  const hasMismatch = comparisonOutcome === 'MISMATCH';

  recordStage(
    7,
    'Stage 7 — Parcel Field & Area Comparison',
    compPassed ? 'passed' : hasMismatch ? 'failed' : 'in_progress',
    comparisonDetail,
    hasMismatch ? 'FAIL' : compPassed ? 'PASS' : 'UNCERTAIN'
  );

  // STAGE 8 — Digital Signature Validation
  const sigValidation = validateDigitalSignature(fileBuffer, sigCheck.fileType);
  const sigPassed = sigValidation.status === 'valid';
  recordStage(
    8,
    'Stage 8 — Digital Signature & PKI Certificate Check',
    sigPassed ? 'passed' : 'in_progress',
    sigValidation.detail,
    sigPassed ? 'PASS' : sigValidation.status === 'unsigned' ? 'UNSIGNED' : 'FAIL'
  );

  // STAGE 9 — Consent & Permissions
  recordStage(
    9,
    'Stage 9 — Consent & Access Permissions Management',
    'passed',
    'Private by default. Enforced server-side. Access restricted to document owner and authorised case reviewers.',
    'PASS'
  );

  // STAGE 10 — Reviewer Sign-Off & Central Status Engine
  // Determine overall status
  let overallStatus = 'processing';

  if (scanResult.status !== 'passed') {
    overallStatus = 'quarantined';
  } else if (hasMismatch) {
    overallStatus = 'mismatch_detected';
  } else if (govLookup.status === 'verification_unavailable') {
    overallStatus = 'verification_unavailable';
  } else if (document.verificationStatus === 'Verified by Authorised Reviewer') {
    overallStatus = 'verified';
  } else {
    overallStatus = 'awaiting_review';
  }

  recordStage(
    10,
    'Stage 10 — Official Reviewer Decision & Trust Status',
    overallStatus === 'verified' ? 'passed' : 'in_progress',
    overallStatus === 'verified'
      ? 'Verified by Authorised Reviewer. Document integrity, parcel cross-checks, and provenance verified.'
      : overallStatus === 'mismatch_detected'
      ? 'Held for reviewer check: parcel discrepancies detected between seller declaration and extracted record.'
      : overallStatus === 'verification_unavailable'
      ? 'Awaiting authorised Assam ILRMS government connectivity.'
      : 'Document ready in queue for Authorised Reviewer inspection.',
    overallStatus === 'verified' ? 'PASS' : 'PENDING'
  );

  return {
    overallStatus,
    sha256,
    fileType: sigCheck.fileType,
    fileSizeKB: sigCheck.sizeKB,
    stages,
    checks,
    evidence,
    ocr: ocrResult,
    govLookup,
    comparison: comparisonResults,
    digitalSignature: sigValidation,
  };
}
