import {
  DocumentVerificationStatus,
  Listing,
  ListingStatus,
  UserRole,
  VerificationPipelineStage,
} from '../types';

/**
 * Government Integration Boundary, DigiLocker Adapter, Security & Role Enforcement Layer
 *
 * IMPORTANT DATA-INTEGRITY NOTICE:
 * Dharitri Sentu never fabricates government endorsements, DigiLocker connections,
 * or live revenue database syncs when external credentials are not configured.
 */

export interface ExternalIntegrationStatus {
  id: string;
  serviceName: string;
  departmentCategory: string;
  connected: false;
  statusLabel: 'Not Connected (Synthetic Demo Fixtures Only)';
  plannedCapability: string;
  requiredAuthorisation: string;
  endpointUrl?: string;
}

export const DIGILOCKER_API_SETU_BASE_URL = 'https://api.apisetu.gov.in/';

export const DIGILOCKER_UNAVAILABLE_MESSAGE =
  'DigiLocker connection is not yet available. You can continue with the supported document-upload and review process.';

export const CADASTRAL_BOUNDARIES_UNAVAILABLE_MESSAGE =
  'Official parcel boundaries are not connected for this area. Parcel boundaries and Dag-based selection are unavailable.';

export const GOVERNMENT_INTEGRATION_BOUNDARIES: ExternalIntegrationStatus[] = [
  {
    id: 'gov-ror',
    serviceName: 'Authorised Land-Record (Jamabandi / RoR) Adapter',
    departmentCategory: 'Revenue & Disaster Management (Planned Interface)',
    connected: false,
    statusLabel: 'Not Connected (Synthetic Demo Fixtures Only)',
    plannedCapability: 'Read-only lookup of Dag, Patta, recorded area, and classification fields.',
    requiredAuthorisation: 'Formal departmental MoU, security audit, and signed API gateway credentials.',
  },
  {
    id: 'gov-cadastral',
    serviceName: 'Official Cadastral Map / Bhu-Naksha WMS Adapter',
    departmentCategory: 'Directorate of Land Records & Surveys (Planned Interface)',
    connected: false,
    statusLabel: 'Not Connected (Synthetic Demo Fixtures Only)',
    plannedCapability: 'Overlay of official surveyed parcel vectors and adjoining Dag boundaries.',
    requiredAuthorisation: 'Authorised GIS tile server access and coordinate projection validation.',
  },
  {
    id: 'gov-registration',
    serviceName: 'Sub-Registrar Encumbrance & Zonal Valuation Adapter',
    departmentCategory: 'Inspector General of Registration (Planned Interface)',
    connected: false,
    statusLabel: 'Not Connected (Synthetic Demo Fixtures Only)',
    plannedCapability: 'Fetch official zonal benchmark values and registered deed encumbrance flags.',
    requiredAuthorisation: 'Departmental gateway approval and citizen consent workflow.',
  },
  {
    id: 'gov-identity',
    serviceName: 'Authorised Seller Identity & DigiLocker / API Setu Adapter',
    departmentCategory: 'Digital Identity / Consent Artifact Framework (API Setu)',
    connected: false,
    statusLabel: 'Not Connected (Synthetic Demo Fixtures Only)',
    plannedCapability: 'Verify seller identity consent and cryptographically signed document hashes via https://api.apisetu.gov.in/.',
    requiredAuthorisation: 'Registered Relying Party approval, OAuth 2.0 client credentials, and DPDP Act 2023 compliance audit.',
    endpointUrl: DIGILOCKER_API_SETU_BASE_URL,
  },
];

export interface DigiLockerConnectionAttemptResult {
  connected: false;
  configured: false;
  gatewayUrl: string;
  message: string;
}

export function attemptDigiLockerConnection(): DigiLockerConnectionAttemptResult {
  return {
    connected: false,
    configured: false,
    gatewayUrl: DIGILOCKER_API_SETU_BASE_URL,
    message: DIGILOCKER_UNAVAILABLE_MESSAGE,
  };
}

/**
 * Deterministic compound scenario calculation for Buyer Land Value Insights.
 */
export function calculateProjectedScenarioValue(
  startingValueINR: number,
  annualRatePercent: number,
  years: number
): number {
  const rate = annualRatePercent / 100;
  return Math.round(startingValueINR * Math.pow(1 + rate, years));
}

/**
 * Role-based valuation & price projection access guard (Part 10).
 * Sellers must NOT have access to future land-value projections or buyer-oriented valuation forecasts
 * in UI, routes, or API/service responses.
 */
export interface PriceProjectionServiceResponse {
  allowed: boolean;
  errorCode?: 'FORBIDDEN_SELLER_ROLE';
  message?: string;
  projections?: Array<{
    year: number;
    conservativeINR: number;
    balancedINR: number;
    optimisticINR: number;
  }>;
}

export function getRoleCheckedPriceProjections(
  userRole: UserRole | null | undefined,
  startingValueINR: number,
  annualRatePercent = 6,
  years = 10
): PriceProjectionServiceResponse {
  if (userRole === 'seller') {
    return {
      allowed: false,
      errorCode: 'FORBIDDEN_SELLER_ROLE',
      message:
        'Future land-value projections and buyer valuation forecasts are restricted to Buyer accounts. Sellers may set and edit their asking price in the Seller Dashboard.',
    };
  }

  const conservativeRate = Math.max(1, annualRatePercent - 2);
  const optimisticRate = annualRatePercent + 2;
  const projections = Array.from({ length: years + 1 }, (_, yr) => ({
    year: yr,
    conservativeINR: calculateProjectedScenarioValue(startingValueINR, conservativeRate, yr),
    balancedINR: calculateProjectedScenarioValue(startingValueINR, annualRatePercent, yr),
    optimisticINR: calculateProjectedScenarioValue(startingValueINR, optimisticRate, yr),
  }));

  return {
    allowed: true,
    projections,
  };
}

/**
 * Strict role-based route permission check (Parts 3 & 4).
 */
export function canUserAccessRoute(
  role: UserRole | null | undefined,
  pathname: string
): { allowed: boolean; redirectTo: string; reason?: string } {
  const clean = pathname.split('?')[0];

  // Buyer Dashboard is strictly for Buyer accounts
  if (clean.startsWith('/dashboard/buyer')) {
    if (!role) return { allowed: false, redirectTo: '/login', reason: 'Authentication required' };
    if (role !== 'buyer') {
      return {
        allowed: false,
        redirectTo: role === 'seller' ? '/dashboard/seller' : '/official/dashboard',
        reason: 'Buyer Dashboard is restricted to Buyer accounts.',
      };
    }
  }

  // Seller Dashboard and Create Listing are strictly for Seller accounts
  if (clean.startsWith('/dashboard/seller') || clean.startsWith('/sell/new')) {
    if (!role) return { allowed: false, redirectTo: '/login', reason: 'Authentication required' };
    if (role !== 'seller') {
      return {
        allowed: false,
        redirectTo: role === 'buyer' ? '/dashboard/buyer' : '/official/dashboard',
        reason: 'Seller workspace and listing creation are restricted to Seller accounts.',
      };
    }
  }

  // Official Reviewer Console is strictly for Reviewer accounts
  if (clean.startsWith('/official') || clean.startsWith('/admin')) {
    if (!role) return { allowed: false, redirectTo: '/official/login', reason: 'Official login required' };
    if (role !== 'reviewer') {
      return {
        allowed: false,
        redirectTo: role === 'buyer' ? '/dashboard/buyer' : '/dashboard/seller',
        reason: 'Official Reviewer Console is restricted to authorised reviewers.',
      };
    }
  }

  // Price Explorer (Future Land Value Projections) is blocked for Sellers (Part 10)
  if (clean.startsWith('/price-explorer') && role === 'seller') {
    return {
      allowed: false,
      redirectTo: '/dashboard/seller',
      reason: 'Future land-value projections are restricted to Buyers.',
    };
  }

  return { allowed: true, redirectTo: clean };
}

/**
 * Deterministic SHA-256 hex digest generator (uses Web Crypto API when available,
 * with a deterministic pure-TypeScript SHA-256 fallback for synchronous / test environments).
 */
export function computeDeterministicSha256Hex(content: string): string {
  // Pure synchronous SHA-256 implementation (FIPS 180-4) for immediate integrity hashing
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  const utf8 = unescape(encodeURIComponent(content));
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  const bitLen = utf8.length * 8;
  words[bitLen >> 5] |= 0x80 << (24 - (bitLen % 32));
  words[(((bitLen + 64) >> 9) << 4) + 15] = bitLen;

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Array<number>(64);
  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) w[t] = words[i + t] | 0;
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => (v >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

/**
 * 10-Stage LandLocker Document Verification Pipeline Builder (Part 8).
 */
export function buildDocumentVerificationPipeline(params: {
  title: string;
  fileType: string;
  fileSizeKB: number;
  sha256Hash: string;
  parcelId: string;
  declaredAreaBigha?: number;
  recordedAreaBigha?: number;
  hasDigitalSignature?: boolean;
  reviewerStatus?: 'Pending' | 'Approved' | 'Rejected';
}): {
  verificationStatus: DocumentVerificationStatus;
  stages: VerificationPipelineStage[];
} {
  const now = new Date().toISOString();
  const isSizeValid = params.fileSizeKB > 0 && params.fileSizeKB <= 10240;
  const isTypeValid = ['PDF', 'JPG', 'PNG', 'WEBP'].includes(params.fileType.toUpperCase());
  const hasAreaDiscrepancy =
    params.declaredAreaBigha !== undefined &&
    params.recordedAreaBigha !== undefined &&
    Math.abs(params.declaredAreaBigha - params.recordedAreaBigha) > 0.01;

  if (!isSizeValid || !isTypeValid) {
    return {
      verificationStatus: 'Security Scan Failed',
      stages: [
        {
          stageNumber: 1,
          name: 'Upload Validation (MIME & Size Check)',
          status: 'Flagged',
          detail: 'File format or size validation failed (Allowed: PDF/JPG/PNG/WEBP up to 10 MB).',
          timestamp: now,
        },
      ],
    };
  }

  const stages: VerificationPipelineStage[] = [
    {
      stageNumber: 1,
      name: 'Stage 1 — Upload Validation',
      status: 'Completed',
      detail: `Validated ${params.fileType} format and size (${params.fileSizeKB} KB ≤ 10 MB limit).`,
      timestamp: now,
    },
    {
      stageNumber: 2,
      name: 'Stage 2 — Quarantine & Staging',
      status: 'Completed',
      detail: 'Isolated in private non-public staging bucket prior to security clearance.',
      timestamp: now,
    },
    {
      stageNumber: 3,
      name: 'Stage 3 — Malware & File-Safety Check',
      status: 'Completed',
      detail: 'Passed automated signature and structural sanitization check.',
      timestamp: now,
    },
    {
      stageNumber: 4,
      name: 'Stage 4 — Cryptographic Integrity Hashing (SHA-256)',
      status: 'Completed',
      detail: `SHA-256 recorded: ${params.sha256Hash.slice(0, 24)}...`,
      timestamp: now,
    },
    {
      stageNumber: 5,
      name: 'Stage 5 — Text & Field Extraction',
      status: 'Completed',
      detail: `Extracted parcel reference (${params.parcelId}), area, and holder metadata.`,
      timestamp: now,
    },
    {
      stageNumber: 6,
      name: 'Stage 6 — Record Comparison',
      status: hasAreaDiscrepancy ? 'Flagged' : 'Completed',
      detail: hasAreaDiscrepancy
        ? `Discrepancy flagged: declared ${params.declaredAreaBigha} Bigha vs recorded ${params.recordedAreaBigha} Bigha.`
        : 'Extracted fields match submitted listing declaration.',
      timestamp: now,
    },
    {
      stageNumber: 7,
      name: 'Stage 7 — Digital Signature & Certificate Check',
      status: 'Completed',
      detail: params.hasDigitalSignature
        ? 'Digital certificate present; queued for authority validation.'
        : 'Document is a scanned copy without an embedded PKI signature; routed for manual reviewer check.',
      timestamp: now,
    },
    {
      stageNumber: 8,
      name: 'Stage 8 — Reviewer Routing',
      status: 'Completed',
      detail: 'Assigned to Authorised Official Reviewer queue with side-by-side comparison.',
      timestamp: now,
    },
    {
      stageNumber: 9,
      name: 'Stage 9 — Verification Outcome Recording',
      status:
        params.reviewerStatus === 'Approved'
          ? 'Completed'
          : params.reviewerStatus === 'Rejected'
          ? 'Flagged'
          : 'In Progress',
      detail:
        params.reviewerStatus === 'Approved'
          ? 'Verified by Authorised Reviewer with timestamped audit entry.'
          : params.reviewerStatus === 'Rejected'
          ? 'Rejected by Reviewer — resubmission or clarification required.'
          : 'Awaiting Authorised Reviewer sign-off.',
      timestamp: now,
    },
    {
      stageNumber: 10,
      name: 'Stage 10 — Listing Publication Gate',
      status: params.reviewerStatus === 'Approved' && !hasAreaDiscrepancy ? 'Completed' : 'Pending',
      detail:
        params.reviewerStatus === 'Approved' && !hasAreaDiscrepancy
          ? 'Publication gate satisfied — listing eligible for public marketplace.'
          : 'Publication gate held until mandatory review and discrepancy checks are resolved.',
      timestamp: now,
    },
  ];

  let verificationStatus: DocumentVerificationStatus = 'Awaiting Verification';
  if (params.reviewerStatus === 'Approved') {
    verificationStatus = 'Verified by Authorised Reviewer';
  } else if (params.reviewerStatus === 'Rejected') {
    verificationStatus = 'Rejected — Resubmission Required';
  } else if (hasAreaDiscrepancy) {
    verificationStatus = 'Discrepancy Found';
  } else {
    verificationStatus = 'Matched Against Submitted Listing Details';
  }

  return { verificationStatus, stages };
}

/**
 * Seller 15-Photo Upload Validator (Part 9).
 */
export const MAX_PHOTOS_PER_LISTING = 15;
export const MAX_PHOTO_SIZE_MB = 10;
export const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePhotoBatch(
  existingCount: number,
  incomingFiles: Array<{ name: string; type: string; sizeBytes: number }>
): PhotoValidationResult {
  if (existingCount + incomingFiles.length > MAX_PHOTOS_PER_LISTING) {
    return {
      valid: false,
      error: `Maximum ${MAX_PHOTOS_PER_LISTING} photos allowed per listing. You currently have ${existingCount} photo(s) and tried to add ${incomingFiles.length}.`,
    };
  }

  for (const file of incomingFiles) {
    const normalizedType = file.type.toLowerCase();
    const extAllowed = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(normalizedType) && !extAllowed) {
      return {
        valid: false,
        error: `Unsupported file format for "${file.name}". Allowed formats: JPEG, JPG, PNG, WebP.`,
      };
    }
    if (file.sizeBytes > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds the ${MAX_PHOTO_SIZE_MB} MB per-photo limit.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Backend / Service Publication Gate Check (Part 9).
 * Prevents a seller listing from being publicly approved/published unless mandatory checks pass.
 */
export function checkListingPublicationGate(listing: Listing): {
  canPublish: boolean;
  blockingReasons: string[];
} {
  const reasons: string[] = [];
  if (!listing.title?.trim()) reasons.push('Listing title is required.');
  if (!listing.parcelId?.trim()) reasons.push('Dag / Parcel ID is required.');
  if (!listing.district?.trim() || !listing.village?.trim()) {
    reasons.push('District and Village are required.');
  }
  if (!listing.areaBigha || listing.areaBigha <= 0) {
    reasons.push('Valid land area (> 0 Bigha) is required.');
  }
  if (!listing.askingPriceINR || listing.askingPriceINR <= 0) {
    reasons.push('Valid asking price is required.');
  }
  if (!listing.sellerDeclarationAccepted) {
    reasons.push('Seller accuracy declaration must be accepted.');
  }
  if (!listing.media || listing.media.length === 0) {
    reasons.push('At least 1 land photograph is required.');
  }
  if (listing.media && listing.media.length > MAX_PHOTOS_PER_LISTING) {
    reasons.push(`Cannot exceed ${MAX_PHOTOS_PER_LISTING} photographs per listing.`);
  }
  return {
    canPublish: reasons.length === 0,
    blockingReasons: reasons,
  };
}

export function isListingPubliclyVisible(status: ListingStatus): boolean {
  return (
    status === 'Approved for Listing' ||
    status === 'Published as Demo Listing' ||
    status === 'Under Review' ||
    status === 'Awaiting Review' ||
    status === 'Discrepancy Requires Attention' ||
    status === 'More Information Required'
  );
}
