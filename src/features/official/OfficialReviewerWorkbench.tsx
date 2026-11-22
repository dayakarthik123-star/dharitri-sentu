import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, Eye, AlertOctagon, Send, FileText, Check, Lock, ChevronRight, UserCheck } from 'lucide-react';

interface DocumentInspectionItem {
  id: string;
  name: string;
  tabLabel: string;
  category: string;
  status: 'Pending Review' | 'In Progress' | 'Verified & Authentic' | 'Mismatch / Revision Needed';
  revisionNote?: string;
  previewUrl: string;
  summary: string;
  fileBytes: string;
}

interface LandDetailRow {
  id: string;
  parameter: string;
  sellerData: string;
  officialData: string;
  status: 'Pending Review' | 'In Progress' | 'Completed / Verified' | 'Mismatch Found';
  remark?: string;
  hasMismatch: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  officer: string;
  action: string;
  statusPill: string;
}

export const OfficialReviewerWorkbench: React.FC = () => {
  const { showToast, updateListingStatus, addDiscrepancyNote } = useApp();
  const { id } = useParams<{ id: string }>();

  // Overall Case Status
  const [overallStatus, setOverallStatus] = useState<
    'Verification In Progress' | 'Action Required — Mismatch Flagged' | 'Officially Verified' | 'Verification Rejected'
  >('Action Required — Mismatch Flagged');

  const [showOtpConfirmModal, setShowOtpConfirmModal] = useState(false);
  const [officerOtpInput, setOfficerOtpInput] = useState('');

  // Active Document Tab in Left Column
  const [activeDocTab, setActiveDocTab] = useState<string>('doc-1');

  // Documents in Inspector
  const [documents, setDocuments] = useState<DocumentInspectionItem[]>([
    {
      id: 'doc-1',
      name: 'Jamabandi / Patta Extract',
      tabLabel: '1. Jamabandi Extract',
      category: 'Record of Rights',
      status: 'Verified & Authentic',
      previewUrl: '/assets/parcel-agricultural.jpg',
      summary: 'Periodic Patta 89, Dag 412, Changsari Village. Registered owner: Pranabjyoti Kalita. Land Revenue status cleared with zero dues.',
      fileBytes: '1.8 MB PDF · Certified by Circle Officer',
    },
    {
      id: 'doc-2',
      name: 'Boundary Trace Sketch',
      tabLabel: '2. Boundary Trace Sketch',
      category: 'Cadastral Survey',
      status: 'Mismatch / Revision Needed',
      revisionNote: 'Physical survey recorded 2.35 Bigha vs 2.50 Bigha declared in listing. Requires updated Lot Mondal field sketch.',
      previewUrl: '/assets/satellite-map-bg.jpg',
      summary: 'Lot Mondal field measurement reflects 2.35 Bigha net area inside perimeter boundary pillars. Listing states 2.50 Bigha.',
      fileBytes: '3.2 MB PDF · Directorate of Land Records',
    },
    {
      id: 'doc-3',
      name: 'Seller Self-Declaration & Possession Affidavit',
      tabLabel: '3. Self-Declaration',
      category: 'Legal Affidavit',
      status: 'In Progress',
      previewUrl: '/assets/tea-garden-bg.jpg',
      summary: 'Notarized declaration of undisputed physical possession, boundary pillar placements, and zero adverse family claims.',
      fileBytes: '1.2 MB PDF · Notary Public Attestation',
    },
    {
      id: 'doc-4',
      name: '30-Year Non-Encumbrance Certificate (NEC)',
      tabLabel: '4. 30-Year NEC',
      category: 'Registration Index Search',
      status: 'Verified & Authentic',
      previewUrl: '/assets/parcel-homestead.jpg',
      summary: 'Form 26 search certificate issued by Senior Sub-Registrar Kamrup. No prior registered mortgages or court stays between 1996 and 2026.',
      fileBytes: '2.4 MB PDF · Sub-Registrar Kamrup',
    },
  ]);

  // Point-by-Point Land Details Rows in Right Column
  const [landDetails, setLandDetails] = useState<LandDetailRow[]>([
    {
      id: 'row-dag-patta',
      parameter: 'Parcel Identity (Dag No. & Patta No.)',
      sellerData: 'Dag 412 / Patta 89',
      officialData: 'Dag 412 / Periodic Patta 89 (Changsari)',
      status: 'Completed / Verified',
      hasMismatch: false,
    },
    {
      id: 'row-ownership',
      parameter: 'Ownership & Jamabandi Mutation Check',
      sellerData: 'Pranabjyoti Kalita',
      officialData: 'Pranabjyoti Kalita (Single Pattadar)',
      status: 'Completed / Verified',
      hasMismatch: false,
    },
    {
      id: 'row-area',
      parameter: 'Land Area Measurement & Survey Match',
      sellerData: '2.50 Bigha (Listing Declared)',
      officialData: '2.35 Bigha (Official Jamabandi / Field Trace)',
      status: 'Mismatch Found',
      hasMismatch: true,
      remark: '0.15 Bigha difference detected between listing and Jamabandi. Requested updated Lot Mondal trace sketch from seller.',
    },
    {
      id: 'row-nec',
      parameter: '30-Year Non-Encumbrance Certificate (NEC) Check',
      sellerData: 'Zero active bank loans or mortgages',
      officialData: 'Sub-Registrar Form 26: Nil encumbrance (1996–2026)',
      status: 'Completed / Verified',
      hasMismatch: false,
    },
    {
      id: 'row-tribal',
      parameter: 'Protected Tribal Belt Check (Chapter X Eligibility)',
      sellerData: 'General Class plot',
      officialData: 'Outside notified Tribal Belts & Scheduled Blocks',
      status: 'Completed / Verified',
      hasMismatch: false,
    },
    {
      id: 'row-corridors',
      parameter: 'Road Access, Flood Zone (ASDMA >52m MSL) & Pipeline Buffer',
      sellerData: '18ft road frontage, flood-free elevated zone',
      officialData: '18ft Panchayat corridor; Elevation 54.2m MSL; PMP Act >350m',
      status: 'In Progress',
      hasMismatch: false,
    },
  ]);

  // Live Activity Audit Log
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      timestamp: 'Today · 12:45 PM',
      officer: 'Debajit Hazarika',
      action: 'Flagged Land Area Measurement as "Mismatch Found (0.15 Bigha variance)"',
      statusPill: 'Mismatch Flagged',
    },
    {
      id: 'log-2',
      timestamp: 'Today · 12:40 PM',
      officer: 'Debajit Hazarika',
      action: 'Verified Jamabandi Record of Rights against Dharitree Portal',
      statusPill: 'Ownership Verified',
    },
    {
      id: 'log-3',
      timestamp: 'Oct 20, 2026 · 11:15 AM',
      officer: 'Debajit Hazarika',
      action: 'Imported Sub-Registrar 30-Year NEC Search Index',
      statusPill: 'NEC Clear',
    },
  ]);

  // Dynamic Progress Calculation
  const verifiedRowsCount = landDetails.filter((r) => r.status === 'Completed / Verified').length;
  const progressPercent = Math.round((verifiedRowsCount / landDetails.length) * 100);

  // Active document object
  const currentDoc = documents.find((d) => d.id === activeDocTab) || documents[0];

  // Update a document's status
  const handleDocStatusChange = (docId: string, newStatus: DocumentInspectionItem['status']) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
    );

    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const logItem: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: `Today · ${nowStr}`,
      officer: 'Debajit Hazarika',
      action: `Changed document status for "${currentDoc.name}" to "${newStatus}"`,
      statusPill: newStatus,
    };
    setAuditLog((prev) => [logItem, ...prev]);
    showToast(`Document status updated to "${newStatus}"`);
  };

  // Update a land detail row's status
  const handleDetailStatusChange = (rowId: string, newStatus: LandDetailRow['status']) => {
    setLandDetails((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          status: newStatus,
          remark: newStatus === 'Mismatch Found' ? (r.remark || 'Discrepancy detected during official comparison.') : r.remark,
        };
      })
    );

    const targetRow = landDetails.find((r) => r.id === rowId);
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const logItem: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: `Today · ${nowStr}`,
      officer: 'Debajit Hazarika',
      action: `Marked "${targetRow?.parameter}" as "${newStatus}"`,
      statusPill: newStatus,
    };
    setAuditLog((prev) => [logItem, ...prev]);
    showToast(`Updated "${targetRow?.parameter}" to ${newStatus}`);
  };

  // Send Discrepancy Alert to Seller & Buyer
  const handleSendDiscrepancyAlert = (rowId: string) => {
    const row = landDetails.find((r) => r.id === rowId);
    setOverallStatus('Action Required — Mismatch Flagged');
    addDiscrepancyNote(
      'DSC-001',
      row?.remark || 'Official Verifier Flagged 0.15 Bigha area difference between 2.50 Bigha listing and 2.35 Bigha Jamabandi. Upload updated trace map or auto-correct.'
    );
    showToast(`Discrepancy alert dispatched directly to Seller (Pranabjyoti Kalita) & Buyer (Ananya Baruah).`);
  };

  // Handle Overall Case Status Change
  const handleOverallStatusSelect = (newStatus: typeof overallStatus) => {
    if (newStatus === 'Officially Verified') {
      if (verifiedRowsCount < landDetails.length) {
        showToast('All 6 verification checklist rows must be verified before official sign-off.');
        return;
      }
      setShowOtpConfirmModal(true);
      return;
    }

    setOverallStatus(newStatus);
    showToast(`Case status updated to: ${newStatus}`);
  };

  const handleConfirmOfficialSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerOtpInput || officerOtpInput.length < 6) {
      showToast('Please enter the 6-digit Verifier confirmation OTP.');
      return;
    }
    setOverallStatus('Officially Verified');
    updateListingStatus(id || 'lst-1', 'Approved for Listing', 'Officially Verified & Digitally Signed by Debajit Hazarika (REV-AS-KMP-104)');
    setShowOtpConfirmModal(false);
    showToast('Officially Verified! Green Trust Badge & Digital Verification Seal Issued.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span className="text-[#15803D] font-bold">Changsari Revenue Circle</span>
            <span>&gt;</span>
            <span>Active Case Inspector</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            Interactive Land Verification Workbench
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Official side-by-side deed inspector and statutory check engine for <strong>Changsari Plot (Dag 412 / Patta 89)</strong>.
          </p>
        </div>

        {/* Top Right Overall Case Status Selector */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
            Overall Property Status:
          </label>
          <select
            value={overallStatus}
            onChange={(e) => handleOverallStatusSelect(e.target.value as typeof overallStatus)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border shadow-xs focus:outline-none ${
              overallStatus === 'Officially Verified'
                ? 'bg-[#DCFCE7] text-[#166534] border-emerald-300'
                : overallStatus === 'Action Required — Mismatch Flagged'
                ? 'bg-[#FEF3C7] text-[#92400E] border-amber-300'
                : overallStatus === 'Verification Rejected'
                ? 'bg-[#FEE2E2] text-[#991B1B] border-red-300'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            <option value="Verification In Progress">🟡 Verification In Progress</option>
            <option value="Action Required — Mismatch Flagged">🟠 Action Required — Mismatch Flagged</option>
            <option value="Officially Verified">🟢 Officially Verified (Issue Trust Badge)</option>
            <option value="Verification Rejected">🔴 Verification Rejected (Title / Legal Dispute)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Progress Calculation Bar */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#15803D] uppercase tracking-wider">
              Statutory Review Progress
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0D261C]">
              {verifiedRowsCount} of {landDetails.length} Checks Verified — {landDetails.length - verifiedRowsCount} Action Items Pending
            </h2>
          </div>

          <div className="sm:text-right">
            <span className="text-2xl font-black text-[#15803D] font-mono">{progressPercent}%</span>
            <span className="text-xs text-gray-500 block">Verification Completeness</span>
          </div>
        </div>

        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercent === 100 ? 'bg-[#15803D]' : progressPercent >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2-COLUMN SPLIT-SCREEN VERIFICATION WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (6 cols): Interactive Document Inspector */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] p-6 space-y-5 shadow-sm">
          <div className="border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0D261C]">
                  Seller Uploaded Document Inspector
                </h3>
                <p className="text-xs text-gray-500">
                  Read-only high-resolution official deed preview and live status control.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-bold">
                Read-Only Safe Mode
              </span>
            </div>
          </div>

          {/* Document Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setActiveDocTab(doc.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeDocTab === doc.id
                    ? 'bg-[#0D261C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {doc.tabLabel}
              </button>
            ))}
          </div>

          {/* Active Document Details & Live Status Dropdown */}
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider">
                  {currentDoc.category}
                </span>
                <h4 className="font-bold text-sm text-[#0D261C]">{currentDoc.name}</h4>
                <div className="text-[11px] text-gray-500">{currentDoc.fileBytes}</div>
              </div>

              {/* Interactive Document Status Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 block uppercase">
                  Document Review Decision:
                </label>
                <select
                  value={currentDoc.status}
                  onChange={(e) => handleDocStatusChange(currentDoc.id, e.target.value as DocumentInspectionItem['status'])}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${
                    currentDoc.status === 'Verified & Authentic'
                      ? 'bg-[#DCFCE7] text-[#166534] border-emerald-300'
                      : currentDoc.status === 'Mismatch / Revision Needed'
                      ? 'bg-[#FEF3C7] text-[#92400E] border-amber-300'
                      : 'bg-white text-gray-800 border-[#E2E8F0]'
                  }`}
                >
                  <option value="Pending Review">⏳ Pending Review</option>
                  <option value="In Progress">🔄 In Progress</option>
                  <option value="Verified & Authentic">✅ Verified &amp; Authentic</option>
                  <option value="Mismatch / Revision Needed">⚠️ Mismatch / Revision Needed</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-[#E2E8F0]">
              {currentDoc.summary}
            </p>

            {/* Mismatch Note Input */}
            {currentDoc.status === 'Mismatch / Revision Needed' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5 animate-fade-in">
                <label className="block text-[11px] font-bold text-amber-900">
                  Reviewer Remark to Seller:
                </label>
                <textarea
                  rows={2}
                  value={currentDoc.revisionNote || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDocuments((prev) =>
                      prev.map((d) => (d.id === currentDoc.id ? { ...d, revisionNote: val } : d))
                    );
                  }}
                  className="w-full p-2.5 rounded-lg bg-white border border-amber-300 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Explain required revision to seller..."
                />
              </div>
            )}
          </div>

          {/* Interactive Document Preview Box */}
          <div className="relative h-64 bg-gray-100 rounded-2xl overflow-hidden border border-[#E2E8F0]">
            <img
              src={currentDoc.previewUrl}
              alt={currentDoc.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
              <div className="text-white text-xs space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#B5E4A3]" />
                  <span>Certified Digital Extract Preview</span>
                </div>
                <div className="text-[11px] text-gray-200">Official seal and Lot Mondal signature verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (6 cols): Point-by-Point Land Details Checklist */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] p-6 space-y-5 shadow-sm">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h3 className="font-serif text-lg font-bold text-[#0D261C]">
              Point-by-Point Land Details Verification Checklist
            </h3>
            <p className="text-xs text-gray-500">
              Cross-examine Seller&apos;s listed information against authoritative Dharitree and Circle Office registries.
            </p>
          </div>

          <div className="space-y-4">
            {landDetails.map((row, idx) => {
              const isVerified = row.status === 'Completed / Verified';
              const isMismatch = row.status === 'Mismatch Found';

              return (
                <div
                  key={row.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isVerified
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isMismatch
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-[#F8FAF7] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-bold text-xs text-[#0D261C] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span>{row.parameter}</span>
                    </div>

                    {/* Live Row Status Dropdown */}
                    <select
                      value={row.status}
                      onChange={(e) => handleDetailStatusChange(row.id, e.target.value as LandDetailRow['status'])}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border focus:outline-none ${
                        isVerified
                          ? 'bg-[#DCFCE7] text-[#166534] border-emerald-300'
                          : isMismatch
                          ? 'bg-[#FEF3C7] text-[#92400E] border-amber-300'
                          : 'bg-white text-gray-800 border-[#E2E8F0]'
                      }`}
                    >
                      <option value="Pending Review">Pending Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed / Verified">✅ Completed / Verified</option>
                      <option value="Mismatch Found">⚠️ Mismatch Found</option>
                    </select>
                  </div>

                  {/* Comparison Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Seller Listed:</span>
                      <span className="font-semibold text-gray-800">{row.sellerData}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Official Reference:</span>
                      <span className="font-semibold text-gray-800">{row.officialData}</span>
                    </div>
                  </div>

                  {/* Auto-expanding Mismatch Box */}
                  {isMismatch && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 mt-2 animate-fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <AlertTriangle size={14} className="text-amber-700" />
                        <span>Action Required — Mismatch Action Box</span>
                      </div>
                      <textarea
                        rows={2}
                        value={row.remark || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLandDetails((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, remark: val } : r))
                          );
                        }}
                        className="w-full p-2.5 rounded-lg bg-white border border-amber-300 text-xs text-gray-800 focus:outline-none"
                        placeholder="Type reviewer remark for seller..."
                      />
                      <button
                        type="button"
                        onClick={() => handleSendDiscrepancyAlert(row.id)}
                        className="py-1.5 px-3 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition flex items-center gap-1.5"
                      >
                        <Send size={12} />
                        <span>Send Discrepancy Alert to Seller &amp; Buyer</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LIVE ACTIVITY AUDIT LOG (Bottom Section) */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#0D261C]">
              Live Activity Audit Log
            </h3>
            <p className="text-xs text-gray-500">
              Immutable chronological record of official verifier actions, timestamped and cryptographically signed.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            {auditLog.length} Recorded Actions
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {auditLog.map((log) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-gray-800">{log.action}</span>
                <div className="text-[11px] text-gray-500">
                  Officer: <strong>{log.officer}</strong> · Circle Verification Officer
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#166534] border border-emerald-200">
                  {log.statusPill}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Sign-Off 6-Digit OTP Confirmation Modal */}
      {showOtpConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="text-center space-y-1.5 border-b border-[#E2E8F0] pb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto">
                🛡️
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0D261C]">
                Official Sign-Off Authorization
              </h3>
              <p className="text-xs text-gray-600">
                You are issuing an immutable government verification stamp for Changsari Plot (Dag 412 / Patta 89).
              </p>
            </div>

            <form onSubmit={handleConfirmOfficialSignOff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Enter 6-Digit Verifier OTP (Quick Test: 123456):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="1 2 3 4 5 6"
                  value={officerOtpInput}
                  onChange={(e) => setOfficerOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-xl border-2 border-[#15803D] focus:outline-none focus:ring-4 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  onClick={() => setOfficerOtpInput('123456')}
                  className="mt-1 text-[11px] text-[#15803D] font-bold hover:underline block"
                >
                  Auto-fill demo OTP (123456)
                </button>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                <div>Officer: <strong>Debajit Hazarika (REV-AS-KMP-402)</strong></div>
                <div>Jurisdiction: <strong>Changsari Revenue Circle</strong></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white font-bold transition shadow-xs"
                >
                  Confirm &amp; Issue Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
