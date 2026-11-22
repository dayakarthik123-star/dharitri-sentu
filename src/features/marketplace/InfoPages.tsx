import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { GOVERNMENT_INTEGRATION_BOUNDARIES } from '../../services/govIntegrationBoundary';
import { CADASTRAL_PARCEL_RECORDS } from '../../services/cadastralService';
import { TWELVE_CAPABILITY_PILLARS } from '../voice-assistant/VoiceAssistantPage';
import {
  formatAreaWithSecondary,
  formatPricePerBighaAndUnit,
  getBuyerTrustBadge,
  getTrafficLightFromListing,
  InteractiveUnitConverterWidget,
} from '../../utils/landUnitsAndBadges';

export const ForBuyersPage: React.FC = () => {
  const { t } = useApp();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
      <div className="border-b border-cream pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
          {t('Safe Land Buying Guide')}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
          {t('for land buyers in assam')}
        </h1>
        <p className="text-sm text-secondarytext mt-2 max-w-3xl leading-relaxed">
          {t('Buy land with complete peace of mind. Compare real satellite terrain, convert Bigha to Acre or Square Feet in one click, check traffic-light Trust Passports, and follow a guided 9-step checklist before paying any advance.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-6 rounded-3xl bg-white border border-[#DFD6C3] shadow-sm space-y-2">
          <span className="w-10 h-10 rounded-2xl bg-palesky flex items-center justify-center text-lg">
            🛰️
          </span>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            {t('1. explore satellite terrain & convert units')}
          </h2>
          <p className="text-secondarytext leading-relaxed">
            {t('Inspect road access, highway proximity, and river elevation on our realistic satellite map while toggling seamlessly between Bigha, Acre, Katha, and Sq. Ft.')}
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-[#DFD6C3] shadow-sm space-y-2">
          <span className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-lg">
            🚦
          </span>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            {t('2. check traffic-light trust passports')}
          </h2>
          <p className="text-secondarytext leading-relaxed">
            {t('Instantly see whether a plot is Green (Verified), Yellow (Warning / Review Pending), or Red (Mismatch Found) before you schedule a site visit.')}
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-[#DFD6C3] shadow-sm space-y-2">
          <span className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-lg">
            📋
          </span>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            {t('3. complete guided due diligence')}
          </h2>
          <p className="text-secondarytext leading-relaxed">
            {t('Request trace maps and Jamabandi extracts in LandLocker and track all 9 verification steps inside your Buyer Dashboard.')}
          </p>
        </div>
      </div>

      <InteractiveUnitConverterWidget defaultBigha={2.5} />

      <div className="flex flex-wrap gap-3">
        <Link
          to="/explore"
          className="px-6 py-3 rounded-xl bg-evergreen text-warmivory text-xs sm:text-sm font-bold hover:bg-teagreen transition shadow-sm"
        >
          {t('Explore Verified Land →')}
        </Link>
        <Link
          to="/dashboard/buyer"
          className="px-6 py-3 rounded-xl bg-white border border-[#CFC5B0] text-evergreen text-xs sm:text-sm font-bold hover:bg-cream transition"
        >
          {t('Open Buyer Dashboard')}
        </Link>
      </div>
    </div>
  );
};

export const ForSellersPage: React.FC = () => {
  const { t } = useApp();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-cream pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
          {t('Direct Landowner Marketplace')}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
          {t('for land sellers & pattadars')}
        </h1>
        <p className="text-sm text-secondarytext mt-2 max-w-3xl leading-relaxed">
          {t('Reach serious buyers directly without middlemen markups. Showcase your plot with a "Verified Owner" or "Clear Title" badge, display transparent per-Bigha and per-Acre pricing, and share documents only when you grant consent.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-6 rounded-3xl bg-white border border-[#DFD6C3] shadow-sm space-y-2">
          <span className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-lg">
            ✨
          </span>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            {t('1. earn high-trust buyer badges')}
          </h2>
          <p className="text-secondarytext leading-relaxed">
            {t('Pre-check your plot number and area against survey records so your listing stands out with a Verified Owner or Clear Title badge.')}
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-[#DFD6C3] shadow-sm space-y-2">
          <span className="w-10 h-10 rounded-2xl bg-palesky flex items-center justify-center text-lg">
            🔒
          </span>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            {t('2. protect privacy with landlocker')}
          </h2>
          <p className="text-secondarytext leading-relaxed">
            {t('Keep your Patta extract and sale deeds private. Grant view access to shortlisted buyers and revoke access anytime with one click.')}
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-[#DFD6C3] shadow-sm space-y-2">
          <span className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-lg">
            💬
          </span>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            {t('3. manage inquiries in one dashboard')}
          </h2>
          <p className="text-secondarytext leading-relaxed">
            {t('Track buyer questions, compare your asking price against local zonal benchmarks, and manage all your plots from your Seller Dashboard.')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/sell/new"
          className="px-6 py-3 rounded-xl bg-[#D97706] text-white text-xs sm:text-sm font-bold hover:bg-[#B45309] transition shadow-sm"
        >
          {t('+ List Your Land Parcel →')}
        </Link>
        <Link
          to="/dashboard/seller"
          className="px-6 py-3 rounded-xl bg-evergreen text-warmivory text-xs sm:text-sm font-bold hover:bg-teagreen transition shadow-sm"
        >
          {t('Open Seller Dashboard')}
        </Link>
      </div>
    </div>
  );
};

export const CapabilitiesPage: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    <div className="border-b border-cream pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
          12 Technology Pillars · 21 Integrated Datasets
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
          Dharitri Sentu Technology & Geospatial Capabilities
        </h1>
        <p className="text-xs sm:text-sm text-secondarytext mt-1 max-w-3xl">
          Inspect the 12 core technology pillars and all 21 statutory revenue and scientific geospatial datasets powering Assam’s land-transparency platform.
        </p>
      </div>
      <Link
        to="/explore"
        className="px-4 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm"
      >
        🛰️ Inspect Live on Satellite Map →
      </Link>
    </div>

    {/* 12 Pillars Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
      {TWELVE_CAPABILITY_PILLARS.map((pillar) => (
        <Link
          key={pillar.id}
          to={pillar.route}
          className="bg-white rounded-3xl p-5 border border-[#DFD6C3] hover:border-evergreen shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-palesky text-evergreen">
                Pillar {pillar.number}
              </span>
              <span className="text-[10px] font-semibold text-teagreen">{pillar.source}</span>
            </div>
            <h2 className="font-serif text-lg font-bold text-evergreen">{pillar.title}</h2>
            <p className="text-secondarytext leading-relaxed">{pillar.summary}</p>
          </div>
          <span className="font-bold text-evergreen">Open Module →</span>
        </Link>
      ))}
    </div>

    {/* Surveyed Pilot Dags & 7 Advanced Geospatial Datasets Table */}
    <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 shadow-sm space-y-4">
      <div>
        <h2 className="font-serif text-xl font-bold text-evergreen">
          Surveyed Pilot Parcels — 21-Dataset Cadastral & Geospatial Matrix
        </h2>
        <p className="text-xs text-secondarytext">
          Real EPSG:4326 WGS-84 surveyed Dag parcels connected across Changsari, Khanapara, Cinnamara Tea Estate, Chowkidinghee, Samaguri, and Ghopa.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-warmivory text-maintext border-b border-cream">
              <th className="p-3 rounded-tl-xl">Pilot Area & Dag</th>
              <th className="p-3">14-Digit ULPIN & RoR</th>
              <th className="p-3">Basundhara Case</th>
              <th className="p-3">Soil & Slope (VEDAS / CartoDEM)</th>
              <th className="p-3">Flood & Seismic (ASDMA / GSI)</th>
              <th className="p-3 rounded-tr-xl text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {CADASTRAL_PARCEL_RECORDS.map((rec) => (
              <tr key={rec.parcel_id} className="border-b border-cream hover:bg-warmivory/50">
                <td className="p-3">
                  <div className="font-bold text-evergreen">
                    {rec.village_name} (Dag {rec.dag_number})
                  </div>
                  <div className="text-secondarytext">
                    Patta {rec.patta_number} · {rec.district_name}
                  </div>
                </td>
                <td className="p-3 font-mono text-[11px]">
                  <div className="font-bold text-maintext">{rec.ulpin}</div>
                  <div className="text-secondarytext">{rec.ror_jamabandi_ref}</div>
                </td>
                <td className="p-3">
                  <div className="font-mono text-[11px] font-semibold text-evergreen">
                    {rec.last_mutation_case}
                  </div>
                  <div className="text-[10px] text-secondarytext">{rec.mutation_status}</div>
                </td>
                <td className="p-3">
                  <div>
                    pH {rec.soil_health.ph_level} · OC {rec.soil_health.organic_carbon_percent}%
                  </div>
                  <div className="text-secondarytext">
                    {rec.topographic_slope.elevation_msl_metres}m MSL ({rec.topographic_slope.slope_percentage}% slope)
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-emerald-900">{rec.asdma_flood_zone}</div>
                  <div className="text-secondarytext">{rec.seismic_micro_zonation.seismic_zone}</div>
                </td>
                <td className="p-3 text-right">
                  <Link
                    to={`/land/${rec.listing_id}`}
                    className="px-3 py-1.5 rounded-xl bg-evergreen text-warmivory font-bold text-[11px] hover:bg-teagreen transition"
                  >
                    Inspect →
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

export const TrustCentrePage: React.FC = () => {
  const { listings, discrepancies, cases, documents, areaUnit, t } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cream pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
            Buyer & Seller Protection Hub
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
            Dharitri Sentu Trust & Verification Centre
          </h1>
          <p className="text-sm text-secondarytext mt-1 max-w-3xl">
            Understand every land parcel’s legal readiness at a single glance using our Traffic-Light Trust Passports, Automated Discrepancy Engine, 9-Step Buyer Checklist, and Consent-Controlled LandLocker Vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/discrepancies"
            className="px-4 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm"
          >
            Open Discrepancy Engine ({discrepancies.length}) →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border-l-8 border-l-emerald-600 border border-[#DFD6C3] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
              🟢 Green · Verified
            </span>
            <span className="text-xs font-bold text-emerald-700">Ready for Site Visit</span>
          </div>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            Records Match Across Sources
          </h2>
          <p className="text-xs text-secondarytext leading-relaxed">
            Seller identity, Dag/Patta plot number, land category, and declared Bigha/Acre area match the survey register with zero discrepancies.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border-l-8 border-l-amber-500 border border-[#DFD6C3] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
              🟡 Yellow · Warning
            </span>
            <span className="text-xs font-bold text-amber-700">Check Pending</span>
          </div>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            Supporting Document Under Review
          </h2>
          <p className="text-xs text-secondarytext leading-relaxed">
            Core plot details are consistent, but a supporting item (such as a trace map sketch or latest land revenue receipt) is awaiting reviewer sign-off.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border-l-8 border-l-red-600 border border-[#DFD6C3] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-900 text-xs font-bold">
              🔴 Red · Issue Found
            </span>
            <span className="text-xs font-bold text-red-700">Clarify Before Deposit</span>
          </div>
          <h2 className="font-serif text-lg font-bold text-evergreen">
            Area or Plot Number Mismatch
          </h2>
          <p className="text-xs text-secondarytext leading-relaxed">
            Our Discrepancy Engine flagged a difference between seller-declared figures and survey records (for example, 2.50 Bigha vs 2.35 Bigha).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
        <Link
          to="/passport/lst-1"
          className="p-6 rounded-3xl bg-white border border-[#DFD6C3] hover:border-evergreen shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl">
              🛡️
            </span>
            <h3 className="font-serif text-lg font-bold text-evergreen">Land Trust Passport</h3>
            <p className="text-secondarytext leading-relaxed">
              Inspect traffic-light verification summaries and field-by-field comparisons for every parcel.
            </p>
          </div>
          <span className="font-bold text-evergreen">Inspect Passports →</span>
        </Link>

        <Link
          to="/discrepancies"
          className="p-6 rounded-3xl bg-white border border-[#DFD6C3] hover:border-evergreen shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <span className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-xl">
              🔍
            </span>
            <h3 className="font-serif text-lg font-bold text-evergreen">
              Discrepancy Engine ({discrepancies.length})
            </h3>
            <p className="text-secondarytext leading-relaxed">
              Review flagged mismatches in Bigha/Acre area, Dag numbers, and land use classifications.
            </p>
          </div>
          <span className="font-bold text-evergreen">Open Engine →</span>
        </Link>

        <Link
          to="/cases"
          className="p-6 rounded-3xl bg-white border border-[#DFD6C3] hover:border-evergreen shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-xl">
              📋
            </span>
            <h3 className="font-serif text-lg font-bold text-evergreen">
              9-Step Buyer Checklist ({cases.length})
            </h3>
            <p className="text-secondarytext leading-relaxed">
              Track verification tasks across Buyer, Seller, and Reviewer roles with a complete audit log.
            </p>
          </div>
          <span className="font-bold text-evergreen">View Checklists →</span>
        </Link>

        <Link
          to="/landlocker"
          className="p-6 rounded-3xl bg-white border border-[#DFD6C3] hover:border-evergreen shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <span className="w-10 h-10 rounded-2xl bg-palesky flex items-center justify-center text-xl">
              🔒
            </span>
            <h3 className="font-serif text-lg font-bold text-evergreen">
              LandLocker Vault ({documents.length})
            </h3>
            <p className="text-secondarytext leading-relaxed">
              Preview ownership records, grant buyer/reviewer access, or revoke sharing permissions instantly.
            </p>
          </div>
          <span className="font-bold text-evergreen">Open Document Vault →</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-bold text-evergreen">
              {t('matrixTitle')}
            </h2>
            <p className="text-xs text-secondarytext">
              {t('matrixSubtitle')}
            </p>
          </div>
          <Link to="/explore" className="text-xs font-bold text-evergreen hover:underline">
            {t('matrixExploreMap')}
          </Link>
        </div>

        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain rounded-xl">
          <table className="w-full min-w-[1080px] text-xs text-left border-collapse">
            <thead>
              <tr className="bg-warmivory text-maintext border-b border-cream">
                <th className="p-3 rounded-tl-xl">{t('matrixBuyerBadge')}</th>
                <th className="p-3">{t('matrixParcelLocation')}</th>
                <th className="p-3">{t('matrixListedSize')}</th>
                <th className="p-3">{t('matrixSurveySize')}</th>
                <th className="p-3">{t('matrixPriceRate')}</th>
                <th className="p-3">{t('matrixTrafficStatus')}</th>
                <th className="p-3 rounded-tr-xl text-right whitespace-nowrap">{t('matrixAction')}</th>
              </tr>
            </thead>
            <tbody>
              {listings.slice(0, 8).map((item) => {
                const badge = getBuyerTrustBadge(item);
                const traffic = getTrafficLightFromListing(item);
                const priceMeta = formatPricePerBighaAndUnit(
                  item.askingPriceINR,
                  item.areaBigha,
                  areaUnit
                );
                return (
                  <tr key={item.id} className="border-b border-cream hover:bg-warmivory/50">
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
                        {item.village}, {item.district} · {item.landType}
                      </div>
                    </td>
                    <td className="p-3 font-semibold">
                      {formatAreaWithSecondary(item.areaBigha, areaUnit)}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatAreaWithSecondary(item.recordedAreaBigha, areaUnit)}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-evergreen">
                        ₹{item.askingPriceINR.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-teagreen">{priceMeta.formattedLine}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${traffic.badgeClass}`}>
                        {traffic.badgeText}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Link
                        to={`/passport/${item.id}`}
                        className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 rounded-xl bg-evergreen text-warmivory font-bold text-[11px] hover:bg-teagreen transition"
                      >
                        {t('matrixPassport')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <InteractiveUnitConverterWidget defaultBigha={3.0} />
    </div>
  );
};

export const AboutPage: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
    <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
      Platform Overview & Architecture
    </span>
    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen">
      About Dharitri Sentu
    </h1>
    <p className="text-sm text-secondarytext leading-relaxed">
      Dharitri Sentu ("Earth Bridge") connects land buyers and sellers across Assam with transparent pricing, instant Bigha-to-Acre unit conversions, traffic-light Land Trust Passports, and consent-controlled document sharing.
    </p>
    <div className="bg-white p-6 rounded-3xl border border-[#DFD6C3] shadow-sm space-y-3 text-xs">
      <h2 className="font-serif text-lg font-bold text-evergreen">
        External Department Integration Boundaries
      </h2>
      {GOVERNMENT_INTEGRATION_BOUNDARIES.map((b) => (
        <div
          key={b.id}
          className="p-3.5 rounded-2xl bg-palesky/60 border border-mistyblue flex flex-wrap justify-between items-center gap-2"
        >
          <div>
            <div className="font-bold text-evergreen">{b.serviceName}</div>
            <div className="text-secondarytext">{b.plannedCapability}</div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 font-semibold">
            {b.statusLabel}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-4 text-xs leading-relaxed">
    <h1 className="font-serif text-3xl font-bold text-evergreen">
      Privacy & Data Protection Policy
    </h1>
    <p className="text-secondarytext">
      1. <strong>Demonstration Data Only:</strong> All listings, owner names, plot numbers, and documents in this environment are fictional demonstration records.
    </p>
    <p className="text-secondarytext">
      2. <strong>Consent-Driven Sharing:</strong> LandLocker gives landowners granular control to grant or revoke document viewing access at any time with an auditable consent log.
    </p>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-4 text-xs leading-relaxed">
    <h1 className="font-serif text-3xl font-bold text-evergreen">
      Terms of Use & Platform Disclaimers
    </h1>
    <p className="text-secondarytext">
      Dharitri Sentu provides structured record comparisons, unit conversions, and due-diligence checklists to help buyers and sellers evaluate land parcels transparently. Always complete a licensed legal title search and physical survey prior to final deed registration.
    </p>
  </div>
);
