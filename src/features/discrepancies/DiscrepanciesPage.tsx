import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { AreaUnit, DiscrepancyCase } from '../../types';
import {
  AREA_UNIT_META,
  formatAreaWithSecondary,
  getTrafficLightFromListing,
  InteractiveUnitConverterWidget,
} from '../../utils/landUnitsAndBadges';

export const DiscrepanciesPage: React.FC = () => {
  const {
    discrepancies,
    listings,
    currentUser,
    areaUnit,
    setAreaUnit,
    addDiscrepancyNote,
  } = useApp();
  const [selectedId, setSelectedId] = useState<string>(discrepancies[0]?.id || 'DSC-001');
  const [filterSeverity, setFilterSeverity] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'Resolved'>('All');
  const [noteText, setNoteText] = useState('');
  const [statusChoice, setStatusChoice] = useState<DiscrepancyCase['status']>('Reviewed in Demo');

  const filteredDiscrepancies = discrepancies.filter((d) => {
    const matchSev = filterSeverity === 'All' || d.severity === filterSeverity;
    const isResolved = d.status === 'Resolved in Demo' || d.status === 'Reviewed in Demo';
    const matchStat =
      filterStatus === 'All' ||
      (filterStatus === 'Open' && !isResolved) ||
      (filterStatus === 'Resolved' && isResolved);
    return matchSev && matchStat;
  });

  const activeCase =
    filteredDiscrepancies.find((d) => d.id === selectedId) ||
    discrepancies.find((d) => d.id === selectedId) ||
    discrepancies[0];

  const linkedListing = listings.find(
    (l) => l.id === activeCase?.listingId || l.parcelId === activeCase?.parcelId
  );

  const verifiedListingsCount = listings.filter(
    (l) => getTrafficLightFromListing(l).level === 'green'
  ).length;
  const warningListingsCount = listings.filter(
    (l) => getTrafficLightFromListing(l).level === 'yellow'
  ).length;
  const issueListingsCount = listings.filter(
    (l) => getTrafficLightFromListing(l).level === 'red'
  ).length;

  const handleReviewerUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    addDiscrepancyNote(
      activeCase.id,
      noteText || 'Updated record check status after document review.',
      statusChoice
    );
    setNoteText('');
  };

  const getTrafficLightForDiscrepancy = (d: DiscrepancyCase) => {
    if (d.status === 'Resolved in Demo') {
      return {
        badge: '🟢 Green · Resolved & Verified',
        cls: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        dot: 'bg-emerald-600',
      };
    }
    if (d.severity === 'High') {
      return {
        badge: '🔴 Red · Issue Found',
        cls: 'bg-red-100 text-red-900 border border-red-300',
        dot: 'bg-red-600',
      };
    }
    return {
      badge: '🟡 Yellow · Warning',
      cls: 'bg-amber-100 text-amber-900 border border-amber-300',
      dot: 'bg-amber-500',
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Clean Structured Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
            Automated Record Cross-Check
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
            Discrepancy Engine & Record Verification Queue
          </h1>
          <p className="text-sm text-secondarytext mt-1 max-w-3xl">
            Automatically compares seller-declared land size, plot numbers, and land use against official survey records so buyers can spot and resolve mismatches before paying a deposit.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-[#CFC5B0] text-xs shadow-sm">
            <span className="text-secondarytext font-medium">📐 Convert Area:</span>
            <select
              aria-label="Convert Land Unit in Discrepancy Engine"
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
              className="font-bold text-evergreen bg-transparent focus:outline-none"
            >
              {(Object.keys(AREA_UNIT_META) as AreaUnit[]).map((u) => (
                <option key={u} value={u}>
                  {AREA_UNIT_META[u].label}
                </option>
              ))}
            </select>
          </div>
          <Link
            to="/trust-centre"
            className="px-4 py-2 rounded-xl bg-white border border-[#CFC5B0] text-evergreen text-xs font-bold hover:bg-cream transition shadow-sm"
          >
            ← Trust Centre
          </Link>
        </div>
      </div>

      {/* Traffic-Light Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              🟢 Green · Verified
            </span>
            <div className="text-2xl font-bold text-evergreen mt-2">
              {verifiedListingsCount} Parcels Clear
            </div>
            <p className="text-xs text-secondarytext mt-0.5">
              Area, plot number & ownership match
            </p>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl">
            ✓
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
              🟡 Yellow · Warning
            </span>
            <div className="text-2xl font-bold text-amber-800 mt-2">
              {warningListingsCount} Pending Review
            </div>
            <p className="text-xs text-secondarytext mt-0.5">
              Awaiting trace map or tax receipt check
            </p>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl">
            ⚠️
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-red-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-900 bg-red-100 px-2.5 py-0.5 rounded-full">
              🔴 Red · Issue Found
            </span>
            <div className="text-2xl font-bold text-red-700 mt-2">
              {discrepancies.length} Flagged Cases ({issueListingsCount} Plots)
            </div>
            <p className="text-xs text-secondarytext mt-0.5">
              Area or Dag mismatch requiring seller clarification
            </p>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-2xl">
            🔍
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DFD6C3] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-maintext">Filter by Risk Level:</span>
          {(['All', 'High', 'Medium', 'Low'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterSeverity === sev
                  ? 'bg-evergreen text-warmivory'
                  : 'bg-warmivory text-maintext hover:bg-cream'
              }`}
            >
              {sev === 'All'
                ? 'All Levels'
                : sev === 'High'
                ? '🔴 High Risk (Red)'
                : sev === 'Medium'
                ? '🟡 Medium Warning (Yellow)'
                : '🟢 Low / Minor'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-maintext">Resolution State:</span>
          {(['All', 'Open', 'Resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterStatus === st
                  ? 'bg-teagreen text-warmivory'
                  : 'bg-warmivory text-maintext hover:bg-cream'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Split Workbench: Discrepancy Queue + Side-by-Side Comparison & Resolution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Cols: Structured Discrepancy Cards */}
        <div className="lg:col-span-5 space-y-3.5">
          {filteredDiscrepancies.map((item) => {
            const active = item.id === activeCase?.id;
            const tl = getTrafficLightForDiscrepancy(item);
            const plot = listings.find(
              (l) => l.id === item.listingId || l.parcelId === item.parcelId
            );

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                  active
                    ? 'bg-white border-evergreen ring-2 ring-evergreen/20 shadow-md'
                    : 'bg-white/90 border-[#DFD6C3] hover:bg-white shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-2">
                  <span className="font-bold text-evergreen">
                    {plot ? `${plot.village}, ${plot.district}` : item.parcelId}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tl.cls}`}>
                    {tl.badge}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-maintext">{item.field}</h3>
                <p className="text-xs text-secondarytext line-clamp-2 mt-1">{item.explanation}</p>

                {plot && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-warmivory border border-cream flex items-center justify-between text-[11px]">
                    <span>
                      Declared: <strong>{formatAreaWithSecondary(plot.areaBigha, areaUnit)}</strong>
                    </span>
                    <span>
                      Survey: <strong>{formatAreaWithSecondary(plot.recordedAreaBigha, areaUnit)}</strong>
                    </span>
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-secondarytext pt-2 border-t border-cream">
                  <span>
                    Status: <strong className="text-maintext">{item.status}</strong>
                  </span>
                  <span>{item.reviewerNotes.length} Review Note(s) →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 7 Cols: Detailed Side-by-Side Comparison & Action Panel */}
        {activeCase && (
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DFD6C3] p-6 sm:p-7 space-y-6 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-cream pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                      getTrafficLightForDiscrepancy(activeCase).cls
                    }`}
                  >
                    {getTrafficLightForDiscrepancy(activeCase).badge}
                  </span>
                  <span className="text-xs text-secondarytext font-semibold">
                    Case {activeCase.id}
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-evergreen">
                  {activeCase.field} — {linkedListing?.title || `Parcel ${activeCase.parcelId}`}
                </h2>
                {linkedListing && (
                  <p className="text-xs text-secondarytext mt-0.5">
                    📍 {linkedListing.village}, {linkedListing.district} · Asking Price: ₹
                    {linkedListing.askingPriceINR.toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/passport/${activeCase.listingId}`}
                  className="px-3.5 py-2 rounded-xl bg-palesky text-evergreen text-xs font-bold hover:bg-mistyblue transition"
                >
                  Open Trust Passport →
                </Link>
                {linkedListing && (
                  <Link
                    to={`/land/${linkedListing.id}`}
                    className="px-3.5 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition"
                  >
                    View Parcel
                  </Link>
                )}
              </div>
            </div>

            {/* Side-by-Side Comparison Cards with Unit Conversion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-warmivory border border-[#CFC5B0] space-y-1.5">
                <div className="text-[11px] uppercase font-bold text-secondarytext">
                  1. Seller Listed Details
                </div>
                <div className="text-base font-bold text-maintext">
                  {activeCase.sellerValue}
                </div>
                {linkedListing && activeCase.field.toLowerCase().includes('area') && (
                  <div className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Converted: {formatAreaWithSecondary(linkedListing.areaBigha, areaUnit)}
                  </div>
                )}
                <div className="text-[11px] text-secondarytext">
                  Source: {activeCase.sellerSourceLabel}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-palesky/70 border border-mistyblue space-y-1.5">
                <div className="text-[11px] uppercase font-bold text-evergreen">
                  2. Official Survey / Reference Record
                </div>
                <div className="text-base font-bold text-evergreen">
                  {activeCase.referenceValue}
                </div>
                {linkedListing && activeCase.field.toLowerCase().includes('area') && (
                  <div className="text-xs font-bold text-evergreen bg-white px-2.5 py-1 rounded-lg border border-mistyblue">
                    Converted: {formatAreaWithSecondary(linkedListing.recordedAreaBigha, areaUnit)}
                  </div>
                )}
                <div className="text-[11px] text-secondarytext">
                  Source: {activeCase.referenceSourceLabel}
                </div>
              </div>
            </div>

            {/* Plain-Language Buyer Risk & Recommended Action */}
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 text-xs space-y-2">
              <div className="font-bold text-red-950 text-sm flex items-center gap-1.5">
                <span>🛡️</span> Why This Matters to Buyers:
              </div>
              <p className="text-red-900 leading-relaxed">{activeCase.explanation}</p>
              <div className="pt-1 text-red-950 bg-white/80 p-2.5 rounded-xl border border-red-200">
                <strong>Recommended Next Step:</strong> {activeCase.recommendedNextStep}
              </div>
            </div>

            {/* Reviewer / Resolution Timeline */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondarytext">
                Verification & Resolution Log ({activeCase.reviewerNotes.length})
              </h3>
              {activeCase.reviewerNotes.length === 0 ? (
                <p className="text-xs text-secondarytext italic">
                  No resolution notes recorded yet. Add a note below to update this check.
                </p>
              ) : (
                activeCase.reviewerNotes.map((rn) => (
                  <div
                    key={rn.id}
                    className="p-3.5 rounded-xl bg-warmivory border border-cream text-xs space-y-1"
                  >
                    <div className="flex justify-between font-bold text-evergreen">
                      <span>{rn.author}</span>
                      <span className="text-[11px] text-secondarytext">
                        {new Date(rn.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-maintext">{rn.note}</p>
                  </div>
                ))
              )}
            </div>

            {/* Interactive Resolution Form */}
            <form
              onSubmit={handleReviewerUpdate}
              className="pt-4 border-t border-cream space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-evergreen">
                  Update Verification Status or Request Seller Clarification
                </h3>
                <span className="text-[11px] text-secondarytext">
                  Active Role: <strong>{currentUser?.role || 'buyer / reviewer'}</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">New Traffic-Light Status</label>
                  <select
                    value={statusChoice}
                    onChange={(e) =>
                      setStatusChoice(e.target.value as DiscrepancyCase['status'])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs font-semibold"
                  >
                    <option value="Open — Requires Review">🔴 Red — Issue Open (Requires Review)</option>
                    <option value="Evidence Requested">🟡 Yellow — Warning (Clarification Requested)</option>
                    <option value="Reviewed in Demo">🟡 Yellow — Reviewed with Buyer Note</option>
                    <option value="Resolved in Demo">🟢 Green — Verified & Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Verification Note</label>
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Seller uploaded updated trace sketch..."
                    className="w-full px-3 py-2 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm"
              >
                Save Verification Update
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Interactive Land Unit Converter Widget at Bottom of Discrepancy Engine */}
      <InteractiveUnitConverterWidget defaultBigha={linkedListing?.areaBigha || 2.5} />
    </div>
  );
};
