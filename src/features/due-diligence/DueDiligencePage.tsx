import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';

interface VerificationCheck {
  id: string;
  code: string;
  title: string;
  authority: string;
  statutoryRule: string;
  description: string;
  status: 'Verified' | 'Action Needed' | 'In Progress';
  statusNote?: string;
}

interface VerificationGroup {
  groupName: string;
  description: string;
  checks: VerificationCheck[];
}

const PROPERTY_OPTIONS = [
  {
    id: 'AS-KMP-001',
    listingId: 'lst-1',
    name: 'Changsari 2.5 Bigha Plot (Dag 412 / Patta 89)',
    location: 'Changsari, Kamrup Rural',
    seller: 'Pranabjyoti Kalita',
    hasDiscrepancy: true,
  },
  {
    id: 'AS-KMP-002',
    listingId: 'lst-2',
    name: 'Sonapur 3.0 Bigha Homestead (Dag 104 / Patta 22)',
    location: 'Sonapur, Kamrup Metro',
    seller: 'Pranabjyoti Kalita',
    hasDiscrepancy: false,
  },
  {
    id: 'AS-DIB-001',
    listingId: 'lst-3',
    name: 'Chabua 5.0 Bigha Tea Plot (Dag 219 / Patta 44)',
    location: 'Chabua, Dibrugarh',
    seller: 'Monideepa Gogoi',
    hasDiscrepancy: false,
  },
  {
    id: 'AS-BKS-001',
    listingId: 'lst-4',
    name: 'Barama 12.5 Bigha Farmland (Dag 530 / Patta 67)',
    location: 'Barama, Baksa',
    seller: 'Pranabjyoti Kalita',
    hasDiscrepancy: false,
  },
];

const INITIAL_GROUPS: VerificationGroup[] = [
  {
    groupName: 'Group A: Ownership & Title Verification',
    description: 'Verify official government ownership records, Jamabandi mutation history, and encumbrance certificates.',
    checks: [
      {
        id: 'chk-jamabandi',
        code: 'A1',
        title: 'Circle Office Jamabandi Mutation Check (Chitha / RoR)',
        authority: 'Office of the Revenue Circle Officer & Lot Mondal',
        statutoryRule: 'Assam Land and Revenue Regulation 1886',
        description: 'Confirms that the seller’s name is recorded in the official Dharitree Record of Rights with no pending co-pattadar succession disputes or unpartitioned inheritance blocks.',
        status: 'Verified',
      },
      {
        id: 'chk-nec',
        code: 'A2',
        title: '30-Year Non-Encumbrance Certificate (NEC)',
        authority: 'Senior Sub-Registrar / Registration Office, Kamrup',
        statutoryRule: 'Section 54, Transfer of Property Act 1882',
        description: 'Verifies the parcel has no registered mortgages, liens, bank attachments, lis pendens (court disputes), or prior registered sale agreements over a continuous 30-year chain.',
        status: 'Verified',
      },
      {
        id: 'chk-tribal',
        code: 'A3',
        title: 'Chapter X Protected Tribal Belt Non-Eligibility Check',
        authority: 'Revenue & Disaster Management Dept, Govt of Assam',
        statutoryRule: 'Chapter X, Assam Land & Revenue Regulation',
        description: 'Confirms that the land parcel is not situated inside notified Tribal Belts or Blocks where transfer of land to non-notified classes is strictly barred by law.',
        status: 'Verified',
      },
    ],
  },
  {
    groupName: 'Group B: Physical & Boundary Verification',
    description: 'Confirm ground reality, surveyor boundary demarcation, road access corridors, and flood resilience.',
    checks: [
      {
        id: 'chk-trace-area',
        code: 'B1',
        title: 'Lot Mondal Boundary Trace Map & Area Measurement',
        authority: 'Lot Mondal Field Office & Directorate of Land Records',
        statutoryRule: 'Assam Land Records Manual & Cadastral Mapping Rules',
        description: 'Physical survey recorded 2.35 Bigha vs 2.50 Bigha in seller listing. A 0.15 Bigha (6%) boundary variance is flagged for rectification.',
        status: 'Action Needed',
        statusNote: 'Variance: -0.15 Bigha (6%) under seller review',
      },
      {
        id: 'chk-road-access',
        code: 'B2',
        title: '18ft Ingress / Egress Access Road Right-of-Way',
        authority: 'Local Gaon Panchayat & PWD Rural Roads Division',
        statutoryRule: 'Assam Panchayat Act 1994 (Road Setback Regulations)',
        description: 'Confirmed dedicated 18-foot public road frontage abutting the northern boundary with direct access for heavy vehicles and construction.',
        status: 'Verified',
      },
      {
        id: 'chk-flood-elevation',
        code: 'B3',
        title: 'ASDMA Flood Safety & Ground Elevation (> 52m MSL)',
        authority: 'Assam State Disaster Management Authority & Survey of India',
        statutoryRule: 'ASDMA Flood Hazard Atlas & SGI Mean Sea Level Benchmarks',
        description: 'Mean terrain elevation measured at 54.2m MSL (safely above the 52m high-flood datum). Outside the 100-year monsoon inundation buffer.',
        status: 'Verified',
      },
    ],
  },
  {
    groupName: 'Group C: Legal & Statutory Sign-Off',
    description: 'Statutory corridor setbacks, District Commissioner permissions, and registration readiness.',
    checks: [
      {
        id: 'chk-pipeline',
        code: 'C1',
        title: 'PMP Act 1962 RoU Pipeline Buffer Inspection',
        authority: 'Competent Authority / GAIL / Oil India / NRL',
        statutoryRule: 'Section 9, Petroleum & Minerals Pipelines Act 1962',
        description: 'Evaluates whether high-pressure petroleum or natural gas pipelines traverse the parcel. Pipeline right-of-use corridor is located >350m south; zero construction setbacks apply.',
        status: 'Verified',
      },
      {
        id: 'chk-noc',
        code: 'C2',
        title: 'District Commissioner / Revenue Circle NOC Clearance',
        authority: 'Deputy Commissioner & Sub-Divisional Magistrate',
        statutoryRule: 'Assam Land Transfer Permission Rules',
        description: 'Statutory land transfer application submitted to Revenue Circle Office. Awaiting standard 15-day public notice gazette window.',
        status: 'In Progress',
        statusNote: 'Notice period ends Oct 28',
      },
      {
        id: 'chk-mutation-readiness',
        code: 'C3',
        title: 'Sale Deed Registration & Instant Mutation Readiness',
        authority: 'Sub-Registrar Office & Sewa Setu Portal',
        statutoryRule: 'Mission Basundhara 3.0 Instant Auto-Mutation Guidelines',
        description: 'Eligible for instant digital mutation upon deed registration once the 0.15 Bigha physical boundary survey is aligned with Jamabandi RoR.',
        status: 'Action Needed',
        statusNote: 'Requires boundary alignment confirmation',
      },
    ],
  },
];

export const DueDiligencePage: React.FC = () => {
  const { showToast, auditEvents } = useApp();
  const navigate = useNavigate();
  const [selectedPropertyId, setSelectedPropertyId] = useState('AS-KMP-001');
  const [groups, setGroups] = useState<VerificationGroup[]>(INITIAL_GROUPS);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  const selectedProperty = PROPERTY_OPTIONS.find((p) => p.id === selectedPropertyId) || PROPERTY_OPTIONS[0];

  // Count total and verified checks
  const allChecks = groups.flatMap((g) => g.checks);
  const verifiedCount = allChecks.filter((c) => c.status === 'Verified').length;
  const progressPercent = Math.round((verifiedCount / allChecks.length) * 100);

  // Dynamic Verification History Timeline sourced from real-time auditEvents
  const dynamicTimelineEvents = useMemo(() => {
    const defaultEvents = [
      {
        id: 'ev-1',
        title: 'RoR Mutation Verified',
        timestamp: 'Oct 20, 2026',
        description: 'Circle Office Jamabandi records cross-checked against Dharitree portal. Seller unencumbered title confirmed.',
        authority: 'Officer: Revenue Circle Officer',
        statusColor: 'emerald',
      },
      {
        id: 'ev-2',
        title: 'Physical Survey Completed',
        timestamp: 'Oct 19, 2026',
        description: 'Lot Mondal completed ground cadastral measurement. 0.15 Bigha area difference noted and escalated to seller.',
        authority: 'Surveyor: Lot Mondal Field Office',
        statusColor: 'amber',
      },
      {
        id: 'ev-3',
        title: '30-Year NEC Search Clear',
        timestamp: 'Oct 18, 2026',
        description: 'Senior Sub-Registrar issued Non-Encumbrance Certificate. Zero registered bank charges or pending court suits.',
        authority: 'Authority: Senior Sub-Registrar',
        statusColor: 'emerald',
      },
      {
        id: 'ev-4',
        title: 'Verification File Opened',
        timestamp: 'Oct 15, 2026',
        description: 'Buyer initiated formal verification workflow upon shortlisting parcel.',
        authority: 'Actor: Ananya Baruah (Buyer)',
        statusColor: 'gray',
      },
    ];

    if (!auditEvents || auditEvents.length === 0) return defaultEvents;

    const liveEvents = auditEvents
      .filter((ev) => ev.actorRole === 'reviewer' || ev.actionType?.includes('LISTING') || ev.actionType?.includes('DISCREPANCY'))
      .map((ev) => ({
        id: ev.id,
        title: ev.actionType === 'LISTING_STATUS_UPDATED' ? 'Official Reviewer Status Sign-Off' : ev.actionType,
        timestamp: new Date(ev.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        description: ev.summary,
        authority: `Official Verifier: ${ev.actorEmail}`,
        statusColor: ev.summary.toLowerCase().includes('officially verified') ? 'emerald' : ev.summary.toLowerCase().includes('discrepancy') ? 'amber' : 'emerald',
      }));

    return [...liveEvents, ...defaultEvents].slice(0, 6);
  }, [auditEvents]);

  // Toggle or cycle a check status
  const handleToggleCheck = (checkId: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        checks: group.checks.map((chk) => {
          if (chk.id !== checkId) return chk;
          const nextStatus: VerificationCheck['status'] =
            chk.status === 'Verified' ? 'Action Needed' : 'Verified';
          showToast(`Updated "${chk.title}" to ${nextStatus}`);
          return { ...chk, status: nextStatus };
        }),
      }))
    );
  };

  // Export summary report
  const handleExportSummary = () => {
    const reportContent = `================================================================================
DHARITRI SENTU — PROPERTY SAFETY & VERIFICATION REPORT
================================================================================
Property: ${selectedProperty.name}
Location: ${selectedProperty.location}
Verified Seller: ${selectedProperty.seller}
Overall Safety Score: ${progressPercent}% (${verifiedCount} of ${allChecks.length} checks verified)
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

================================================================================
1. VERIFICATION CHECKLIST DETAILS
================================================================================
${groups.map((group) => `
[${group.groupName}]
${group.checks.map((c) => `  • [${c.status.toUpperCase()}] ${c.title}
    Authority: ${c.authority}
    Rule: ${c.statutoryRule}
    Findings: ${c.description}${c.statusNote ? ` (${c.statusNote})` : ''}
`).join('\n')}`).join('\n')}

================================================================================
2. CRITICAL AUDIT ADVISORY
================================================================================
${selectedProperty.hasDiscrepancy ? `
⚠️ BOUNDARY DISCREPANCY FLAGGED:
The Lot Mondal physical survey recorded 2.35 Bigha vs 2.50 Bigha in the seller listing (variance: -0.15 Bigha / 6%).
Recommendation: Request the seller to execute an updated field demarcation sketch or adjust the sale consideration proportionately prior to signing the registered agreement.
` : 'All physical boundaries and legal records are fully aligned.'}

================================================================================
Notice: Dharitri Sentu provides technical and documentary verification tools.
Always retain an enrolled advocate for formal title search before disbursement.
================================================================================`;

    const blob = new Blob([reportContent], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `property-verification-report-${selectedProperty.id.toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded Property Verification Report (PDF)!');
  };

  const handleShareWhatsApp = () => {
    const shareText = encodeURIComponent(
      `*Dharitri Sentu Verified Land Trust Passport*\n\n` +
      `📍 Property: ${selectedProperty.name}\n` +
      `👤 Seller: ${selectedProperty.seller}\n` +
      `🛡️ Verification Readiness: ${progressPercent}% (${verifiedCount} of ${allChecks.length} Checks Verified)\n` +
      `📜 Jamabandi RoR & 30-Yr NEC: Cleared\n` +
      `🌐 View Official Dossier: ${window.location.origin}/due-diligence\n\n` +
      `_Directorate of Land Records & Surveys, Assam_`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span>Buyer Workspace</span>
            <span>&gt;</span>
            <span className="text-[#15803D] font-bold">Property Verification</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            Property Safety Report &amp; Verification Tracker
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Step-by-step legal, government, and physical verification before you buy.
          </p>
        </div>

        {/* Property Selector & Trust Passport link */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-[260px]">
            <select
              aria-label="Selected Property"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#0D261C] focus:outline-none focus:ring-2 focus:ring-[#15803D] shadow-xs"
            >
              {PROPERTY_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Link
            to={`/passport/${selectedProperty.listingId}`}
            className="px-4 py-2 rounded-xl bg-[#092F24] hover:bg-[#147D4A] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <span>🛡️</span>
            <span>Trust Passport</span>
          </Link>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5C] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <span>📲</span>
            <span>Share on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleExportSummary}
            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-[#E5EBE7] text-[#092F24] text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>Export Dossier (PDF)</span>
          </button>
        </div>
      </div>

      {/* TOP SUMMARY & ALERT CARD */}
      <div className="space-y-4">
        {/* Progress Card */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#15803D] border border-emerald-200 text-[11px] font-bold uppercase tracking-wider mb-1">
                Official Verification Status
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#0D261C]">
                Verification Readiness: {progressPercent}%
              </h2>
              <p className="text-xs text-gray-600">
                {verifiedCount} of {allChecks.length} legal, government, and boundary checks satisfied.
              </p>
            </div>

            <div className="sm:text-right min-w-[220px]">
              <span className="text-2xl font-black text-[#15803D] font-mono">
                {progressPercent}%
              </span>
              <span className="text-xs text-gray-500 block">Overall Safety Score</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercent >= 80 ? 'bg-[#15803D]' : progressPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* PROMINENT AMBER ALERT BOX for 0.15 Bigha Area Mismatch */}
          {selectedProperty.hasDiscrepancy && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-amber-900">
                    Boundary Discrepancy Flagged: Area Variance (-0.15 Bigha / 6%)
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    The Lot Mondal physical survey recorded <strong>2.35 Bigha</strong> vs <strong>2.50 Bigha</strong> in the seller listing. Verification is on hold pending revised field trace demarcation.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/buyer/inquiries?topic=boundary&parcel=${encodeURIComponent(selectedProperty.id)}`)}
                  className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 active:scale-98"
                >
                  <span>💬</span>
                  <span>Message Seller &amp; View Inquiry</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: 3 Clean Grouped Sections (8 cols) + Verification Timeline (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 3 Clean Grouped Sections */}
        <div className="lg:col-span-8 space-y-6">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-white rounded-3xl border border-[#E2E8F0] p-6 space-y-4 shadow-sm">
              <div className="border-b border-[#E2E8F0] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#0D261C]">
                  {group.groupName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {group.description}
                </p>
              </div>

              <div className="space-y-3">
                {group.checks.map((chk) => {
                  const isVerified = chk.status === 'Verified';
                  const isAction = chk.status === 'Action Needed';

                  return (
                    <div
                      key={chk.id}
                      onClick={() => handleToggleCheck(chk.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isVerified
                          ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                          : isAction
                          ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                          : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={isVerified}
                          onChange={() => {}}
                          aria-label={`Toggle check ${chk.title}`}
                          className="w-5 h-5 rounded-md border-2 border-[#15803D] text-[#15803D] focus:ring-[#15803D] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5 grow min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-[#0D261C]">
                            {chk.title}
                          </h4>

                          {isVerified && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-emerald-200">
                              Verified ✅
                            </span>
                          )}
                          {isAction && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-200">
                              Action Needed ⚠️
                            </span>
                          )}
                          {!isVerified && !isAction && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                              In Progress ⏳
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed">
                          {chk.description}
                        </p>

                        {chk.statusNote && (
                          <div className="inline-block px-2.5 py-1 rounded-lg bg-amber-100/70 border border-amber-200 text-[11px] text-amber-900 font-semibold">
                            ⚠️ {chk.statusNote}
                          </div>
                        )}

                        {chk.id === 'chk-trace-area' && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/buyer/inquiries?topic=boundary&parcel=${encodeURIComponent(selectedProperty.id)}`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition shadow-xs"
                            >
                              <span>💬 Message Seller About Boundary →</span>
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 pt-1">
                          <span>🏛️ <strong>Authority:</strong> {chk.authority}</span>
                          <span>📜 <strong>Rule:</strong> {chk.statutoryRule}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Export Report Card */}
          <div className="bg-[#F8FAF7] rounded-3xl border border-[#E2E8F0] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <h4 className="font-serif text-base font-bold text-[#0D261C]">
                Need a printable record for your bank or advocate?
              </h4>
              <p className="text-xs text-gray-600">
                Download a clean, timestamped property verification dossier covering all 9 checks.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportSummary}
              className="shrink-0 py-2.5 px-5 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <span>📥</span>
              <span>Download Report (PDF)</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Verification History Timeline (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#0D261C]">
                Verification History
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Audit events & official milestone updates
              </p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
              {dynamicTimelineEvents.map((ev) => {
                const isEmerald = ev.statusColor === 'emerald';
                const isAmber = ev.statusColor === 'amber';
                return (
                  <div key={ev.id} className="relative space-y-1">
                    <span
                      className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                        isEmerald
                          ? 'bg-[#15803D] ring-emerald-200'
                          : isAmber
                          ? 'bg-amber-500 ring-amber-200'
                          : 'bg-gray-400 ring-gray-200'
                      }`}
                    />
                    <div className="flex items-center justify-between text-xs font-bold text-[#0D261C]">
                      <span>{ev.title}</span>
                      <span className="text-[11px] font-semibold text-gray-500">{ev.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {ev.description}
                    </p>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {ev.authority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Contact & Action Card */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 space-y-3 shadow-sm">
            <h4 className="font-serif text-base font-bold text-[#0D261C]">
              Property Seller
            </h4>
            <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] space-y-1">
              <div className="text-xs font-bold text-[#0D261C]">{selectedProperty.seller}</div>
              <div className="text-[11px] text-gray-500">Verified Landowner · Changsari, Kamrup</div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigate('/buyer/inquiries?topic=boundary&parcel=' + encodeURIComponent(selectedProperty.id));
              }}
              className="w-full py-2.5 rounded-xl bg-[#0D261C] hover:bg-[#15803D] text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>💬</span>
              <span>Message Seller About Boundary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inquiry Status Modal for Area Variance Clarification */}
      {showInquiryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-status-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInquiryModal(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3.5">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Active Clarification Inquiry
                </span>
                <h3 id="inquiry-status-title" className="font-serif text-xl font-bold text-[#0D261C]">
                  0.15 Bigha Survey Discrepancy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center transition"
                aria-label="Close Modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#F8FAF7] p-4 rounded-2xl border border-[#E2E8F0]">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Property:</span>
                <span className="font-bold text-[#0D261C]">{selectedProperty.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Seller:</span>
                <span className="font-bold text-[#0D261C]">{selectedProperty.seller}</span>
              </div>
              <div>
                <span className="font-bold text-gray-800 block mb-1">Your Inquiry (Sent Oct 19):</span>
                <p className="text-gray-700 bg-white p-3 rounded-xl border border-gray-200">
                  &ldquo;Hello Pranabjyoti, during the Lot Mondal field survey, the physical sketch showed 2.35 Bigha whereas the listing states 2.50 Bigha. Could you clarify if the boundary pillars on the western irrigation channel have been re-demarcated?&rdquo;
                </p>
              </div>
              <div className="pt-2">
                <span className="font-bold text-emerald-800 block mb-1">Seller Response (Received Oct 20):</span>
                <p className="text-emerald-950 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 font-medium">
                  &ldquo;Namaskar Ananya. Yes, the Lot Mondal noted that the western irrigation buffer was left uncultivated. We have scheduled the circle surveyor for a joint field demarcation this Monday morning. If the measured net area is 2.35 Bigha, I will adjust the final asking price proportionately.&rdquo;
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#0D261C] hover:bg-[#15803D] text-white text-xs font-bold transition shadow-xs"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
