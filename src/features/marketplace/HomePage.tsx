import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { API_MODE } from '../../services/apiClient';
import { InteractiveParcelMap } from '../parcel-map/InteractiveParcelMap';
import { AmbientLeaves } from '../../components/AmbientLeaves';
import {
  calculateProjectedScenarioValue,
  isListingPubliclyVisible,
} from '../../services/govIntegrationBoundary';
import {
  formatPricePerBighaAndUnit,
  getTrafficLightFromListing,
} from '../../utils/landUnitsAndBadges';

export const HomePage: React.FC = () => {
  const {
    listings,
    addRecentSearch,
    areaUnit,
    currentUser,
    productionEmptyMode,
    t,
  } = useApp();
  const navigate = useNavigate();
  const mapSectionRef = useRef<HTMLElement | null>(null);

  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('All');
  const [landType, setLandType] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [landSizeRange, setLandSizeRange] = useState('All');
  const [selectedParcelId, setSelectedParcelId] = useState(listings[0]?.id || 'lst-1');

  // Role Selection Modal ("Get Started")
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  // Interactive Price Projection Widget state
  const [activeProjectionRate, setActiveProjectionRate] = useState<number>(6);
  const [hoveredYearIdx, setHoveredYearIdx] = useState<number>(5);

  // FAQ Accordion state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const publishedListings = productionEmptyMode
    ? []
    : listings.filter((l) => isListingPubliclyVisible(l.status));

  const filteredListings = publishedListings.filter((item) => {
    const matchesQuery =
      !query.trim() ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.village.toLowerCase().includes(query.toLowerCase()) ||
      item.district.toLowerCase().includes(query.toLowerCase()) ||
      item.parcelId.toLowerCase().includes(query.toLowerCase());
    const matchesDistrict = district === 'All' || item.district === district;
    const matchesType = landType === 'All' || item.landType === landType;

    const priceLakhs = item.askingPriceINR / 100000;
    const matchesPrice =
      priceRange === 'All' ||
      (priceRange === 'under15' && priceLakhs < 15) ||
      (priceRange === '15to25' && priceLakhs >= 15 && priceLakhs <= 25) ||
      (priceRange === '25to40' && priceLakhs > 25 && priceLakhs <= 40) ||
      (priceRange === 'above40' && priceLakhs > 40);

    const matchesSize =
      landSizeRange === 'All' ||
      (landSizeRange === 'under2' && item.areaBigha < 2) ||
      (landSizeRange === '2to4' && item.areaBigha >= 2 && item.areaBigha <= 4) ||
      (landSizeRange === 'above4' && item.areaBigha > 4);

    return matchesQuery && matchesDistrict && matchesType && matchesPrice && matchesSize;
  });

  const selectedListing =
    listings.find((l) => l.id === selectedParcelId) ||
    filteredListings[0] ||
    publishedListings[0] ||
    listings[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) addRecentSearch(query.trim());
    const maxPriceParam =
      priceRange === 'under15'
        ? 15
        : priceRange === '15to25'
        ? 25
        : priceRange === '25to40'
        ? 40
        : 60;
    const minAreaParam =
      landSizeRange === '2to4' ? 2 : landSizeRange === 'above4' ? 4 : 0;
    navigate(
      `/explore?q=${encodeURIComponent(query)}&district=${encodeURIComponent(
        district
      )}&type=${encodeURIComponent(landType)}&maxPrice=${maxPriceParam}&minArea=${minAreaParam}`
    );
  };

  const applyQuickChip = (chipText: string, filterKind: 'district' | 'type' | 'query') => {
    addRecentSearch(chipText);
    if (filterKind === 'district') {
      setDistrict(chipText);
      setLandType('All');
      setQuery('');
    } else if (filterKind === 'type') {
      setLandType(chipText);
      setDistrict('All');
      setQuery('');
    } else {
      setQuery(chipText);
    }
  };

  // Price Projection Chart Calculations for Selected Parcel
  const basePrice = selectedListing?.askingPriceINR || 1800000;
  const chartYears = [0, 2, 4, 6, 8, 10];
  const chartData = chartYears.map((yr) => ({
    year: yr,
    conservative: calculateProjectedScenarioValue(basePrice, 4, yr),
    balanced: calculateProjectedScenarioValue(basePrice, activeProjectionRate, yr),
    optimistic: calculateProjectedScenarioValue(basePrice, 8, yr),
  }));
  const maxChartVal = chartData[chartData.length - 1].optimistic * 1.08;
  const activePoint = chartData[hoveredYearIdx] || chartData[chartData.length - 1];

  const faqItems = [
    {
      q: 'What is a Land Trust Passport?',
      a: 'A Land Trust Passport is a traffic-light verification summary that compares seller-submitted details (Dag number, Patta number, Bigha/Acre area, and holder name) against reference survey records and 21 geospatial layers so buyers can spot inconsistencies before paying any advance.',
    },
    {
      q: 'Does Dharitri Sentu verify legal ownership or replace government mutation?',
      a: 'No. Dharitri Sentu is a land-transparency and due-diligence platform. It organizes record checks, flags discrepancies, and structures 9-step due diligence, but official title registration and mutation remain the statutory authority of Revenue Circle Officers and IGR Assam.',
    },
    {
      q: 'What does "Red · Issue Found" or "Mismatch Found" mean on a listing?',
      a: 'It means our Discrepancy Engine detected a difference between what the seller declared and the reference survey record—for example, a 2.50 Bigha listed area versus 2.35 Bigha on the survey map, or a plot located inside a Chapter X Protected Tribal Belt.',
    },
    {
      q: 'How are seller documents protected inside LandLocker?',
      a: 'Landowners upload Jamabandi extracts, sale deeds, and trace maps into LandLocker with SHA-256 cryptographic hashing, malware screening, and granular privacy controls. Documents remain restricted until the owner explicitly grants access to a shortlisted buyer or authorised reviewer, and access can be revoked at any time.',
    },
    {
      q: 'Are price projections a guaranteed future valuation?',
      a: 'No. The 10-year Price Projection chart illustrates conservative (4%), balanced (6%), and high-corridor (8%) compound scenarios alongside official circle benchmark rates so buyers can evaluate long-term value transparently.',
    },
  ];

  return (
    <div className="relative">
      {/* ====================================================================
          1. HERO SECTION & UNIFIED SEARCH BAR
         ==================================================================== */}
      <section
        className="ds-editorial-hero relative overflow-hidden border-b border-cream min-h-[620px] lg:min-h-[720px] flex items-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(7, 31, 24, 0.92) 0%, rgba(7, 31, 24, 0.79) 52%, rgba(7, 31, 24, 0.35) 100%), url('/assets/tea-garden-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <AmbientLeaves inHeroOnly={true} count={10} />

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-20">
          <div className="max-w-5xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur text-[#E1ECE5] border border-white/20 shadow-sm mb-4">
              🌱 {t('eyebrow')}
            </span>

            <div className="font-serif text-sm sm:text-base font-bold uppercase tracking-[0.22em] text-[#B8DDA0] mb-1">
              {t('brandName')}
            </div>

            <h1 className="ds-display ds-reveal text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-[0.9] mb-6 max-w-5xl">
              {t('heroTitleLine1')}<br />
              <span className="text-[#B8DDA0]">{t('heroTitleLine2')}</span><br />
              {t('heroTitleLine3')}
            </h1>

            <p className="text-base sm:text-xl text-white/85 max-w-2xl mb-7 leading-relaxed font-medium">
              {t('heroDescription')}
            </p>

            {/* Primary & Secondary Hero Actions Required by Part 2 */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                type="button"
                onClick={() => {
                  if (mapSectionRef.current) {
                    mapSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/explore');
                  }
                }}
                className="px-6 py-4 rounded-xl bg-[#B8DDA0] hover:bg-[#CAE9B8] text-[#0A241B] text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2"
              >
                <span>🛰️ {t('exploreLand')}</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleModalOpen(true)}
                className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/25 text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2 backdrop-blur"
              >
                <span>{t('getStarted')}</span>
                <span>→</span>
              </button>
              <Link
                to="/landlocker"
                className="px-5 py-3.5 rounded-xl bg-white/95 hover:bg-white text-evergreen border border-[#CFC5B0] text-xs sm:text-sm font-bold shadow-sm transition"
              >
                🔒 {t('navLandLocker')}
              </Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('dharitri:replay-intro'))}
                className="px-5 py-3.5 rounded-xl bg-black/40 hover:bg-black/60 text-[#D4EBC8] border border-[#B8DDA0]/30 text-xs sm:text-sm font-bold shadow-sm transition backdrop-blur flex items-center gap-2"
              >
                <span>🎬</span>
                <span>Watch Assam Intro</span>
              </button>
            </div>

            {/* Unified Land Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-3 rounded-2xl shadow-xl border border-[#DFD6C3] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center"
            >
              <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 px-3.5 py-2.5 bg-palesky/70 rounded-xl border border-mistyblue/80">
                <span className="text-secondarytext">🔍</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label="Search by district, village, Dag number, or locality"
                  className="w-full bg-transparent text-xs sm:text-sm text-maintext placeholder-secondarytext focus:outline-none"
                />
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Filter by District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-warmivory text-xs sm:text-sm font-medium text-maintext border border-[#CFC5B0] focus:outline-none focus:ring-2 focus:ring-evergreen"
                >
                  <option value="All">{t('allDistricts')}</option>
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
                <select
                  aria-label="Filter by Land Type"
                  value={landType}
                  onChange={(e) => setLandType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-warmivory text-xs sm:text-sm font-medium text-maintext border border-[#CFC5B0] focus:outline-none focus:ring-2 focus:ring-evergreen"
                >
                  <option value="All">{t('allLandTypes')}</option>
                  <option value="Agricultural Land">{t('Agricultural Land')}</option>
                  <option value="Tea Garden Land">{t('Tea Garden Land')}</option>
                  <option value="Rural Homestead">{t('Rural Homestead')}</option>
                  <option value="Residential Plot">{t('Residential Plot')}</option>
                  <option value="Commercial Land">{t('Commercial Land')}</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Filter by Price Range"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-warmivory text-xs sm:text-sm font-medium text-maintext border border-[#CFC5B0] focus:outline-none focus:ring-2 focus:ring-evergreen"
                >
                  <option value="All">{t('Price Range (All)')}</option>
                  <option value="under15">{t('Under ₹15 Lakhs')}</option>
                  <option value="15to25">{t('₹15L – ₹25 Lakhs')}</option>
                  <option value="25to40">{t('₹25L – ₹40 Lakhs')}</option>
                  <option value="above40">{t('Above ₹40 Lakhs')}</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Filter by Land Size"
                  value={landSizeRange}
                  onChange={(e) => setLandSizeRange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-warmivory text-xs sm:text-sm font-medium text-maintext border border-[#CFC5B0] focus:outline-none focus:ring-2 focus:ring-evergreen"
                >
                  <option value="All">Land Size (All)</option>
                  <option value="under2">&lt; 2 Bigha (&lt; 0.66 Acre)</option>
                  <option value="2to4">2 – 4 Bigha (0.66–1.3 Acre)</option>
                  <option value="above4">4+ Bigha (1.3+ Acre)</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory font-semibold text-xs sm:text-sm transition shadow-md"
                >
                  {t('searchBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ====================================================================
          GET STARTED ROLE SELECTION MODAL (BUYER / SELLER / OFFICIAL PORTAL)
         ==================================================================== */}
      {roleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose How You Want to Use Dharitri Sentu"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-warmivory rounded-3xl border border-[#DFD6C3] max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-cream pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
                  Two User Portals
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen mt-0.5">
                  {t('Choose How You Want to Use Dharitri Sentu')}
                </h2>
                <p className="text-xs sm:text-sm text-secondarytext mt-1">
                  {t('Choose a buyer or seller workspace. Official review access is provisioned separately for authorised reviewers.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                aria-label="Close role selection modal"
                className="w-8 h-8 rounded-full bg-white hover:bg-cream text-secondarytext font-bold text-sm flex items-center justify-center border border-cream"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Path 1: Buyer Portal */}
              <div className="bg-white rounded-3xl p-5 border border-[#DFD6C3] shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                    👤 {t('Buyer Portal')}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-evergreen">
                    {t('Continue as Buyer')}
                  </h3>
                  <p className="text-secondarytext leading-relaxed">
                    {t('Browse land across Assam, inspect traffic-light Trust Passports and 21 geospatial layers, save plots, and track your 9-step due-diligence checklist.')}
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setRoleModalOpen(false)}
                      className="py-2 px-2 rounded-xl bg-warmivory border border-cream text-center font-semibold text-maintext hover:bg-cream"
                    >
                      {t('Buyer Login')}
                    </Link>
                    <Link
                      to="/signup?role=buyer"
                      onClick={() => setRoleModalOpen(false)}
                      className="py-2 px-2 rounded-xl bg-palesky border border-mistyblue text-center font-semibold text-evergreen hover:bg-mistyblue"
                    >
                      {t('Sign Up Buyer')}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Path 2: Seller Portal */}
              <div className="bg-white rounded-3xl p-5 border border-[#DFD6C3] shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                    🏡 {t('Seller Portal')}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-evergreen">
                    {t('Continue as Seller')}
                  </h3>
                  <p className="text-secondarytext leading-relaxed">
                    {t('Create land listings with up to 15 photos, pre-check Dag and Patta records, manage private LandLocker documents, and respond to buyer enquiries.')}
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setRoleModalOpen(false)}
                      className="py-2 px-2 rounded-xl bg-warmivory border border-cream text-center font-semibold text-maintext hover:bg-cream"
                    >
                      {t('Seller Login')}
                    </Link>
                    <Link
                      to="/signup?role=seller"
                      onClick={() => setRoleModalOpen(false)}
                      className="py-2 px-2 rounded-xl bg-amber-50 border border-amber-200 text-center font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      {t('Sign Up Seller')}
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          POPULAR SEARCHES SECTION
         ==================================================================== */}
      <section
        id="popular-searches"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-cream"
      >
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DFD6C3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-palesky border border-mistyblue flex items-center justify-center text-lg flex-shrink-0">
              🔍
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teagreen">
                Quick Navigation & Filters
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-evergreen">
                {t('popularSearches') || 'Popular Searches'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { label: 'Kamrup', kind: 'district' as const },
              { label: 'Dibrugarh', kind: 'district' as const },
              { label: 'Baksa', kind: 'district' as const },
              { label: 'Tea Garden Land', kind: 'type' as const },
              { label: 'Agricultural Land', kind: 'type' as const },
              { label: 'Residential Plot', kind: 'type' as const },
            ].map((chip) => {
              const isActive =
                district === chip.label || landType === chip.label || query === chip.label;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => applyQuickChip(chip.label, chip.kind)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition border shadow-sm ${
                    isActive
                      ? 'bg-evergreen text-warmivory border-evergreen shadow'
                      : 'bg-warmivory hover:bg-cream text-maintext border-[#CFC5B0]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. INTERACTIVE SATELLITE PARCEL EXPLORER (Directly Beneath Popular Searches)
         ==================================================================== */}
      <section
        ref={mapSectionRef}
        id="satellite-parcel-explorer"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14 border-b border-cream space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
              Real-World Terrain, Surveyed Dags & 21 Geospatial Layers
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen mt-1">
              {t('interactiveSatelliteExplorer')}
            </h2>
            <p className="text-xs sm:text-sm text-secondarytext mt-1">
              Search any Assam district, village, Dag number (412, 142, 104, 785), or 14-digit ULPIN to inspect terrain, road access, flood zones, and surveyed parcel records.
            </p>
          </div>
        </div>

        <InteractiveParcelMap
          listings={filteredListings.length > 0 ? filteredListings : listings}
          selectedId={selectedParcelId}
          onSelectListing={setSelectedParcelId}
        />
      </section>

      {/* ====================================================================
          3. VERIFY LEGAL STATUS & FUTURE LAND VALUE AT A GLANCE
             (Moved directly below Interactive Satellite Parcel Explorer)
         ==================================================================== */}
      <section
        id="verify-legal-status-and-value"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14 border-b border-cream"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
              Trust Through Transparency & Land Value Insights
            </span>
            <h2 className="font-serif text-3xl font-bold text-evergreen mt-1">
              {t('verifyLegalAndValueAtGlance')}
            </h2>
            <p className="text-sm text-secondarytext mt-1">
              Simple traffic-light record indicators and transparent value insights for{' '}
              <strong className="text-evergreen">{selectedListing?.title}</strong> ({selectedListing?.village}, {selectedListing?.district}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="home-widget-parcel" className="text-xs font-semibold text-maintext">
              Inspect Plot:
            </label>
            <select
              id="home-widget-parcel"
              value={selectedListing?.id || 'lst-1'}
              onChange={(e) => setSelectedParcelId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-[#CFC5B0] text-xs font-bold text-evergreen shadow-sm"
            >
              {listings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.village} ({item.district}) — {item.title.slice(0, 28)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 5 Cols: Simplified Traffic-Light Land Trust Passport Widget */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#DFD6C3] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teagreen">
                    {t('Instant Legal & Record Check')}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-evergreen">
                    {t('Land Trust Passport Overview')}
                  </h3>
                </div>
                {selectedListing && (
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      getTrafficLightFromListing(selectedListing).badgeClass
                    }`}
                  >
                    {getTrafficLightFromListing(selectedListing).badgeText}
                  </span>
                )}
              </div>

              <p className="text-xs text-secondarytext mb-5 leading-relaxed">
                {t('We cross-check seller documents against survey and ownership records so you can spot risks before paying an advance.')}
              </p>

              {/* Simple Traffic-Light Status Indicators */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 mt-0.5 flex-shrink-0 shadow-sm" />
                    <div>
                      <div className="font-bold text-emerald-950 text-sm">
                        {t('Green · Verified')} ({selectedListing?.passportSummary.matchedCount || 4} Checks Passed)
                      </div>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        {t('Owner name, plot number, and land use match reference records.')}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] whitespace-nowrap">
                    {t('Verified')}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 mt-0.5 flex-shrink-0 shadow-sm" />
                    <div>
                      <div className="font-bold text-amber-950 text-sm">
                        {t('Yellow · Warning')} ({selectedListing?.passportSummary.pendingCount || 1} Check Pending)
                      </div>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        {t('Updated tax receipt or mutation note is awaiting reviewer sign-off.')}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] whitespace-nowrap">
                    {t('Warning')}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 mt-0.5 flex-shrink-0 shadow-sm" />
                    <div>
                      <div className="font-bold text-red-950 text-sm">
                        {t('Red · Issue Found')} ({selectedListing?.passportSummary.discrepancyCount || 0}{' '}
                        {(selectedListing?.passportSummary.discrepancyCount || 0) === 1 ? 'Mismatch' : 'Mismatches'})
                      </div>
                      <p className="text-red-800 text-[11px] mt-0.5">
                        {(selectedListing?.passportSummary.discrepancyCount || 0) > 0
                          ? `Listed area (${selectedListing?.areaBigha} Bigha) differs from survey record (${selectedListing?.recordedAreaBigha} Bigha).`
                          : t('No boundary or area mismatches found on this plot.')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap ${
                      (selectedListing?.passportSummary.discrepancyCount || 0) > 0
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {(selectedListing?.passportSummary.discrepancyCount || 0) > 0 ? t('Issue Found') : t('0 Issues')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-cream flex items-center gap-3">
              <Link
                to={`/passport/${selectedListing?.id || 'lst-1'}`}
                className="flex-1 text-center py-2.5 px-4 rounded-xl bg-evergreen text-warmivory text-xs font-semibold hover:bg-teagreen transition shadow-sm"
              >
                {t('Open Full Land Trust Passport →')}
              </Link>
              <Link
                to="/discrepancies"
                className="py-2.5 px-4 rounded-xl bg-warmivory border border-[#CFC5B0] text-evergreen text-xs font-semibold hover:bg-cream transition"
              >
                {t('Discrepancy Engine')}
              </Link>
            </div>
          </div>

          {/* Right 7 Cols: Buyer-Only Price Projection Chart (Hidden from Sellers per Part 10) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#DFD6C3] shadow-md flex flex-col justify-between">
            {currentUser?.role === 'seller' ? (
              <div className="my-auto p-6 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-4 text-xs">
                <span className="px-3 py-1 rounded-full bg-amber-200/80 text-amber-950 font-bold">
                  🔒 Role-Based Access Policy (Seller Account Active)
                </span>
                <h3 className="font-serif text-2xl font-bold text-evergreen">
                  {t('sellerValuationBlockedTitle')}
                </h3>
                <p className="text-maintext leading-relaxed">
                  {t('sellerValuationBlockedDesc')}
                </p>
                <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-1">
                  <div className="font-bold text-evergreen">
                    Selected Listing Asking Price: ₹{basePrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-secondarytext">
                    Circle Guideline Benchmark: ₹
                    {(selectedListing?.benchmarkRatePerBighaINR || 680000).toLocaleString('en-IN')} / Bigha
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    to="/dashboard/seller"
                    className="inline-block px-5 py-2.5 rounded-xl bg-[#D97706] text-white font-bold hover:bg-[#B45309] transition shadow-sm"
                  >
                    Manage My Asking Prices in Seller Dashboard →
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teagreen">
                      {t('Buyer Land Value Insights · Indicative Scenarios')}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-evergreen">
                      {t('Price Projection & Value Growth Explorer')}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 bg-warmivory p-1 rounded-xl border border-cream">
                    {[
                      { rate: 4, label: '4% Conservative' },
                      { rate: 6, label: '6% Balanced' },
                      { rate: 8, label: '8% High Growth' },
                    ].map((opt) => (
                      <button
                        key={opt.rate}
                        type="button"
                        onClick={() => setActiveProjectionRate(opt.rate)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          activeProjectionRate === opt.rate
                            ? 'bg-evergreen text-warmivory shadow-sm'
                            : 'text-secondarytext hover:text-evergreen'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-secondarytext mb-4">
                  {t('Distinguishes official circle guideline rates, seller asking prices, and indicative 10-year appreciation scenarios. Click or hover any milestone year below.')}
                </p>

                {/* Highlighted Milestone KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-warmivory border border-cream">
                    <div className="text-[11px] text-secondarytext font-medium">
                      {t('Seller Asking Price')} (vs ₹{((selectedListing?.benchmarkRatePerBighaINR || 680000) / 100000).toFixed(1)}L/Bigha Circle Rate)
                    </div>
                    <div className="text-base sm:text-lg font-bold text-evergreen">
                      ₹{basePrice.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-teagreen font-semibold">
                      {selectedListing
                        ? formatPricePerBighaAndUnit(
                            selectedListing.askingPriceINR,
                            selectedListing.areaBigha,
                            areaUnit
                          ).formattedLine
                        : ''}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-palesky/80 border-2 border-evergreen/30">
                    <div className="text-[11px] text-evergreen font-bold">
                      Year {activePoint.year} Indicative ({activeProjectionRate}%/yr)
                    </div>
                    <div className="text-base sm:text-lg font-bold text-evergreen">
                      ₹{activePoint.balanced.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-secondarytext font-medium">
                      +₹{(activePoint.balanced - basePrice).toLocaleString('en-IN')} est. scenario delta
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
                    <div className="text-[11px] text-amber-900 font-semibold">
                      10-Yr High Scenario (8%/yr)
                    </div>
                    <div className="text-base sm:text-lg font-bold text-amber-900">
                      ₹{chartData[chartData.length - 1].optimistic.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-amber-800">
                      Indicative upper range (non-guaranteed)
                    </div>
                  </div>
                </div>

                {/* Expanded Wide Interactive SVG Chart */}
                <div className="bg-palesky/40 rounded-2xl p-4 border border-mistyblue">
                  <svg
                    viewBox="0 0 620 220"
                    className="w-full h-56 overflow-visible"
                    role="img"
                    aria-label="10-Year Land Price Projection Line Chart"
                  >
                    <defs>
                      <linearGradient id="balancedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#123F32" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#123F32" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = 180 - ratio * 145;
                      const valLakhs = ((basePrice * 0.8 + ratio * (maxChartVal - basePrice * 0.8)) / 100000).toFixed(0);
                      return (
                        <g key={idx}>
                          <line
                            x1="55"
                            y1={y}
                            x2="590"
                            y2={y}
                            stroke="rgba(86, 102, 95, 0.18)"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text x="10" y={y + 4} fontSize="10" fill="#56665F" fontWeight="600">
                            ₹{valLakhs}L
                          </text>
                        </g>
                      );
                    })}

                    <line x1="55" y1="180" x2="590" y2="180" stroke="#56665F" strokeWidth="1.5" />
                    <line x1="55" y1="25" x2="55" y2="180" stroke="#56665F" strokeWidth="1.5" />

                    {(() => {
                      const minVal = basePrice * 0.85;
                      const span = Math.max(1, maxChartVal - minVal);
                      const getXY = (idx: number, val: number) => {
                        const x = 65 + (idx / (chartData.length - 1)) * 510;
                        const y = 175 - ((val - minVal) / span) * 140;
                        return { x, y };
                      };

                      const consPts = chartData.map((d, i) => getXY(i, d.conservative));
                      const balPts = chartData.map((d, i) => getXY(i, d.balanced));
                      const optPts = chartData.map((d, i) => getXY(i, d.optimistic));

                      const areaPolygon = [
                        `${balPts[0].x},180`,
                        ...balPts.map((p) => `${p.x},${p.y}`),
                        `${balPts[balPts.length - 1].x},180`,
                      ].join(' ');

                      return (
                        <>
                          <polygon points={areaPolygon} fill="url(#balancedAreaGrad)" />
                          <polyline
                            fill="none"
                            stroke="#769B63"
                            strokeWidth="2.2"
                            points={consPts.map((p) => `${p.x},${p.y}`).join(' ')}
                          />
                          <polyline
                            fill="none"
                            stroke="#123F32"
                            strokeWidth="3.2"
                            points={balPts.map((p) => `${p.x},${p.y}`).join(' ')}
                          />
                          <polyline
                            fill="none"
                            stroke="#D97706"
                            strokeWidth="2.2"
                            strokeDasharray="6 4"
                            points={optPts.map((p) => `${p.x},${p.y}`).join(' ')}
                          />

                          {chartData.map((d, i) => {
                            const pt = balPts[i];
                            const optPt = optPts[i];
                            const consPt = consPts[i];
                            const isHovered = i === hoveredYearIdx;

                            return (
                              <g
                                key={d.year}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredYearIdx(i)}
                                onClick={() => setHoveredYearIdx(i)}
                              >
                                {isHovered && (
                                  <line
                                    x1={pt.x}
                                    y1="30"
                                    x2={pt.x}
                                    y2="180"
                                    stroke="#123F32"
                                    strokeWidth="1.2"
                                    strokeDasharray="3 3"
                                  />
                                )}
                                <circle cx={consPt.x} cy={consPt.y} r="4" fill="#769B63" />
                                <circle cx={optPt.x} cy={optPt.y} r="4" fill="#D97706" />
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={isHovered ? 7 : 5}
                                  fill={isHovered ? '#D97706' : '#123F32'}
                                  stroke="#FFFFFF"
                                  strokeWidth="2"
                                />
                                <text
                                  x={pt.x}
                                  y={pt.y - 12}
                                  textAnchor="middle"
                                  fontSize={isHovered ? '11' : '9.5'}
                                  fontWeight="700"
                                  fill="#123F32"
                                >
                                  ₹{(d.balanced / 100000).toFixed(1)}L
                                </text>
                                <text
                                  x={pt.x}
                                  y="198"
                                  textAnchor="middle"
                                  fontSize="11"
                                  fontWeight={isHovered ? '700' : '500'}
                                  fill={isHovered ? '#123F32' : '#56665F'}
                                >
                                  Year {d.year}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>

                  <div className="mt-2 pt-2 border-t border-mistyblue flex flex-wrap items-center justify-between gap-2 text-xs text-secondarytext">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-3 h-1 bg-[#769B63] inline-block rounded" /> 4% Steady Scenario
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-evergreen">
                        <span className="w-3 h-1 bg-evergreen inline-block rounded" /> {activeProjectionRate}% Selected Scenario
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-amber-800">
                        <span className="w-3 h-1 bg-amber-600 inline-block rounded" /> 8% High-Corridor Scenario
                      </span>
                    </div>
                    <Link
                      to="/price-explorer"
                      className="font-bold text-evergreen hover:underline"
                    >
                      Open Buyer Value Calculator →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. HOW DHARITRI SENTU WORKS (Compacted Flow)
         ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 border-b border-cream">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teagreen">
              {t('End-to-End Workflow')}
            </span>
            <h2 className="font-serif text-2xl font-bold text-evergreen">
              {t('howDharitriWorks')}
            </h2>
          </div>
          <p className="text-xs text-secondarytext max-w-md sm:text-right">
            {t('A structured 6-step due-diligence process from satellite discovery to verified title inspection.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          {[
            {
              step: '01',
              icon: '🛰️',
              title: 'Discover on Map',
              desc: 'Search by district, village, Dag, or ULPIN on our satellite map.',
              to: '/explore',
            },
            {
              step: '02',
              icon: '🛡️',
              title: 'Inspect Trust Passport',
              desc: 'Instant traffic-light comparison of seller claims against survey records.',
              to: '/passport/lst-1',
            },
            {
              step: '03',
              icon: '🔍',
              title: 'Review Flagged Discrepancies',
              desc: 'Catch area variances and Chapter X Tribal Belt restrictions early.',
              to: '/discrepancies',
            },
            {
              step: '04',
              icon: '🔒',
              title: 'Verify in LandLocker',
              desc: 'Inspect Jamabandi extracts and trace maps with SHA-256 integrity checks.',
              to: '/landlocker',
            },
            {
              step: '05',
              icon: '📋',
              title: 'Track 9-Step Due Diligence',
              desc: 'Follow a structured verification checklist with timeline audit logs.',
              to: '/cases',
            },
            {
              step: '06',
              icon: '🤝',
              title: 'Connect with Confidence',
              desc: 'Direct zero-brokerage seller inquiries with circle guideline rate context.',
              to: '/trust-centre',
            },
          ].map((item) => (
            <Link
              key={item.step}
              to={item.to}
              className="bg-white rounded-2xl p-3.5 border border-[#DFD6C3] hover:border-evergreen shadow-sm hover:shadow transition flex items-start gap-3 group"
            >
              <span className="w-8 h-8 rounded-xl bg-palesky border border-mistyblue flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                {item.icon}
              </span>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xs font-bold text-evergreen group-hover:text-teagreen transition truncate">
                    {t(item.title)}
                  </h3>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-warmivory text-evergreen border border-cream ml-1 flex-shrink-0">
                    {t(`Step ${item.step}`) !== `Step ${item.step}` ? t(`Step ${item.step}`) : `${t('Step')} ${item.step}`}
                  </span>
                </div>
                <p className="text-secondarytext text-[11px] leading-snug line-clamp-2">{t(item.desc)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ====================================================================
          5. LAND TRUST PASSPORT & DOCUMENT-VERIFICATION EXPLANATION
         ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14 border-b border-cream">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
              {t('Evidence-Driven Verification Architecture')}
            </span>
            <h2 className="font-serif text-3xl font-bold text-evergreen">
              {t('landTrustPassportSection')}
            </h2>
            <p className="text-sm text-secondarytext leading-relaxed">
              {t('Every listing on Dharitri Sentu undergoes structured field-by-field comparison and a 10-stage document verification pipeline inside LandLocker before it can earn a Verified badge.')}
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-[#DFD6C3] flex items-start gap-3">
                <span className="text-lg">🟢</span>
                <div>
                  <div className="font-bold text-evergreen">{t('Traffic-Light Legal Clarity')}</div>
                  <p className="text-secondarytext mt-0.5">
                    {t('Replaces confusing bureaucratic jargon with clear Green (Verified), Yellow (Warning / Pending Review), and Red (Issue Found) indicators.')}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#DFD6C3] flex items-start gap-3">
                <span className="text-lg">🔒</span>
                <div>
                  <div className="font-bold text-evergreen">{t('10-Stage LandLocker Document Pipeline')}</div>
                  <p className="text-secondarytext mt-0.5">
                    {t('Uploaded deeds and Jamabandi extracts pass through format validation, staging quarantine, malware checks, SHA-256 hashing, field extraction, and reviewer sign-off.')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/passport/${selectedListing?.id || 'lst-1'}`}
                className="px-5 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm"
              >
                {t('Inspect Sample Land Trust Passport →')}
              </Link>
              <Link
                to="/landlocker"
                className="px-5 py-2.5 rounded-xl bg-white border border-[#CFC5B0] text-evergreen text-xs font-bold hover:bg-cream transition"
              >
                {t('Open LandLocker Workspace →')}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#DFD6C3] shadow-md space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-cream pb-3">
              <div>
                <div className="font-bold text-evergreen text-sm">
                  {t('How Seller Claims vs. Reference Records Are Compared')}
                </div>
                <div className="text-[11px] text-secondarytext">
                  {t('Source-labeled comparison for every parcel')}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-palesky text-evergreen font-bold">
                {t('10-Stage Pipeline')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-warmivory border border-cream">
                <div className="font-bold text-evergreen mb-1">{t('1. Seller Declaration')}</div>
                <p className="text-secondarytext">
                  {t('Plot Dag/Patta number, declared Bigha/Acre size, asking price, and up to 15 land photographs.')}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-warmivory border border-cream">
                <div className="font-bold text-evergreen mb-1">{t('2. LandLocker Evidence')}</div>
                <p className="text-secondarytext">
                  {t('SHA-256 hashed PDF/JPG deeds, Jamabandi extracts, and trace maps with revocable buyer sharing.')}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-warmivory border border-cream">
                <div className="font-bold text-evergreen mb-1">{t('3. Discrepancy Engine')}</div>
                <p className="text-secondarytext">
                  {t('Flags area mismatches (e.g., 2.50 vs 2.35 Bigha) and Chapter X Tribal Belt restrictions automatically.')}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-warmivory border border-cream">
                <div className="font-bold text-evergreen mb-1">{t('4. Reviewer Sign-Off Gate')}</div>
                <p className="text-secondarytext">
                  {t('Authorised Reviewer inspects evidence and approves or rejects before public marketplace listing.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. ABOUT, FAQ AND SUPPORTING TRUST INFORMATION
         ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 7 Cols: FAQ Accordion */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
                Clarity Before You Commit
              </span>
              <h2 className="font-serif text-3xl font-bold text-evergreen mt-1">
                {t('aboutAndFaqSection')}
              </h2>
            </div>

            <div className="space-y-3">
              {faqItems.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={faq.q}
                    className="bg-white rounded-2xl border border-[#DFD6C3] overflow-hidden shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-evergreen hover:bg-warmivory/60 transition"
                    >
                      <span>{faq.q}</span>
                      <span className="text-base">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs text-secondarytext leading-relaxed border-t border-cream pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 5 Cols: About Dharitri Sentu & Statutory Notice */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#DFD6C3] shadow-md space-y-4 text-xs">
            <span className="px-3 py-1 rounded-full bg-palesky text-evergreen font-bold">
              🌱 Built for Assam
            </span>
            <h3 className="font-serif text-2xl font-bold text-evergreen">
              {t('About Dharitri Sentu')}
            </h3>
            <p className="text-secondarytext leading-relaxed">
              Dharitri Sentu ("Earth Bridge") is designed around Assam’s cadastral architecture—supporting local Bigha-Katha-Lessa measurements alongside Acre and Square Feet, highlighting Chapter X Tribal Belt rules, and integrating 21 revenue and geospatial datasets into one clear due-diligence experience.
            </p>
            <div className="p-4 rounded-2xl bg-warmivory border border-cream space-y-1.5">
              <div className="font-bold text-evergreen">Statutory & Evidence Notice</div>
              <p className="text-[11px] text-secondarytext leading-relaxed">
                Land Trust Passports, satellite boundaries, and price scenarios are structured decision-support tools and do not substitute for a certified Jamabandi extract, Sub-Registrar encumbrance search, or licensed legal opinion.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRoleModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-evergreen text-warmivory font-bold hover:bg-teagreen transition shadow-sm"
              >
                Choose Portal ({t('getStarted')}) →
              </button>
              <Link
                to="/about"
                className="px-4 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-evergreen font-bold hover:bg-cream transition"
              >
                Architecture & Boundaries
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
