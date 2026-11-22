import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { AlertTriangle, Send, CheckCircle2, Eye, Clock, MessageSquare, ArrowRight } from 'lucide-react';

export const OfficialDiscrepanciesPage: React.FC = () => {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span className="text-[#15803D] font-bold">Government Reviewer Portal</span>
            <span>&gt;</span>
            <span>Discrepancy &amp; Seller Clarifications</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            Discrepancy &amp; Seller Clarification Register
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Track plots where sellers were flagged for boundary mismatches, unpartitioned inheritance shares, or missing trace sketches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition ${
              activeTab === 'active'
                ? 'bg-[#0D261C] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-[#E2E8F0]'
            }`}
          >
            Active Inquiries (1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resolved')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition ${
              activeTab === 'resolved'
                ? 'bg-[#0D261C] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-[#E2E8F0]'
            }`}
          >
            Resolved Cases (12)
          </button>
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 mt-0.5">
                  ⚠️
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold mb-1">
                    Area Discrepancy Escalation
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#0D261C]">
                    Changsari 2.5 Bigha Plot (Dag 412 / Patta 89)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Landowner: <strong>Pranabjyoti Kalita</strong> · Contact: +91 94350 12345 · Flagged on Oct 19, 2026
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start">
                Status: Awaiting Seller Demarcation Sketch
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] space-y-2 text-xs">
              <div>
                <strong className="text-gray-900">Official Flag Note:</strong>{' '}
                <span className="text-gray-700">
                  Cadastral survey recorded 2.35 Bigha inside physical coordinates, creating a -0.15 Bigha variance against the 2.50 Bigha listing.
                </span>
              </div>
              <div>
                <strong className="text-gray-900">Seller Latest Reply:</strong>{' '}
                <span className="text-emerald-900 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  &ldquo;Scheduled the circle surveyor for joint boundary re-demarcation on Monday morning. Will upload revised sketch.&rdquo;
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                to="/official/inspector/lst-1"
                className="py-2 px-4 rounded-xl bg-[#0D261C] hover:bg-[#15803D] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
              >
                <span>Open in Workbench</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 text-center text-xs text-gray-500">
          12 historical discrepancy cases resolved and digitally archived with verified boundary sketches.
        </div>
      )}
    </div>
  );
};
