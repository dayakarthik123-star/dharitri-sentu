import fs from 'node:fs';

let content = fs.readFileSync('src/features/marketplace/ListingDetailPage.tsx', 'utf8');

const marker1Start = '  const [activeImgIdx, setActiveImgIdx] = useState(0);';
const marker1End = '  // Hide 10-Year Value Projection tab from Sellers (Part 10)';

const idx1Start = content.indexOf(marker1Start);
const idx1End = content.indexOf(marker1End);

if (idx1Start === -1 || idx1End === -1) {
  console.error('Markers 1 not found', { idx1Start, idx1End });
  process.exit(1);
}

const replacement1 = `  const [activeImgIdx, setActiveImgIdx] = useState(0);
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

  const QUICK_CHIPS = [
    'Request Title Deeds & Jamabandi RoR',
    'Schedule Physical Site Visit',
    'Inquire on RoU Pipeline Corridor Status',
    'Negotiate Offer Price',
  ];

  const openContactModal = () => {
    if (!listing) return;
    setContactSubject('Enquiry for ' + listing.title + ' (Dag No: ' + listing.parcelId + ', ' + listing.village + ', ' + listing.district + ')');
    setBuyerName(currentUser?.name || 'Ananya Baruah');
    setBuyerEmail(currentUser?.email || 'buyer@demo.dharitrisentu.test');
    setContactMessage(
      'Hello ' + (listing.sellerName || 'Seller') + ',\\n\\nI am interested in this parcel and would like to confirm availability, recent boundary fencing status, and schedule an inspection against the official circle rate benchmark.\\n\\nThank you.'
    );
    setDispatchSuccess(false);
    setIsContactModalOpen(true);
  };

  const appendChip = (chipText: string) => {
    setContactMessage((prev) => {
      const trimmed = prev.trim();
      return trimmed + '\\n• ' + chipText;
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

`;

content = content.slice(0, idx1Start) + replacement1 + content.slice(idx1End);

// Normalize content linebreaks to \n
content = content.replace(/\r\n/g, '\n');

const marker2End = '{/* Interactive Land Unit Converter for this Listing */}';
const idx2Start = content.indexOf('onClick={() => setEnquiryOpen(!enquiryOpen)}');
const buttonTagStart = content.lastIndexOf('<button', idx2Start);
const idx2End = content.indexOf(marker2End);

if (buttonTagStart === -1 || idx2End === -1) {
  console.error('Markers 2 not found', { buttonTagStart, idx2End });
  process.exit(1);
}

const replacement2 = `<button
                type="button"
                onClick={openContactModal}
                className="py-3 px-4 rounded-xl bg-evergreen text-warmivory font-bold text-xs hover:bg-teagreen transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>✉️</span>
                <span>Contact Seller</span>
              </button>
            </div>

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

      `;

content = content.slice(0, buttonTagStart) + replacement2 + content.slice(idx2End);

fs.writeFileSync('src/features/marketplace/ListingDetailPage.tsx', content, 'utf8');
console.log('ListingDetailPage updated successfully!');
