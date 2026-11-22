import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { Heart, ArrowLeftRight, Trash2, MapPin, ExternalLink, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatAreaWithSecondary, formatPricePerBighaAndUnit } from '../../utils/landUnitsAndBadges';

interface ShortlistedComparePageProps {
  initialTab?: 'saved' | 'compare';
}

export const ShortlistedComparePage: React.FC<ShortlistedComparePageProps> = ({ initialTab = 'saved' }) => {
  const { listings, savedListingIds, toggleSavedListing, areaUnit, currentUser } = useApp();
  const [tab, setTab] = useState<'saved' | 'compare'>(initialTab);

  // If user hasn't explicitly added items, show sample shortlisted plots so the view is helpful
  const effectiveSavedIds = savedListingIds.length > 0 ? savedListingIds : ['lst-1', 'lst-2', 'lst-3'];
  const savedListings = listings.filter((l) => effectiveSavedIds.includes(l.id));

  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(() => {
    return effectiveSavedIds.slice(0, 3);
  });

  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const comparedListings = listings.filter((l) => selectedForCompare.includes(l.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Buyer Workspace &gt; Shortlisted &amp; Compare
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 mt-1">
            Shortlisted Properties &amp; Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review your saved land parcels and compare legal benchmarks, prices, and boundary access side-by-side.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setTab('saved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              tab === 'saved'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart size={14} className={tab === 'saved' ? 'fill-emerald-800 text-emerald-800' : ''} />
            <span>Shortlisted ({savedListings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('compare')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              tab === 'compare'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight size={14} />
            <span>Compare ({selectedForCompare.length})</span>
          </button>
        </div>
      </div>

      {tab === 'saved' && (
        <>
          {savedListings.length === 0 ? (
            <div className="ds-buyer-card p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl">
                🤍
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">No Shortlisted Properties Yet</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Explore our live satellite map of Assam, filter by your budget or circle, and tap the heart icon on any listing to save it here for comparison.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Explore Land Catalog</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedListings.map((listing) => {
                const isSelected = selectedForCompare.includes(listing.id);
                const priceMeta = formatPricePerBighaAndUnit(
                  listing.askingPriceINR,
                  listing.areaBigha,
                  areaUnit
                );
                return (
                  <div
                    key={listing.id}
                    className="ds-buyer-card overflow-hidden flex flex-col hover:border-emerald-300 transition"
                  >
                    <div className="relative h-48 w-full bg-slate-100">
                      <img
                        src={listing.media[0]?.url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSavedListing(listing.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-rose-600 hover:bg-white transition shadow-sm"
                        title="Remove from shortlist"
                      >
                        <Heart size={16} className="fill-rose-600 text-rose-600" />
                      </button>
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                        {listing.landType}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                          <MapPin size={13} className="text-emerald-800" />
                          <span>{listing.village}, {listing.district}</span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-slate-900 line-clamp-1">
                          {listing.title}
                        </h3>

                        <div className="mt-3 flex items-baseline justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xl font-bold text-slate-900">
                              ₹{(listing.askingPriceINR / 100000).toFixed(1)} Lakhs
                            </span>
                            <div className="text-[11px] text-slate-500">{priceMeta.formattedLine}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-900 block">
                              {formatAreaWithSecondary(listing.areaBigha, areaUnit)}
                            </span>
                            <span className="text-[10px] text-slate-500">Declared Area</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-600 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Road Access:</span>
                            <span className="font-medium text-slate-800">{listing.roadAccess.slice(0, 24)}...</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Circle Benchmark:</span>
                            <span className="font-medium text-slate-800">
                              ₹{(listing.benchmarkRatePerBighaINR / 100000).toFixed(1)}L / Bigha
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCompareSelect(listing.id)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <ArrowLeftRight size={13} />
                          <span>{isSelected ? 'Selected ✓' : 'Add to Compare'}</span>
                        </button>
                        <Link
                          to={`/land/${listing.id}`}
                          className="py-2 px-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition"
                        >
                          Inspect
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'compare' && (
        <div className="space-y-6">
          {comparedListings.length === 0 ? (
            <div className="ds-buyer-card p-12 text-center space-y-3">
              <ArrowLeftRight size={36} className="mx-auto text-slate-400" />
              <h2 className="font-serif text-2xl font-bold text-slate-900">Select Properties to Compare</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Select 2 or 3 saved properties from the Shortlisted tab to compare asking prices, circle benchmarks, road frontage, and legal verifications side-by-side.
              </p>
              <button
                type="button"
                onClick={() => setTab('saved')}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
              >
                Go to Shortlisted Properties
              </button>
            </div>
          ) : (
            <div className="ds-buyer-card overflow-x-auto p-6">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 text-slate-500 font-semibold w-48">Feature</th>
                    {comparedListings.map((l) => (
                      <th key={l.id} className="p-3 min-w-[240px]">
                        <div className="font-serif text-base font-bold text-slate-900">{l.title}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{l.village}, {l.district}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">Asking Price</td>
                    {comparedListings.map((l) => (
                      <td key={l.id} className="p-3">
                        <span className="text-base font-bold text-slate-900">
                          ₹{(l.askingPriceINR / 100000).toFixed(1)} Lakhs
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">Land Area</td>
                    {comparedListings.map((l) => (
                      <td key={l.id} className="p-3 font-semibold text-slate-800">
                        {formatAreaWithSecondary(l.areaBigha, areaUnit)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">Price Per Unit</td>
                    {comparedListings.map((l) => {
                      const meta = formatPricePerBighaAndUnit(l.askingPriceINR, l.areaBigha, areaUnit);
                      return <td key={l.id} className="p-3 font-semibold text-emerald-800">{meta.formattedLine}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">Circle Benchmark</td>
                    {comparedListings.map((l) => (
                      <td key={l.id} className="p-3 text-slate-700 font-medium">
                        ₹{(l.benchmarkRatePerBighaINR / 100000).toFixed(1)}L / Bigha
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">Road Access</td>
                    {comparedListings.map((l) => (
                      <td key={l.id} className="p-3 text-slate-700">{l.roadAccess}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">Elevation &amp; Terrain</td>
                    {comparedListings.map((l) => (
                      <td key={l.id} className="p-3 text-slate-700">{l.floodRiskNote}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">Trust Passport</td>
                    {comparedListings.map((l) => (
                      <td key={l.id} className="p-3">
                        <span className="badge-verified-green px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>{l.passportSummary.matchedCount} Checks Verified</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50">Actions</td>
                    {comparedListings.map((l) => (
                      <td key={l.id} className="p-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/land/${l.id}`}
                            className="py-1.5 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
                          >
                            View Parcel
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleCompareSelect(l.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-50"
                            title="Remove from comparison"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
