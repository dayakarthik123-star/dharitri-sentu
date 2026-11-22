/**
 * Assam Geographic & Coordinate Resolution Service
 *
 * Provides regional boundary validation (WGS-84), canonical village/district
 * centroid gazetteer, and safe polygon generation for Dharitri Sentu map markers.
 */

export interface AssamLocationCentroid {
  district: string;
  circle: string;
  village: string;
  lat: number;
  lng: number;
}

export const ASSAM_BOUNDS = {
  minLat: 24.0,
  maxLat: 28.5,
  minLng: 89.5,
  maxLng: 96.5,
} as const;

/**
 * Authentic geographic centroids for Assam districts, revenue circles, and villages.
 * Used for accurate location autofill, map centering, and transparent approximate fallbacks.
 */
export const ASSAM_LOCATIONS: AssamLocationCentroid[] = [
  // Kamrup / Kamrup Metropolitan
  { district: 'Kamrup', circle: 'North Guwahati', village: 'Changsari', lat: 26.2442, lng: 91.7061 },
  { district: 'Kamrup', circle: 'North Guwahati', village: 'Silasindurighopa', lat: 26.2468, lng: 91.7085 },
  { district: 'Kamrup', circle: 'Palashbari', village: 'Mirza', lat: 26.0825, lng: 91.5230 },
  { district: 'Kamrup', circle: 'Sonapur', village: 'Sonapur', lat: 26.1185, lng: 91.9791 },
  { district: 'Kamrup', circle: 'Hajo', village: 'Hajo', lat: 26.2483, lng: 91.5278 },
  { district: 'Kamrup', circle: 'Rangia', village: 'Rangia', lat: 26.4678, lng: 91.6212 },
  { district: 'Kamrup', circle: 'Boko', village: 'Boko', lat: 25.9754, lng: 91.2291 },
  { district: 'Kamrup Metropolitan', circle: 'Dispur', village: 'Dispur', lat: 26.1433, lng: 91.7898 },
  { district: 'Kamrup Metropolitan', circle: 'Guwahati', village: 'Guwahati', lat: 26.1445, lng: 91.7362 },
  { district: 'Kamrup Metropolitan', circle: 'Beltola', village: 'Beltola', lat: 26.1265, lng: 91.7915 },
  { district: 'Kamrup Metropolitan', circle: 'Jalukbari', village: 'Jalukbari', lat: 26.1528, lng: 91.6664 },

  // Dibrugarh
  { district: 'Dibrugarh', circle: 'Dibrugarh East', village: 'Mancotta', lat: 27.4820, lng: 94.9280 },
  { district: 'Dibrugarh', circle: 'Dibrugarh West', village: 'Chabua', lat: 27.4831, lng: 95.1764 },
  { district: 'Dibrugarh', circle: 'Naharkatia', village: 'Naharkatia', lat: 27.2842, lng: 95.2536 },

  // Baksa (BTR)
  { district: 'Baksa', circle: 'Baksa / Barama', village: 'Ghopa', lat: 26.5820, lng: 91.4250 },
  { district: 'Baksa', circle: 'Tamulpur', village: 'Tamulpur', lat: 26.6341, lng: 91.5732 },
  { district: 'Baksa', circle: 'Mushalpur', village: 'Mushalpur', lat: 26.5833, lng: 91.3500 },

  // Jorhat
  { district: 'Jorhat', circle: 'Jorhat East', village: 'Cinnamara', lat: 26.7450, lng: 94.2230 },
  { district: 'Jorhat', circle: 'Titabor', village: 'Titabor', lat: 26.5833, lng: 94.2000 },
  { district: 'Jorhat', circle: 'Mariani', village: 'Mariani', lat: 26.6667, lng: 94.3333 },

  // Nagaon
  { district: 'Nagaon', circle: 'Samaguri', village: 'Bheleuguri', lat: 26.3450, lng: 92.6850 },
  { district: 'Nagaon', circle: 'Kaliabor', village: 'Kaliabor', lat: 26.5667, lng: 93.0000 },
  { district: 'Nagaon', circle: 'Raha', village: 'Raha', lat: 26.2333, lng: 92.5167 },

  // Sonitpur
  { district: 'Sonitpur', circle: 'Tezpur', village: 'Tezpur', lat: 26.6338, lng: 92.7926 },
  { district: 'Sonitpur', circle: 'Dhekiajuli', village: 'Dhekiajuli', lat: 26.7000, lng: 92.5000 },

  // Nalbari
  { district: 'Nalbari', circle: 'Nalbari', village: 'Nalbari', lat: 26.4447, lng: 91.4426 },
  { district: 'Nalbari', circle: 'Tihu', village: 'Tihu', lat: 26.4833, lng: 91.3167 },

  // Sivasagar
  { district: 'Sivasagar', circle: 'Sivasagar', village: 'Sivasagar', lat: 26.9826, lng: 94.6425 },
  { district: 'Sivasagar', circle: 'Nazira', village: 'Nazira', lat: 26.9167, lng: 94.7333 },

  // Tinsukia
  { district: 'Tinsukia', circle: 'Tinsukia', village: 'Tinsukia', lat: 27.4922, lng: 95.3537 },
  { district: 'Tinsukia', circle: 'Digboi', village: 'Digboi', lat: 27.3833, lng: 95.6333 },

  // Cachar
  { district: 'Cachar', circle: 'Silchar', village: 'Silchar', lat: 24.8333, lng: 92.7789 },
  { district: 'Cachar', circle: 'Sonai', village: 'Sonai', lat: 24.7167, lng: 92.8833 },

  // Golaghat
  { district: 'Golaghat', circle: 'Golaghat', village: 'Golaghat', lat: 26.5167, lng: 93.9667 },
  { district: 'Golaghat', circle: 'Bokakhat', village: 'Bokakhat', lat: 26.6000, lng: 93.6000 },
];

/**
 * Checks if given lat and lng fall within Assam's geographic bounds.
 */
export function isValidAssamCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    lat >= ASSAM_BOUNDS.minLat &&
    lat <= ASSAM_BOUNDS.maxLat &&
    lng >= ASSAM_BOUNDS.minLng &&
    lng <= ASSAM_BOUNDS.maxLng
  );
}

/**
 * Normalizes input coordinates.
 * Automatically catches and corrects swapped lat/long inputs (e.g. lat=91.7, lng=26.2).
 * If coordinates are invalid or missing, resolves to the nearest known Assam village/district centroid.
 */
export function resolveAssamCoordinates(
  rawLat: unknown,
  rawLng: unknown,
  fallbackVillage?: string,
  fallbackDistrict?: string
): {
  latitude: number | undefined;
  longitude: number | undefined;
  locationAccuracy: 'precise_parcel' | 'approximate_village' | 'pending';
  isValid: boolean;
} {
  let lat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat || ''));
  let lng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng || ''));

  // Catch swapped latitude and longitude (lat is around 90-96, lng is around 24-28)
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= ASSAM_BOUNDS.minLng &&
    lat <= ASSAM_BOUNDS.maxLng &&
    lng >= ASSAM_BOUNDS.minLat &&
    lng <= ASSAM_BOUNDS.maxLat
  ) {
    const swap = lat;
    lat = lng;
    lng = swap;
  }

  // If valid coordinates were provided by the user
  if (isValidAssamCoordinate(lat, lng)) {
    return {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      locationAccuracy: 'precise_parcel',
      isValid: true,
    };
  }

  // Fallback to approximate village centroid
  if (fallbackVillage || fallbackDistrict) {
    const vNorm = (fallbackVillage || '').trim().toLowerCase();
    const dNorm = (fallbackDistrict || '').trim().toLowerCase();

    // 1. Exact match on village
    let match = ASSAM_LOCATIONS.find((loc) =>
      loc.village.toLowerCase() === vNorm && (!dNorm || loc.district.toLowerCase() === dNorm)
    );

    // 2. Substring match on village
    if (!match && vNorm) {
      match = ASSAM_LOCATIONS.find((loc) =>
        loc.village.toLowerCase().includes(vNorm) || vNorm.includes(loc.village.toLowerCase())
      );
    }

    // 3. Fallback to district centroid
    if (!match && dNorm) {
      match = ASSAM_LOCATIONS.find((loc) => loc.district.toLowerCase() === dNorm);
    }

    if (match) {
      return {
        latitude: match.lat,
        longitude: match.lng,
        locationAccuracy: 'approximate_village',
        isValid: true,
      };
    }
  }

  // Location cannot be resolved
  return {
    latitude: undefined,
    longitude: undefined,
    locationAccuracy: 'pending',
    isValid: false,
  };
}

/**
 * Generates a 4-point WGS-84 polygon boundary around a centroid.
 * Area is scaled according to Bigha measurement.
 * 1 Bigha ~ 1,337.8 sq meters ~ 0.00033 degrees radius.
 */
export function generateParcelPolygon(
  lat: number,
  lng: number,
  areaBigha: number = 2.0
): [number, number][] {
  // Approximate delta in degrees based on area
  const scale = Math.sqrt(Math.max(0.2, areaBigha)) * 0.00055;
  const latOffset = scale * 0.9;
  const lngOffset = scale * 1.1;

  return [
    [Number((lat + latOffset).toFixed(6)), Number((lng - lngOffset).toFixed(6))],
    [Number((lat + latOffset * 1.05).toFixed(6)), Number((lng + lngOffset).toFixed(6))],
    [Number((lat - latOffset).toFixed(6)), Number((lng + lngOffset * 0.95).toFixed(6))],
    [Number((lat - latOffset * 0.95).toFixed(6)), Number((lng - lngOffset * 1.05).toFixed(6))],
  ];
}
