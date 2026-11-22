export type Language = 'en' | 'as' | 'hi';

export type UserRole = 'buyer' | 'seller' | 'reviewer';

export type AreaUnit = 'bigha' | 'acre' | 'katha' | 'lessa' | 'sqft' | 'hectare';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  district?: string;
  createdAt: string;
}

export type LandType =
  | 'Agricultural Land'
  | 'Tea Garden Land'
  | 'Residential Plot'
  | 'Rural Homestead'
  | 'Commercial Land';

export type ListingStatus =
  | 'Draft'
  | 'Documents Needed'
  | 'Upload Received'
  | 'Security Check'
  | 'Awaiting Review'
  | 'Additional Information Required'
  | 'Under Review'
  | 'Discrepancy Requires Attention'
  | 'Approved for Listing'
  | 'Rejected with Reason'
  | 'Withdrawn'
  | 'Submitted'
  | 'More Information Required'
  | 'Published as Demo Listing'
  | 'Rejected';

export type PassportCheckStatus =
  | 'Not Checked'
  | 'Evidence Supplied'
  | 'Matched Against Demo Data'
  | 'Mismatch Found'
  | 'Pending Authorised Review'
  | 'Reviewed in Demo'
  | 'Unable to Determine';

export type DocumentVerificationStatus =
  | 'Uploaded — Security Scan Pending'
  | 'Security Scan Passed'
  | 'Security Scan Failed'
  | 'Integrity Hash Recorded'
  | 'Awaiting Verification'
  | 'Under Reviewer Check'
  | 'Matched Against Submitted Listing Details'
  | 'Discrepancy Found'
  | 'Verified by Authorised Reviewer'
  | 'Rejected — Resubmission Required';

export interface VerificationPipelineStage {
  stageNumber: number;
  name: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Flagged';
  detail: string;
  timestamp?: string;
}

export interface GeoPoint {
  x: number; // SVG 0-1000 coordinate
  y: number; // SVG 0-600 coordinate
  lat: number;
  lng: number;
}

export interface ParcelFieldComparison {
  field: string;
  sellerSubmittedValue: string;
  demoReferenceValue: string;
  sourceLabel: string;
  sourceTimestamp: string;
  status: PassportCheckStatus;
  explanation: string;
}

export interface DiscrepancyCase {
  id: string;
  parcelId: string;
  listingId: string;
  field: string;
  sellerValue: string;
  sellerSourceLabel: string;
  referenceValue: string;
  referenceSourceLabel: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Open — Requires Review' | 'Evidence Requested' | 'Reviewed in Demo' | 'Resolved in Demo';
  explanation: string;
  recommendedNextStep: string;
  reviewerNotes: Array<{
    id: string;
    author: string;
    note: string;
    timestamp: string;
  }>;
  updatedAt: string;
}

export interface ChecklistTask {
  id: string;
  titleKey: string;
  title: string;
  responsibleRole: UserRole;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Needs Attention';
  note: string;
  evidenceReference: string;
  updatedAt: string;
}

export interface DueDiligenceCase {
  id: string;
  parcelId: string;
  listingId: string;
  buyerEmail: string;
  sellerEmail: string;
  status: 'In Progress' | 'Pending Reviewer' | 'Completed in Demo';
  createdAt: string;
  updatedAt: string;
  summaryNote: string;
  tasks: ChecklistTask[];
  timeline: Array<{
    id: string;
    actor: string;
    role: UserRole;
    action: string;
    timestamp: string;
  }>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  listingId: string;
  senderId: string;
  recipientId: string;
  senderRole: UserRole;
  senderName?: string;
  senderEmail?: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  listingTitle: string;
  parcelId: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  messages: ChatMessage[];
}

export interface EnquiryReply {
  id: string;
  conversationId?: string;
  listingId?: string;
  senderId?: string;
  recipientId?: string;
  senderEmail: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  content?: string;
  timestamp: string;
  createdAt?: string;
  readAt?: string | null;
}

export interface Enquiry {
  id: string;
  conversationId?: string;
  listingId: string;
  parcelId: string;
  listingTitle: string;
  buyerId?: string;
  sellerId?: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone?: string;
  sellerEmail: string;
  sellerName?: string;
  subject: string;
  message: string;
  status: 'Sent' | 'Replied' | 'Follow-up Requested';
  createdAt: string;
  replies: EnquiryReply[];
}

export interface SiteVisit {
  id: string;
  propertyName: string;
  parcelId: string;
  location: string;
  dateTime: string;
  visitType: 'Physical Meeting' | '360° Virtual Tour' | 'Physical On-Site Visit';
  status: 'Confirmed' | 'Confirmed by Seller' | 'Pending Confirmation' | 'Completed' | 'Rescheduled' | 'Cancelled';
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone?: string;
  meetingPoint: string;
  notes?: string;
}

export type LandLockerCategory =
  | 'Sale Deed (Demo)'
  | 'Jamabandi / Patta Extract (Demo)'
  | 'Trace Map / Sketch (Demo)'
  | 'Encumbrance Statement (Demo)'
  | 'Seller Declaration (Demo)'
  | 'Revenue Tax Receipt'
  | 'Mutation Order'
  | 'Identity / Authority Proof';

export interface LandLockerDocument {
  id: string;
  title: string;
  category: LandLockerCategory;
  parcelId: string;
  ownerEmail: string;
  fileType: 'PDF' | 'JPG' | 'PNG' | 'WEBP';
  fileSizeKB: number;
  uploadedAt: string;
  status: 'Private' | 'Shared with Buyer' | 'Shared with Reviewer' | 'Access Revoked';
  verificationStatus?: DocumentVerificationStatus;
  sha256Hash?: string;
  /** Present for actual files stored by the backend; absent for sample/demo metadata. */
  fileId?: string;
  scanStatus?: 'Passed' | 'Pending' | 'Scan Error' | 'Demo Only';
  sellerProvidedMetadata?: { declaredAreaBigha?: number; recordedAreaBigha?: number; declaresDigitalSignature?: boolean };
  extractedFields?: {
    dagNumber?: string;
    pattaNumber?: string;
    recordedAreaBigha?: number;
    holderName?: string;
    district?: string;
    village?: string;
    digitalSignatureStatus?: 'Present (Verified Certificate)' | 'Not Digitally Signed (Requires Manual Review)';
  };
  pipelineStages?: VerificationPipelineStage[];
  sharedWithEmails: string[];
  consentExpiresAt?: string;
  previewSummary: string;
  consentHistory: Array<{
    id: string;
    action: 'Uploaded' | 'Shared' | 'Viewed' | 'Access Revoked' | 'Verified' | 'Hash Recorded';
    actorEmail: string;
    targetEmail?: string;
    timestamp: string;
    note: string;
  }>;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: UserRole;
  actionType: string;
  targetId: string;
  summary: string;
}

export interface ListingMedia {
  id: string;
  url: string;
  caption: string;
  type: 'photo' | 'panorama360' | 'sketch';
  sourceLabel: string;
  isCover?: boolean;
  widthPx?: number;
  heightPx?: number;
  fileSizeKB?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Server-assigned encrypted storage identifier; absent for local demo media. */
  fileId?: string;
  /** Malware scan state. Only Passed media can be served publicly. */
  scanStatus?: 'Passed' | 'Pending' | 'Scan Error';
  /** SHA-256 of the original uploaded file bytes. */
  sha256Hash?: string;
}

export interface Listing {
  id: string;
  parcelId: string;
  dagNumber?: string;
  title: string;
  district: string;
  village: string;
  circle?: string;
  pattaNumber?: string;
  pattaType?: 'Miyadi (Periodic)' | 'Eksona (Annual)';
  landType: LandType;
  areaBigha: number;
  recordedAreaBigha: number;
  askingPriceINR: number;
  benchmarkRatePerBighaINR: number;
  status: ListingStatus;
  rejectionReason?: string;
  sellerEmail: string;
  sellerName: string;
  description: string;
  roadAccess: string;
  floodRiskNote: string;
  sellerDeclarationAccepted: boolean;
  submittedAt: string;
  featured: boolean;
  polygonPoints: string; // SVG polygon points on parcel map
  mapCenter: GeoPoint;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: 'precise_parcel' | 'approximate_village' | 'pending';
  media: ListingMedia[];
  passportSummary: {
    matchedCount: number;
    discrepancyCount: number;
    pendingCount: number;
    notCheckedCount: number;
    overallStatus: PassportCheckStatus;
    lastReviewedAt: string;
    comparisons: ParcelFieldComparison[];
  };
}

export interface VerificationCheckRecord {
  id: string;
  document_id: string;
  stage_number: number;
  stage_name: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Flagged';
  outcome: 'PASS' | 'FAIL' | 'PENDING' | 'UNCERTAIN' | 'UNSIGNED' | 'UNAVAILABLE';
  detail: string;
  performed_at: string;
}

export interface VerificationEvidenceRecord {
  id: string;
  document_id: string;
  stage_number?: number;
  evidence_type: string;
  source: string;
  sha256_hash?: string;
  data_json: string;
  created_at: string;
}

export interface DocumentConsentRecord {
  id: string;
  document_id: string;
  granter_user_id: string;
  grantee_user_id: string;
  grantee_email: string;
  scope: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
  revoked_at?: string;
}

export interface IntegrationDiagnostics {
  antivirus: {
    available: boolean;
    platform: string;
    binaryPath: string | null;
    signatures: { available: boolean; path: string | null };
    status: string;
    version?: string;
    message: string;
  };
  ocr: {
    binaryPath: string | null;
    tessdataDir: string;
    availableLangs: string[];
    hasEnglish: boolean;
    hasAssamese: boolean;
  };
  setuDigiLocker: {
    configured: boolean;
    baseUrl: string;
    clientIdMasked: string;
    productInstanceId: string;
    status: string;
  };
  assamLandRecords: {
    configured: boolean;
    endpointUrl: string | null;
    status: string;
  };
  encryption: {
    active: boolean;
    algorithm: string;
    mode: string;
  };
  database: {
    path: string;
    type: string;
    status: string;
  };
}
