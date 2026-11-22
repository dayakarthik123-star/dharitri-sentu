import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { AreaUnit } from '../../types';
import { InteractiveParcelMap } from '../parcel-map/InteractiveParcelMap';
import {
  AREA_UNIT_META,
  formatAreaWithSecondary,
  formatPricePerBighaAndUnit,
  getBuyerTrustBadge,
  getTrafficLightFromListing,
} from '../../utils/landUnitsAndBadges';

export const ExplorePage: React.FC = () => {
  const {
    listings,
    savedListingIds,
    toggleSavedListing,
    addRecentSearch,
    areaUnit,
    setAreaUnit,
  } = useApp();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || 'All');
  const [landType, setLandType] = useState(searchParams.get('type') || 'All');
  const [maxPriceLakhs, setMaxPriceLakhs] = useState<number>(
    Number(searchParams.get('maxPrice')) || 60
  );
  const [minAreaBigha, setMinAreaBigha] = useState<number>(
    Number(searchParams.get('minArea')) || 0
  );
  const [trustFilter, setTrustFilter] = useState<'all' | 'verified' | 'mismatch'>('all');
  const [sortBy, setSortBy] = useState<
    'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'area-desc'
  >('relevance');
  const [viewMode, setViewMode] = useState<'split' | 'grid' | 'list'>('split');
  const [selectedId, setSelectedId] = useState<string>(listings[0]?.id || 'lst-1');

  useEffect(() => {
    const q = searchParams.get('q');
    const d = searchParams.get('district');
    const tp = searchParams.get('type');
    const mp = searchParams.get('maxPrice');
    const ma = searchParams.get('minArea');
    if (q !== null) setQuery(q);
    if (d !== null) setDistrict(d);
    if (tp !== null) setLandType(tp);
    if (mp !== null && !Number.isNaN(Number(mp))) setMaxPriceLakhs(Number(mp));
    if (ma !== null && !Number.isNaN(Number(ma))) setMinAreaBigha(Number(ma));
  }, [searchParams]);

  const filtered = listings
    .filter((l) => l.status !== 'Withdrawn' && l.status !== 'Rejected')
    .filter((item) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.village.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.parcelId.toLowerCase().includes(q);
      const matchDist = district === 'All' || item.district === district;
      const matchType = landType === 'All' || item.landType === landType;
      const matchPrice = item.askingPriceINR <= maxPriceLakhs * 100000;
      const matchArea = item.areaBigha >= minAreaBigha;
      const traffic = getTrafficLightFromListing(item);
      const matchTrust =
        trustFilter === 'all' ||
        (trustFilter === 'verified' && traffic.level === 'green') ||
        (trustFilter === 'mismatch' && traffic.level === 'red');
      return matchQ && matchDist && matchType && matchPrice && matchArea && matchTrust;
    })
    .sort((a, b) => {
      if (sortBy === 'newest')
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      if (sortBy === 'price-asc') return a.askingPriceINR - b.askingPriceINR;
      if (sortBy === 'price-desc') return b.askingPriceINR - a.askingPriceINR;
      if (sortBy === 'area-desc') return b.areaBigha - a.areaBigha;
      return Number(b.featured) - Number(a.featured);
    });

  const handleResetFilters = () => {
    setQuery('');
    setDistrict('All');
    setLandType('All');
    setMaxPriceLakhs(60);
    setMinAreaBigha(0);
    setTrustFilter('all');
    setSortBy('relevance');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Clean Page Header (Internal Prototyping Eyebrow Removed) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen">
            Explore Verified Land Across Assam
          </h1>
          <p className="text-sm text-secondarytext mt-1">
            Compare satellite terrain, road access, traffic-light verification status, and transparent pricing per Bigha or Acre.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {/* Quick Unit Converter Switcher */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#CFC5B0] text-xs">
            <span className="text-secondarytext font-medium">📐 Unit:</span>
            <select
              aria-label="Select Area Display Unit"
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

          {(['split', 'grid', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize border transition ${
                viewMode === mode
                  ? 'bg-evergreen text-warmivory border-evergreen shadow-sm'
                  : 'bg-white text-maintext border-[#CFC5B0] hover:bg-cream'
              }`}
            >
              {mode === 'split'
                ? '🛰️ Map + Cards'
                : mode === 'grid'
                ? '⊞ Grid View'
                : '☰ List View'}
            </button>
          ))}
        </div>
      </div>

      {/* Refined Filter Bar with Lightened Max Price Slider Track */}
      <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-3">
          <label className="block text-xs font-semibold text-maintext mb-1.5">
            Search Village, District or Plot
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 3) addRecentSearch(e.target.value);
            }}
            placeholder="e.g. Changsari, Chabua, Tezpur..."
            className="w-full px-3.5 py-2 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-evergreen"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-maintext mb-1.5">District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs sm:text-sm"
          >
            <option value="All">All Districts (11)</option>
            <option value="Kamrup">Kamrup</option>
            <option value="Dibrugarh">Dibrugarh</option>
            <option value="Baksa">Baksa</option>
            <option value="Jorhat">Jorhat</option>
            <option value="Sonitpur">Sonitpur</option>
            <option value="Nalbari">Nalbari</option>
            <option value="Sivasagar">Sivasagar</option>
            <option value="Nagaon">Nagaon</option>
            <option value="Tinsukia">Tinsukia</option>
            <option value="Cachar">Cachar</option>
            <option value="Golaghat">Golaghat</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-maintext mb-1.5">Land Type</label>
          <select
            value={landType}
            onChange={(e) => setLandType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs sm:text-sm"
          >
            <option value="All">All Land Types</option>
            <option value="Agricultural Land">Agricultural Land</option>
            <option value="Tea Garden Land">Tea Garden Land</option>
            <option value="Rural Homestead">Rural Homestead</option>
            <option value="Residential Plot">Residential Plot</option>
            <option value="Commercial Land">Commercial Land</option>
          </select>
        </div>

        {/* Lightened Max Price Slider Track harmonizing with input borders */}
        <div className="lg:col-span-2 bg-warmivory px-3.5 py-2 rounded-xl border border-[#CFC5B0]">
          <div className="flex items-center justify-between text-xs font-semibold text-maintext mb-1.5">
            <span>Max Price</span>
            <span className="text-evergreen font-bold">₹{maxPriceLakhs} Lakhs</span>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={maxPriceLakhs}
            onChange={(e) => setMaxPriceLakhs(Number(e.target.value))}
            aria-label="Maximum Price in Lakhs"
            className="soft-slider"
          />
        </div>

        <div className="lg:col-span-3 flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              Min Size / Sort
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                aria-label="Minimum Land Size"
                value={minAreaBigha}
                onChange={(e) => setMinAreaBigha(Number(e.target.value))}
                className="w-full px-2 py-2 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs font-medium"
              >
                <option value={0}>Any Size</option>
                <option value={1}>1+ Bigha</option>
                <option value={2}>2+ Bigha</option>
                <option value={4}>4+ Bigha</option>
              </select>
              <select
                aria-label="Sort Listings By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-2 py-2 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs font-medium"
              >
                <option value="relevance">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low</option>
                <option value="price-desc">Price: High</option>
                <option value="area-desc">Largest Area</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-xl bg-warmivory hover:bg-cream border border-[#CFC5B0] text-xs font-semibold text-maintext transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Count & Traffic-Light Quick Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs sm:text-sm font-medium text-secondarytext">
          Showing <strong className="text-evergreen">{filtered.length}</strong> land parcel(s) ·
          Active Unit: <strong className="text-evergreen">{AREA_UNIT_META[areaUnit].label}</strong>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-secondarytext font-medium">Passport Status:</span>
          {[
            { id: 'all', label: 'All Plots' },
            { id: 'verified', label: '🟢 Verified Only' },
            { id: 'mismatch', label: '🔴 Mismatch Found' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setTrustFilter(pill.id as typeof trustFilter)}
              className={`px-3 py-1 rounded-full font-semibold border transition ${
                trustFilter === pill.id
                  ? 'bg-evergreen text-warmivory border-evergreen'
                  : 'bg-white text-maintext border-[#CFC5B0] hover:bg-cream'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#DFD6C3] shadow-sm space-y-3">
          <p className="text-xl font-serif font-bold text-evergreen">
            No land parcels match your current filters
          </p>
          <p className="text-xs sm:text-sm text-secondarytext max-w-md mx-auto">
            Try increasing the maximum price slider or resetting the district and land-size filters to view all available Assam listings.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {viewMode === 'split' && (
            <div className="lg:col-span-7 sticky top-20">
              <InteractiveParcelMap
                listings={filtered}
                selectedId={selectedId}
                onSelectListing={setSelectedId}
              />
            </div>
          )}

          <div
            className={
              viewMode === 'split'
                ? 'lg:col-span-5 space-y-5 max-h-[680px] overflow-y-auto pr-1'
                : viewMode === 'grid'
                ? 'lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'lg:col-span-12 space-y-4'
            }
          >
            {filtered.map((item) => {
              const isSaved = savedListingIds.includes(item.id);
              const isSelected = item.id === selectedId;
              const buyerBadge = getBuyerTrustBadge(item);
              const traffic = getTrafficLightFromListing(item);
              const priceMeta = formatPricePerBighaAndUnit(
                item.askingPriceINR,
                item.areaBigha,
                areaUnit
              );

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`cursor-pointer bg-white rounded-3xl border overflow-hidden transition-all duration-200 shadow-sm hover:shadow-lg ${
                    isSelected
                      ? 'border-evergreen ring-2 ring-evergreen/20'
                      : 'border-[#DFD6C3]'
                  } ${
                    viewMode === 'list'
                      ? 'flex flex-col sm:flex-row items-stretch justify-between'
                      : 'flex flex-col'
                  }`}
                >
                  {/* Enlarged Thumbnail Image with Buyer Trust Badge */}
                  <div
                    className={`relative bg-cream flex-shrink-0 overflow-hidden ${
                      viewMode === 'list' ? 'sm:w-64 h-48 sm:h-auto' : 'w-full h-48'
                    }`}
                  >
                    <img
                      src={item.media[0]?.url || '/assets/parcel-agricultural.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Buyer Trust Badge replacing database ID */}
                    <span
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-md border ${buyerBadge.bgClass} ${buyerBadge.textClass} ${buyerBadge.borderClass}`}
                    >
                      {buyerBadge.icon} {buyerBadge.label}
                    </span>

                    {/* Color-Coded Passport Traffic-Light Badge */}
                    <span
                      className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${traffic.badgeClass}`}
                    >
                      {traffic.badgeText}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavedListing(item.id);
                      }}
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-xs font-bold text-maintext shadow-md"
                    >
                      {isSaved ? '❤️ Saved' : '🤍 Save'}
                    </button>
                  </div>

                  {/* Card Details + Price per Bigha + Single Primary CTA */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-secondarytext mb-1">
                        <span>📍 {item.village}, {item.district}</span>
                        <span className="font-semibold text-teagreen">{item.landType}</span>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-evergreen leading-snug">
                        {item.title}
                      </h3>

                      <div className="mt-3 p-3 rounded-2xl bg-warmivory border border-cream space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-bold text-lg text-evergreen">
                            ₹{item.askingPriceINR.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-bold text-maintext">
                            📐 {formatAreaWithSecondary(item.areaBigha, areaUnit)}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-teagreen flex items-center justify-between">
                          <span>Price per Unit: {priceMeta.formattedLine}</span>
                        </div>
                      </div>
                    </div>

                    {/* De-cluttered Card Footer: Passport status note + Single Solid View Parcel Button */}
                    <div className="pt-1 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-secondarytext line-clamp-1">
                        {traffic.plainExplanation}
                      </span>
                      <Link
                        to={`/land/${item.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition whitespace-nowrap shadow-sm"
                      >
                        View Parcel →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
