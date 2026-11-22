import React from 'react';
import { useApp } from '../../app/AppContext';
import { ShieldCheck, Lock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

interface AuditItem {
  id: string;
  parcelId: string;
  propertyName: string;
  circle: string;
  decision: 'Approved & Verified' | 'Discrepancy Rectified' | 'Title Rejected';
  verifierName: string;
  verifierRole: string;
  timestamp: string;
  notes: string;
}

const AUDIT_ITEMS: AuditItem[] = [
  {
    id: 'aud-1',
    parcelId: 'Dag 219 / Patta 44',
    propertyName: 'Chabua 5.0 Bigha Tea Estate Plot',
    circle: 'Dibrugarh Circle',
    decision: 'Approved & Verified',
    verifierName: 'Debajit Hazarika',
    verifierRole: 'Circle Verification Officer',
    timestamp: 'Nov 02, 2026 · 3:45 PM',
    notes: 'Special Cultivation land classification certified. RoR Jamabandi and 30-year NEC verified clean.',
  },
  {
    id: 'aud-2',
    parcelId: 'Dag 530 / Patta 67',
    propertyName: 'Barama 12.5 Bigha Farmland',
    circle: 'Baksa Circle',
    decision: 'Approved & Verified',
    verifierName: 'Debajit Hazarika',
    verifierRole: 'Circle Verification Officer',
    timestamp: 'Oct 28, 2026 · 11:20 AM',
    notes: 'PMP Act pipeline clearance buffer confirmed >300m south. Uncontested Myadi Patta title.',
  },
  {
    id: 'aud-3',
    parcelId: 'Dag 104 / Patta 22',
    propertyName: 'Sonapur 3.0 Bigha Homestead Plot',
    circle: 'Sonapur Circle',
    decision: 'Approved & Verified',
    verifierName: 'Debajit Hazarika',
    verifierRole: 'Circle Verification Officer',
    timestamp: 'Oct 24, 2026 · 4:10 PM',
    notes: 'Elevation measured 54.2m MSL above ASDMA datum. Road access right-of-way confirmed.',
  },
  {
    id: 'aud-4',
    parcelId: 'Dag 785 / Patta 12',
    propertyName: 'Cinnamara Tea Fringe Plot',
    circle: 'Jorhat Circle',
    decision: 'Discrepancy Rectified',
    verifierName: 'Debajit Hazarika',
    verifierRole: 'Circle Verification Officer',
    timestamp: 'Oct 16, 2026 · 1:30 PM',
    notes: 'Seller provided updated partition deed resolving co-pattadar succession dispute.',
  },
];

export const OfficialAuditLogPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span className="text-[#15803D] font-bold">Government Reviewer Portal</span>
            <span>&gt;</span>
            <span>Completed Sign-Off Audit Log</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            Official Sign-Off &amp; Audit History
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Immutable gazette log of all approved, rectified, and rejected land title certifications across Kamrup &amp; Upper Assam.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-[#15803D] border border-emerald-200">
            🔒 Audit Log Integrity: 100% Sealed
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-sm p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAF7] border-b border-[#E2E8F0] text-gray-700">
                <th className="p-3.5 font-bold rounded-l-xl">Parcel &amp; Location</th>
                <th className="p-3.5 font-bold">Revenue Circle</th>
                <th className="p-3.5 font-bold">Official Decision</th>
                <th className="p-3.5 font-bold">Authorized Officer</th>
                <th className="p-3.5 font-bold">Timestamp</th>
                <th className="p-3.5 font-bold rounded-r-xl">Verification Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {AUDIT_ITEMS.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-sm text-[#0D261C]">{item.propertyName}</div>
                    <div className="font-mono text-[11px] text-gray-500 font-semibold">{item.parcelId}</div>
                  </td>
                  <td className="p-3.5 font-medium text-gray-700">{item.circle}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-[#166534] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                      ✓ {item.decision}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-gray-800">{item.verifierName}</div>
                    <div className="text-[10px] text-gray-500">{item.verifierRole}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-gray-500">{item.timestamp}</td>
                  <td className="p-3.5 text-gray-600 max-w-xs">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
