import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { API_MODE, apiRequest } from '../../services/apiClient';
import { AreaUnit, LandType, ListingMedia, ListingStatus } from '../../types';
import {
  AREA_UNIT_META,
  convertFromBigha,
  convertToBigha,
  formatAreaWithSecondary,
} from '../../utils/landUnitsAndBadges';
import {
  MAX_PHOTOS_PER_LISTING,
  MAX_PHOTO_SIZE_MB,
  validatePhotoBatch,
} from '../../services/govIntegrationBoundary';
import { resolveAssamCoordinates } from '../../services/assamGeoService';

const SAMPLE_LAND_PHOTOS = [
  {
    url: '/assets/parcel-agricultural.jpg',
    caption: 'Front road access and main plot boundary view (1200×900 px · 4:3)',
  },
  {
    url: '/assets/tea-garden-bg.jpg',
    caption: 'Elevated horizon and drainage slope view (1200×900 px · 4:3)',
  },
  {
    url: '/assets/parcel-homestead.jpg',
    caption: 'Western boundary fencing and utility pole access (1200×900 px · 4:3)',
  },
];

export const CreateListingPage: React.FC = () => {
  const { currentUser, createListing, t } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [parcelId, setParcelId] = useState('AS-KMP-019');
  const [dagNumber, setDagNumber] = useState('412');
  const [pattaNumber, setPattaNumber] = useState('PP-108');
  const [pattaType, setPattaType] = useState<'Miyadi (Periodic)' | 'Eksona (Annual)'>(
    'Miyadi (Periodic)'
  );
  const [district, setDistrict] = useState('Kamrup');
  const [circle, setCircle] = useState('North Guwahati');
  const [village, setVillage] = useState('Mirza');
  const [latitude, setLatitude] = useState('26.2510');
  const [longitude, setLongitude] = useState('91.6850');
  const [landType, setLandType] = useState<LandType>('Agricultural Land');
  const [inputUnit, setInputUnit] = useState<AreaUnit>('bigha');
  const [areaValue, setAreaValue] = useState<number>(2.0);
  const [recordedAreaBigha, setRecordedAreaBigha] = useState<number>(2.0);
  const [askingPriceINR, setAskingPriceINR] = useState<number>(1500000);
  const [roadAccess, setRoadAccess] = useState('16 ft rural panchayat road');
  const [description, setDescription] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 15-Photo Upload State ("Add Photos of Your Land" - Part 9)
  const [photos, setPhotos] = useState<ListingMedia[]>(API_MODE ? [] : [{
      id: 'photo-init-1',
      url: '/assets/parcel-agricultural.jpg',
      caption: 'Primary approach road & boundary view (Cover Photo)',
      type: 'photo',
      sourceLabel: 'Seller Uploaded Land Photo (1200×900 px)',
      isCover: true,
      widthPx: 1200,
      heightPx: 900,
      fileSizeKB: 840,
      mimeType: 'image/jpeg',
    }]);

  const computedBigha = +(convertToBigha(areaValue, inputUnit)).toFixed(2);
  const computedAcre = convertFromBigha(computedBigha, 'acre');
  const pricePerBigha = computedBigha > 0 ? Math.round(askingPriceINR / computedBigha) : 0;

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const resolved = resolveAssamCoordinates(undefined, undefined, village, newDist);
    if (resolved.latitude && resolved.longitude) {
      setLatitude(resolved.latitude.toFixed(4));
      setLongitude(resolved.longitude.toFixed(4));
    }
  };

  const handleVillageChange = (newVill: string) => {
    setVillage(newVill);
    const resolved = resolveAssamCoordinates(undefined, undefined, newVill, district);
    if (resolved.latitude && resolved.longitude) {
      setLatitude(resolved.latitude.toFixed(4));
      setLongitude(resolved.longitude.toFixed(4));
    }
  };

  const addPhotoFiles = (fileList: FileList | File[]) => {
    setPhotoError(null);
    const incoming = Array.from(fileList).map((f) => ({
      name: f.name,
      type: f.type || 'image/jpeg',
      sizeBytes: f.size,
      fileObj: f,
    }));
    if (incoming.length === 0) return;

    const check = validatePhotoBatch(photos.length, incoming);
    if (!check.valid) {
      setPhotoError(check.error || t('photoLimitExceeded'));
      return;
    }

    const added: ListingMedia[] = incoming.map((item, idx) => ({
      id: `photo-${Date.now()}-${idx}`,
      url: URL.createObjectURL(item.fileObj),
      caption: `${item.name} — Seller-provided land photograph`,
      type: 'photo',
      sourceLabel: API_MODE ? 'Seller-provided — security scan pending' : 'Local demo upload',
      isCover: photos.length === 0 && idx === 0,
      widthPx: 1200,
      heightPx: 900,
      fileSizeKB: Math.max(1, Math.round(item.sizeBytes / 1024)),
      mimeType: (item.type as 'image/jpeg' | 'image/png' | 'image/webp') || 'image/jpeg',
    }));

    setPhotos((prev) => [...prev, ...added]);
    setPhotoFiles((prev) => ({ ...prev, ...Object.fromEntries(incoming.map((item, idx) => [added[idx].id, item.fileObj])) }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addPhotoFiles(e.target.files);
    e.target.value = '';
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) addPhotoFiles(e.dataTransfer.files);
  };

  const handleAddSamplePhoto = () => {
    setPhotoError(null);
    if (API_MODE) { setPhotoError('Sample photos are disabled in connected mode. Upload an actual photograph of this parcel.'); return; }
    const check = validatePhotoBatch(photos.length, [
      { name: 'parcel-view.jpg', type: 'image/jpeg', sizeBytes: 920 * 1024 },
    ]);
    if (!check.valid) {
      setPhotoError(check.error || t('photoLimitExceeded'));
      return;
    }
    const sample = SAMPLE_LAND_PHOTOS[photos.length % SAMPLE_LAND_PHOTOS.length];
    const newPhoto: ListingMedia = {
      id: `photo-${Date.now()}-${photos.length + 1}`,
      url: sample.url,
      caption: `Photo #${photos.length + 1}: ${sample.caption}`,
      type: 'photo',
      sourceLabel: 'Seller Uploaded Land Photo (1200×900 px)',
      isCover: photos.length === 0,
      widthPx: 1200,
      heightPx: 900,
      fileSizeKB: 920,
      mimeType: 'image/jpeg',
    };
    setPhotos((prev) => [...prev, newPhoto]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotoError(null);
    const removed = photos.find((p) => p.id === id);
    if (removed?.url.startsWith('blob:')) URL.revokeObjectURL(removed.url);
    setPhotoFiles((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isCover)) {
        filtered[0] = { ...filtered[0], isCover: true };
      }
      return filtered;
    });
  };

  const handleSetCoverPhoto = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === id,
      }))
    );
  };

  const handleMovePhoto = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleReplacePhoto = (index: number) => {
    if (API_MODE) { setPhotoError('Replace with an actual new photograph using Browse Photos. Remove this image and upload its replacement.'); return; }
    const nextSample = SAMPLE_LAND_PHOTOS[(index + 1) % SAMPLE_LAND_PHOTOS.length];
    setPhotos((prev) =>
      prev.map((p, idx) =>
        idx === index
          ? {
              ...p,
              url: nextSample.url,
              caption: `Replaced Photo #${index + 1}: ${nextSample.caption}`,
            }
          : p
      )
    );
  };

  const handleSubmit = async (targetStatus: 'Draft' | 'Awaiting Review') => {
    setErrorMsg(null);
    if (!title.trim() || !parcelId.trim() || !village.trim()) {
      setErrorMsg('Please complete Listing Title, Village, and Plot / Dag Number.');
      return;
    }
    if (computedBigha <= 0 || askingPriceINR <= 0) {
      setErrorMsg('Land Size and Asking Price must be positive numbers.');
      return;
    }
    if (photos.length === 0) {
      setErrorMsg('Please add at least 1 land photograph before submitting.');
      return;
    }
    if (photos.length > MAX_PHOTOS_PER_LISTING) {
      setErrorMsg(t('photoLimitExceeded'));
      return;
    }
    if (targetStatus === 'Awaiting Review' && !declarationAccepted) {
      setErrorMsg('Please accept the Seller Accuracy Declaration before submitting for verification.');
      return;
    }

    // Order photos so cover photo is first. Connected mode uploads actual bytes before creating the listing.
    let orderedMedia = [...photos].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0));
    setIsSubmitting(true);
    try {
      if (API_MODE) {
        const uploadedMedia: ListingMedia[] = [];
        for (const photo of orderedMedia) {
          if (photo.fileId) { uploadedMedia.push(photo); continue; }
          const file = photoFiles[photo.id];
          if (!file) throw new Error(`The original file for “${photo.caption}” is missing. Remove it and upload the photograph again.`);
          const form = new FormData();
          form.set('file', file);
          const result = await apiRequest<{ media: ListingMedia; message: string }>('/api/listing-media', { method: 'POST', body: form });
          const saved = { ...result.media, caption: photo.caption, isCover: Boolean(photo.isCover) };
          if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url);
          uploadedMedia.push(saved);
          setPhotos((prev) => prev.map((item) => item.id === photo.id ? saved : item));
          setPhotoFiles((prev) => { const next = { ...prev }; delete next[photo.id]; return next; });
          if (saved.scanStatus !== 'Passed') {
            setPhotoError('Your photograph is encrypted and stored privately, but it has not passed malware scanning. It cannot be displayed publicly or approved until ClamAV is configured and the image is rescanned.');
          }
        }
        orderedMedia = uploadedMedia;
      }

    const coords = resolveAssamCoordinates(latitude, longitude, village, district);
    const latNum = coords.latitude || 26.2442;
    const lngNum = coords.longitude || 91.7061;

    const created = createListing({
      parcelId: parcelId.trim().toUpperCase(),
      dagNumber: dagNumber.trim() || parcelId.trim().replace(/\D/g, '') || '412',
      pattaNumber: pattaNumber.trim(),
      pattaType,
      circle: circle.trim(),
      title: title.trim(),
      district,
      village: village.trim(),
      landType,
      areaBigha: computedBigha,
      recordedAreaBigha: Number(recordedAreaBigha),
      askingPriceINR: Number(askingPriceINR),
      benchmarkRatePerBighaINR: Math.round((askingPriceINR / computedBigha) * 0.9),
      status: targetStatus as ListingStatus,
      sellerEmail: currentUser?.email || '',
      sellerName: currentUser?.name || 'Pranabjyoti Kalita (Seller)',
      description:
        description.trim() ||
        'Direct landowner listing with verified plot details and transparent pricing.',
      roadAccess,
      floodRiskNote: 'Well-drained elevated plot.',
      sellerDeclarationAccepted: declarationAccepted,
      featured: false,
      polygonPoints: '250,180 390,170 405,290 265,300',
      mapCenter: { x: 325, y: 235, lat: latNum, lng: lngNum },
      latitude: coords.latitude,
      longitude: coords.longitude,
      locationAccuracy: coords.locationAccuracy,
      media: orderedMedia,
    });

    navigate(`/land/${created.id}`);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to upload listing photographs. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="border-b border-cream pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
          Mandatory Seller Verification Workflow · Up to 15 Land Photos
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
          List Your Land Parcel on Dharitri Sentu
        </h1>
        <p className="text-xs sm:text-sm text-secondarytext mt-1">
          Every seller listing passes through document validation, discrepancy screening, and Authorised Reviewer approval before appearing as an approved public listing.
        </p>
      </div>

      {/* 11-State Mandatory Review Lifecycle Bar (Part 9) */}
      <div className="bg-white rounded-3xl p-4 border border-[#DFD6C3] shadow-sm space-y-2">
        <div className="text-xs font-bold text-evergreen">
          Mandatory Publication Lifecycle (11-Stage Gate)
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {[
            '1. Draft',
            '2. Documents Needed',
            '3. Upload Received',
            '4. Security Check',
            '5. Awaiting Review',
            '6. Additional Info Required',
            '7. Under Review',
            '8. Discrepancy Check',
            '9. Approved for Listing',
            '10. Rejected with Reason',
            '11. Withdrawn',
          ].map((st, idx) => (
            <span
              key={st}
              className={`px-2.5 py-1 rounded-full font-semibold border ${
                idx === 0 || idx === 4
                  ? 'bg-evergreen text-warmivory border-evergreen'
                  : 'bg-warmivory text-secondarytext border-cream'
              }`}
            >
              {st}
            </span>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-semibold"
        >
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DFD6C3] shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('1. Property Listing Title *')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fertile Sali Paddy & Orchard Tract near Mirza Highway"
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('2. Plot / Parcel ID & Dag Number *')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={parcelId}
                onChange={(e) => setParcelId(e.target.value)}
                placeholder="AS-KMP-019"
                className="w-1/2 px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
                title="Parcel Reference ID"
              />
              <input
                type="text"
                value={dagNumber}
                onChange={(e) => setDagNumber(e.target.value)}
                placeholder="Dag 412"
                className="w-1/2 px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
                title="Survey Dag Number (appears on Map)"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Enter your cadastral Dag number so your plot appears prominently on the Interactive Parcel Map.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('Patta Number & Tenure Type *')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pattaNumber}
                onChange={(e) => setPattaNumber(e.target.value)}
                placeholder="PP-108"
                className="w-1/2 px-3 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
              />
              <select
                value={pattaType}
                onChange={(e) =>
                  setPattaType(e.target.value as 'Miyadi (Periodic)' | 'Eksona (Annual)')
                }
                className="w-1/2 px-2.5 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs font-bold text-evergreen"
              >
                <option value="Miyadi (Periodic)">{t('Miyadi (Periodic)')}</option>
                <option value="Eksona (Annual)">{t('Eksona (Annual)')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('Assam District *')}
            </label>
            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-sm"
            >
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

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('Revenue Circle & Village / Locality *')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={circle}
                onChange={(e) => setCircle(e.target.value)}
                placeholder="Circle"
                className="w-1/2 px-3 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
              />
              <input
                type="text"
                value={village}
                onChange={(e) => handleVillageChange(e.target.value)}
                placeholder="Village"
                className="w-1/2 px-3 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5 flex items-center justify-between">
              <span>{t('GPS Map Coordinates (Latitude & Longitude) *')}</span>
              <span className="text-[11px] text-teagreen font-bold">Auto-pinned to Live Map</span>
            </label>
            <div className="flex gap-2">
              <div className="w-1/2">
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="26.2510"
                  className="w-full px-3 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
                />
                <span className="text-[10px] text-secondarytext mt-0.5 block">Latitude (e.g. 26.2510)</span>
              </div>
              <div className="w-1/2">
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="91.6850"
                  className="w-full px-3 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
                />
                <span className="text-[10px] text-secondarytext mt-0.5 block">Longitude (e.g. 91.6850)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('3. Land Classification / Type *')}
            </label>
            <select
              value={landType}
              onChange={(e) => setLandType(e.target.value as LandType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-sm"
            >
              <option value="Agricultural Land">{t('Agricultural Land')}</option>
              <option value="Tea Garden Land">{t('Tea Garden Land')}</option>
              <option value="Rural Homestead">{t('Rural Homestead')}</option>
              <option value="Residential Plot">{t('Residential Plot')}</option>
              <option value="Commercial Land">{t('Commercial Land')}</option>
            </select>
          </div>

          {/* Land Area Input with Unit Converter */}
          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('4. Declared Land Size (Choose Unit) *')}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.05"
                value={areaValue}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAreaValue(v);
                  setRecordedAreaBigha(+(convertToBigha(v, inputUnit)).toFixed(2));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-bold text-evergreen"
              />
              <select
                aria-label="Input Area Unit"
                value={inputUnit}
                onChange={(e) => setInputUnit(e.target.value as AreaUnit)}
                className="px-3 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs font-bold text-evergreen"
              >
                {(Object.keys(AREA_UNIT_META) as AreaUnit[]).map((u) => (
                  <option key={u} value={u}>
                    {AREA_UNIT_META[u].shortLabel}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-teagreen font-semibold mt-1">
              Equivalent: {computedBigha} Bigha · {computedAcre} Acre · {(computedBigha * 14400).toLocaleString('en-IN')} Sq. Ft.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('Patta / Survey Recorded Area (Bigha) (For Discrepancy Check)')}
            </label>
            <input
              type="number"
              step="0.05"
              value={recordedAreaBigha}
              onChange={(e) => setRecordedAreaBigha(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
            />
            <div className="text-[11px] text-secondarytext mt-1">
              {Math.abs(computedBigha - recordedAreaBigha) > 0.01
                ? '🔴 Area difference will route listing to Discrepancy Requires Attention'
                : '🟢 Matches declared area (Green Verified check)'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('5. Total Asking Price (INR ₹) *')}
            </label>
            <input
              type="number"
              step="50000"
              value={askingPriceINR}
              onChange={(e) => setAskingPriceINR(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-bold text-evergreen"
            />
            <div className="text-[11px] text-teagreen font-semibold mt-1">
              Calculated Rate: ₹{pricePerBigha.toLocaleString('en-IN')} / Bigha
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('6. Road Access & Landmark Note')}
            </label>
            <input
              type="text"
              value={roadAccess}
              onChange={(e) => setRoadAccess(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              {t('Property Description & Available Documents')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe soil quality, water access, boundary fencing, and available Patta/deed records..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
            />
          </div>
        </div>

        {/* ====================================================================
            PART 9 SECTION 21: "ADD PHOTOS OF YOUR LAND" (UP TO 15 PHOTOS)
           ==================================================================== */}
        <div className="p-5 rounded-3xl bg-warmivory border border-[#CFC5B0] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl font-bold text-evergreen">
                📷 {t('addPhotosTitle')}
              </h2>
              <p className="text-xs text-secondarytext mt-0.5">
                {t('addPhotosSubtitle')}
              </p>
            </div>
            <span
              data-testid="photo-count-indicator"
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                photos.length >= MAX_PHOTOS_PER_LISTING
                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                  : 'bg-white text-evergreen border-[#CFC5B0]'
              }`}
            >
              {photos.length} of {MAX_PHOTOS_PER_LISTING} photos added
            </span>
          </div>

          {/* Upfront Photo Specification Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white border border-cream">
              <div className="text-secondarytext">Max Photos</div>
              <div className="font-bold text-evergreen">15 per listing</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-cream">
              <div className="text-secondarytext">Recommended Size</div>
              <div className="font-bold text-evergreen">1200 × 900 px (4:3)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-cream">
              <div className="text-secondarytext">Minimum Recommended</div>
              <div className="font-bold text-evergreen">800 × 600 px</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-cream">
              <div className="text-secondarytext">Max File Size</div>
              <div className="font-bold text-evergreen">{MAX_PHOTO_SIZE_MB} MB / photo</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-cream">
              <div className="text-secondarytext">Allowed Formats</div>
              <div className="font-bold text-evergreen">JPEG, JPG, PNG, WebP</div>
            </div>
          </div>

          {photoError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-semibold"
            >
              ⚠️ {photoError}
            </div>
          )}

          {/* Drag-and-Drop / Browse Upload Zone + Quick Test Add Button */}
          <div onDragOver={(e) => e.preventDefault()} onDrop={handlePhotoDrop} className="border-2 border-dashed border-evergreen/35 rounded-2xl bg-white/80 p-5 text-center space-y-3">
            <div className="text-xs font-semibold text-maintext">
              Drag and drop actual land photographs here, or browse from your device
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory text-xs font-bold transition shadow-sm">
                <span>📂 Browse Photos (JPEG / PNG / WebP)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
              {!API_MODE && <button
                type="button"
                onClick={handleAddSamplePhoto}
                className="px-4 py-2 rounded-xl bg-palesky hover:bg-mistyblue text-evergreen border border-mistyblue text-xs font-bold transition"
              >
                + Add Sample Demo Photo
              </button>}
            </div>
          </div>

          {/* Photo Thumbnail Grid with Reorder, Cover Selection, Replace, and Remove */}
          {photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className={`rounded-2xl overflow-hidden bg-white border transition ${
                    photo.isCover
                      ? 'border-evergreen ring-2 ring-evergreen/20'
                      : 'border-cream'
                  }`}
                >
                  <div className="relative h-32 bg-cream">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                    {photo.isCover && (
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-evergreen text-warmivory text-[10px] font-bold shadow">
                        ★ Cover Photo
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/65 text-white text-[10px] font-mono">
                      #{idx + 1} · {photo.scanStatus === 'Passed' ? 'Scanned' : photo.scanStatus === 'Pending' ? 'Quarantined' : photo.scanStatus === 'Scan Error' ? 'Scan Error' : photo.fileId ? 'Uploaded' : 'Preview'}
                    </span>
                  </div>
                  <div className="p-3 space-y-2 text-[11px]">
                    <div className="font-semibold text-maintext truncate">{photo.caption}</div>
                    <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-cream">
                      <button
                        type="button"
                        onClick={() => handleSetCoverPhoto(photo.id)}
                        className={`px-2 py-1 rounded font-bold ${
                          photo.isCover
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-warmivory text-evergreen hover:bg-cream'
                        }`}
                      >
                        {photo.isCover ? 'Cover ✓' : 'Set Cover'}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(idx, -1)}
                          disabled={idx === 0}
                          aria-label={`Move photo ${idx + 1} left`}
                          className="px-1.5 py-1 rounded bg-warmivory text-maintext disabled:opacity-40"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(idx, 1)}
                          disabled={idx === photos.length - 1}
                          aria-label={`Move photo ${idx + 1} right`}
                          className="px-1.5 py-1 rounded bg-warmivory text-maintext disabled:opacity-40"
                        >
                          →
                        </button>
                        {!API_MODE && <button
                          type="button"
                          onClick={() => handleReplacePhoto(idx)}
                          className="px-2 py-1 rounded bg-palesky text-evergreen font-semibold"
                        >
                          Replace
                        </button>}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="px-2 py-1 rounded bg-red-50 text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seller Declaration */}
        <div className="p-4 rounded-2xl bg-warmivory border border-[#CFC5B0]">
          <label className="flex items-start gap-2.5 text-xs text-maintext cursor-pointer">
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              className="mt-0.5 accent-evergreen"
            />
            <span>
              <strong>7. Seller Accuracy Declaration:</strong> I confirm that the declared plot details, Bigha/Acre measurements, uploaded photographs, and asking price are accurate to the best of my knowledge, and I consent to automated cross-checking and Authorised Reviewer verification before marketplace publication.
            </span>
          </label>
        </div>

        {/* Preview & Submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-cream">
          <span className="text-xs text-secondarytext">
            Preview: <strong className="text-evergreen">{formatAreaWithSecondary(computedBigha, 'bigha')}</strong> ·{' '}
            <strong className="text-evergreen">₹{askingPriceINR.toLocaleString('en-IN')}</strong> ·{' '}
            <strong>{photos.length}/15 Photos</strong>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSubmit('Draft')}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-evergreen text-evergreen text-xs font-bold hover:bg-cream transition"
            >
              {isSubmitting ? t('Uploading…') : t('Save as Draft')}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit('Awaiting Review')}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen shadow-sm transition"
            >
              {isSubmitting ? t('Uploading…') : t('Submit for Verification Review →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
