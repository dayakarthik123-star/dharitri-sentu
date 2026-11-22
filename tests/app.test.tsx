import { describe, it, expect } from 'vitest';
import {
  attemptDigiLockerConnection,
  buildDocumentVerificationPipeline,
  calculateProjectedScenarioValue,
  canUserAccessRoute,
  checkListingPublicationGate,
  computeDeterministicSha256Hex,
  DIGILOCKER_UNAVAILABLE_MESSAGE,
  getRoleCheckedPriceProjections,
  GOVERNMENT_INTEGRATION_BOUNDARIES,
  MAX_PHOTOS_PER_LISTING,
  validatePhotoBatch,
} from '../src/services/govIntegrationBoundary';
import { getInitialSeedState } from '../src/services/storageService';
import { TRANSLATIONS } from '../src/i18n/translations';
import enJson from '../src/i18n/locales/en.json';
import asJson from '../src/i18n/locales/as.json';
import hiJson from '../src/i18n/locales/hi.json';
import {
  convertFromBigha,
  getBuyerTrustBadge,
  getTrafficLightFromListing,
} from '../src/utils/landUnitsAndBadges';
import {
  isHindiOrHinglish,
  detectQueryLanguage,
  classifyDomainIntent,
  buildStructuredAssistantTurn,
} from '../src/features/voice-assistant/VoiceAssistantPage';
import {
  fetchParcelById,
  fetchMapSourceStatus,
  searchParcelsByDag,
} from '../src/services/cadastralService';
import {
  ESRI_WORLD_IMAGERY_URL,
  OSM_STREETS_URL,
} from '../src/features/parcel-map/InteractiveParcelMap';

describe('Dharitri Sentu Master Upgrade Acceptance Suite (Parts 1–15)', () => {
  it('Part 1 & 6: includes complete translations across locales/en.json, locales/as.json, and locales/hi.json', () => {
    const enKeys = Object.keys(enJson);
    const asKeys = Object.keys(asJson);
    const hiKeys = Object.keys(hiJson);
    expect(enKeys.length).toBeGreaterThanOrEqual(65);
    expect(asKeys.length).toBe(enKeys.length);
    expect(hiKeys.length).toBe(enKeys.length);

    expect(TRANSLATIONS.en.enterDharitriSentu).toBe('Enter Dharitri Sentu →');
    expect(TRANSLATIONS.en.heroDescription).toBe(enJson.heroDescription);
    expect(TRANSLATIONS.as.brandName).toContain('ধৰিত্ৰী সেতু');
    expect(TRANSLATIONS.hi.brandName).toContain('धरित्री सेतु');
  });

  it('Part 2 & 11: configures satellite basemap URLs, Dag search, and unconnected boundary handling', () => {
    expect(ESRI_WORLD_IMAGERY_URL).toContain('arcgisonline.com');
    expect(OSM_STREETS_URL).toContain('openstreetmap.org');
    const dag142 = fetchParcelById('142');
    expect(dag142).toBeDefined();
    expect(dag142?.village_name).toBe('Amingaon');
    const status = fetchMapSourceStatus();
    expect(status.provider).toMatch(/MapTiler|Esri World Imagery/);

    // Searching an unconnected Dag returns empty matches so the UI displays the honest boundary warning
    const unconnected = searchParcelsByDag('999999');
    expect(unconnected.length).toBe(0);
  });

  it('Part 3 & 4: enforces strict role-based route access control for Buyer, Seller, and Official Reviewer', () => {
    // Buyer can access /dashboard/buyer and /price-explorer, but NOT /dashboard/seller, /sell/new, or /admin
    expect(canUserAccessRoute('buyer', '/dashboard/buyer').allowed).toBe(true);
    expect(canUserAccessRoute('buyer', '/price-explorer').allowed).toBe(true);
    expect(canUserAccessRoute('buyer', '/dashboard/seller').allowed).toBe(false);
    expect(canUserAccessRoute('buyer', '/sell/new').allowed).toBe(false);
    expect(canUserAccessRoute('buyer', '/admin').allowed).toBe(false);

    // Seller can access /dashboard/seller and /sell/new, but NOT /dashboard/buyer, /admin, or /price-explorer
    expect(canUserAccessRoute('seller', '/dashboard/seller').allowed).toBe(true);
    expect(canUserAccessRoute('seller', '/sell/new').allowed).toBe(true);
    expect(canUserAccessRoute('seller', '/dashboard/buyer').allowed).toBe(false);
    expect(canUserAccessRoute('seller', '/admin').allowed).toBe(false);
    expect(canUserAccessRoute('seller', '/price-explorer').allowed).toBe(false);

    // Official Reviewer can access /admin, but NOT /dashboard/buyer or /dashboard/seller
    expect(canUserAccessRoute('reviewer', '/admin').allowed).toBe(true);
    expect(canUserAccessRoute('reviewer', '/dashboard/buyer').allowed).toBe(false);
    expect(canUserAccessRoute('reviewer', '/dashboard/seller').allowed).toBe(false);
  });

  it('Part 5: routes multi-intent AI Advisor queries accurately across EN, AS, and HI without misclassifying Assam terms', () => {
    expect(
      isHindiOrHinglish('What is the difference between Eksona and Miyadi patta for 2 bigha dag 412 mutation?')
    ).toBe(false);
    expect(
      detectQueryLanguage('Explain Bigha to Katha conversion and mutation on Dag 142', 'en').code
    ).toBe('en');
    expect(isHindiOrHinglish('Assam mein zameen kharidna hai, patta kaise check karein?')).toBe(true);
    expect(isHindiOrHinglish('असम में ज़मीन कैसे खरीदें?')).toBe(true);

    expect(classifyDomainIntent('Analyze Parcel AS-KMP-001 or Dag 412')).toBe('PARCEL_INSPECTION');
    expect(classifyDomainIntent('Inspect Dag 142 in Amingaon')).toBe('PARCEL_INSPECTION');
    expect(classifyDomainIntent('Difference between Eksona and Miyadi Patta')).toBe('PATTA_COMPARISON');
    expect(classifyDomainIntent('Explain Chapter X Tribal Belt rules under Section 160-162')).toBe('TRIBAL_BELT');
    expect(classifyDomainIntent('How do ASDMA Flood Hazard Zones 1, 2, and 3 work?')).toBe('FLOOD_ZONATION');
    expect(classifyDomainIntent('Convert 2.5 Bigha into Katha, Lessa and Sq. Ft.')).toBe('LAND_UNIT_CALC');
    expect(classifyDomainIntent('How does Mission Basundhara 3.0 online mutation work?')).toBe('MISSION_BASUNDHARA');
    expect(classifyDomainIntent('What documents are in the due diligence buying checklist?')).toBe('BUYING_CHECKLIST');

    const parcelTurn = buildStructuredAssistantTurn('Analyze Parcel AS-KMP-001', 'en');
    expect(parcelTurn.title).toContain('AS-KMP-001');
  });

  it('Part 7 & 8: verifies DigiLocker adapter honesty, deterministic SHA-256 hashing, and 10-stage verification pipeline', () => {
    const digi = attemptDigiLockerConnection();
    expect(digi.connected).toBe(false);
    expect(digi.configured).toBe(false);
    expect(digi.message).toBe(DIGILOCKER_UNAVAILABLE_MESSAGE);

    for (const boundary of GOVERNMENT_INTEGRATION_BOUNDARIES) {
      expect(boundary.connected).toBe(false);
      expect(boundary.statusLabel).toContain('Not Connected');
    }

    const hash1 = computeDeterministicSha256Hex('Jamabandi-Dag-412-Patta-89');
    const hash2 = computeDeterministicSha256Hex('Jamabandi-Dag-412-Patta-89');
    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);

    // 10-stage pipeline with matching area and reviewer approval
    const approvedPipeline = buildDocumentVerificationPipeline({
      title: 'Certified Jamabandi RoR',
      fileType: 'PDF',
      fileSizeKB: 1200,
      sha256Hash: hash1,
      parcelId: 'AS-KMP-001',
      declaredAreaBigha: 2.35,
      recordedAreaBigha: 2.35,
      hasDigitalSignature: true,
      reviewerStatus: 'Approved',
    });
    expect(approvedPipeline.verificationStatus).toBe('Verified by Authorised Reviewer');
    expect(approvedPipeline.stages).toHaveLength(10);
    expect(approvedPipeline.stages[9].status).toBe('Completed');

    // 10-stage pipeline with area discrepancy
    const discrepancyPipeline = buildDocumentVerificationPipeline({
      title: 'Mismatch Jamabandi Extract',
      fileType: 'PDF',
      fileSizeKB: 1400,
      sha256Hash: hash1,
      parcelId: 'AS-KMP-001',
      declaredAreaBigha: 2.5,
      recordedAreaBigha: 2.35,
      hasDigitalSignature: false,
      reviewerStatus: 'Pending',
    });
    expect(discrepancyPipeline.verificationStatus).toBe('Discrepancy Found');
    expect(discrepancyPipeline.stages[5].status).toBe('Flagged');
  });

  it('Part 9: enforces 15-photo limit, file type/size validation, and mandatory listing publication gate', () => {
    expect(MAX_PHOTOS_PER_LISTING).toBe(15);

    // Valid batch of 15 photos
    const valid15 = Array.from({ length: 15 }, (_, i) => ({
      name: `land-photo-${i + 1}.jpg`,
      type: 'image/jpeg',
      sizeBytes: 1024 * 1024, // 1 MB
    }));
    expect(validatePhotoBatch(0, valid15).valid).toBe(true);

    // Rejects 16th photo
    const rejected16 = validatePhotoBatch(15, [
      { name: 'land-photo-16.jpg', type: 'image/jpeg', sizeBytes: 500 * 1024 },
    ]);
    expect(rejected16.valid).toBe(false);
    expect(rejected16.error).toContain('Maximum 15 photos');

    // Rejects oversized photo (> 10 MB)
    const oversized = validatePhotoBatch(1, [
      { name: 'huge.png', type: 'image/png', sizeBytes: 12 * 1024 * 1024 },
    ]);
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toContain('10 MB');

    // Rejects unsupported file type
    const badFormat = validatePhotoBatch(1, [
      { name: 'script.exe', type: 'application/x-msdownload', sizeBytes: 100 * 1024 },
    ]);
    expect(badFormat.valid).toBe(false);

    // Publication gate check
    const state = getInitialSeedState();
    const validListing = state.listings[0];
    expect(checkListingPublicationGate(validListing).canPublish).toBe(true);

    const incompleteListing = {
      ...validListing,
      sellerDeclarationAccepted: false,
      media: [],
    };
    const gateRes = checkListingPublicationGate(incompleteListing);
    expect(gateRes.canPublish).toBe(false);
    expect(gateRes.blockingReasons.length).toBeGreaterThanOrEqual(2);
  });

  it('Part 10: blocks Sellers from future land-value projections while allowing Buyers', () => {
    const sellerResult = getRoleCheckedPriceProjections('seller', 1800000, 6, 10);
    expect(sellerResult.allowed).toBe(false);
    expect(sellerResult.errorCode).toBe('FORBIDDEN_SELLER_ROLE');
    expect(sellerResult.projections).toBeUndefined();

    const buyerResult = getRoleCheckedPriceProjections('buyer', 1800000, 6, 10);
    expect(buyerResult.allowed).toBe(true);
    expect(buyerResult.projections).toBeDefined();
    expect(buyerResult.projections).toHaveLength(11);
    expect(buyerResult.projections?.[10].balancedINR).toBe(
      calculateProjectedScenarioValue(1800000, 6, 10)
    );
  });

  it('Part 12: verifies Assam land unit conversions, buyer badges, and seed data integrity', () => {
    const state = getInitialSeedState();
    expect(state.listings.length).toBeGreaterThanOrEqual(12);
    expect(convertFromBigha(1, 'katha')).toBe(5);
    expect(convertFromBigha(1, 'lessa')).toBe(100);
    expect(convertFromBigha(1, 'sqft')).toBe(14400);
    expect(convertFromBigha(3, 'acre')).toBeCloseTo(0.99, 1);

    const first = state.listings[0];
    const badge = getBuyerTrustBadge(first);
    expect(['Verified Owner', 'Clear Title', 'New Listing']).toContain(badge.label);
    const traffic = getTrafficLightFromListing(first);
    expect(['green', 'yellow', 'red']).toContain(traffic.level);
  });
});
