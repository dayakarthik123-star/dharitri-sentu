import { AccountSecuritySettingsPanel } from '../profile/AccountSecuritySettingsPanel';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { GOVERNMENT_INTEGRATION_BOUNDARIES } from '../../services/govIntegrationBoundary';
import { AreaUnit, ListingStatus } from '../../types';
import {
  AREA_UNIT_META,
  formatAreaWithSecondary,
  formatPricePerBighaAndUnit,
  getBuyerTrustBadge,
  getTrafficLightFromListing,
} from '../../utils/landUnitsAndBadges';

export const BUYER_DEMO_EXPLORE_LISTINGS = [
  {
    id: 'demo-heng-1',
    title: '1.5 Bigha Residential Plot in Hengrabari, Guwahati',
    priceINR: 5500000,
    priceFormatted: '₹55,00,000',
    district: 'Kamrup Metro',
    circle: 'Dispur',
    mouza: 'Beltola',
    dagNo: '452',
    pattaNo: '178',
    kisam: 'Basti',
    areaText: '1.5 Bigha (21,600 sq. ft.)',
    image: '/assets/parcel-homestead.jpg',
    description:
      'High-demand residential plot located in Hengrabari with direct municipal road access, natural hillside drainage, zero waterlogging history, and verified Periodic Patta ownership ready for immediate transfer.',
    badgeLabel: 'Verified Clear Title',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'demo-barp-2',
    title: '2 Bigha Commercial Land near NH-27, Patbaushi',
    priceINR: 3800000,
    priceFormatted: '₹38,00,000',
    district: 'Barpeta',
    circle: 'Barpeta',
    mouza: 'Barpeta',
    dagNo: '198',
    pattaNo: '84',
    kisam: 'Commercial/Basti',
    areaText: '2.0 Bigha (28,800 sq. ft.)',
    image: '/assets/parcel-agricultural.jpg',
    description:
      'High-visibility commercial frontage plot situated 200m from the NH-27 bypass at Patbaushi, Barpeta. Wide road frontage ideal for logistics depot, cold storage, showroom, or agro-processing unit.',
    badgeLabel: 'Verified Commercial Zone',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'demo-jalu-3',
    title: '3 Bigha Agricultural & Homestead Plot in Jalukbari',
    priceINR: 7200000,
    priceFormatted: '₹72,00,000',
    district: 'Kamrup Metro',
    circle: 'Guwahati',
    mouza: 'Jalukbari',
    dagNo: '125',
    pattaNo: '45',
    kisam: 'Rupit/Basti',
    areaText: '3.0 Bigha (43,200 sq. ft.)',
    image: '/assets/tea-garden-bg.jpg',
    description:
      'Picturesque fertile homestead and agricultural land near Jalukbari foothills. Excellent groundwater table, nearby 3-phase electricity line, clear RoR Jamabandi records, and boundary fencing in place.',
    badgeLabel: 'Verified RoR & Jamabandi',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
];

export const BuyerDashboardPage: React.FC = () => {
  const {
    currentUser,
    listings,
    savedListingIds,
    recentlyViewedIds,
    recentSearches,
    enquiries,
    cases,
    documents,
    areaUnit,
    setAreaUnit,
    toggleSavedListing,
    showToast,
  } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'saved' | 'explore' | 'passport' | 'compare' | 'enquiries' | 'verification' | 'faqs' | 'settings'
  >('saved');

  const [requestedAccessIds, setRequestedAccessIds] = useState<Record<string, boolean>>({});
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const handleRequestAccess = (id: string, title: string) => {
    setRequestedAccessIds((prev) => ({ ...prev, [id]: true }));
    showToast(`Access Request Dispatched: Land title deeds for "${title}" requested from Pattadar.`);
  };

  const savedListings = listings.filter((l) => savedListingIds.includes(l.id));
  const recentlyViewed = listings.filter((l) => recentlyViewedIds.includes(l.id));
  const sharedDocs = documents.filter((d) =>
    d.sharedWithEmails.includes(currentUser?.email || '')
  );
  const verifiedSavedCount = savedListings.filter(
    (l) => getTrafficLightFromListing(l).level === 'green'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Structured Buyer Workspace Header (Strictly Buyer Only - No Switch to Seller Link) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
              👤 Buyer Workspace (Role-Restricted)
            </span>
            <span className="text-xs text-secondarytext font-medium">
              {currentUser?.email || ''}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen">
            Buyer Dashboard — {currentUser?.name || 'Ananya Baruah'}
          </h1>
          <p className="text-sm text-secondarytext mt-1">
            Compare saved land parcels, convert Bigha to Acre or Sq. Ft., review traffic-light Trust Passports, inspect Land Value Insights, and track seller replies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-[#CFC5B0] text-xs shadow-sm">
            <span className="text-secondarytext font-medium">📐 Unit:</span>
            <select
              aria-label="Buyer Dashboard Area Unit"
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
            to="/buyer/inquiries"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#CFC5B0] text-xs font-bold text-evergreen hover:bg-cream transition shadow-sm flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>Site Visits & Inquiries</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Live Hub</span>
          </Link>

          <Link
            to="/price-explorer"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#CFC5B0] text-xs font-bold text-evergreen hover:bg-cream transition shadow-sm"
          >
            📈 Land Value Insights
          </Link>

          <Link
            to="/explore"
            className="px-4 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm"
          >
            + Explore Land
          </Link>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
          <div className="text-xs font-semibold text-secondarytext">Saved Land Parcels</div>
          <div className="text-3xl font-bold text-evergreen mt-1">{savedListings.length}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            🟢 {verifiedSavedCount} Verified · {savedListings.length - verifiedSavedCount} Need Review
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
          <div className="text-xs font-semibold text-secondarytext">Active Seller Inquiries</div>
          <div className="text-3xl font-bold text-evergreen mt-1">{enquiries.length}</div>
          <div className="text-[11px] text-secondarytext mt-1">
            Direct zero-brokerage threads
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
          <div className="text-xs font-semibold text-secondarytext">Buyer Checklists</div>
          <div className="text-3xl font-bold text-evergreen mt-1">{cases.length}</div>
          <div className="text-[11px] text-secondarytext mt-1">
            9-step verification workflows
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
          <div className="text-xs font-semibold text-secondarytext">Shared LandLocker Deeds</div>
          <div className="text-3xl font-bold text-teagreen mt-1">{sharedDocs.length}</div>
          <div className="text-[11px] text-secondarytext mt-1">
            Consent-granted seller records
          </div>
        </div>
      </div>

      {/* Seller Reply Notification Alert */}
      {enquiries.some((e) => e.status === 'Replied' || (e.replies && e.replies.length > 0)) && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-evergreen flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">
              💬
            </span>
            <div className="min-w-0">
              <div className="font-bold text-sm text-evergreen flex items-center gap-2">
                <span>Seller Response Received!</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                  New Message
                </span>
              </div>
              <p className="text-xs text-secondarytext mt-0.5 truncate">
                A verified seller has replied to your enquiry. Check their latest message and coordinate next steps.
              </p>
            </div>
          </div>
          <Link
            to="/buyer/inquiries"
            className="py-2.5 px-4 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory text-xs font-bold transition shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>Open Inquiries & Visits Hub →</span>
          </Link>
        </div>
      )}

      {/* Structured Workspace Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-cream pb-3">
        {[
          { id: 'saved', label: `❤️ Saved Parcels (${savedListings.length})` },
          { id: 'explore', label: '🌾 Explore Land (Assam Listings)' },
          { id: 'passport', label: '🛡️ Land Trust Passport (95/100)' },
          { id: 'compare', label: '📐 Side-by-Side Comparison' },
          { id: 'enquiries', label: `💬 Seller Inquiries (${enquiries.length})` },
          { id: 'verification', label: `📋 Due Diligence Checklists (${cases.length})` },
          { id: 'faqs', label: '❓ Buyer FAQs & Guidance' },
          { id: 'settings', label: '⚙️ Account & Security Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-evergreen text-warmivory shadow-sm'
                : 'bg-white text-maintext border border-[#DFD6C3] hover:bg-cream'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SAVED PARCELS */}
      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-evergreen">
                Saved Land Listings ({savedListings.length})
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('compare')}
                className="text-xs font-bold text-evergreen hover:underline"
              >
                Compare Side-by-Side →
              </button>
            </div>

            {savedListings.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#DFD6C3] space-y-3">
                <p className="text-base font-serif font-bold text-evergreen">
                  No saved land parcels yet
                </p>
                <p className="text-xs text-secondarytext">
                  Click the ❤️ Save button on any parcel card on the Homepage or Explore page to shortlist properties here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('explore')}
                  className="inline-block px-5 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold"
                >
                  Browse Assam Land Listings →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {savedListings.map((item) => {
                  const badge = getBuyerTrustBadge(item);
                  const traffic = getTrafficLightFromListing(item);
                  const priceMeta = formatPricePerBighaAndUnit(
                    item.askingPriceINR,
                    item.areaBigha,
                    areaUnit
                  );

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-[#DFD6C3] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div className="relative h-44 bg-cream">
                        <img
                          src={item.media[0]?.url || '/assets/parcel-agricultural.jpg'}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow ${badge.bgClass} ${badge.textClass}`}
                        >
                          {badge.icon} {badge.label}
                        </span>
                        <span
                          className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${traffic.badgeClass}`}
                        >
                          {traffic.badgeText}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSavedListing(item.id)}
                          className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-xs font-bold text-red-700 shadow"
                        >
                          Remove ✕
                        </button>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-serif font-bold text-base text-evergreen">
                            {item.title}
                          </h3>
                          <p className="text-xs text-secondarytext">
                            📍 {item.village}, {item.district} · {item.landType}
                          </p>
                        </div>

                        <div className="p-3 rounded-2xl bg-warmivory border border-cream text-xs space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-base text-evergreen">
                              ₹{item.askingPriceINR.toLocaleString('en-IN')}
                            </span>
                            <span className="font-bold text-maintext">
                              {formatAreaWithSecondary(item.areaBigha, areaUnit)}
                            </span>
                          </div>
                          <div className="text-teagreen font-semibold">
                            {priceMeta.formattedLine}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Link
                            to={`/passport/${item.id}`}
                            className="text-xs font-bold text-evergreen hover:underline"
                          >
                            Trust Passport
                          </Link>
                          <Link
                            to={`/land/${item.id}`}
                            className="px-4 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition"
                          >
                            View Parcel →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 4 Cols: Recently Viewed & Recent Searches */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-3xl border border-[#DFD6C3] p-5 space-y-3 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-evergreen">Recently Viewed Plots</h2>
              {recentlyViewed.map((item) => (
                <Link
                  key={item.id}
                  to={`/land/${item.id}`}
                  className="block p-3 rounded-2xl bg-warmivory hover:bg-cream/70 text-xs border border-cream transition"
                >
                  <div className="flex items-center justify-between font-bold text-evergreen">
                    <span>{item.village}, {item.district}</span>
                    <span>₹{item.askingPriceINR.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-maintext font-medium truncate mt-0.5">{item.title}</div>
                  <div className="text-[11px] text-secondarytext mt-0.5">
                    {formatAreaWithSecondary(item.areaBigha, areaUnit)}
                  </div>
                </Link>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-[#DFD6C3] p-5 space-y-3 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-evergreen">Recent Searches</h2>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((s) => (
                  <Link
                    key={s}
                    to={`/explore?q=${encodeURIComponent(s)}`}
                    className="px-3 py-1.5 rounded-full bg-warmivory border border-cream text-xs font-semibold text-maintext hover:bg-evergreen hover:text-warmivory transition"
                  >
                    🔍 {s}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPLORE LAND (REALISTIC ASSAM LAND LISTINGS) */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-evergreen">
                Explore Verified Assam Land Parcels
              </h2>
              <p className="text-xs sm:text-sm text-secondarytext mt-0.5">
                Curated government-verified land parcels across Guwahati, Kamrup Metro, and Barpeta with active RoR Jamabandi clearance.
              </p>
            </div>
            <Link
              to="/explore"
              className="self-start px-4 py-2 rounded-xl bg-white border border-[#CFC5B0] text-xs font-bold text-evergreen hover:bg-cream transition shadow-xs"
            >
              Open Full-Screen Geospatial Explorer →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BUYER_DEMO_EXPLORE_LISTINGS.map((plot) => {
              const requested = requestedAccessIds[plot.id];
              return (
                <div
                  key={plot.id}
                  className="bg-white rounded-3xl border border-[#DFD6C3] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* High-res Image & Badge */}
                    <div className="relative h-48 bg-cream overflow-hidden">
                      <img
                        src={plot.image}
                        alt={plot.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-300"
                      />
                      <span
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${plot.badgeColor}`}
                      >
                        ✓ {plot.badgeLabel}
                      </span>
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-mono font-semibold">
                        {plot.areaText}
                      </span>
                    </div>

                    {/* Listing Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-serif font-bold text-base text-evergreen leading-snug">
                          {plot.title}
                        </h3>
                        <p className="text-xs text-secondarytext mt-1">
                          📍 {plot.circle} Circle, {plot.district} · Mouza: {plot.mouza}
                        </p>
                      </div>

                      {/* Land & Revenue Data Grid */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-warmivory border border-cream text-xs text-center">
                        <div className="p-1">
                          <span className="block text-[10px] text-secondarytext uppercase font-semibold">Dag No</span>
                          <strong className="text-evergreen font-mono">{plot.dagNo}</strong>
                        </div>
                        <div className="p-1 border-x border-[#E2D8C3]">
                          <span className="block text-[10px] text-secondarytext uppercase font-semibold">Patta No</span>
                          <strong className="text-evergreen font-mono">{plot.pattaNo}</strong>
                        </div>
                        <div className="p-1">
                          <span className="block text-[10px] text-secondarytext uppercase font-semibold">Kisam</span>
                          <strong className="text-evergreen">{plot.kisam}</strong>
                        </div>
                      </div>

                      <p className="text-xs text-secondarytext leading-relaxed line-clamp-3">
                        {plot.description}
                      </p>

                      <div className="p-3 rounded-xl bg-palesky/50 border border-mistyblue flex items-center justify-between">
                        <span className="text-xs text-secondarytext font-medium">Asking Price:</span>
                        <strong className="text-base text-evergreen font-serif">{plot.priceFormatted}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action CTAs */}
                  <div className="p-5 pt-0 border-t border-cream mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRequestAccess(plot.id, plot.title)}
                      disabled={requested}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-xs ${
                        requested
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-evergreen hover:bg-teagreen text-warmivory'
                      }`}
                    >
                      {requested ? '✓ Access Requested' : 'Request Access'}
                    </button>
                    <Link
                      to="/explore"
                      className="py-2.5 px-3 rounded-xl bg-warmivory hover:bg-cream border border-[#CFC5B0] text-xs font-bold text-evergreen text-center transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LAND TRUST PASSPORT */}
      {activeTab === 'passport' && (
        <div className="space-y-8">
          {/* Top Trust Score Header with Circular Progress Meter */}
          <div className="bg-white rounded-3xl border border-[#DFD6C3] p-7 sm:p-9 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Circular Meter (SVG) */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#E5E0D4"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1B4D3E"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset="12.56" /* 95% filled */
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl font-serif font-bold text-evergreen">95</span>
                    <span className="text-[11px] font-bold tracking-wider text-secondarytext uppercase">out of 100</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                    Tier-1 Verified Buyer Score
                  </span>
                  <div className="text-[11px] text-secondarytext mt-1">
                    95% of statutory verification checks cleared
                  </div>
                </div>
              </div>

              {/* Trust Overview & Score Drivers */}
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
                    Digital Identity & Purchase Verification
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen mt-0.5">
                    Land Trust Passport — Verified Buyer Portfolio
                  </h2>
                  <p className="text-xs sm:text-sm text-secondarytext mt-1 leading-relaxed">
                    This official cryptographic Trust Passport certifies that your citizen identity, registered mobile OTP, Permanent Account Number (PAN), and land purchase eligibility in Assam have been digitally authenticated.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-warmivory border border-cream text-center">
                    <span className="text-lg">🆔</span>
                    <div className="text-xs font-bold text-evergreen mt-1">Aadhaar e-KYC</div>
                    <div className="text-[10px] text-emerald-700 font-bold">✓ Authenticated</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-warmivory border border-cream text-center">
                    <span className="text-lg">📱</span>
                    <div className="text-xs font-bold text-evergreen mt-1">Mobile OTP</div>
                    <div className="text-[10px] text-emerald-700 font-bold">✓ Two-Factor Active</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-warmivory border border-cream text-center">
                    <span className="text-lg">🏛️</span>
                    <div className="text-xs font-bold text-evergreen mt-1">Assam Domicile</div>
                    <div className="text-[10px] text-emerald-700 font-bold">✓ Citizen Record</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-warmivory border border-cream text-center">
                    <span className="text-lg">📜</span>
                    <div className="text-xs font-bold text-evergreen mt-1">Purchase NOC</div>
                    <div className="text-[10px] text-emerald-700 font-bold">✓ Pre-Cleared</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Section: Buyer Verification Card + Digital Document Vault */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Buyer Verification Card */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#DFD6C3] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-cream pb-3">
                <h3 className="font-serif text-lg font-bold text-evergreen">Buyer Verification Card</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  ✓ Verified Govt ID
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-cream">
                  <span className="text-secondarytext">Full Name:</span>
                  <strong className="text-maintext font-bold">{currentUser?.name || 'Ananya Baruah'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-cream">
                  <span className="text-secondarytext">Verified Phone:</span>
                  <strong className="text-maintext font-mono">{currentUser?.phone || '+91 94350-00101'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-cream">
                  <span className="text-secondarytext">Email Address:</span>
                  <strong className="text-maintext">{currentUser?.email || 'buyer@demo.dharitrisentu.test'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-cream">
                  <span className="text-secondarytext">Primary Assam District:</span>
                  <strong className="text-evergreen font-bold">{currentUser?.district || 'Kamrup Metro'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-cream">
                  <span className="text-secondarytext">UIDAI e-KYC Status:</span>
                  <span className="font-bold text-emerald-800">Linked (Aadhaar XXXX-XXXX-4091)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-secondarytext">Assam Citizen Category:</span>
                  <strong className="text-maintext">General Citizen / Indigenous Resident</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed">
                <strong>🔒 Cryptographic Seal:</strong> All verification attributes are anchored with a SHA-256 digital signature to prevent impersonation or unauthorized proxy land purchases.
              </div>
            </div>

            {/* Digital Document Vault */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DFD6C3] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-cream pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-evergreen">Digital Document Vault</h3>
                  <p className="text-[11px] text-secondarytext">Encrypted and pre-cleared statutory documents stored in LandLocker</p>
                </div>
                <Link
                  to="/landlocker"
                  className="px-3 py-1.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs font-bold text-evergreen hover:bg-cream"
                >
                  Open Vault →
                </Link>
              </div>

              <div className="space-y-3">
                {/* Vault Card 1: Aadhaar */}
                <div className="p-4 rounded-2xl bg-warmivory border border-cream flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-2xs">
                      🪪
                    </span>
                    <div>
                      <div className="font-bold text-xs text-evergreen">Aadhaar Identity Verification</div>
                      <div className="text-[11px] text-secondarytext">UIDAI e-KYC Verified · SHA-256 Match</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓ Verified
                  </span>
                </div>

                {/* Vault Card 2: PAN Card */}
                <div className="p-4 rounded-2xl bg-warmivory border border-cream flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-2xs">
                      💳
                    </span>
                    <div>
                      <div className="font-bold text-xs text-evergreen">Permanent Account Number (PAN) Card</div>
                      <div className="text-[11px] text-secondarytext">Income Tax Dept Validated · Ref: AXXXX9214K</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓ Linked & Active
                  </span>
                </div>

                {/* Vault Card 3: Pre-cleared Land Purchase Eligibility Certificate */}
                <div className="p-4 rounded-2xl bg-warmivory border border-cream flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-2xs">
                      📜
                    </span>
                    <div>
                      <div className="font-bold text-xs text-evergreen">Pre-cleared Land Purchase Eligibility Certificate</div>
                      <div className="text-[11px] text-secondarytext">Revenue Dept Assam · No. AS-REV-PUR-8820 · General Belts</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓ Pre-Cleared
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Audit Log */}
          <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-cream pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-evergreen">Security Audit Log</h3>
                <p className="text-[11px] text-secondarytext">Recent access requests, session authentications, and statutory verification events</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-palesky text-evergreen text-xs font-semibold">
                🛡️ Tamper-Evident Ledger
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-warmivory text-maintext border-b border-cream">
                    <th className="p-3 rounded-tl-xl font-bold">Timestamp</th>
                    <th className="p-3 font-bold">Event Type</th>
                    <th className="p-3 font-bold">Target Parcel / Action</th>
                    <th className="p-3 font-bold">Device & Network</th>
                    <th className="p-3 rounded-tr-xl font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream">
                  <tr className="hover:bg-warmivory/40">
                    <td className="p-3 font-mono text-[11px] text-secondarytext">2026-10-30 18:42:10</td>
                    <td className="p-3 font-bold text-evergreen">e-KYC DigiLocker Session Initiated</td>
                    <td className="p-3">Citizen Identity Re-verification</td>
                    <td className="p-3 text-secondarytext">Guwahati, Assam (103.28.140.21)</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ Success
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-warmivory/40">
                    <td className="p-3 font-mono text-[11px] text-secondarytext">2026-10-30 14:15:33</td>
                    <td className="p-3 font-bold text-evergreen">Document Access Request Dispatched</td>
                    <td className="p-3">Dag 452, Patta 178 (Hengrabari, Guwahati)</td>
                    <td className="p-3 text-secondarytext">Web Console (Desktop Edge)</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                        ⏳ Dispatched
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-warmivory/40">
                    <td className="p-3 font-mono text-[11px] text-secondarytext">2026-10-29 11:20:05</td>
                    <td className="p-3 font-bold text-evergreen">Jamabandi RoR Record Query</td>
                    <td className="p-3">Dharitree / ILRMS Gateway Sync</td>
                    <td className="p-3 text-secondarytext">Govt Gateway Adapter</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ 0 Discrepancy
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-warmivory/40">
                    <td className="p-3 font-mono text-[11px] text-secondarytext">2026-10-28 09:05:44</td>
                    <td className="p-3 font-bold text-evergreen">Two-Factor OTP Security Login</td>
                    <td className="p-3">Mobile Verification (+91 94350-00101)</td>
                    <td className="p-3 text-secondarytext">Windows 11 / Chrome 124</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ Authenticated
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SIDE-BY-SIDE COMPARISON (UNIT CONVERTER REMOVED) */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-evergreen">
                Side-by-Side Shortlisted Parcel Comparison
              </h2>
              <p className="text-xs text-secondarytext">
                Compare verified asking rates, Dag/Patta classifications, and traffic-light legal statuses across your saved Assam land parcels.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-warmivory text-maintext border-b border-cream">
                    <th className="p-3.5 rounded-tl-xl">Property</th>
                    <th className="p-3.5">Buyer Badge</th>
                    <th className="p-3.5">Traffic-Light Status</th>
                    <th className="p-3.5">Size ({AREA_UNIT_META[areaUnit].shortLabel})</th>
                    <th className="p-3.5">Total Price</th>
                    <th className="p-3.5">Rate per Unit</th>
                    <th className="p-3.5 rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(savedListings.length > 0 ? savedListings : listings.slice(0, 4)).map((item) => {
                    const badge = getBuyerTrustBadge(item);
                    const traffic = getTrafficLightFromListing(item);
                    const priceMeta = formatPricePerBighaAndUnit(
                      item.askingPriceINR,
                      item.areaBigha,
                      areaUnit
                    );
                    return (
                      <tr key={item.id} className="border-b border-cream hover:bg-warmivory/40">
                        <td className="p-3.5">
                          <div className="font-bold text-evergreen">{item.title}</div>
                          <div className="text-secondarytext">
                            {item.village}, {item.district} · {item.landType}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bgClass} ${badge.textClass}`}
                          >
                            {badge.icon} {badge.label}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${traffic.badgeClass}`}>
                            {traffic.badgeText}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold">
                          {formatAreaWithSecondary(item.areaBigha, areaUnit)}
                        </td>
                        <td className="p-3.5 font-bold text-evergreen">
                          ₹{item.askingPriceINR.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 font-semibold text-teagreen">
                          {priceMeta.formattedLine}
                        </td>
                        <td className="p-3.5">
                          <Link
                            to={`/land/${item.id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-evergreen text-warmivory font-bold"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SELLER INQUIRIES */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-4 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-evergreen">
            My Inquiries & Seller Replies ({enquiries.length})
          </h2>
          {enquiries.map((enq) => (
            <div
              key={enq.id}
              className="p-5 rounded-2xl bg-warmivory border border-cream text-xs space-y-2.5"
            >
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="font-bold text-sm text-evergreen">
                  {enq.listingTitle} ({enq.parcelId})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-palesky text-evergreen font-bold">
                  Status: {enq.status}
                </span>
              </div>
              <div className="font-semibold text-maintext">{enq.subject}</div>
              <p className="text-secondarytext">{enq.message}</p>
              {enq.replies.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-white border-l-4 border-teagreen space-y-0.5"
                >
                  <div className="font-bold text-evergreen">{r.senderName} (Seller):</div>
                  <p className="text-maintext">{r.message}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* TAB 6: VERIFICATION CHECKLISTS & SHARED DEEDS */}
      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-3 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-evergreen">
              Active 9-Step Buyer Checklists ({cases.length})
            </h2>
            {cases.map((c) => {
              const done = c.tasks.filter((t) => t.status === 'Completed').length;
              const pct = Math.round((done / c.tasks.length) * 100);
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-palesky/60 border border-mistyblue text-xs space-y-2"
                >
                  <div className="flex justify-between font-bold text-evergreen">
                    <span>Case {c.id} · Parcel {c.parcelId}</span>
                    <span>{pct}% Complete</span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-evergreen" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-secondarytext">{c.summaryNote}</p>
                  <Link
                    to={`/cases/${c.id}`}
                    className="inline-block font-bold text-evergreen hover:underline"
                  >
                    Open Interactive Checklist →
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-3 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-evergreen">
              Shared LandLocker Documents ({sharedDocs.length})
            </h2>
            {sharedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-warmivory border border-cream text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-evergreen">{doc.title}</div>
                  <div className="text-secondarytext">
                    Parcel {doc.parcelId} · {doc.category}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/landlocker')}
                  className="px-3.5 py-1.5 rounded-xl bg-evergreen text-warmivory font-bold"
                >
                  Preview
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: BUYER FAQS */}
      {activeTab === 'faqs' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-7 sm:p-9 shadow-sm space-y-6">
          <div className="border-b border-cream pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
              Buyer Knowledge Base & Support
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen mt-1">
              Frequently Asked Questions for Land Buyers
            </h2>
            <p className="text-xs sm:text-sm text-secondarytext mt-1">
              Statutory guidance on Jamabandi RoR verification, document unlocking, Assam land units, and fraud protection.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Q1: How do I request document access from a land seller?',
                a: 'Browse the desired property listing in the Explore section and click "Request Access". Once the seller approves your request, all verified NOCs, Jamabandi records, and land title deeds will unlock in your dashboard.',
              },
              {
                q: 'Q2: What is a Jamabandi document and how do I verify it?',
                a: 'Jamabandi is the official Record of Rights (RoR) in Assam, maintaining details of ownership, Dag/Patta numbers, and land classification (Kisam). You can cross-verify the Dag and Patta details via our integrated Dharitree/ILRMS verification check.',
              },
              {
                q: 'Q3: What are the typical land units used in Assam?',
                a: 'Land in Assam is traditionally measured in Bigha, Katha, and Lessa (1 Bigha = 5 Katha = 100 Lessa, or approximately 14,400 sq. ft.).',
              },
              {
                q: 'Q4: How does Dharitri Sentu protect buyers from fraudulent land sales?',
                a: 'Every land listing undergoes a multi-layer check including seller identity verification, Dharitree database cross-referencing, NOC status validation, and official Reviewer verification before listing approval.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-cream bg-warmivory overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-evergreen"
                  >
                    <span>{faq.q}</span>
                    <span className="text-base text-secondarytext font-mono">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs text-maintext leading-relaxed border-t border-[#DFD6C3]/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AccountSecuritySettingsPanel />
        </div>
      )}
    </div>
  );
};

export const SellerDashboardPage: React.FC = () => {
  const {
    currentUser,
    listings,
    enquiries,
    documents,
    areaUnit,
    setAreaUnit,
    replyToEnquiry,
    updateListingStatus,
    updateSellerAskingPrice,
    shareDocument,
    revokeDocumentAccess,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'listings' | 'enquiries' | 'documents' | 'faqs' | 'settings'>('listings');
  const [openSellerFaqIdx, setOpenSellerFaqIdx] = useState<number | null>(0);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [editingPriceMap, setEditingPriceMap] = useState<Record<string, number>>({});

  const sellerListings = listings.filter(
    (l) => !currentUser || currentUser.role !== 'seller' || l.sellerEmail === currentUser.email
  );
  const totalPortfolioINR = sellerListings.reduce((acc, l) => acc + l.askingPriceINR, 0);
  const verifiedListingsCount = sellerListings.filter(
    (l) => getTrafficLightFromListing(l).level === 'green'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Structured Seller Workspace Header (Strictly Seller Only - No Buyer Dashboard / Projection Link) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
              🏡 Seller Workspace (Role-Restricted)
            </span>
            <span className="text-xs text-secondarytext font-medium">
              {currentUser?.email || ''}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen">
            Seller Dashboard — {currentUser?.name || 'Pranabjyoti Kalita'}
          </h1>
          <p className="text-sm text-secondarytext mt-1">
            Manage your land listings and asking prices, track mandatory verification statuses, share LandLocker documents with consent, and respond to buyer inquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-[#CFC5B0] text-xs shadow-sm">
            <span className="text-secondarytext font-medium">📐 Unit:</span>
            <select
              aria-label="Seller Dashboard Area Unit"
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
            to="/landlocker"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#CFC5B0] text-xs font-bold text-evergreen hover:bg-cream transition shadow-sm"
          >
            🔒 Open LandLocker
          </Link>

          <Link
            to="/sell/new"
            className="px-4 py-2 rounded-xl bg-[#D97706] text-white text-xs font-bold hover:bg-[#B45309] transition shadow-md"
          >
            + List New Land Parcel (Up to 15 Photos)
          </Link>
        </div>
      </div>

      {/* Seller KPI Row */}
      {enquiries.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-evergreen flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">
              🔔
            </span>
            <div className="min-w-0">
              <div className="font-bold text-sm text-evergreen flex items-center gap-2">
                <span>New Buyer Enquiry Received!</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                  {enquiries.filter((e) => e.status === 'Sent').length || enquiries.length} Active
                </span>
              </div>
              <p className="text-xs text-secondarytext mt-0.5 truncate">
                Latest from <strong>{enquiries[0]?.buyerName}</strong> for <em>{enquiries[0]?.listingTitle}</em>: &ldquo;{enquiries[0]?.message.slice(0, 90)}...&rdquo;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('enquiries')}
            className="py-2.5 px-4 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory text-xs font-bold transition shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>Open Inquiries Inbox →</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
          <div className="text-xs font-semibold text-secondarytext">My Land Listings</div>
          <div className="text-3xl font-bold text-evergreen mt-1">{sellerListings.length}</div>
          <div className="text-[11px] text-secondarytext mt-1">
            Direct zero-commission plots
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
          <div className="text-xs font-semibold text-secondarytext">Total Asking Portfolio</div>
          <div className="text-2xl sm:text-3xl font-bold text-evergreen mt-1">
            ₹{(totalPortfolioINR / 100000).toFixed(1)} Lakhs
          </div>
          <div className="text-[11px] text-teagreen font-semibold mt-1">
            Seller-controlled asking prices
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
          <div className="text-xs font-semibold text-secondarytext">Verified / Clear Title</div>
          <div className="text-3xl font-bold text-emerald-700 mt-1">{verifiedListingsCount}</div>
          <div className="text-[11px] text-secondarytext mt-1">
            🟢 Green Trust Passport status
          </div>
        </div>
        <div
          onClick={() => setActiveTab('enquiries')}
          className="bg-white p-5 rounded-3xl border border-[#DFD6C3] hover:border-evergreen shadow-sm cursor-pointer transition"
        >
          <div className="text-xs font-semibold text-secondarytext flex items-center justify-between">
            <span>Buyer Inquiries</span>
            <span className="text-[10px] text-teagreen font-bold">View Inbox →</span>
          </div>
          <div className="text-3xl font-bold text-amber-700 mt-1">{enquiries.length}</div>
          <div className="text-[11px] text-secondarytext mt-1">
            Direct buyer messages
          </div>
        </div>
      </div>

      {/* Seller Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-cream pb-3">
        {[
          { id: 'listings', label: `🌾 My Land Listings (${sellerListings.length})` },
          { id: 'enquiries', label: `💬 Buyer Inquiries Inbox (${enquiries.length})` },
          { id: 'documents', label: `🔒 LandLocker Document Permissions (${documents.length})` },
          { id: 'faqs', label: '❓ Seller FAQs & Guidelines' },
          { id: 'settings', label: '⚙️ Account & Security Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-evergreen text-warmivory shadow-sm'
                : 'bg-white text-maintext border border-[#DFD6C3] hover:bg-cream'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SELLER LISTINGS */}
      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sellerListings.map((item) => {
            const badge = getBuyerTrustBadge(item);
            const traffic = getTrafficLightFromListing(item);
            const priceMeta = formatPricePerBighaAndUnit(
              item.askingPriceINR,
              item.areaBigha,
              areaUnit
            );
            const draftPrice =
              editingPriceMap[item.id] !== undefined
                ? editingPriceMap[item.id]
                : item.askingPriceINR;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#DFD6C3] overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="relative h-44 bg-cream">
                  <img
                    src={item.media[0]?.url || '/assets/parcel-agricultural.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow ${badge.bgClass} ${badge.textClass}`}
                  >
                    {badge.icon} {badge.label}
                  </span>
                  <span
                    className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${traffic.badgeClass}`}
                  >
                    {traffic.badgeText}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-evergreen text-[11px] font-bold shadow">
                    Status: {item.status}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-evergreen">{item.title}</h3>
                    <p className="text-xs text-secondarytext">
                      📍 {item.village}, {item.district} · {item.landType} · {item.media.length} Photo(s)
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-warmivory border border-cream text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-base text-evergreen">
                        ₹{item.askingPriceINR.toLocaleString('en-IN')}
                      </span>
                      <span className="font-bold text-maintext">
                        📐 {formatAreaWithSecondary(item.areaBigha, areaUnit)}
                      </span>
                    </div>
                    <div className="text-teagreen font-semibold">{priceMeta.formattedLine}</div>

                    {/* Seller Asking Price Editor (Allowed per Part 10) */}
                    <div className="pt-2 border-t border-cream flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-maintext whitespace-nowrap">
                        Edit Asking Price (₹):
                      </label>
                      <input
                        type="number"
                        step={50000}
                        value={draftPrice}
                        onChange={(e) =>
                          setEditingPriceMap((prev) => ({
                            ...prev,
                            [item.id]: Number(e.target.value),
                          }))
                        }
                        className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-[#CFC5B0] text-xs font-bold text-evergreen"
                      />
                      <button
                        type="button"
                        onClick={() => updateSellerAskingPrice(item.id, draftPrice)}
                        className="px-3 py-1 rounded-lg bg-evergreen text-warmivory text-[11px] font-bold hover:bg-teagreen"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/land/${item.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold"
                      >
                        View Parcel
                      </Link>
                      <Link
                        to={`/passport/${item.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-palesky text-evergreen text-xs font-bold"
                      >
                        Trust Passport
                      </Link>
                    </div>

                    {item.status !== 'Withdrawn' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateListingStatus(item.id, 'Withdrawn', 'Withdrawn by seller')
                        }
                        className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-xs font-semibold"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: BUYER INQUIRIES INBOX */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-4 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-evergreen">
            Buyer Inquiries & Direct Messages ({enquiries.length})
          </h2>
          {enquiries.map((enq) => (
            <div
              key={enq.id}
              className="p-5 rounded-2xl bg-warmivory border border-cream text-xs space-y-3"
            >
              <div className="flex justify-between font-bold text-evergreen">
                <span>
                  {enq.listingTitle} (Parcel {enq.parcelId})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-cream">
                  {enq.status}
                </span>
              </div>
              <div className="font-semibold text-maintext">From Buyer: {enq.buyerName}</div>
              <p className="text-secondarytext">{enq.message}</p>

              {enq.replies.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-xl bg-white border-l-4 border-evergreen"
                >
                  <span className="font-bold text-evergreen">{rep.senderName}: </span>
                  <span>{rep.message}</span>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={replyTextMap[enq.id] || ''}
                  onChange={(e) =>
                    setReplyTextMap((prev) => ({ ...prev, [enq.id]: e.target.value }))
                  }
                  placeholder="Write reply to buyer..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#CFC5B0] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const txt = replyTextMap[enq.id];
                    if (!txt?.trim()) return;
                    replyToEnquiry(enq.id, txt.trim());
                    setReplyTextMap((prev) => ({ ...prev, [enq.id]: '' }));
                  }}
                  className="px-4 py-2 rounded-xl bg-evergreen text-warmivory font-bold"
                >
                  Send Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: LANDLOCKER DOCUMENT PERMISSIONS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl font-bold text-evergreen">
                LandLocker Document Access Control
              </h2>
              <p className="text-xs text-secondarytext">
                Grant or revoke buyer viewing permissions for your Patta extracts, trace maps, and deeds.
              </p>
            </div>
            <Link
              to="/landlocker"
              className="px-4 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold"
            >
              Open Full LandLocker Workspace →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-warmivory border border-cream text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-evergreen">{doc.title}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-cream font-semibold">
                    {doc.status}
                  </span>
                </div>
                <div className="text-secondarytext">
                  Parcel {doc.parcelId} · {doc.category}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => shareDocument(doc.id, '')}
                    className="px-3 py-1.5 rounded-xl bg-teagreen text-warmivory font-semibold"
                  >
                    Share with Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => revokeDocumentAccess(doc.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 font-semibold"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SELLER FAQS */}
      {activeTab === 'faqs' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-7 sm:p-9 shadow-sm space-y-6">
          <div className="border-b border-cream pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">
              Seller Knowledge Base & Guidelines
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen mt-1">
              Frequently Asked Questions for Land Sellers & Pattadars
            </h2>
            <p className="text-xs sm:text-sm text-secondarytext mt-1">
              Essential guidance on required listing documents, ILRMS review workflow, document privacy locks, and Patta categories.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Q1: What documents are required to list my land property for sale?',
                a: 'You need to submit an updated Jamabandi copy, Patta details (Dag No. and Patta No.), Govt-issued Photo ID (Aadhaar/PAN), and a valid Revenue Department NOC (No Objection Certificate) for land transfer.',
              },
              {
                q: 'Q2: How does the document review and verification process work?',
                a: 'Once you upload your details, an assigned Dharitri Sentu Reviewer inspects your submission, cross-checks the Dag/Patta details with official Assam ILRMS records, and approves the listing.',
              },
              {
                q: 'Q3: Who can view my uploaded land documents?',
                a: 'Your uploaded title documents are locked by default. Prospective buyers must send an "Access Request" which you can approve or decline directly from your Seller Dashboard.',
              },
              {
                q: 'Q4: What is the difference between Periodic Patta (ম্যাদী পাট্টা) and Annual Patta (একসনা পাট্টা)?',
                a: 'Periodic Patta grants permanent, transferable ownership rights eligible for sale/mutation. Annual Patta is a temporary lease from the government and cannot be directly transferred or sold without conversion to Periodic Patta.',
              },
            ].map((faq, idx) => {
              const isOpen = openSellerFaqIdx === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-cream bg-warmivory overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenSellerFaqIdx(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-evergreen"
                  >
                    <span>{faq.q}</span>
                    <span className="text-base text-secondarytext font-mono">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs text-maintext leading-relaxed border-t border-[#DFD6C3]/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AccountSecuritySettingsPanel />
        </div>
      )}
    </div>
  );
};

export const ReviewerAdminConsolePage: React.FC = () => {
  const {
    listings,
    discrepancies,
    cases,
    auditEvents,
    areaUnit,
    updateListingStatus,
  } = useApp();
  const [activeSection, setActiveSection] = useState<
    'moderation' | 'discrepancies' | 'sources' | 'audit'
  >('moderation');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
            Authorised Official Reviewer & Governance Console
          </span>
          <h1 className="font-serif text-3xl font-bold text-evergreen mt-1">
            Reviewer & Verification Console
          </h1>
          <p className="text-xs text-secondarytext mt-1">
            Review submitted listings across all 11 lifecycle states, resolve Discrepancy Engine cases, and inspect chronological audit logs.
          </p>
        </div>


      </div>

      {/* Console Sub-Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'moderation', label: `Listing Moderation (${listings.length})` },
          { id: 'discrepancies', label: `Discrepancy Queue (${discrepancies.length})` },
          { id: 'sources', label: 'Integration Boundaries (4)' },
          { id: 'audit', label: `Audit History (${auditEvents.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSection === tab.id
                ? 'bg-evergreen text-warmivory'
                : 'bg-white text-maintext border border-[#DFD6C3] hover:bg-cream'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <Link
          to="/landlocker"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-palesky text-evergreen border border-mistyblue"
        >
          🔒 LandLocker Verification Queue →
        </Link>
        <Link
          to="/cases"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-palesky text-evergreen border border-mistyblue"
        >
          Buyer Checklists ({cases.length}) →
        </Link>
      </div>

      {activeSection === 'moderation' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-5 overflow-x-auto shadow-sm">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-warmivory text-maintext">
                <th className="p-3 rounded-tl-xl">Buyer Badge</th>
                <th className="p-3">Title & Location</th>
                <th className="p-3">Land Size</th>
                <th className="p-3">Traffic-Light Status</th>
                <th className="p-3 rounded-tr-xl">Reviewer Moderation Action (11-State Gate)</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-secondarytext">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <span className="text-3xl">📋</span>
                      <p className="font-bold text-sm text-evergreen">No listings currently in moderation queue</p>
                      <p className="text-xs text-secondarytext">All submitted land listings have been processed or none are awaiting reviewer action.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                listings.map((item) => {
                const badge = getBuyerTrustBadge(item);
                const traffic = getTrafficLightFromListing(item);
                return (
                  <tr key={item.id} className="border-b border-cream">
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bgClass} ${badge.textClass}`}
                      >
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-evergreen">{item.title}</div>
                      <div className="text-secondarytext">
                        {item.village}, {item.district} ({item.parcelId})
                      </div>
                    </td>
                    <td className="p-3 font-semibold">
                      {formatAreaWithSecondary(item.areaBigha, areaUnit)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${traffic.badgeClass}`}>
                        {traffic.badgeText}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        aria-label={`Change status for ${item.parcelId}`}
                        value={item.status}
                        onChange={(e) =>
                          updateListingStatus(
                            item.id,
                            e.target.value as ListingStatus,
                            'Updated via Reviewer Console'
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-warmivory border border-[#CFC5B0] text-xs font-semibold"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Documents Needed">Documents Needed</option>
                        <option value="Upload Received">Upload Received</option>
                        <option value="Security Check">Security Check</option>
                        <option value="Awaiting Review">Awaiting Review</option>
                        <option value="Additional Information Required">
                          Additional Information Required
                        </option>
                        <option value="Under Review">Under Review</option>
                        <option value="Discrepancy Requires Attention">
                          Discrepancy Requires Attention
                        </option>
                        <option value="Approved for Listing">Approved for Listing</option>
                        <option value="Published as Demo Listing">Published as Demo Listing</option>
                        <option value="Rejected with Reason">Rejected with Reason</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === 'discrepancies' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg font-bold text-evergreen">
              Flagged Discrepancy Cases
            </h2>
            <Link to="/discrepancies" className="text-xs font-bold text-evergreen hover:underline">
              Open Full Discrepancy Engine →
            </Link>
          </div>
          {discrepancies.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-2xl bg-red-50/70 border border-red-200 text-xs flex justify-between items-center"
            >
              <div>
                <div className="font-bold text-red-950">
                  🔴 {d.id} · Parcel {d.parcelId} ({d.field})
                </div>
                <div className="text-red-900">
                  {d.sellerValue} vs {d.referenceValue}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white font-bold text-red-950 border border-red-200">
                {d.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'sources' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-4 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-evergreen">
            External Department Integration Boundaries
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GOVERNMENT_INTEGRATION_BOUNDARIES.map((svc) => (
              <div
                key={svc.id}
                className="p-4 rounded-2xl bg-palesky/60 border border-mistyblue text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-evergreen">{svc.serviceName}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-bold text-[10px]">
                    Not Connected
                  </span>
                </div>
                <div className="text-secondarytext font-medium">{svc.departmentCategory}</div>
                <p className="text-maintext">{svc.plannedCapability}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'audit' && (
        <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-2.5 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-evergreen">
            Chronological Verification Audit Log
          </h2>
          {auditEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-xl bg-warmivory border-l-4 border-evergreen text-xs flex justify-between gap-4"
            >
              <div>
                <span className="font-bold text-evergreen">[{ev.actionType}]</span>{' '}
                <span className="font-medium text-maintext">{ev.summary}</span>
                <div className="text-[11px] text-secondarytext">
                  Actor: {ev.actorEmail} ({ev.actorRole})
                </div>
              </div>
              <span className="text-[11px] text-secondarytext whitespace-nowrap">
                {new Date(ev.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
