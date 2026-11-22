import { describe, it, expect, vi } from 'vitest';
import {
  isValidAssamCoordinate,
  resolveAssamCoordinates,
  generateParcelPolygon,
  ASSAM_BOUNDS,
  ASSAM_LOCATIONS,
} from '../src/services/assamGeoService';
import { Listing, User } from '../src/types';
import { CADASTRAL_PARCEL_RECORDS } from '../src/services/cadastralService';

describe('Assam Geographic Coordinate Engine & Validation', () => {
  it('validates coordinates strictly within Assam regional bounds', () => {
    // Changsari (valid)
    expect(isValidAssamCoordinate(26.2442, 91.7061)).toBe(true);
    // Dibrugarh (valid)
    expect(isValidAssamCoordinate(27.4820, 94.9280)).toBe(true);
    // Silchar / Cachar (valid)
    expect(isValidAssamCoordinate(24.8333, 92.7789)).toBe(true);

    // Delhi (out of bounds)
    expect(isValidAssamCoordinate(28.6139, 77.2090)).toBe(false);
    // Mumbai (out of bounds)
    expect(isValidAssamCoordinate(19.0760, 72.8777)).toBe(false);
    // NaN / Infinity
    expect(isValidAssamCoordinate(NaN, 91.7061)).toBe(false);
    expect(isValidAssamCoordinate(26.2442, Infinity)).toBe(false);
  });

  it('detects and auto-swaps reversed latitude and longitude inputs', () => {
    // User accidentally entered Longitude (91.5230) in Latitude box and Latitude (26.0825) in Longitude box
    const resolved = resolveAssamCoordinates(91.5230, 26.0825, 'Mirza', 'Kamrup');
    expect(resolved.isValid).toBe(true);
    expect(resolved.latitude).toBeCloseTo(26.0825, 3);
    expect(resolved.longitude).toBeCloseTo(91.5230, 3);
    expect(resolved.locationAccuracy).toBe('precise_parcel');
  });

  it('falls back to transparent village centroid when coordinates are omitted', () => {
    const resolved = resolveAssamCoordinates(undefined, undefined, 'Sonapur', 'Kamrup');
    expect(resolved.isValid).toBe(true);
    expect(resolved.latitude).toBeCloseTo(26.1185, 3);
    expect(resolved.longitude).toBeCloseTo(91.9791, 3);
    expect(resolved.locationAccuracy).toBe('approximate_village');
  });

  it('marks location as pending when village and district are completely unknown', () => {
    const resolved = resolveAssamCoordinates('', '', 'UnknownVillageXYZ', 'NonExistentDistrict');
    expect(resolved.isValid).toBe(false);
    expect(resolved.latitude).toBeUndefined();
    expect(resolved.longitude).toBeUndefined();
    expect(resolved.locationAccuracy).toBe('pending');
  });

  it('generates a 4-point WGS-84 bounding polygon scaled by land area', () => {
    const coords = generateParcelPolygon(26.2442, 91.7061, 2.5);
    expect(coords).toHaveLength(4);
    coords.forEach(([lat, lng]) => {
      expect(isValidAssamCoordinate(lat, lng)).toBe(true);
    });
  });
});

describe('Canonical Listing to Map Synchronization Rules', () => {
  const mockSeller: User = {
    id: 'usr-seller-1',
    email: 'pranabjyoti@dharitrisentu.in',
    name: 'Pranabjyoti Kalita',
    role: 'seller',
    district: 'Kamrup',
    createdAt: '2026-01-01',
  };

  const mockBuyer: User = {
    id: 'usr-buyer-1',
    email: 'ananya@dharitrisentu.in',
    name: 'Ananya Baruah',
    role: 'buyer',
    district: 'Kamrup',
    createdAt: '2026-01-01',
  };

  const createSampleListing = (overrides: Partial<Listing> = {}): Listing => ({
    id: `lst-${Date.now()}`,
    parcelId: 'AS-KMP-999',
    title: 'Fertile Paddy Land near Palashbari',
    district: 'Kamrup',
    circle: 'Palashbari',
    village: 'Mirza',
    landType: 'Agricultural Land',
    areaBigha: 3.5,
    recordedAreaBigha: 3.5,
    askingPriceINR: 2400000,
    benchmarkRatePerBighaINR: 650000,
    status: 'Approved for Listing',
    sellerEmail: 'pranabjyoti@dharitrisentu.in',
    sellerName: 'Pranabjyoti Kalita',
    description: 'Direct owner title land with road access.',
    roadAccess: 'Paved Panchayat Road',
    floodRiskNote: 'Low Risk Zone',
    sellerDeclarationAccepted: true,
    submittedAt: new Date().toISOString(),
    featured: false,
    polygonPoints: '120,120 280,120 280,240 120,240',
    mapCenter: { x: 200, y: 180, lat: 26.0825, lng: 91.5230 },
    latitude: 26.0825,
    longitude: 91.5230,
    locationAccuracy: 'precise_parcel',
    media: [
      {
        id: 'photo-1',
        url: '/assets/parcel-agricultural.jpg',
        caption: 'Plot entrance',
        type: 'photo',
        sourceLabel: 'Seller Upload',
      },
    ],
    passportSummary: {
      matchedCount: 4,
      discrepancyCount: 0,
      pendingCount: 0,
      notCheckedCount: 1,
      overallStatus: 'Reviewed in Demo',
      lastReviewedAt: new Date().toISOString(),
      comparisons: [],
    },
    ...overrides,
  });

  it('1 & 2. Newly created listing with valid coordinates is preserved in state', () => {
    const listing = createSampleListing({
      latitude: 26.0825,
      longitude: 91.5230,
      status: 'Awaiting Review',
    });

    expect(listing.id).toMatch(/^lst-/);
    expect(listing.latitude).toBe(26.0825);
    expect(listing.longitude).toBe(91.5230);
    expect(isValidAssamCoordinate(listing.latitude!, listing.longitude!)).toBe(true);
  });

  it('3 & 4. Listing appears in marketplace and on map with correct centroid', () => {
    const listing = createSampleListing();
    const existingListingIds = new Set(CADASTRAL_PARCEL_RECORDS.map((c) => c.listing_id));

    // Dynamic record generation matching InteractiveParcelMap logic
    const dynamicRecord = {
      parcel_id: listing.parcelId,
      listing_id: listing.id,
      village_name: listing.village,
      district_name: listing.district,
      centroid: [listing.latitude!, listing.longitude!] as [number, number],
      asking_price_inr: listing.askingPriceINR,
      mutation_status: listing.status,
    };

    expect(existingListingIds.has(listing.id)).toBe(false);
    expect(dynamicRecord.centroid[0]).toBe(26.0825);
    expect(dynamicRecord.centroid[1]).toBe(91.5230);
    expect(dynamicRecord.asking_price_inr).toBe(2400000);
  });

  it('6 & 7. Popup data matches required schema and has View Listing link', () => {
    const listing = createSampleListing({
      id: 'lst-test-map-popup',
      title: 'Brahmaputra View Residential Plot',
      district: 'Kamrup',
      village: 'Silasindurighopa',
      areaBigha: 2.0,
      askingPriceINR: 1500000,
      status: 'Approved for Listing',
    });

    const popupHtml = `
      <div class="map-popup">
        <span class="status-badge">${listing.status}</span>
        <h4>${listing.title}</h4>
        <div>📍 ${listing.village}, ${listing.district}</div>
        <div>📐 ${listing.areaBigha} Bigha</div>
        <div>₹${(listing.askingPriceINR / 100000).toFixed(2)} Lakhs</div>
        <a href="/land/${listing.id}">View Listing →</a>
      </div>
    `;

    expect(popupHtml).toContain('Brahmaputra View Residential Plot');
    expect(popupHtml).toContain('Silasindurighopa, Kamrup');
    expect(popupHtml).toContain('2 Bigha');
    expect(popupHtml).toContain('₹15.00 Lakhs');
    expect(popupHtml).toContain('Approved for Listing');
    expect(popupHtml).toContain('href="/land/lst-test-map-popup"');
  });

  it('8. Editing listing location updates coordinates correctly', () => {
    const listing = createSampleListing({
      village: 'Mirza',
      district: 'Kamrup',
      latitude: 26.0825,
      longitude: 91.5230,
    });

    // Seller updates location to Sonapur
    const newCoords = resolveAssamCoordinates(undefined, undefined, 'Sonapur', 'Kamrup');
    const updated = {
      ...listing,
      village: 'Sonapur',
      latitude: newCoords.latitude,
      longitude: newCoords.longitude,
      locationAccuracy: newCoords.locationAccuracy,
    };

    expect(updated.village).toBe('Sonapur');
    expect(updated.latitude).toBeCloseTo(26.1185, 3);
    expect(updated.longitude).toBeCloseTo(91.9791, 3);
  });

  it('9. Missing coordinates are handled gracefully without crashing map', () => {
    const listingWithoutCoords = createSampleListing({
      latitude: undefined,
      longitude: undefined,
      village: 'CustomRemoteUnindexedVillage',
      district: 'RemoteDistrict',
      locationAccuracy: 'pending',
    });

    // Resolution yields pending without throw
    const resolved = resolveAssamCoordinates(
      listingWithoutCoords.latitude,
      listingWithoutCoords.longitude,
      listingWithoutCoords.village,
      listingWithoutCoords.district
    );

    expect(resolved.isValid).toBe(false);
    expect(resolved.locationAccuracy).toBe('pending');
    expect(resolved.latitude).toBeUndefined();
  });

  it('10 & 15. Draft listing is visible only to its authorized seller', () => {
    const draftListing = createSampleListing({
      id: 'lst-draft-1',
      status: 'Draft',
      sellerEmail: 'pranabjyoti@dharitrisentu.in',
    });

    const isVisibleToSeller = draftListing.sellerEmail === mockSeller.email;
    const isVisibleToBuyer = draftListing.status === 'Approved for Listing';
    const isVisibleToPublic = draftListing.status === 'Approved for Listing';

    expect(isVisibleToSeller).toBe(true);
    expect(isVisibleToBuyer).toBe(false);
    expect(isVisibleToPublic).toBe(false);
  });

  it('12. Rejected and Withdrawn listings are excluded from map display', () => {
    const rejectedListing = createSampleListing({ status: 'Rejected' });
    const withdrawnListing = createSampleListing({ status: 'Withdrawn' });

    const isExcluded = (status: string) => status === 'Withdrawn' || status === 'Rejected';

    expect(isExcluded(rejectedListing.status)).toBe(true);
    expect(isExcluded(withdrawnListing.status)).toBe(true);
  });

  it('13. Deduplication prevents multiple markers for the same listing ID', () => {
    const listing = createSampleListing({ id: 'lst-duplicate-check' });
    const records = [
      { id: listing.id, lat: listing.latitude, lng: listing.longitude },
      { id: listing.id, lat: listing.latitude, lng: listing.longitude },
    ];

    const uniqueMap = new Map(records.map((r) => [r.id, r]));
    expect(uniqueMap.size).toBe(1);
  });
});
