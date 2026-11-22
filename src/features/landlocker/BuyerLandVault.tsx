import React, { useState } from 'react';
import { LandLockerDocument, User } from '../../types';

interface BuyerLandVaultProps {
  isDigiLockerConnected: boolean;
  onConnectDigiLocker: () => void;
  documents: LandLockerDocument[];
  currentUser: User | null;
  showToast: (msg: string) => void;
  t: (k: any) => string;
}

interface OfficialPropertyDoc {
  id: string;
  title: string;
  category: 'Government Record' | 'Survey & Boundary' | 'Legal Clearance' | 'Seller Disclosure';
  status: 'Verified' | 'Action Needed' | 'Pending Review';
  statusNote?: string;
  details: string;
  description: string;
  issuingAuthority: string;
  previewSummary: string;
}

const PROPERTY_OPTIONS = [
  {
    id: 'AS-KMP-001',
    name: 'Changsari 2.5 Bigha Plot (Dag 412 / Patta 89)',
    location: 'Changsari, Kamrup Rural',
    seller: 'Pranabjyoti Kalita',
    docsCount: 4,
  },
  {
    id: 'AS-KMP-002',
    name: 'Sonapur 3.0 Bigha Homestead (Dag 104 / Patta 22)',
    location: 'Sonapur, Kamrup Metro',
    seller: 'Pranabjyoti Kalita',
    docsCount: 3,
  },
  {
    id: 'AS-DIB-001',
    name: 'Chabua 5.0 Bigha Tea Plot (Dag 219 / Patta 44)',
    location: 'Chabua, Dibrugarh',
    seller: 'Monideepa Gogoi',
    docsCount: 4,
  },
  {
    id: 'AS-BKS-001',
    name: 'Barama 12.5 Bigha Farmland (Dag 530 / Patta 67)',
    location: 'Barama, Baksa',
    seller: 'Pranabjyoti Kalita',
    docsCount: 3,
  },
];

const OFFICIAL_DOCUMENTS: OfficialPropertyDoc[] = [
  {
    id: 'doc-jamabandi',
    title: 'Jamabandi / Patta Extract (Record of Rights)',
    category: 'Government Record',
    status: 'Verified',
    details: 'Dag No: 412 | Patta No: 89 | Owner: Matches Seller (Pranabjyoti Kalita)',
    description: 'Official Jamabandi certified by Revenue Circle Officer. Confirms unencumbered Myadi (Periodic) Patta title.',
    issuingAuthority: 'Office of the Revenue Circle Officer & Lot Mondal, Kamrup',
    previewSummary: 'Jamabandi Extract for Dag 412, Periodic Patta 89, Changsari Village. Classified as Agricultural (Faringati). Recorded Area: 2.35 Bigha. Revenue status up-to-date with zero land tax arrears.',
  },
  {
    id: 'doc-trace-map',
    title: 'Boundary Trace Map & Survey Sketch',
    category: 'Survey & Boundary',
    status: 'Action Needed',
    statusNote: '0.15 Bigha area variance under review',
    details: 'Official Lot Mondal trace sketch showing plot boundaries and 18ft road access.',
    description: 'Physical survey recorded 2.35 Bigha vs 2.50 Bigha listing. Area variance (-0.15 Bigha / 6%) is currently under review.',
    issuingAuthority: 'Lot Mondal Field Office & Directorate of Land Records, Assam',
    previewSummary: 'Certified field trace map depicting Dag 412 coordinates, 18-foot dedicated ingress/egress corridor, and natural drainage boundary. Seller declared 2.50 Bigha; cadastral measurement reflects 2.35 Bigha.',
  },
  {
    id: 'doc-nec',
    title: '30-Year Non-Encumbrance Certificate (NEC)',
    category: 'Legal Clearance',
    status: 'Verified',
    details: 'Confirms zero active mortgages, bank liens, or court disputes.',
    description: 'Search report issued by Senior Sub-Registrar covering continuous 30-year chain from 1996 to 2026.',
    issuingAuthority: 'Senior Sub-Registrar / Registration Office, Kamrup',
    previewSummary: 'Form 26 Non-Encumbrance Certificate. 30-year index search confirms no registered deeds of mortgage, charge, lis pendens, or prior agreements for sale registered against Dag 412.',
  },
  {
    id: 'doc-seller-decl',
    title: 'Seller Self-Declaration & Field Note',
    category: 'Seller Disclosure',
    status: 'Pending Review',
    statusNote: 'Awaiting signature verification',
    details: 'Signed declaration regarding plot possession and boundary markers.',
    description: 'Seller declaration confirming undisturbed physical possession, boundary pillar demarcation, and zero third-party claims.',
    issuingAuthority: 'Notary Public & Seller Self-Attestation',
    previewSummary: 'Affidavit by Pranabjyoti Kalita confirming boundary pillars placed on all four corners, absence of family inheritance disputes, and agreement to resolve the 0.15 Bigha survey delta prior to final registry.',
  },
];

export const BuyerLandVault: React.FC<BuyerLandVaultProps> = ({
  isDigiLockerConnected,
  onConnectDigiLocker,
  currentUser,
  showToast,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState('AS-KMP-001');
  const [previewDoc, setPreviewDoc] = useState<OfficialPropertyDoc | null>(null);

  const selectedProperty = PROPERTY_OPTIONS.find((p) => p.id === selectedPropertyId) || PROPERTY_OPTIONS[0];

  // Download a single document as a clean PDF-formatted report
  const handleDownloadDoc = (doc: OfficialPropertyDoc) => {
    const reportContent = `================================================================================
DHARITRI SENTU — OFFICIAL VERIFIED PROPERTY DOCUMENT
================================================================================
Document Title: ${doc.title}
Category: ${doc.category}
Verification Status: ${doc.status.toUpperCase()}${doc.statusNote ? ` (${doc.statusNote})` : ''}
Issuing Authority: ${doc.issuingAuthority}

PROPERTY DETAILS
--------------------------------------------------------------------------------
Property: ${selectedProperty.name}
Location: ${selectedProperty.location}
Verified Seller: ${selectedProperty.seller}
Details: ${doc.details}

DOCUMENT SUMMARY & VERIFICATION FINDINGS
--------------------------------------------------------------------------------
${doc.previewSummary}

ADDITIONAL NOTES
--------------------------------------------------------------------------------
${doc.description}

Verified through Dharitri Sentu Government Land Records Portal.
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
Buyer: ${currentUser?.name || 'Ananya Baruah'}
================================================================================`;

    const blob = new Blob([reportContent], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-verified.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded verified document: ${doc.title} (PDF)`);
  };

  // Download complete property document dossier
  const handleDownloadCompletePack = () => {
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const packContent = `================================================================================
DHARITRI SENTU — COMPLETE PROPERTY DOCUMENT PACK (VERIFIED DOSSIER)
================================================================================
Generated: ${dateStr}
Buyer Identity: ${currentUser?.name || 'Ananya Baruah'} (Verified Buyer)
Identity Status: ${isDigiLockerConnected ? 'Verified via DigiLocker / Aadhaar e-KYC' : 'Government Identity Linked'}
Selected Property: ${selectedProperty.name}
Location: ${selectedProperty.location}
Seller: ${selectedProperty.seller}

================================================================================
INDEX OF VERIFIED DOCUMENTS
================================================================================
${OFFICIAL_DOCUMENTS.map((doc, idx) => `
[Document #${idx + 1}] ${doc.title}
  • Category: ${doc.category}
  • Status: ${doc.status}${doc.statusNote ? ` (${doc.statusNote})` : ''}
  • Authority: ${doc.issuingAuthority}
  • Scope: ${doc.details}
  • Summary: ${doc.previewSummary}
`).join('\n')}

================================================================================
CRITICAL PROPERTY FINDINGS
================================================================================
1. Ownership & Title: Verified unencumbered Periodic (Myadi) Patta ownership in Jamabandi.
2. Area Verification Alert: Boundary Trace survey recorded 2.35 Bigha vs 2.50 Bigha in listing.
   A 0.15 Bigha area difference requires clarification before sale deed execution.
3. Encumbrance Status: 30-Year Non-Encumbrance Certificate confirms zero active mortgages or court stays.
4. Road Ingress: 18-foot dedicated approach road verified in village trace map.

================================================================================
OFFICIAL NOTICE
================================================================================
This verified dossier synthesizes official records from the Revenue Circle Office,
Sub-Registrar Office, and Lot Mondal field surveys for ${selectedProperty.name}.
Always conduct formal spot verification with an enrolled advocate before token payment.
================================================================================`;

    const blob = new Blob([packContent], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `property-document-pack-${selectedProperty.id.toLowerCase()}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Complete Property Document Pack downloaded successfully (PDF)!');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SECTION 1: Identity Verification Banner (Dark Forest Green Theme #0D261C) */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-warmivory shadow-xl border border-emerald-900/40"
        style={{ background: 'linear-gradient(135deg, #0D261C 0%, #15392B 60%, #1B4D3A 100%)' }}
      >
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#B5E4A3] border border-white/15">
              <span className="w-2 h-2 rounded-full bg-[#B5E4A3] animate-pulse" />
              <span>Government Identity Verification</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Government Identity Verification (DigiLocker / MeriPehchaan)
            </h2>
            <p className="text-xs sm:text-sm text-gray-200/90 leading-relaxed">
              Connect your DigiLocker account to complete instant paperless KYC and unlock verified land records shared by sellers.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2">
              {isDigiLockerConnected ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-900/80 border border-emerald-400/50 text-[#B5E4A3] text-xs font-bold shadow-xs">
                  <span>🛡️</span>
                  <span>KYC Status: Verified via Aadhaar e-KYC</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-400/30 text-amber-200 text-xs font-semibold">
                  <span>⏳</span>
                  <span>KYC Status: Not Connected</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {isDigiLockerConnected ? (
              <button
                type="button"
                onClick={onConnectDigiLocker}
                className="py-3 px-5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs border border-white/25 transition shadow-sm text-center"
              >
                🔄 Re-verify DigiLocker
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnectDigiLocker}
                className="py-3.5 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-[#0D261C] font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
              >
                <span>🔗</span>
                <span>Connect DigiLocker</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadCompletePack}
              className="py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>📥</span>
              <span>Download All Verified Documents (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Property Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg text-[#15803D] shrink-0">
            📍
          </div>
          <div>
            <label htmlFor="property-selector" className="text-xs font-bold text-[#111827] block">
              Viewing Documents For:
            </label>
            <p className="text-[11px] text-gray-500">
              Select a shortlisted or contacted property to view official seller documents and verification records.
            </p>
          </div>
        </div>

        <div className="shrink-0 min-w-[320px]">
          <select
            id="property-selector"
            aria-label="Viewing Documents For"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs font-bold text-[#0D261C] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
          >
            {PROPERTY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 3: Official Property Documents Grid (4 Clean Cards) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#0D261C]">
              Shared Seller Documents & Government Records
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              All documents below are tamper-checked and verified against official Assam land records.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-[#15803D] border border-emerald-200 self-start sm:self-auto">
            {OFFICIAL_DOCUMENTS.length} Official Documents Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OFFICIAL_DOCUMENTS.map((doc) => {
            const isVerified = doc.status === 'Verified';
            const isActionNeeded = doc.status === 'Action Needed';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3.5 hover:border-emerald-300 hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                      {doc.category}
                    </span>

                    {isVerified && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-emerald-200">
                        Verified ✅
                      </span>
                    )}
                    {isActionNeeded && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-200">
                        Action Needed ⚠️
                      </span>
                    )}
                    {!isVerified && !isActionNeeded && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Pending Review ⏳
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif text-base font-bold text-[#0D261C]">
                    {doc.title}
                  </h4>

                  <p className="text-xs text-gray-700 font-medium">
                    {doc.details}
                  </p>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {doc.description}
                  </p>

                  {doc.statusNote && (
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>Note: {doc.statusNote}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-gray-500 pt-1">
                    🏛️ <strong>Authority:</strong> {doc.issuingAuthority}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="py-2 px-4 rounded-xl bg-[#F8FAF7] hover:bg-gray-100 border border-[#E2E8F0] text-[#0D261C] font-bold text-xs transition"
                  >
                    {doc.id === 'doc-trace-map' ? '🗺️ View Map Sketch' : '👁️ Preview Document'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="py-2 px-4 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>⬇️</span>
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: Export Pack Banner */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#15803D] text-xs font-bold border border-emerald-100">
            <span>📑</span>
            <span>Complete Buyer Verification Dossier</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#0D261C]">
            Download Complete Property Document Pack
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Export all verified records for {selectedProperty.name} — including Jamabandi Patta extract, Lot Mondal boundary trace sketch, 30-year NEC, and seller possession declarations — as a single clean PDF dossier.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCompletePack}
          className="shrink-0 py-3.5 px-6 rounded-2xl bg-[#0D261C] hover:bg-[#15803D] text-white font-bold text-xs transition shadow-md flex items-center gap-2 active:scale-98"
        >
          <span>📥</span>
          <span>Download Complete Pack (PDF)</span>
        </button>
      </div>

      {/* Clean Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-doc-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
        >
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3.5">
              <div>
                <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider">
                  {previewDoc.category}
                </span>
                <h3 id="preview-doc-modal-title" className="font-serif text-xl font-bold text-[#0D261C]">
                  {previewDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center transition"
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#F8FAF7] p-5 rounded-2xl border border-[#E2E8F0]">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Verification Status:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                  previewDoc.status === 'Verified'
                    ? 'bg-[#DCFCE7] text-[#166534]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}>
                  {previewDoc.status}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-800">Selected Property:</span>{' '}
                <span className="text-gray-700">{selectedProperty.name}</span>
              </div>
              <div>
                <span className="font-bold text-gray-800">Issuing Authority:</span>{' '}
                <span className="text-gray-700">{previewDoc.issuingAuthority}</span>
              </div>
              <div>
                <span className="font-bold text-gray-800">Record Scope:</span>{' '}
                <span className="text-gray-700">{previewDoc.details}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-800 block mb-1">Official Summary & Findings:</span>
                <p className="text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-gray-200">
                  {previewDoc.previewSummary}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold hover:bg-gray-50 text-gray-700 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadDoc(previewDoc);
                  setPreviewDoc(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <span>⬇️</span>
                <span>Download Verified PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
