import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { AreaUnit } from '../../types';
import { API_MODE, apiRequest } from '../../services/apiClient';
import { calculateProjectedScenarioValue } from '../../services/govIntegrationBoundary';
import {
  AREA_UNIT_META,
  formatAreaWithSecondary,
  formatPricePerBighaAndUnit,
  getBuyerTrustBadge,
  getTrafficLightFromCheckStatus,
  getTrafficLightFromListing,
  InteractiveUnitConverterWidget,
} from '../../utils/landUnitsAndBadges';
import { PricingStampDutyCalculator } from '../../components/PricingStampDutyCalculator';
import { PricingLegalCostCard } from '../../components/PricingLegalCostCard';
import { InteractivePanoramaViewer } from '../../components/InteractivePanoramaViewer';
import { Camera, Globe, MapPinned, Calendar } from 'lucide-react';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    listings,
    currentUser,
    savedListingIds,
    toggleSavedListing,
    recordRecentlyViewed,
    submitEnquiry,
    getOrCreateConversationThread,
    createDueDiligenceCase,
    refreshServerState,
    areaUnit,
    setAreaUnit,
    t,
  } = useApp();

  const listing =
    listings.find((l) => l.id === id || l.parcelId.toLowerCase() === id?.toLowerCase()) ||
    listings[0];
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'passport' | 'media' | 'price'>(
    'overview'
  );
  const [mediaViewMode, setMediaViewMode] = useState<'photos' | '360' | 'map'>('photos');
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [photoScanNotice, setPhotoScanNotice] = useState<string | null>(null);
  const [rescanningPhotoId, setRescanningPhotoId] = useState<string | null>(null);

  // Module 1: Direct Contact Seller Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [buyerName, setBuyerName] = useState(currentUser?.name || 'Ananya Baruah');
  const [buyerEmail, setBuyerEmail] = useState(currentUser?.email || 'buyer@demo.dharitrisentu.test');
  const [buyerPhone, setBuyerPhone] = useState('9864012345');
  const [contactMessage, setContactMessage] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [id]);

  const QUICK_CHIPS = [
    'Request Title Deeds & Jamabandi RoR',
    'Schedule Physical Site Visit',
    'Inquire on RoU Pipeline Corridor Status',
    'Negotiate Offer Price',
  ];

  useEffect(() => {
    if (isContactModalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isContactModalOpen]);

  const handleContactSeller = () => {
    if (!listing) return;
    const isMonideepa = listing.parcelId === 'AS-DBR-008' || listing.id === 'lst-3' || listing.sellerEmail?.includes('seller2');
    const sellerName = isMonideepa ? 'Monideepa Gogoi' : (listing.sellerName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Pranabjyoti Kalita');
    const threadId = getOrCreateConversationThread(listing.id);
    const draftText = `Hello ${sellerName}, I am interested in ${listing.title}.`;
    navigate(`/buyer/inquiries?tab=inquiries&thread=${threadId}&draft=${encodeURIComponent(draftText)}`);
  };

  const openContactModal = () => {
    if (!listing) return;
    setContactSubject('Enquiry for ' + listing.title + ' (Dag No: ' + listing.parcelId + ', ' + listing.village + ', ' + listing.district + ')');
    setBuyerName(currentUser?.name || 'Ananya Baruah');
    setBuyerEmail(currentUser?.email || 'buyer@demo.dharitrisentu.test');
    setContactMessage(
      'Hello ' + (listing.sellerName || 'Seller') + ',\n\nI am interested in this parcel and would like to confirm availability, recent boundary fencing status, and schedule an inspection against the official circle rate benchmark.\n\nThank you.'
    );
    setDispatchSuccess(false);
    setIsContactModalOpen(true);
  };

  const appendChip = (chipText: string) => {
    setContactMessage((prev) => {
      const trimmed = prev.trim();
      return trimmed + '\n• ' + chipText;
    });
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isContactModalOpen) {
        setIsContactModalOpen(false);
      }
    };
    if (isContactModalOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isContactModalOpen]);

  useEffect(() => {
    if (listing) recordRecentlyViewed(listing.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (!listing) return null;

  const isSaved = savedListingIds.includes(listing.id);
  const buyerBadge = getBuyerTrustBadge(listing);
  const trafficStatus = getTrafficLightFromListing(listing);
  const priceMeta = formatPricePerBighaAndUnit(
    listing.askingPriceINR,
    listing.areaBigha,
    areaUnit
  );

  const handleRescanPhoto = async (mediaId: string) => {
    if (!API_MODE) return;
    setPhotoScanNotice(null); setRescanningPhotoId(mediaId);
    try {
      const result = await apiRequest<{ message: string }>('/api/listing-media/' + encodeURIComponent(mediaId) + '/rescan', { method: 'POST' });
      setPhotoScanNotice(result.message); await refreshServerState();
    } catch (error) { setPhotoScanNotice(error instanceof Error ? error.message : 'Unable to rescan this photo.'); }
    finally { setRescanningPhotoId(null); }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setIsDispatching(true);

    // 1. Save enquiry in AppContext state
    submitEnquiry(listing.id, contactSubject, contactMessage, {
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
    });

    // 2. Dispatch multi-channel notification (SMTP + in-app)
    try {
      if (API_MODE) {
        await apiRequest('/api/notifications/seller-enquiry', {
          method: 'POST',
          body: JSON.stringify({
            listingId: listing.id,
            listingTitle: listing.title,
            parcelId: listing.parcelId,
            sellerEmail: listing.sellerEmail,
            sellerName: listing.sellerName,
            subject: contactSubject,
            message: contactMessage,
            buyerName,
            buyerEmail,
            buyerPhone,
          }),
        });
      }
    } catch (err) {
      console.warn('Backend notification notice:', err);
    } finally {
      setIsDispatching(false);
      setDispatchSuccess(true);
    }
  };

  // Hide 10-Year Value Projection tab from Sellers (Part 10)
  const detailTabs = [
    { id: 'overview', label: 'Overview & Unit Breakdown' },
    { id: 'pricing', label: '💰 Valuation & Stamp Duty' },
    { id: 'passport', label: 'Traffic-Light Trust Passport' },
    { id: 'media', label: `360° Virtual Tour & Photos (${listing.media.length})` },
    ...(currentUser?.role !== 'seller'
      ? [{ id: 'price', label: '10-Year Value Projection (Buyer Insight)' }]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-secondarytext">
        <div className="flex items-center gap-2">
          <Link to="/explore" className="hover:text-evergreen font-semibold">
            ← Back to Explore Land
          </Link>
          <span>/</span>
          <span className="font-bold text-evergreen">
            {listing.village}, {listing.district}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#CFC5B0]">
            <span className="font-medium">📐 Unit:</span>
            <select
              aria-label="Convert Land Unit"
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
          <span className={`px-3 py-1 rounded-full font-bold ${trafficStatus.badgeClass}`}>
            {trafficStatus.badgeText}
          </span>
        </div>
      </div>

      {/* Main Hero Detail Card */}
      <div className="bg-white rounded-3xl border border-[#E5EBE7] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 p-5 sm:p-8">
        {/* Media Gallery Column */}
        <div className="lg:col-span-7 space-y-3">
          {/* Photos / 360 Site View / Satellite Map Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F7F9F6] border border-[#E5EBE7] rounded-xl self-start w-fit">
            <button
              type="button"
              onClick={() => setMediaViewMode('photos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mediaViewMode === 'photos'
                  ? 'bg-[#092F24] text-white shadow-xs'
                  : 'text-[#66736D] hover:text-[#092F24]'
              }`}
            >
              <Camera size={13} />
              <span>📷 Photos</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaViewMode('360')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mediaViewMode === '360'
                  ? 'bg-[#147D4A] text-white shadow-xs'
                  : 'text-[#66736D] hover:text-[#092F24]'
              }`}
            >
              <Globe size={13} />
              <span>🌐 360° Site View</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mediaViewMode === 'map'
                  ? 'bg-[#092F24] text-white shadow-xs'
                  : 'text-[#66736D] hover:text-[#092F24]'
              }`}
            >
              <MapPinned size={13} />
              <span>🗺️ Satellite Map</span>
            </button>
          </div>

          {/* Conditional Media Rendering */}
          {mediaViewMode === '360' ? (
            <InteractivePanoramaViewer
              title={listing.title}
              roadWidth={listing.roadAccess}
              coverImage={listing.media[0]?.url || '/assets/parcel-agricultural.jpg'}
            />
          ) : mediaViewMode === 'map' ? (
            <div className="rounded-2xl overflow-hidden border border-[#E5EBE7] h-[420px]">
              <iframe
                title="Interactive Satellite Map View"
                src={`/explore?parcel=${listing.parcelId}&embed=true`}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <>
              <div className="relative h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-cream border border-cream">
                {API_MODE && listing.media[activeImgIdx]?.fileId && listing.media[activeImgIdx]?.scanStatus !== 'Passed' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-amber-50 text-amber-900 p-6 text-center">
                    <strong>Photograph quarantined</strong>
                    <span className="text-xs">This seller-uploaded image is not displayed until a configured malware scan passes.</span>
                  </div>
                ) : (
                  <img
                    src={listing.media[activeImgIdx]?.url || '/assets/parcel-agricultural.jpg'}
                    alt={listing.media[activeImgIdx]?.caption || listing.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <span
                  className={`absolute top-3 left-3 px-3.5 py-1 rounded-full text-xs font-bold shadow-md ${buyerBadge.bgClass} ${buyerBadge.textClass}`}
                >
                  {buyerBadge.icon} {buyerBadge.label}
                </span>
                <button
                  type="button"
                  onClick={() => setMediaViewMode('360')}
                  className="absolute bottom-3 right-3 px-4 py-2 rounded-xl bg-white/95 text-[#092F24] text-xs font-bold shadow-md hover:bg-cream transition flex items-center gap-1.5"
                >
                  <Globe size={13} className="text-[#147D4A]" />
                  <span>Launch 360° Site View</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-secondarytext italic">
                  {listing.media[activeImgIdx]?.caption}
                </p>
                {listing.media.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {listing.media.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveImgIdx(idx)}
                        className={`w-16 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                          idx === activeImgIdx
                            ? 'border-[#092F24] scale-105 shadow-sm'
                            : 'border-transparent opacity-70'
                        }`}
                      >
                        {API_MODE && m.fileId && m.scanStatus !== 'Passed' ? <span className="flex h-full w-full items-center justify-center bg-amber-50 text-[9px] text-amber-900 text-center">Quarantined</span> : <img src={m.url} alt={m.caption} className="w-full h-full object-cover" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Summary & Actions Column */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-palesky text-evergreen">
                {listing.landType}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${trafficStatus.badgeClass}`}>
                Passport: {trafficStatus.badgeText}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen leading-tight">
              {listing.title}
            </h1>

            <p className="text-sm text-secondarytext">
              📍 Village: <strong className="text-maintext">{listing.village}</strong>, District:{' '}
              <strong className="text-maintext">{listing.district}</strong>, Assam
            </p>

            {/* Price, Price per Bigha & Unit-Converted Area Box */}
            <div className="p-5 rounded-2xl bg-warmivory border border-[#CFC5B0] space-y-2">
              <div className="text-xs text-secondarytext font-medium">
                Seller Asking Price (vs ₹{listing.benchmarkRatePerBighaINR.toLocaleString('en-IN')}/Bigha Circle Benchmark)
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-3xl font-bold text-evergreen">
                  ₹{listing.askingPriceINR.toLocaleString('en-IN')}
                </div>
                <span className="text-xs font-bold text-teagreen bg-white px-2.5 py-1 rounded-lg border border-cream">
                  {priceMeta.formattedLine}
                </span>
              </div>
              <div className="text-xs text-maintext flex items-center justify-between pt-2 border-t border-cream">
                <span>
                  📐 Seller Declared: <strong>{formatAreaWithSecondary(listing.areaBigha, areaUnit)}</strong>
                </span>
                <span className="text-secondarytext">
                  Survey: {formatAreaWithSecondary(listing.recordedAreaBigha, areaUnit)}
                </span>
              </div>
            </div>

            {/* Traffic-Light Trust Passport Quick Status Box */}
            <div className="p-4 rounded-2xl bg-palesky/60 border border-mistyblue space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-evergreen">
                  🛡️ Land Trust Passport Summary
                </span>
                <Link
                  to={`/passport/${listing.id}`}
                  className="text-xs font-bold text-evergreen hover:underline"
                >
                  Full Report →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-700">
                    🟢 {listing.passportSummary.matchedCount}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-900">Verified</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-700">
                    🟡 {listing.passportSummary.pendingCount}
                  </div>
                  <div className="text-[10px] font-semibold text-amber-900">Warning</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-red-200">
                  <div className="font-bold text-red-700">
                    🔴 {listing.passportSummary.discrepancyCount}
                  </div>
                  <div className="text-[10px] font-semibold text-red-900">Issue Found</div>
                </div>
              </div>
              <p className="text-[11px] text-secondarytext">{trafficStatus.plainExplanation}</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => toggleSavedListing(listing.id)}
                className="py-3 px-4 rounded-xl border border-evergreen text-evergreen font-bold text-xs hover:bg-cream transition"
              >
                {isSaved ? `❤️ ${t('savedListing')}` : `🤍 ${t('saveListing')}`}
              </button>
              <button
                type="button"
                onClick={handleContactSeller}
                className="py-3 px-4 rounded-xl bg-evergreen text-warmivory font-bold text-xs hover:bg-teagreen transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>✉️</span>
                <span>Contact Seller</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/buyer/inquiries?tab=visits&action=schedule&listingId=${listing.id}`)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#147D4A] hover:bg-[#092F24] text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <Calendar size={15} className="text-emerald-300" />
              <span>Schedule Physical Site Visit (Pick Date & Time)</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to={'/passport/' + listing.id}
                className="py-2.5 px-3 rounded-xl bg-warmivory border border-[#CFC5B0] text-maintext font-semibold text-xs text-center hover:bg-cream transition"
              >
                Inspect Trust Passport
              </Link>
              <button
                type="button"
                onClick={() => {
                  const c = createDueDiligenceCase(listing.id);
                  navigate('/cases/' + c.id);
                }}
                className="py-2.5 px-3 rounded-xl bg-palesky text-evergreen font-bold text-xs hover:bg-mistyblue transition"
              >
                Start Buyer Checklist →
              </button>
            </div>
          </div>

          {/* Quick Pricing & Legal Cost Breakdown Card in Right Action Column */}
          <div className="pt-2">
            <PricingLegalCostCard
              circleName={`${listing.village || 'Changsari'} (${listing.district || 'Kamrup'})`}
              areaBigha={listing.areaBigha || 2.5}
              circleRatePerBighaINR={listing.benchmarkRatePerBighaINR || 450000}
              askingPricePerBighaINR={Math.round(listing.askingPriceINR / (listing.areaBigha || 1))}
            />
          </div>
        </div>
      </div>

      {/* MODULE 1: Direct Contact Seller Notification Modal */}
      {isContactModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-seller-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsContactModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#DFD6C3] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-cream pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-evergreen text-xs font-bold tracking-wide uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Direct Multi-Channel Notification
                </div>
                <h2 id="contact-seller-title" className="font-serif text-2xl font-bold text-evergreen">
                  Contact Verified Seller ({listing.sellerName})
                </h2>
                <p className="text-xs text-secondarytext mt-0.5">
                  Your enquiry triggers an instant in-app dashboard notification & official email dispatch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-warmivory hover:bg-cream text-secondarytext hover:text-maintext flex items-center justify-center text-sm font-bold transition"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {dispatchSuccess ? (
              /* Success State */
              <div className="py-8 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl shadow-inner font-bold">
                  ✓
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-bold text-evergreen">
                    Notification & Email Dispatched to Seller
                  </h3>
                  <p className="text-xs sm:text-sm text-secondarytext max-w-md mx-auto leading-relaxed">
                    An urgent notification and SMTP email alert have been dispatched to{' '}
                    <strong className="text-maintext font-bold">{listing.sellerName}</strong> ({listing.sellerEmail}).
                    You can track replies and documentation updates directly in your Buyer Dashboard.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-warmivory border border-[#DFD6C3] text-left text-xs space-y-1.5 max-w-lg mx-auto">
                  <div className="font-bold text-evergreen flex items-center gap-2">
                    <span>📋 Dispatch Reference Summary</span>
                  </div>
                  <div className="text-secondarytext"><strong className="text-maintext">Subject:</strong> {contactSubject}</div>
                  <div className="text-secondarytext"><strong className="text-maintext">Listing:</strong> {listing.title} (Dag #{listing.parcelId})</div>
                  <div className="text-secondarytext"><strong className="text-maintext">Buyer Contact:</strong> {buyerName} • {buyerEmail} {buyerPhone ? '• ' + buyerPhone : ''}</div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsContactModalOpen(false);
                      navigate('/dashboard/buyer');
                    }}
                    className="py-3 px-6 rounded-xl bg-evergreen text-warmivory font-bold text-xs hover:bg-teagreen transition shadow-md"
                  >
                    Go to My Enquiries →
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="py-3 px-5 rounded-xl border border-cream text-secondarytext hover:text-maintext text-xs font-semibold transition"
                  >
                    Back to Parcel Details
                  </button>
                </div>
              </div>
            ) : (
              /* Enquiry Form */
              <form onSubmit={handleSendNotification} className="space-y-5">
                {/* Auto-generated & Editable Subject */}
                <div>
                  <label className="block text-xs font-bold text-maintext uppercase tracking-wider mb-1.5">
                    Subject Line (Auto-generated & Editable)
                  </label>
                  <input
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-warmivory/70 border border-[#DFD6C3] text-sm text-maintext focus:outline-none focus:ring-2 focus:ring-evergreen/30"
                  />
                </div>

                {/* Buyer Contact Details Grid */}
                <div>
                  <label className="block text-xs font-bold text-maintext uppercase tracking-wider mb-1.5">
                    Your Contact Details (Dispatched to Seller)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] text-secondarytext block mb-1">Full Name</span>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-warmivory/60 border border-[#DFD6C3] text-xs text-maintext font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-secondarytext block mb-1">Email Address</span>
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-warmivory/60 border border-[#DFD6C3] text-xs text-maintext font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-secondarytext block mb-1">Phone Number (Optional)</span>
                      <input
                        type="tel"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="e.g. 9864012345"
                        className="w-full px-3 py-2 rounded-xl bg-warmivory/60 border border-[#DFD6C3] text-xs text-maintext font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Query Chips */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-maintext uppercase tracking-wider">
                      Quick Query Chips (Click to append into message)
                    </span>
                    <span className="text-[10px] text-secondarytext">One-click insert</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => appendChip(chip)}
                        className="py-1.5 px-3 rounded-lg bg-warmivory border border-[#DFD6C3] hover:border-evergreen hover:bg-emerald-50 text-evergreen text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className="text-emerald-700 font-bold">+</span>
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-xs font-bold text-maintext uppercase tracking-wider mb-1.5">
                    Message Body
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Inquire about availability, boundary fencing, or circle rate benchmark..."
                    className="w-full px-4 py-3 rounded-xl bg-warmivory/70 border border-[#DFD6C3] text-sm text-maintext leading-relaxed focus:outline-none focus:ring-2 focus:ring-evergreen/30"
                  />
                  <p className="text-[11px] text-secondarytext mt-1">
                    Default greeting inquires about availability, boundary markers, and circle rate benchmark.
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-cream">
                  <div className="text-[11px] text-secondarytext">
                    🔒 Delivered via secure Dharitri Sentu Notification Gateway
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsContactModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-cream text-secondarytext hover:text-maintext text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDispatching}
                      className="px-6 py-2.5 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory font-bold text-xs transition shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {isDispatching ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <span>✉️</span>
                          <span>Send Notification to Seller</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Interactive Land Unit Converter for this Listing */}
      <InteractiveUnitConverterWidget defaultBigha={listing.areaBigha} compact />

      {/* Detail Tabs */}
      <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-cream pb-3">
          {detailTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-evergreen text-warmivory shadow-sm'
                  : 'bg-warmivory text-maintext hover:bg-cream'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <PricingLegalCostCard
              circleName={`${listing.village || 'Changsari'} (${listing.district || 'Kamrup'})`}
              areaBigha={listing.areaBigha || 2.5}
              circleRatePerBighaINR={listing.benchmarkRatePerBighaINR || 450000}
              askingPricePerBighaINR={Math.round(listing.askingPriceINR / (listing.areaBigha || 1))}
            />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-bold text-evergreen">
                Property Highlights (Preserved Original Description)
              </h3>
              <p className="text-maintext leading-relaxed">{listing.description}</p>
              <div className="p-4 rounded-2xl bg-warmivory border border-cream text-xs space-y-2">
                <div>
                  🛣️ <strong>Road Access:</strong> {listing.roadAccess}
                </div>
                <div>
                  💧 <strong>Terrain & Elevation:</strong> {listing.floodRiskNote}
                </div>
                <div>
                  👤 <strong>Listed By:</strong> {listing.sellerName}
                </div>
                <div>
                  📋 <strong>Verification Status:</strong> {listing.status}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-bold text-evergreen">
                Seller Declaration vs. Reference Record Summary
              </h3>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-cream">
                    <td className="py-2.5 text-secondarytext">Seller Declared Area</td>
                    <td className="py-2.5 font-bold text-right text-evergreen">
                      {formatAreaWithSecondary(listing.areaBigha, areaUnit)}
                    </td>
                  </tr>
                  <tr className="border-b border-cream">
                    <td className="py-2.5 text-secondarytext">Survey Record Area</td>
                    <td className="py-2.5 font-bold text-right">
                      {formatAreaWithSecondary(listing.recordedAreaBigha, areaUnit)}
                    </td>
                  </tr>
                  <tr className="border-b border-cream">
                    <td className="py-2.5 text-secondarytext">Price per Unit</td>
                    <td className="py-2.5 font-bold text-right text-teagreen">
                      {priceMeta.formattedLine}
                    </td>
                  </tr>
                  <tr className="border-b border-cream">
                    <td className="py-2.5 text-secondarytext">Local Zonal Benchmark</td>
                    <td className="py-2.5 font-semibold text-right">
                      ₹{listing.benchmarkRatePerBighaINR.toLocaleString('en-IN')} / Bigha
                    </td>
                  </tr>
                  <tr className="border-b border-cream">
                    <td className="py-2.5 text-secondarytext">Plot Reference</td>
                    <td className="py-2.5 font-semibold text-right text-secondarytext">
                      {listing.parcelId}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'passport' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-warmivory text-maintext">
                    <th className="p-3 rounded-tl-xl">Check</th>
                    <th className="p-3">Seller Declaration</th>
                    <th className="p-3">Reference Record</th>
                    <th className="p-3">Traffic-Light Status</th>
                    <th className="p-3 rounded-tr-xl">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {listing.passportSummary.comparisons.map((c, idx) => {
                    const tl = getTrafficLightFromCheckStatus(c.status);
                    return (
                      <tr key={idx} className="border-b border-cream">
                        <td className="p-3 font-bold text-evergreen">{c.field}</td>
                        <td className="p-3">{c.sellerSubmittedValue}</td>
                        <td className="p-3 font-semibold">{c.demoReferenceValue}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${tl.badgeClass}`}>
                            {tl.badgeText}
                          </span>
                        </td>
                        <td className="p-3 text-secondarytext">{c.explanation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-4">
            {photoScanNotice && <p role="status" className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs">{photoScanNotice}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {listing.media.map((m) => (
                <div key={m.id} className="rounded-2xl overflow-hidden border border-cream bg-warmivory">
                  {m.scanStatus === 'Passed' || !API_MODE || !m.fileId ? <img src={m.url} alt={m.caption} className="w-full h-44 object-cover" /> : <div className="w-full h-44 flex flex-col items-center justify-center gap-2 bg-amber-50 text-amber-900 text-xs p-4 text-center"><strong>Photograph quarantined</strong><span>It is stored privately until the configured virus scan passes.</span></div>}
                  <div className="p-3 text-xs space-y-1">
                    <span className="font-bold text-evergreen block">{m.sourceLabel}</span>
                    <p className="text-secondarytext">{m.caption}</p>
                    {API_MODE && m.fileId && m.scanStatus !== 'Passed' && (currentUser?.role === 'seller' || currentUser?.role === 'reviewer') && <button type="button" disabled={rescanningPhotoId === m.fileId} onClick={() => void handleRescanPhoto(m.fileId!)} className="mt-2 px-3 py-2 rounded-lg bg-evergreen text-white font-bold disabled:opacity-50">{rescanningPhotoId === m.fileId ? 'Scanning…' : 'Run / Retry Security Scan'}</button>}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to={`/virtual-tour/${listing.id}`}
              className="inline-block px-5 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold"
            >
              Open Fullscreen 360° Virtual Tour →
            </Link>
          </div>
        )}

        {activeTab === 'price' && currentUser?.role !== 'seller' && (
          <div className="space-y-4 text-xs">
            <p className="text-secondarytext">{t('priceDisclaimer')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { rate: 4, title: '4% Steady Appreciation (10 Yrs)' },
                { rate: 6, title: '6% Balanced Appreciation (10 Yrs)' },
                { rate: 8, title: '8% High-Growth Corridor (10 Yrs)' },
              ].map((item) => {
                const yr10 = calculateProjectedScenarioValue(
                  listing.askingPriceINR,
                  item.rate,
                  10
                );
                return (
                  <div
                    key={item.rate}
                    className="p-4 rounded-2xl bg-palesky/60 border border-mistyblue"
                  >
                    <div className="font-bold text-secondarytext">{item.title}</div>
                    <div className="text-xl font-bold text-evergreen mt-1">
                      ₹{yr10.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-teagreen font-semibold mt-1">
                      Starting: ₹{listing.askingPriceINR.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
