import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, Upload, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export const SellerVerificationActionCenter: React.FC = () => {
  const { showToast, updateListingStatus, addDiscrepancyNote } = useApp();
  const [selectedProperty, setSelectedProperty] = useState('AS-KMP-001');
  const [isResolved, setIsResolved] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(true);

  const handleAutoCorrect = () => {
    setIsResolved(true);
    addDiscrepancyNote('DSC-001', 'Seller Pranabjyoti Kalita auto-corrected listing to 2.35 Bigha matching official Jamabandi.', 'Resolved in Demo');
    updateListingStatus('lst-1', 'Approved for Listing', 'Auto-corrected to 2.35 Bigha matching Jamabandi Record');
    showToast('Listing updated to 2.35 Bigha! Discrepancy resolved and trust badge activated.');
  };

  const handleUploadTrace = (e: React.FormEvent) => {
    e.preventDefault();
    setIsResolved(true);
    setShowUploadModal(false);
    addDiscrepancyNote('DSC-001', 'Seller Pranabjyoti Kalita uploaded revised Lot Mondal Boundary Trace Map. Awaiting Reviewer verification.', 'Evidence Requested');
    showToast('Updated Lot Mondal trace sketch submitted for official circle review!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span>Seller Workspace</span>
            <span>&gt;</span>
            <span className="text-[#15803D] font-bold">Verification &amp; Action Center</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            Property Verification &amp; Trust Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Earn your &apos;Verified Plot&apos; badge to build buyer trust and sell up to 3x faster with zero legal hurdles.
          </p>
        </div>

        <div className="min-w-[280px]">
          <label htmlFor="seller-prop-select" className="block text-xs font-bold text-gray-700 mb-1">
            Selected Listing:
          </label>
          <select
            id="seller-prop-select"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#0D261C] focus:outline-none focus:ring-2 focus:ring-[#15803D] shadow-xs"
          >
            <option value="AS-KMP-001">Changsari 2.5 Bigha Plot (Dag 412 / Patta 89)</option>
            <option value="AS-KMP-002">Sonapur 3.0 Bigha Homestead Plot (Dag 104 / Patta 22)</option>
          </select>
        </div>
      </div>

      {/* Top Section — Property Verification Score */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#15803D] border border-emerald-200 text-xs font-bold mb-1">
              <span>🛡️ Verified Seller Status</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#0D261C]">
              {isResolved
                ? 'Verification 100% Complete — Verified Plot Badge Active!'
                : 'Verification 75% Complete — 1 Seller Action Required'}
            </h2>
            <p className="text-xs text-gray-600">
              {isResolved
                ? 'All government records and field surveys are aligned. Your listing is featured with the green Trust Passport.'
                : '3 of 4 official verification checkpoints are verified. Complete the remaining action below to unlock maximum buyer reach.'}
            </p>
          </div>

          <div className="sm:text-right min-w-[180px]">
            <span className="text-3xl font-black text-[#15803D] font-mono">
              {isResolved ? '100%' : '75%'}
            </span>
            <span className="text-xs text-gray-500 block">Trust Readiness Score</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${isResolved ? 'bg-[#15803D]' : 'bg-amber-500'}`}
            style={{ width: isResolved ? '100%' : '75%' }}
          />
        </div>
      </div>

      {/* SECTION 1: Action Required From You (Highlighted Card) */}
      {!isResolved ? (
        <div className="bg-amber-50/80 rounded-3xl border-2 border-amber-300 p-6 sm:p-7 space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 mt-0.5">
              ⚠️
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Immediate Seller Action Required
              </span>
              <h3 className="font-serif text-xl font-bold text-amber-950">
                Resolve 0.15 Bigha Area Discrepancy
              </h3>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed max-w-3xl">
                Your listing states <strong>2.50 Bigha</strong>, while the uploaded Jamabandi government record shows <strong>2.35 Bigha</strong>. Please either upload an updated Lot Mondal trace sketch confirming the field area, or click &apos;Update Listing Area to 2.35 Bigha&apos; to instantly match the government record.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="py-3 px-5 rounded-xl bg-[#0D261C] hover:bg-[#15803D] text-white font-bold text-xs transition shadow-sm flex items-center gap-2 active:scale-98"
            >
              <span>🗺️</span>
              <span>Upload Updated Trace Sketch</span>
            </button>

            <button
              type="button"
              onClick={handleAutoCorrect}
              className="py-3 px-5 rounded-xl bg-white hover:bg-emerald-50 text-[#15803D] border-2 border-[#15803D] font-bold text-xs transition shadow-xs flex items-center gap-2 active:scale-98"
            >
              <span>⚡</span>
              <span>Auto-Correct Listing to 2.35 Bigha</span>
            </button>

            <Link
              to="/seller/inquiries"
              className="py-3 px-4 rounded-xl bg-amber-100/70 hover:bg-amber-200 text-amber-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>💬</span>
              <span>Reply to Buyer Inquiry</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-3xl border border-emerald-300 p-6 flex items-center justify-between gap-4 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-serif text-base font-bold text-[#166534]">
                Area Discrepancy Resolved Successfully
              </h4>
              <p className="text-xs text-emerald-800">
                Your listing area is aligned with official Jamabandi records at 2.35 Bigha. Verified trust badge is live.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResolved(false)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Reset Demo State
          </button>
        </div>
      )}

      {/* SECTION 2: Completed & Automated Platform Checks (Collapsible List) */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-sm space-y-4">
        <button
          type="button"
          onClick={() => setCompletedOpen(!completedOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="font-serif text-lg font-bold text-[#0D261C] flex items-center gap-2">
              <span>Completed &amp; Automated Platform Checks</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#166534]">
                3 Passed
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              These statutory and physical checks have already been validated by the verification system.
            </p>
          </div>
          {completedOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {completedOpen && (
          <div className="space-y-3 pt-2 divide-y divide-gray-100">
            {/* Check 1 */}
            <div className="pt-3 flex items-start gap-3">
              <span className="text-lg text-emerald-600 mt-0.5">✅</span>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0D261C]">
                  Jamabandi Ownership Match
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Dharitree portal confirmed that Periodic (Myadi) Patta 89 is registered directly in your name (<strong>Pranabjyoti Kalita</strong>) with zero tax arrears.
                </p>
              </div>
            </div>

            {/* Check 2 */}
            <div className="pt-3 flex items-start gap-3">
              <span className="text-lg text-emerald-600 mt-0.5">✅</span>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0D261C]">
                  30-Year Non-Encumbrance Check (NEC)
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Senior Sub-Registrar records confirm clean continuous ownership from 1996 to 2026 with no registered mortgages, liens, or court attachments.
                </p>
              </div>
            </div>

            {/* Check 3 */}
            <div className="pt-3 flex items-start gap-3">
              <span className="text-lg text-emerald-600 mt-0.5">✅</span>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0D261C]">
                  18ft Road Access &amp; 360° Tour Verification
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Public Gaon Panchayat road corridor verified abutting the plot frontage. Street and panoramic imagery live on the public explore card.
                </p>
              </div>
            </div>

            {/* Final Badge Status */}
            <div className="pt-3 flex items-start gap-3">
              <span className="text-lg mt-0.5">{isResolved ? '✅' : '⏳'}</span>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0D261C]">
                  Final Platform Trust Badge
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isResolved
                    ? 'Official Verified Badge is active. Buyers see this plot highlighted as 100% verified.'
                    : 'Will activate automatically once the 0.15 Bigha area discrepancy is resolved above.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Trace Map Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUploadModal(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider">
                  Verification Action
                </span>
                <h3 className="font-serif text-xl font-bold text-[#0D261C]">
                  Upload Updated Lot Mondal Trace Sketch
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

            <form onSubmit={handleUploadTrace} className="space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Upload the revised cadastral map or surveyor field certificate signed by the Lot Mondal or Circle Officer clarifying the boundary coordinates for Dag 412.
              </p>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Select File (PDF or Image):</label>
                <div className="border-2 border-dashed border-[#E2E8F0] rounded-2xl p-6 text-center bg-[#F8FAF7]">
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#15803D] file:text-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-2">Maximum file size: 10 MB.</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Clarification Note for Verifier &amp; Buyer:</label>
                <textarea
                  rows={3}
                  defaultValue="Attached updated Lot Mondal field demarcation sketch showing net usable area after western irrigation buffer."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
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
    </div>
  );
};
