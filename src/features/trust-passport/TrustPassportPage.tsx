import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { AreaUnit } from '../../types';
import {
  AREA_UNIT_META,
  formatAreaWithSecondary,
  formatPricePerBighaAndUnit,
  getBuyerTrustBadge,
  getTrafficLightFromCheckStatus,
  getTrafficLightFromListing,
} from '../../utils/landUnitsAndBadges';

export const TrustPassportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    listings,
    documents,
    discrepancies,
    createDueDiligenceCase,
    areaUnit,
    setAreaUnit,
    t,
  } = useApp();

  const listing =
    listings.find((l) => l.id === id || l.parcelId.toLowerCase() === id?.toLowerCase()) ||
    listings[0];

  if (!listing) return null;

  const parcelDocs = documents.filter((d) => d.parcelId === listing.parcelId);
  const parcelDiscrepancies = discrepancies.filter((d) => d.parcelId === listing.parcelId);
  const overallTraffic = getTrafficLightFromListing(listing);
  const buyerBadge = getBuyerTrustBadge(listing);
  const priceMeta = formatPricePerBighaAndUnit(
    listing.askingPriceINR,
    listing.areaBigha,
    areaUnit
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Parcel Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${buyerBadge.bgClass} ${buyerBadge.textClass}`}
            >
              {buyerBadge.icon} {buyerBadge.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${overallTraffic.badgeClass}`}>
              {overallTraffic.badgeText}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen">
            Land Trust Passport — {listing.title}
          </h1>
          <p className="text-xs sm:text-sm text-secondarytext mt-1">
            📍 {listing.village}, {listing.district} · {listing.landType} · Declared Size:{' '}
            <strong className="text-evergreen">{formatAreaWithSecondary(listing.areaBigha, areaUnit)}</strong> ·{' '}
            <strong className="text-teagreen">{priceMeta.formattedLine}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-[#CFC5B0] text-xs">
            <span className="text-secondarytext font-medium">📐 Unit:</span>
            <select
              aria-label="Select Area Unit"
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
              className="font-bold text-evergreen bg-transparent focus:outline-none"
            >
              {(Object.keys(AREA_UNIT_META) as AreaUnit[]).map((u) => (
                <option key={u} value={u}>
                  {AREA_UNIT_META[u].shortLabel}
                </option>
              ))}
            </select>
          </div>

          <select
            id="passport-parcel-select"
            aria-label="Switch Parcel Passport"
            value={listing.id}
            onChange={(e) => navigate(`/passport/${e.target.value}`)}
            className="px-3 py-2 rounded-xl bg-white border border-[#CFC5B0] text-xs font-bold text-evergreen shadow-sm"
          >
            {listings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.village} ({item.district}) — {getTrafficLightFromListing(item).shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Traffic-Light Status Summary Cards (Replacing Bureaucratic Labels) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
              🟢 Green · Verified
            </span>
            <span className="text-2xl font-bold text-emerald-700">
              {listing.passportSummary.matchedCount} Checks
            </span>
          </div>
          <p className="text-xs text-secondarytext mt-2">
            Seller ownership, plot number, and land classification match verified reference records.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
              🟡 Yellow · Warning
            </span>
            <span className="text-2xl font-bold text-amber-700">
              {listing.passportSummary.pendingCount + listing.passportSummary.notCheckedCount} Check(s)
            </span>
          </div>
          <p className="text-xs text-secondarytext mt-2">
            Supporting mutation or local tax receipt is awaiting final verification before registration.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-900">
              🔴 Red · Issue Found
            </span>
            <span className="text-2xl font-bold text-red-700">
              {listing.passportSummary.discrepancyCount} Issue(s)
            </span>
          </div>
          <p className="text-xs text-secondarytext mt-2">
            {listing.passportSummary.discrepancyCount > 0
              ? 'Difference detected between seller-listed area and survey map — review below.'
              : 'Zero record mismatches detected on this land parcel.'}
          </p>
        </div>
      </div>

      {/* Field-by-Field Traffic-Light Verification Table */}
      <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-bold text-evergreen">
              Side-by-Side Record Verification Breakdown
            </h2>
            <p className="text-xs text-secondarytext">
              Plain-language comparison between seller declarations and official reference records.
            </p>
          </div>
          <span className="text-xs text-secondarytext font-medium">
            Last Checked: {new Date(listing.passportSummary.lastReviewedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-warmivory text-maintext border-b border-cream">
                <th className="p-3.5 rounded-tl-xl font-bold">Record Check</th>
                <th className="p-3.5 font-bold">Seller Listed Value</th>
                <th className="p-3.5 font-bold">Reference Record</th>
                <th className="p-3.5 font-bold">Traffic-Light Status</th>
                <th className="p-3.5 rounded-tr-xl font-bold">What This Means for You</th>
              </tr>
            </thead>
            <tbody>
              {listing.passportSummary.comparisons.map((row, idx) => {
                const tl = getTrafficLightFromCheckStatus(row.status);
                return (
                  <tr
                    key={idx}
                    className={`border-b border-cream ${
                      tl.level === 'red' ? 'bg-red-50/50' : tl.level === 'yellow' ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="p-3.5 font-bold text-evergreen">{row.field}</td>
                    <td className="p-3.5 font-medium text-maintext">{row.sellerSubmittedValue}</td>
                    <td className="p-3.5 font-bold text-evergreen">{row.demoReferenceValue}</td>
                    <td className="p-3.5">
                      <span className={`inline-block px-3 py-1 rounded-full font-bold text-[11px] ${tl.badgeClass}`}>
                        {tl.badgeText}
                      </span>
                    </td>
                    <td className="p-3.5 text-secondarytext max-w-xs leading-relaxed">
                      {row.explanation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Linked Discrepancies & LandLocker Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-3 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-evergreen">
            Flagged Discrepancies ({parcelDiscrepancies.length})
          </h3>
          {parcelDiscrepancies.length === 0 ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
              🟢 All checked fields match! No discrepancies flagged for this parcel.
            </div>
          ) : (
            parcelDiscrepancies.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-red-50/80 border border-red-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-red-950">
                  <span>🔴 {d.field}</span>
                  <span className="px-2 py-0.5 rounded bg-red-200 text-red-950 text-[10px]">
                    {d.severity} Priority
                  </span>
                </div>
                <p className="text-red-900 leading-relaxed">{d.explanation}</p>
                <p className="text-[11px] text-maintext bg-white/80 p-2 rounded-lg">
                  <strong>Action:</strong> {d.recommendedNextStep}
                </p>
              </div>
            ))
          )}
          <Link
            to="/discrepancies"
            className="inline-block text-xs font-bold text-evergreen hover:underline pt-1"
          >
            Open Discrepancy Engine →
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-3 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-evergreen">
            Owner Documents in LandLocker ({parcelDocs.length})
          </h3>
          {parcelDocs.length === 0 ? (
            <p className="text-xs text-secondarytext">
              No documents attached yet. Open LandLocker to request seller deeds or Patta extracts.
            </p>
          ) : (
            parcelDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-2xl bg-palesky/60 border border-mistyblue text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-evergreen">{doc.title}</div>
                  <div className="text-[11px] text-secondarytext">
                    {doc.category} · {doc.status}
                  </div>
                </div>
                <Link
                  to="/landlocker"
                  className="px-3 py-1.5 rounded-xl bg-evergreen text-warmivory font-semibold text-[11px]"
                >
                  View Document
                </Link>
              </div>
            ))
          )}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const c = createDueDiligenceCase(listing.id);
                navigate(`/cases/${c.id}`);
              }}
              className="px-4 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm"
            >
              Start 9-Step Buyer Checklist →
            </button>
            <Link
              to={`/land/${listing.id}`}
              className="px-4 py-2.5 rounded-xl border border-evergreen text-evergreen text-xs font-bold hover:bg-cream transition"
            >
              Back to Parcel Page
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-warmivory border border-cream text-xs text-secondarytext">
        ℹ️ {t('passportDisclaimer')}
      </div>
    </div>
  );
};
