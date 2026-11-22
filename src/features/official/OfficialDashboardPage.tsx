import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { Shield, Clock, AlertTriangle, CheckCircle2, AlertOctagon, ArrowRight, Eye, UserCheck } from 'lucide-react';

interface QueueItem {
  id: string;
  propertyName: string;
  location: string;
  dagPatta: string;
  sellerName: string;
  preCheckStatus: string;
  statusBadge: 'warning' | 'pending' | 'success';
  receivedDate: string;
}

const QUEUE_ITEMS: QueueItem[] = [
  {
    id: 'lst-1',
    propertyName: 'Changsari 2.5 Bigha Agricultural & Tea Plot',
    location: 'Changsari, Kamrup Rural',
    dagPatta: 'Dag 412 / Patta 89',
    sellerName: 'Pranabjyoti Kalita',
    preCheckStatus: '⚠️ 0.15 Bigha Area Mismatch Detected',
    statusBadge: 'warning',
    receivedDate: 'Oct 19, 2026',
  },
  {
    id: 'lst-2',
    propertyName: 'Sonapur 3.0 Bigha Homestead Plot with Areca Grove',
    location: 'Sonapur, Kamrup Metro',
    dagPatta: 'Dag 104 / Patta 22',
    sellerName: 'Pranabjyoti Kalita',
    preCheckStatus: '✅ Title Search & NEC Cleared',
    statusBadge: 'success',
    receivedDate: 'Oct 20, 2026',
  },
  {
    id: 'lst-3',
    propertyName: 'Amingaon Highway Commercial Plot',
    location: 'Amingaon, Kamrup Rural',
    dagPatta: 'Dag 142 / Patta 54',
    sellerName: 'Monideepa Gogoi',
    preCheckStatus: '⏳ Circle Officer NOC Under Review',
    statusBadge: 'pending',
    receivedDate: 'Oct 21, 2026',
  },
  {
    id: 'lst-4',
    propertyName: 'Ghopa Riverine Farmland Parcel',
    location: 'Ghopa, Kamrup Rural',
    dagPatta: 'Dag 318 / Patta 11',
    sellerName: 'Pranabjyoti Kalita',
    preCheckStatus: '⏳ASDMD Flood Zone & MSL Check in Queue',
    statusBadge: 'pending',
    receivedDate: 'Oct 22, 2026',
  },
];

export const OfficialDashboardPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span className="text-[#15803D] font-bold">Government Reviewer Portal</span>
            <span>&gt;</span>
            <span>Verification Queue</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            Revenue Circle Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Assigned Jurisdiction: <strong>Changsari Revenue Circle (Kamrup Metro)</strong> · Verifier: Debajit Hazarika
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/official/inspector/lst-1"
            className="py-2.5 px-5 rounded-xl bg-[#0D261C] hover:bg-[#15803D] text-white font-bold text-xs transition shadow-xs flex items-center gap-2 active:scale-98"
          >
            <span>Open Priority Case (Changsari)</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 4 Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-1">
          <div className="text-xs font-bold text-gray-500">Pending Verification Queue</div>
          <div className="text-3xl font-black text-[#0D261C] mt-1">4 Plots</div>
          <div className="text-[11px] text-gray-500">Changsari &amp; Amingaon circles</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-1">
          <div className="text-xs font-bold text-amber-800">Awaiting Clarification</div>
          <div className="text-3xl font-black text-amber-900 mt-1">1 Plot</div>
          <div className="text-[11px] text-amber-700 font-semibold">0.15 Bigha Area Variance (Changsari)</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-1">
          <div className="text-xs font-bold text-emerald-800">Verified &amp; Signed Off</div>
          <div className="text-3xl font-black text-[#15803D] mt-1">18 Plots</div>
          <div className="text-[11px] text-gray-500">This Month · 100% Audit Ready</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-1">
          <div className="text-xs font-bold text-red-800">Flagged Title / Encumbrance</div>
          <div className="text-3xl font-black text-red-900 mt-1">2 Plots</div>
          <div className="text-[11px] text-red-700 font-semibold">Action escalated to Circle Officer</div>
        </div>
      </div>

      {/* Priority Queue Table */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#0D261C]">
              Priority Verification Queue
            </h3>
            <p className="text-xs text-gray-500">
              Land parcels submitted by registered landowners requiring statutory review and digital sign-off.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-[#15803D] border border-emerald-200">
            {QUEUE_ITEMS.length} Plots in Queue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAF7] border-b border-[#E2E8F0] text-gray-700">
                <th className="p-3.5 font-bold rounded-l-xl">Plot Name &amp; Location</th>
                <th className="p-3.5 font-bold">Dag / Patta No.</th>
                <th className="p-3.5 font-bold">Seller Name</th>
                <th className="p-3.5 font-bold">Automated Pre-Check Status</th>
                <th className="p-3.5 font-bold text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {QUEUE_ITEMS.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-sm text-[#0D261C]">{item.propertyName}</div>
                    <div className="text-[11px] text-gray-500">📍 {item.location} · Received {item.receivedDate}</div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-gray-800">
                    {item.dagPatta}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-gray-800">{item.sellerName}</div>
                    <span className="text-[10px] text-gray-500">Registered Landowner</span>
                  </td>
                  <td className="p-3.5">
                    {item.statusBadge === 'warning' && (
                      <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                        {item.preCheckStatus}
                      </span>
                    )}
                    {item.statusBadge === 'success' && (
                      <span className="font-bold text-[#166534] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                        {item.preCheckStatus}
                      </span>
                    )}
                    {item.statusBadge === 'pending' && (
                      <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block">
                        {item.preCheckStatus}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      to={`/official/inspector/${item.id}`}
                      className="py-1.5 px-3.5 rounded-xl bg-[#0D261C] hover:bg-[#15803D] text-white font-bold text-xs transition shadow-xs inline-flex items-center gap-1.5"
                    >
                      <span>Open Inspector</span>
                      <span>→</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
