import React, { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { User } from '../../types';
import { Upload, FileText, Shield, Eye, Lock, Globe, AlertTriangle, CheckCircle2, Clock, Trash2, RefreshCw } from 'lucide-react';

interface SellerLandVaultProps {
  currentUser: User | null;
  onConnectDigiLocker: () => void;
  isDigiLockerConnected: boolean;
}

interface SellerDocument {
  id: string;
  title: string;
  category: string;
  propertyId: string;
  propertyName: string;
  dagPatta: string;
  status: 'Verified' | 'Action Needed' | 'In Review';
  statusNote?: string;
  privacy: 'Shared with Verified Buyers' | 'Shared' | 'Private';
  uploadedDate: string;
  fileSize: string;
  summary: string;
}

interface BuyerPermission {
  id: string;
  buyerName: string;
  buyerTag: string;
  buyerEmail: string;
  property: string;
  propertyId: string;
  documentsShared: string[];
  grantedDate: string;
  expiresIn: string;
}

const INITIAL_SELLER_DOCS: SellerDocument[] = [
  {
    id: 's-doc-1',
    title: 'Jamabandi / Patta Extract (Record of Rights)',
    category: 'Government Record',
    propertyId: 'AS-KMP-001',
    propertyName: 'Changsari 2.5 Bigha Plot',
    dagPatta: 'Dag 412 / Patta 89',
    status: 'Verified',
    privacy: 'Shared with Verified Buyers',
    uploadedDate: 'Oct 14, 2026',
    fileSize: '1.8 MB (PDF)',
    summary: 'Official Jamabandi extract certified by Kamrup Revenue Circle Officer. Confirms undisputed Periodic (Myadi) Patta ownership in seller’s name (Pranabjyoti Kalita).',
  },
  {
    id: 's-doc-2',
    title: 'Boundary Trace Sketch & Survey Map',
    category: 'Survey & Demarcation',
    propertyId: 'AS-KMP-001',
    propertyName: 'Changsari 2.5 Bigha Plot',
    dagPatta: 'Dag 412 / Patta 89',
    status: 'Action Needed',
    statusNote: '0.15 Bigha area variance under review',
    privacy: 'Shared',
    uploadedDate: 'Oct 18, 2026',
    fileSize: '3.2 MB (PDF)',
    summary: 'Cadastral trace sketch by Lot Mondal. Noted physical survey of 2.35 Bigha vs 2.50 Bigha listing. Area rectification survey pending with Circle Surveyor.',
  },
  {
    id: 's-doc-3',
    title: 'Registered Sale Deed (Original Chain of Title)',
    category: 'Legal Title',
    propertyId: 'AS-KMP-002',
    propertyName: 'Sonapur 3.0 Bigha Homestead Plot',
    dagPatta: 'Dag 104 / Patta 22',
    status: 'In Review',
    statusNote: 'Under Senior Sub-Registrar review',
    privacy: 'Private',
    uploadedDate: 'Oct 22, 2026',
    fileSize: '4.5 MB (PDF)',
    summary: 'Registered conveyance deed registered at Sonapur Sub-Registry in 2012. Confirms clean prior chain of title and zero third-party mortgages.',
  },
];

const INITIAL_PERMISSIONS: BuyerPermission[] = [
  {
    id: 'perm-1',
    buyerName: 'Ananya Baruah',
    buyerTag: 'Verified KYC Buyer',
    buyerEmail: 'ananya.baruah@email.test',
    property: 'Changsari 2.5 Bigha Plot (Dag 412 / Patta 89)',
    propertyId: 'AS-KMP-001',
    documentsShared: ['Jamabandi Extract', 'Boundary Trace Sketch'],
    grantedDate: 'Oct 19, 2026',
    expiresIn: 'In 7 Days',
  },
  {
    id: 'perm-2',
    buyerName: 'Ramen Das',
    buyerTag: 'Verified Buyer',
    buyerEmail: 'ramen.das@email.test',
    property: 'Changsari 2.5 Bigha Plot (Dag 412 / Patta 89)',
    propertyId: 'AS-KMP-001',
    documentsShared: ['Jamabandi Extract'],
    grantedDate: 'Oct 20, 2026',
    expiresIn: 'In 12 Days',
  },
  {
    id: 'perm-3',
    buyerName: 'Barun Bora',
    buyerTag: 'Verified Buyer',
    buyerEmail: 'barun.bora@email.test',
    property: 'Sonapur 3.0 Bigha Homestead Plot (Dag 104 / Patta 22)',
    propertyId: 'AS-KMP-002',
    documentsShared: ['Jamabandi Extract'],
    grantedDate: 'Oct 21, 2026',
    expiresIn: 'In 14 Days',
  },
];

export const SellerLandVault: React.FC<SellerLandVaultProps> = ({
  currentUser,
  onConnectDigiLocker,
  isDigiLockerConnected,
}) => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'documents' | 'permissions'>('documents');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [documents, setDocuments] = useState<SellerDocument[]>(INITIAL_SELLER_DOCS);
  const [permissions, setPermissions] = useState<BuyerPermission[]>(INITIAL_PERMISSIONS);
  const [previewDoc, setPreviewDoc] = useState<SellerDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [privacyModalDoc, setPrivacyModalDoc] = useState<SellerDocument | null>(null);

  // New Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Jamabandi / Patta Extract');
  const [uploadPropertyId, setUploadPropertyId] = useState('AS-KMP-001');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const filteredDocs =
    selectedPropertyFilter === 'all'
      ? documents
      : documents.filter((d) => d.propertyId === selectedPropertyFilter);

  const handleRevokePermission = (permId: string, buyerName: string) => {
    setPermissions((prev) => prev.filter((p) => p.id !== permId));
    showToast(`Revoked document access permissions for ${buyerName}.`);
  };

  const handleUpdatePrivacy = (docId: string, newPrivacy: SellerDocument['privacy']) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, privacy: newPrivacy } : d))
    );
    setPrivacyModalDoc(null);
    showToast(`Updated document privacy setting to: ${newPrivacy}`);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      showToast('Please enter a document title');
      return;
    }

    const newDoc: SellerDocument = {
      id: `s-doc-${Date.now()}`,
      title: uploadTitle,
      category: uploadCategory,
      propertyId: uploadPropertyId,
      propertyName: uploadPropertyId === 'AS-KMP-001' ? 'Changsari 2.5 Bigha Plot' : 'Sonapur 3.0 Bigha Homestead Plot',
      dagPatta: uploadPropertyId === 'AS-KMP-001' ? 'Dag 412 / Patta 89' : 'Dag 104 / Patta 22',
      status: 'In Review',
      statusNote: 'Submitted for verification',
      privacy: 'Private',
      uploadedDate: 'Just Now',
      fileSize: uploadFile ? `${Math.round(uploadFile.size / 1024)} KB (PDF)` : '1.5 MB (PDF)',
      summary: `Uploaded land record document for ${uploadTitle}. Verification team will review within 24 hours.`,
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadFile(null);
    showToast(`Document "${uploadTitle}" uploaded successfully! Verification scheduled.`);
  };

  const handleDownloadDoc = (doc: SellerDocument) => {
    const reportContent = `================================================================================
DHARITRI SENTU — SELLER LANDLOCKER RECORD EXTRACT
================================================================================
Document Title: ${doc.title}
Property: ${doc.propertyName} (${doc.dagPatta})
Category: ${doc.category}
Verification Status: ${doc.status}${doc.statusNote ? ` (${doc.statusNote})` : ''}
Privacy Setting: ${doc.privacy}
Uploaded: ${doc.uploadedDate}
Seller: ${currentUser?.name || 'Pranabjyoti Kalita'}

DOCUMENT SUMMARY & DETAILS
--------------------------------------------------------------------------------
${doc.summary}

Issued under Assam Land & Revenue Regulation · Dharitri Sentu Trust Network
================================================================================`;

    const blob = new Blob([reportContent], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded verified document: ${doc.title} (PDF)`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span>Seller Workspace</span>
            <span>&gt;</span>
            <span className="text-[#15803D] font-bold">LandLocker</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            LandLocker — My Property Documents &amp; Privacy
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-3xl">
            Upload your official land records once, get them verified to earn the &apos;Verified Plot&apos; badge, and control which buyers can view them.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onConnectDigiLocker}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-gray-50 border border-[#E2E8F0] text-[#0D261C] font-bold text-xs transition shadow-xs flex items-center gap-2"
          >
            <span>🏛️</span>
            <span>{isDigiLockerConnected ? 'DigiLocker Linked ✅' : 'Fetch from DigiLocker'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="py-2.5 px-5 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white font-bold text-xs transition shadow-sm flex items-center gap-2 active:scale-98"
          >
            <span>+</span>
            <span>Upload New Document</span>
          </button>
        </div>
      </div>

      {/* 3 Clean Stat Cards (Zero Technical Jargon) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#15803D] border border-emerald-100 flex items-center justify-center text-lg shrink-0">
            📄
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500">Uploaded Documents</div>
            <div className="text-2xl font-black text-[#0D261C] mt-0.5">{documents.length}</div>
            <div className="text-[11px] text-gray-500">Grouped across your listed plots</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center text-lg shrink-0">
            ⏳
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500">Verification Status</div>
            <div className="text-2xl font-black text-amber-900 mt-0.5">
              {documents.filter((d) => d.status !== 'Verified').length} Under Review
            </div>
            <div className="text-[11px] text-gray-500">Expected completion within 24 hrs</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-lg shrink-0">
            🔒
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500">Shared with Buyers</div>
            <div className="text-2xl font-black text-blue-900 mt-0.5">
              {permissions.length} Active Permissions
            </div>
            <div className="text-[11px] text-gray-500">You can revoke access anytime</div>
          </div>
        </div>
      </div>

      {/* 2 Clean Tabs (Replacing the 8 confusing numbered tabs) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'bg-[#0D261C] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-[#E2E8F0]'
            }`}
          >
            <span>📑</span>
            <span>My Property Documents ({documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'bg-[#0D261C] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-[#E2E8F0]'
            }`}
          >
            <span>👥</span>
            <span>Buyer Access &amp; Permissions ({permissions.length})</span>
          </button>
        </div>

        {/* TAB 1: MY PROPERTY DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">Filter by Property:</span>
                <select
                  aria-label="Filter documents by property"
                  value={selectedPropertyFilter}
                  onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs font-bold text-[#0D261C] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                >
                  <option value="all">All Properties ({documents.length})</option>
                  <option value="AS-KMP-001">Changsari 2.5 Bigha Plot (Dag 412 / Patta 89)</option>
                  <option value="AS-KMP-002">Sonapur 3.0 Bigha Homestead Plot (Dag 104 / Patta 22)</option>
                </select>
              </div>

              <span className="text-xs text-gray-500 font-medium">
                Showing {filteredDocs.length} official records
              </span>
            </div>

            {/* Document Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => {
                const isVerified = doc.status === 'Verified';
                const isAction = doc.status === 'Action Needed';

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3.5 hover:border-emerald-300 hover:shadow-md transition duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700">
                          {doc.category}
                        </span>

                        {isVerified && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-emerald-200">
                            Verified ✅
                          </span>
                        )}
                        {isAction && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-200">
                            Action Needed ⚠️
                          </span>
                        )}
                        {!isVerified && !isAction && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            In Review ⏳
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-serif text-base font-bold text-[#0D261C] leading-snug">
                          {doc.title}
                        </h4>
                        <div className="text-xs font-semibold text-gray-600 mt-1">
                          📍 {doc.propertyName} ({doc.dagPatta})
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {doc.summary}
                      </p>

                      {doc.statusNote && (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>{doc.statusNote}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          {doc.privacy.includes('Private') ? '🔒 Private' : '🌐 ' + doc.privacy}
                        </span>
                        <span>{doc.fileSize}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="py-1.5 px-3 rounded-xl bg-[#F8FAF7] hover:bg-gray-100 border border-[#E2E8F0] text-[#0D261C] font-bold text-xs transition"
                      >
                        👁️ View PDF
                      </button>

                      {isAction ? (
                        <button
                          type="button"
                          onClick={() => setShowUploadModal(true)}
                          className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs"
                        >
                          Upload Revised File
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrivacyModalDoc(doc)}
                          className="py-1.5 px-3 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white font-bold text-xs transition shadow-xs"
                        >
                          Manage Access
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: BUYER ACCESS & PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-sm space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#0D261C]">
                Active Buyer Permissions
              </h3>
              <p className="text-xs text-gray-500">
                Buyers who have completed KYC verification and requested access to view your property deeds and survey maps.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAF7] border-b border-[#E2E8F0] text-gray-700">
                    <th className="p-3.5 font-bold rounded-l-xl">Buyer Name</th>
                    <th className="p-3.5 font-bold">Property</th>
                    <th className="p-3.5 font-bold">Documents Shared</th>
                    <th className="p-3.5 font-bold">Access Expires</th>
                    <th className="p-3.5 font-bold text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {permissions.map((perm) => (
                    <tr key={perm.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-sm text-[#0D261C]">{perm.buyerName}</div>
                        <div className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[#15803D] text-[10px] font-bold border border-emerald-200">
                          {perm.buyerTag}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-800">{perm.property}</div>
                        <div className="text-[11px] text-gray-500">Granted on {perm.grantedDate}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {perm.documentsShared.map((dName, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-medium">
                              {dName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          ⏳ {perm.expiresIn}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRevokePermission(perm.id, perm.buyerName)}
                          className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition"
                        >
                          Revoke Access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload New Document Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUploadModal(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3.5">
              <div>
                <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider">
                  LandLocker Document Vault
                </span>
                <h3 id="upload-modal-title" className="font-serif text-xl font-bold text-[#0D261C]">
                  Upload Official Property Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Property:</label>
                <select
                  value={uploadPropertyId}
                  onChange={(e) => setUploadPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                >
                  <option value="AS-KMP-001">Changsari 2.5 Bigha Plot (Dag 412 / Patta 89)</option>
                  <option value="AS-KMP-002">Sonapur 3.0 Bigha Homestead Plot (Dag 104 / Patta 22)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Document Type:</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                >
                  <option value="Jamabandi / Patta Extract">Jamabandi / Patta Extract (Record of Rights)</option>
                  <option value="Boundary Trace Map">Boundary Trace Map / Cadastral Sketch</option>
                  <option value="Registered Sale Deed">Registered Sale Deed (Conveyance)</option>
                  <option value="Non-Encumbrance Certificate">30-Year Non-Encumbrance Certificate (NEC)</option>
                  <option value="Seller Declaration">Seller Self-Declaration &amp; Possession Affidavit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Document Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Updated Lot Mondal Field Trace Map"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Select File (PDF, JPG, PNG):</label>
                <div className="border-2 border-dashed border-[#E2E8F0] rounded-2xl p-5 text-center bg-[#F8FAF7] hover:bg-emerald-50/30 transition cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#15803D] file:text-white hover:file:bg-[#0D261C]"
                  />
                  <p className="text-[11px] text-gray-400 mt-2">Files are verified for legibility and authentic government stamp seals.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white font-bold transition shadow-xs"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-preview-modal-title"
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
                <h3 id="seller-preview-modal-title" className="font-serif text-xl font-bold text-[#0D261C]">
                  {previewDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#F8FAF7] p-4 rounded-2xl border border-[#E2E8F0]">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-700">Property:</span>
                <span className="text-gray-900 font-semibold">{previewDoc.propertyName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-700">Cadastral Reference:</span>
                <span className="text-gray-900 font-semibold">{previewDoc.dagPatta}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-700">Verification Status:</span>
                <span className="font-bold text-[#166534] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {previewDoc.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-700">Privacy Mode:</span>
                <span className="text-gray-900 font-semibold">{previewDoc.privacy}</span>
              </div>
              <div className="pt-2">
                <span className="font-bold text-gray-800 block mb-1">Document Record Summary:</span>
                <p className="text-gray-700 bg-white p-3 rounded-xl border border-gray-200 leading-relaxed">
                  {previewDoc.summary}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] font-semibold text-gray-700 hover:bg-gray-50 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadDoc(previewDoc);
                  setPreviewDoc(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
              >
                <span>⬇️</span>
                <span>Download PDF Extract</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Privacy Modal */}
      {privacyModalDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPrivacyModalDoc(null);
          }}
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider">
                  Document Privacy Settings
                </span>
                <h3 id="privacy-modal-title" className="font-serif text-lg font-bold text-[#0D261C]">
                  {privacyModalDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalDoc(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() => handleUpdatePrivacy(privacyModalDoc.id, 'Shared with Verified Buyers')}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  privacyModalDoc.privacy === 'Shared with Verified Buyers'
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'border-[#E2E8F0] hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">🛡️</span>
                <div>
                  <div className="font-bold text-gray-900">Shared with Verified Buyers (Recommended)</div>
                  <p className="text-gray-500 mt-0.5 text-[11px]">Only buyers who completed DigiLocker Aadhaar e-KYC can view this deed.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePrivacy(privacyModalDoc.id, 'Shared')}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  privacyModalDoc.privacy === 'Shared'
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'border-[#E2E8F0] hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">🌐</span>
                <div>
                  <div className="font-bold text-gray-900">Shared with All Inquiring Buyers</div>
                  <p className="text-gray-500 mt-0.5 text-[11px]">Any buyer sending a verified inquiry on this listing can preview the document.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePrivacy(privacyModalDoc.id, 'Private')}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  privacyModalDoc.privacy === 'Private'
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'border-[#E2E8F0] hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">🔒</span>
                <div>
                  <div className="font-bold text-gray-900">Private (Only You &amp; Official Reviewer)</div>
                  <p className="text-gray-500 mt-0.5 text-[11px]">No buyer can view this document until you explicitly grant individual permission.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
