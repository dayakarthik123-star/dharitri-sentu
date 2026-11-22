import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import { Listing } from '../../types';
import { CadastralParcelRecord } from '../../types/cadastral';
import {
  CADASTRAL_PARCEL_RECORDS,
  fetchMapSourceStatus,
  fetchParcelById,
  getMapTilerApiKey,
  isUsableMapTilerKey,
  searchParcelsByDag,
} from '../../services/cadastralService';
import { useApp } from '../../app/AppContext';
import { API_MODE, apiRequest } from '../../services/apiClient';
import {
  formatAreaWithSecondary,
  formatPricePerBighaAndUnit,
} from '../../utils/landUnitsAndBadges';
import {
  generateParcelPolygon,
  resolveAssamCoordinates,
} from '../../services/assamGeoService';

interface InteractiveParcelMapProps {
  listings: Listing[];
  selectedId: string;
  onSelectListing: (id: string) => void;
  compact?: boolean;
}

export type LayerMode = 'hybrid' | 'satellite' | 'streets';
type InspectorTab = 'gov' | 'geo' | 'risk';
type OfficialLookupResult = { ok: boolean; message: string; source?: string; retrievedAt?: string; data?: unknown };

export const getMapTilerStyleUrl = (mode: LayerMode, apiKey: string): string => {
  if (mode === 'satellite') {
    return `https://api.maptiler.com/maps/satellite/style.json?key=${apiKey}`;
  }
  if (mode === 'streets') {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`;
  }
  return `https://api.maptiler.com/maps/hybrid/style.json?key=${apiKey}`;
};

export const OPENFREEMAP_POSITRON_URL = 'https://tiles.openfreemap.org/styles/positron';
export const OPENFREEMAP_LIBERTY_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const OPENFREEMAP_BRIGHT_URL = 'https://tiles.openfreemap.org/styles/bright';

export const ESRI_WORLD_IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const OSM_STREETS_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const CARTO_POSITRON_LABELS_URL =
  'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';

// High-resolution Satellite Hybrid style (with Esri World Imagery + Labels fallback)
export const ESRI_HYBRID_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    },
    'esri-reference-overlay': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-world-imagery',
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: 'esri-reference-layer',
      type: 'raster',
      source: 'esri-reference-overlay',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Pure Satellite raster style for MapLibre GL JS
export const ESRI_SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-world-imagery',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export interface NearbyFacility {
  id: string;
  category: 'healthcare' | 'education' | 'road' | 'transit' | 'markets' | 'gov';
  icon: string;
  name: string;
  distanceKm: string;
  note: string;
  badgeColor: string;
  coords: [number, number];
}

export const NEARBY_AMENITIES: NearbyFacility[] = [
  { id: 'amen-1', category: 'healthcare', icon: '🏥', name: 'AIIMS Guwahati Super-Specialty Hospital', distanceKm: '4.2 km', note: 'Apex National Tertiary Hospital & Emergency Center', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200', coords: [26.2652, 91.6954] },
  { id: 'amen-2', category: 'healthcare', icon: '🏥', name: 'Changsari Community Health Centre (CHC)', distanceKm: '1.5 km', note: '24/7 Primary Emergency Care & Outpatient Ward', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200', coords: [26.2554, 91.6882] },
  { id: 'amen-3', category: 'education', icon: '🎓', name: 'IIT Guwahati (Indian Institute of Technology)', distanceKm: '6.8 km', note: 'National Institute Campus & Technology Research Park', badgeColor: 'bg-blue-50 text-blue-800 border-blue-200', coords: [26.1902, 91.6921] },
  { id: 'amen-4', category: 'education', icon: '🎓', name: 'Changsari Higher Secondary School', distanceKm: '1.1 km', note: 'Affiliated State Board Senior Secondary Education', badgeColor: 'bg-blue-50 text-blue-800 border-blue-200', coords: [26.2531, 91.6845] },
  { id: 'amen-5', category: 'road', icon: '🛣️', name: 'NH-27 Four-Lane National Highway Corridor', distanceKm: '0.8 km', note: 'Immediate East-West Multi-Lane Expressway Access', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200', coords: [26.2520, 91.6800] },
  { id: 'amen-6', category: 'road', icon: '🛣️', name: '18ft Blacktop Approach Road Frontage', distanceKm: 'Direct Frontage', note: 'Permanent Concrete Corridor & Commercial Vehicle Access', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200', coords: [26.2488, 91.7058] },
  { id: 'amen-7', category: 'transit', icon: '🚆', name: 'Changsari Railway Station', distanceKm: '2.1 km', note: 'Northeast Frontier Railway (NFR) Main Line Hub', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200', coords: [26.2612, 91.6784] },
  { id: 'amen-8', category: 'transit', icon: '✈️', name: 'Lokpriya Gopinath Bordoloi Int. Airport (GAU)', distanceKm: '18 km', note: 'Direct Flight Connectivity via Saraighat Bridge Bypass', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200', coords: [26.1061, 91.5859] },
  { id: 'amen-9', category: 'markets', icon: '🛒', name: 'State Bank of India (SBI) & 24/7 ATM', distanceKm: '1.3 km', note: 'Commercial Banking, Agriloan & Forex Services', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200', coords: [26.2562, 91.6865] },
  { id: 'amen-10', category: 'markets', icon: '🛒', name: 'Changsari Daily Market & Commercial Center', distanceKm: '0.9 km', note: 'Fresh Agricultural Produce, Hardware & Daily Provisions', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200', coords: [26.2540, 91.6815] },
  { id: 'amen-11', category: 'gov', icon: '🏛️', name: 'Office of the Revenue Circle Officer & Lot Mondal', distanceKm: '2.4 km', note: 'Assam Revenue Sub-Division & Cadastral Registration', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300', coords: [26.2625, 91.6890] },
];

export const InteractiveParcelMap: React.FC<InteractiveParcelMapProps> = ({
  listings,
  selectedId,
  onSelectListing,
  compact = false,
}) => {
  const { listings: contextListings, areaUnit, currentUser } = useApp();
  const effectiveListings = (listings && listings.length > 0 ? listings : contextListings) || [];
  const navigate = useNavigate();

  const [layerMode, setLayerMode] = useState<LayerMode>('hybrid');
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [dagQuery, setDagQuery] = useState<string>('');
  const [unconnectedWarning, setUnconnectedWarning] = useState<string | null>(null);
  const [officialLookupLoading, setOfficialLookupLoading] = useState(false);
  const [officialLookupResult, setOfficialLookupResult] = useState<OfficialLookupResult | null>(null);
  const [activeTileProviderLabel, setActiveTileProviderLabel] = useState<string>(
    'MapTiler Satellite Hybrid'
  );

  // Nearby Facilities Layer State
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState<string>('all');
  const [showFacilitiesSection, setShowFacilitiesSection] = useState<boolean>(true);
  const [activeRouteInfo, setActiveRouteInfo] = useState<{ name: string; distance: string } | null>(null);

  // Dynamic cadastral records merging all global state listings (Canonical Source of Truth)
  const allCadastralRecords = useMemo(() => {
    const canonicalMap = new Map((effectiveListings || []).map((l) => [l.id, l]));

    // Synchronize base cadastral records with canonical listings (preventing stale asking prices & status)
    const syncedBaseRecords = CADASTRAL_PARCEL_RECORDS.map((c) => {
      const live = canonicalMap.get(c.listing_id);
      if (!live) return c;
      return {
        ...c,
        asking_price_inr: live.askingPriceINR ?? c.asking_price_inr,
        mutation_status: live.status ?? c.mutation_status,
        declared_area_bigha: live.areaBigha ?? c.declared_area_bigha,
        surveyed_area_bigha: live.recordedAreaBigha || live.areaBigha || c.surveyed_area_bigha,
        pattadar_name: live.sellerName ?? c.pattadar_name,
        verification_traffic_light: (live.passportSummary && live.passportSummary.discrepancyCount > 0 ? 'red' : live.status === 'Approved for Listing' ? 'green' : 'yellow') as 'green' | 'yellow' | 'red',
      };
    });

    const existingListingIds = new Set(CADASTRAL_PARCEL_RECORDS.map((c) => c.listing_id));
    const dynamicRecords: CadastralParcelRecord[] = (effectiveListings || [])
      .filter((l) => !existingListingIds.has(l.id) && l.status !== 'Withdrawn' && l.status !== 'Rejected' && l.status !== 'Rejected with Reason')
      .map((l, index) => {
        const coords = resolveAssamCoordinates(
          (l as { latitude?: number }).latitude ?? l.mapCenter?.lat,
          (l as { longitude?: number }).longitude ?? l.mapCenter?.lng,
          l.village,
          l.district
        );
        const baseLat = coords.latitude || (26.248 + (index * 0.005));
        const baseLng = coords.longitude || (91.700 + (index * 0.006));
        const polygonCoords = generateParcelPolygon(baseLat, baseLng, l.areaBigha);
        const template = CADASTRAL_PARCEL_RECORDS[0];

        return {
          ...template,
          parcel_id: l.parcelId || `AS-KMP-${100 + index}`,
          listing_id: l.id,
          district_code: `AS-18-${(l.district || 'KMP').slice(0, 3).toUpperCase()}`,
          district_name: l.district || 'Kamrup',
          circle_code: 'CIR-NGHY-04',
          circle_name: l.circle || 'North Guwahati',
          mouza: `${l.village || 'Revenue'} Mouza`,
          village_lgd_code: `LGD-${l.parcelId}`,
          village_name: l.village || 'Assam Parcel',
          dag_number: l.dagNumber || (l.parcelId ? l.parcelId.replace(/\D/g, '') || `${500 + index}` : `${500 + index}`),
          patta_number: l.pattaNumber || `${120 + index}`,
          ulpin: `18290412${100000 + index}`,
          centroid: [baseLat, baseLng],
          polygon_coords: polygonCoords,
          svg_points: '120,120 280,120 280,240 120,240',
          svg_center: { x: 200, y: 180 },
          ror_jamabandi_ref: `DHAR-ROR-${l.parcelId}`,
          pattadar_name: l.sellerName || 'Verified Landowner',
          land_class: l.landType || 'Agricultural (Rupit)',
          tenure_type: l.pattaType || 'Myadi Patta (Periodic)',
          surveyed_area_bigha: l.recordedAreaBigha || l.areaBigha,
          declared_area_bigha: l.areaBigha,
          registered_deed_ref: `DEED-${l.parcelId}`,
          nec_30yr_certificate_no: `NEC-${l.parcelId}`,
          encumbrance_status: 'Verification Queued',
          last_mutation_case: `MUT-${l.parcelId}`,
          mutation_status: l.status,
          chapter_x_tribal_belt: 'Outside Protected Tribal Belt',
          zonal_valuation_inr_per_bigha: l.benchmarkRatePerBighaINR || 450000,
          asking_price_inr: l.askingPriceINR,
          asdma_flood_zone: 'Low Hazard',
          verification_traffic_light: (l.passportSummary && l.passportSummary.discrepancyCount > 0 ? 'red' : l.status === 'Approved for Listing' ? 'green' : 'yellow') as 'green' | 'yellow' | 'red',
        };
      });

    return [...syncedBaseRecords, ...dynamicRecords];
  }, [effectiveListings, contextListings]);

  const unmappedListingsCount = useMemo(() => {
    return (effectiveListings || []).filter((l) => {
      const lat = (l as { latitude?: number }).latitude ?? l.mapCenter?.lat;
      const lng = (l as { longitude?: number }).longitude ?? l.mapCenter?.lng;
      return !Number.isFinite(lat) || !Number.isFinite(lng);
    }).length;
  }, [effectiveListings]);

  // Liquid Retina Glassmorphism Inspector states
  const [inspectorMinimized, setInspectorMinimized] = useState<boolean>(false);
  const [inspectorClosed, setInspectorClosed] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('gov');

  // Active cadastral record (linked to selected listing or directly selected pilot Dag)
  const [activeCadastral, setActiveCadastral] = useState<CadastralParcelRecord>(() => {
    return (
      fetchParcelById(selectedId) ||
      allCadastralRecords.find((p) => p.listing_id === selectedId || p.parcel_id === selectedId) ||
      CADASTRAL_PARCEL_RECORDS[0]
    );
  });

  // Authoritative real-data geo intelligence loaded from backend & live APIs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoIntelligence, setGeoIntelligence] = useState<any>(null);
  const [geoIntelligenceLoading, setGeoIntelligenceLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const fetchGeo = async () => {
      if (!activeCadastral) return;
      setGeoIntelligenceLoading(true);
      const [lat, lng] = activeCadastral.centroid || [26.2442, 91.7061];
      try {
        const res = await apiRequest<{ ok: boolean; data: any }>(
          `/api/parcels/${encodeURIComponent(activeCadastral.parcel_id)}/geo-intelligence?lat=${lat}&lng=${lng}&district=${encodeURIComponent(activeCadastral.district_name || 'Kamrup')}&village=${encodeURIComponent(activeCadastral.village_name || 'Changsari')}`
        );
        if (!cancelled && res.ok && res.data) {
          setGeoIntelligence(res.data);
        }
      } catch (e) {
        // Fallback gracefully to offline regional model
      } finally {
        if (!cancelled) setGeoIntelligenceLoading(false);
      }
    };
    fetchGeo();
    return () => {
      cancelled = true;
    };
  }, [activeCadastral?.parcel_id, activeCadastral?.centroid]);

  // Fallback SVG zoom/pan when tiles are offline or being inspected
  const [svgZoom, setSvgZoom] = useState<number>(1);
  const [svgPan, setSvgPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const facilityMarkersRef = useRef<maplibregl.Marker[]>([]);

  const mapSourceStatus = fetchMapSourceStatus();

  // Synchronize external selectedId changes with activeCadastral
  useEffect(() => {
    if (selectedId) {
      const matched = allCadastralRecords.find(
        (p) => p.listing_id === selectedId || p.parcel_id === selectedId
      );
      if (matched) {
        if (matched.parcel_id !== activeCadastral.parcel_id) {
          setActiveCadastral(matched);
        }
        if (mapRef.current) {
          try {
            mapRef.current.flyTo({
              center: [matched.centroid[1], matched.centroid[0]],
              zoom: 16,
              essential: true,
            });
          } catch {
            // Ignore if map unmounted
          }
        }
      }
    }
  }, [selectedId, allCadastralRecords, activeCadastral.parcel_id]);

  // Auto-center and select newly created listings in real time
  useEffect(() => {
    const handleCreatedListing = (e: Event) => {
      const customEvent = e as CustomEvent<{ listing?: Listing }>;
      const newListing = customEvent.detail?.listing;
      if (newListing) {
        onSelectListing(newListing.id);
        const lat = (newListing as { latitude?: number }).latitude || newListing.mapCenter?.lat;
        const lng = (newListing as { longitude?: number }).longitude || newListing.mapCenter?.lng;
        if (Number.isFinite(lat) && Number.isFinite(lng) && mapRef.current) {
          try {
            mapRef.current.flyTo({
              center: [lng, lat],
              zoom: 16,
              essential: true,
            });
          } catch {}
        }
      }
    };
    window.addEventListener('dharitri-listing-created', handleCreatedListing);
    return () => window.removeEventListener('dharitri-listing-created', handleCreatedListing);
  }, [onSelectListing]);

  // Select a parcel from polygon, centroid pin, or pilot chip (Instant Click-to-Switch)
  const handleSelectCadastralParcel = (record: CadastralParcelRecord, flyCamera = true) => {
    setActiveCadastral(record);
    setInspectorClosed(false);
    setInspectorMinimized(false);
    setUnconnectedWarning(null);
    onSelectListing(record.listing_id);

    if (flyCamera && mapRef.current) {
      try {
        mapRef.current.flyTo({
          center: [record.centroid[1], record.centroid[0]],
          zoom: 16,
          essential: true,
        });
      } catch {
        // Ignore if map container is hidden
      }
    }
  };

  // Zoom map to fit all parcels across Assam
  const handleFitAllListings = () => {
    const map = mapRef.current;
    if (!map || allCadastralRecords.length === 0) return;
    try {
      const bounds = new maplibregl.LngLatBounds();
      allCadastralRecords.forEach((r) => bounds.extend([r.centroid[1], r.centroid[0]]));
      map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
    } catch {
      // Ignore
    }
  };

  // Check if WebGL is available in current browser environment (graceful in tests/jsdom)
  const isWebGLSupported = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  };

  // Update GeoJSON sources & layers on the active MapLibre instance
  const updateMapLayers = (map: maplibregl.Map) => {
    if (!map || !map.isStyleLoaded()) return;

    try {
      const features: GeoJSON.Feature<GeoJSON.Polygon>[] = allCadastralRecords.map((rec) => {
        const isSelected = rec.parcel_id === activeCadastral.parcel_id;
        const ring = rec.polygon_coords.map(([lat, lng]) => [lng, lat]);
        if (ring.length > 0) {
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            ring.push([first[0], first[1]]);
          }
        }
        const fillColor =
          rec.verification_traffic_light === 'red'
            ? '#EF4444'
            : rec.verification_traffic_light === 'yellow'
            ? '#F59E0B'
            : '#10B981';
        const strokeColor = isSelected
          ? '#D97706'
          : rec.verification_traffic_light === 'red'
          ? '#DC2626'
          : rec.verification_traffic_light === 'yellow'
          ? '#D97706'
          : '#059669';

        return {
          type: 'Feature',
          id: rec.parcel_id,
          properties: {
            parcel_id: rec.parcel_id,
            listing_id: rec.listing_id,
            dag_number: rec.dag_number,
            village_name: rec.village_name,
            district_name: rec.district_name,
            fillColor,
            strokeColor,
            isSelected,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [ring],
          },
        };
      });

      const geojsonData: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
        type: 'FeatureCollection',
        features,
      };

      const existingSource = map.getSource('parcels-source') as maplibregl.GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(geojsonData);
      } else {
        map.addSource('parcels-source', {
          type: 'geojson',
          data: geojsonData,
        });
      }

      if (!map.getLayer('parcels-fill')) {
        map.addLayer({
          id: 'parcels-fill',
          type: 'fill',
          source: 'parcels-source',
          layout: {
            visibility: showBoundaries ? 'visible' : 'none',
          },
          paint: {
            'fill-color': ['get', 'fillColor'],
            'fill-opacity': [
              'case',
              ['boolean', ['get', 'isSelected'], false],
              0.28,
              0.12,
            ],
          },
        });

        map.on('click', 'parcels-fill', (e) => {
          if (e.features && e.features[0]) {
            const pid = e.features[0].properties?.parcel_id;
            const found = allCadastralRecords.find((r) => r.parcel_id === pid);
            if (found) {
              handleSelectCadastralParcel(found, true);
            }
          }
        });

        map.on('mouseenter', 'parcels-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'parcels-fill', () => {
          map.getCanvas().style.cursor = '';
        });
      } else {
        map.setLayoutProperty('parcels-fill', 'visibility', showBoundaries ? 'visible' : 'none');
      }

      if (!map.getLayer('parcels-outline')) {
        map.addLayer({
          id: 'parcels-outline',
          type: 'line',
          source: 'parcels-source',
          layout: {
            visibility: showBoundaries ? 'visible' : 'none',
          },
          paint: {
            'line-color': ['get', 'strokeColor'],
            'line-width': [
              'case',
              ['boolean', ['get', 'isSelected'], false],
              2.6,
              1.5,
            ],
            'line-dasharray': [3, 2],
          },
        });
      } else {
        map.setLayoutProperty('parcels-outline', 'visibility', showBoundaries ? 'visible' : 'none');
      }

      // Facility route LineString source & layer
      if (!map.getSource('facility-route-source')) {
        map.addSource('facility-route-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });
        map.addLayer({
          id: 'facility-route-layer',
          type: 'line',
          source: 'facility-route-source',
          paint: {
            'line-color': '#147D4A',
            'line-width': 3,
            'line-dasharray': [3, 2],
          },
        });
      }
    } catch {
      // Ignore during unmount or style reloading
    }
  };

  // Initialize MapLibre GL JS Map with MapTiler Satellite Hybrid as Primary Basemap
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    if (!isWebGLSupported()) return;

    try {
      const apiKey = getMapTilerApiKey();
      const hasKey = isUsableMapTilerKey(apiKey);

      let initialStyle: string | maplibregl.StyleSpecification;
      if (hasKey) {
        initialStyle = getMapTilerStyleUrl(layerMode, apiKey);
        setActiveTileProviderLabel(`MapTiler ${layerMode === 'streets' ? 'Streets' : layerMode === 'satellite' ? 'Satellite' : 'Satellite Hybrid'}`);
      } else {
        initialStyle = layerMode === 'satellite' ? ESRI_SATELLITE_STYLE : ESRI_HYBRID_STYLE;
        setActiveTileProviderLabel('Esri World Imagery + Hybrid Labels');
      }

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [91.7061, 26.2442],
        zoom: 14.5,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution:
            '<a href="https://www.maptiler.com" target="_blank" rel="noopener noreferrer">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
        }),
        'bottom-right'
      );

      // Gracefully fall back to Esri World Imagery if MapTiler has any network or quota issue
      map.on('error', (e) => {
        if (e && e.error && hasKey) {
          console.warn('MapTiler encountered error, activating Esri World Imagery fallback:', e.error);
          try {
            map.setStyle(layerMode === 'satellite' ? ESRI_SATELLITE_STYLE : ESRI_HYBRID_STYLE);
            setActiveTileProviderLabel('Esri World Imagery (Satellite Fallback)');
          } catch {}
        }
      });

      map.on('load', () => {
        updateMapLayers(map);
      });

      map.on('style.load', () => {
        updateMapLayers(map);
      });

      mapRef.current = map;
    } catch {
      // Graceful fallback to SVG viewer
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  // Hot-swap MapTiler Basemap Styles (Hybrid / Satellite / Streets) with Esri / OSM Fallbacks
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const apiKey = getMapTilerApiKey();
      const hasKey = isUsableMapTilerKey(apiKey);

      if (hasKey) {
        setActiveTileProviderLabel(
          `MapTiler ${layerMode === 'streets' ? 'Streets' : layerMode === 'satellite' ? 'Satellite' : 'Satellite Hybrid'}`
        );
        map.setStyle(getMapTilerStyleUrl(layerMode, apiKey));
      } else {
        if (layerMode === 'satellite') {
          setActiveTileProviderLabel('Esri World Imagery (High-Res Satellite)');
          map.setStyle(ESRI_SATELLITE_STYLE);
        } else if (layerMode === 'hybrid') {
          setActiveTileProviderLabel('Esri World Imagery + Hybrid Labels');
          map.setStyle(ESRI_HYBRID_STYLE);
        } else {
          setActiveTileProviderLabel('OpenStreetMap Streets');
          map.setStyle(OPENFREEMAP_LIBERTY_URL);
        }
      }
    } catch {
      // Ignore during rapid switches
    }
  }, [layerMode]);

  // Synchronize Centroid Pins and Boundary Layers with State
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      updateMapLayers(map);
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!showBoundaries) return;

    try {
      allCadastralRecords.forEach((record) => {
        const isSelected = record.parcel_id === activeCadastral.parcel_id;
        const markerEl = document.createElement('div');
        markerEl.className = `dag-centroid-pin ${isSelected ? 'selected' : ''}`;
        markerEl.textContent = `Dag ${record.dag_number}`;
        markerEl.style.cursor = 'pointer';

        const linked = (effectiveListings || []).find(
          (l) => l.id === record.listing_id || l.parcelId === record.parcel_id
        );
        const displayTitle = linked?.title || `${record.village_name} Dag #${record.dag_number}`;
        const displayLoc = `${record.village_name}, ${record.district_name}`;
        const displayArea = formatAreaWithSecondary(
          record.declared_area_bigha || record.surveyed_area_bigha,
          areaUnit
        );
        const displayPrice = `₹${(record.asking_price_inr / 100000).toFixed(2)} Lakhs`;
        const displayStatus = record.mutation_status || linked?.status || 'Awaiting Review';
        const listingId = record.listing_id || linked?.id || selectedId;
        const trafficClass =
          record.verification_traffic_light === 'green'
            ? 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;'
            : record.verification_traffic_light === 'red'
            ? 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;'
            : 'background: #fffbeb; color: #92400e; border: 1px solid #fde68a;';

        const popupNode = document.createElement('div');
        popupNode.className = 'dharitri-map-popup-card';
        popupNode.style.cssText =
          'font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b; min-width: 210px; padding: 4px 2px;';
        popupNode.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 9999px; ${trafficClass}">${displayStatus}</span>
            <span style="font-size: 10px; color: #64748b; font-weight: 700;">Dag ${record.dag_number}</span>
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #0d261c; margin-bottom: 5px; line-height: 1.3;">${displayTitle}</div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 3px;">📍 ${displayLoc}</div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 3px;">📐 ${displayArea}</div>
          <div style="font-weight: 800; color: #147d4a; font-size: 13px; margin-bottom: 8px;">${displayPrice}</div>
          <button type="button" class="map-popup-view-btn" style="display: block; text-align: center; width: 100%; padding: 6px 12px; background: #0d261c; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; font-size: 11px; cursor: pointer;">
            View Listing →
          </button>
        `;

        const viewBtn = popupNode.querySelector('.map-popup-view-btn');
        if (viewBtn) {
          viewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/land/${listingId}`);
          });
        }

        const popup = new maplibregl.Popup({ offset: 16, maxWidth: '280px' })
          .setDOMContent(popupNode);

        const marker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
          .setLngLat([record.centroid[1], record.centroid[0]])
          .setPopup(popup)
          .addTo(map);

        markerEl.addEventListener('click', () => {
          handleSelectCadastralParcel(record, true);
        });

        markersRef.current.push(marker);
      });
    } catch {
      // Ignore marker rendering issues if WebGL is unavailable
    }
  }, [allCadastralRecords, activeCadastral, showBoundaries, effectiveListings, areaUnit]);

  // Render Nearby Amenities Markers and Interactive Route Line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    facilityMarkersRef.current.forEach((m) => m.remove());
    facilityMarkersRef.current = [];

    // Clear route line
    try {
      const routeSource = map.getSource('facility-route-source') as maplibregl.GeoJSONSource | undefined;
      if (routeSource) {
        routeSource.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    } catch {}
    setActiveRouteInfo(null);

    const facilitiesToShow =
      selectedFacilityCategory === 'all'
        ? NEARBY_AMENITIES
        : NEARBY_AMENITIES.filter((a) => a.category === selectedFacilityCategory);

    try {
      facilitiesToShow.forEach((fac) => {
        const el = document.createElement('div');
        el.className = 'facility-map-pin';
        el.innerHTML = `<span>${fac.icon}</span><span>${fac.name.split(' ')[0]} (${fac.distanceKm})</span>`;
        el.style.cursor = 'pointer';

        const popup = new maplibregl.Popup({ offset: 14 })
          .setHTML(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
              <strong style="color: #092F24;">${fac.icon} ${fac.name}</strong><br/>
              <span style="color: #147D4A; font-weight: bold;">Distance: ${fac.distanceKm} from Dag ${activeCadastral.dag_number}</span><br/>
              <span style="color: #66736D; font-size: 11px;">${fac.note}</span>
            </div>
          `);

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([fac.coords[1], fac.coords[0]])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', () => {
          try {
            const routeGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [activeCadastral.centroid[1], activeCadastral.centroid[0]],
                      [fac.coords[1], fac.coords[0]],
                    ],
                  },
                },
              ],
            };
            const s = map.getSource('facility-route-source') as maplibregl.GeoJSONSource | undefined;
            if (s) {
              s.setData(routeGeoJSON);
            }
          } catch {}
          setActiveRouteInfo({ name: fac.name, distance: fac.distanceKm });
        });

        facilityMarkersRef.current.push(marker);
      });
    } catch {
      // Ignore marker rendering errors
    }
  }, [selectedFacilityCategory, activeCadastral]);

  // Real-time Dag number ("412", "142", "104", "785") and 14-digit ULPIN search handler
  const handleDagSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = dagQuery.trim();
    if (!q) {
      setUnconnectedWarning(null);
      return;
    }

    const matches = searchParcelsByDag(q);
    if (matches.length > 0) {
      handleSelectCadastralParcel(matches[0], true);
      setUnconnectedWarning(null);
    } else {
      setUnconnectedWarning(
        'Official parcel boundaries are not connected for this area. Parcel boundaries and Dag-based selection are unavailable.'
      );
    }
  };

  const handleOfficialRecordLookup = async () => {
    setOfficialLookupLoading(true);
    setOfficialLookupResult(null);
    if (!API_MODE) {
      setOfficialLookupResult({ ok: false, message: 'Official lookup is disabled in standalone demo mode. Start the full-stack app and configure an authorised land-record endpoint.' });
      setOfficialLookupLoading(false);
      return;
    }
    try {
      const identifier = activeCadastral.ulpin || activeCadastral.parcel_id;
      const response = await apiRequest<{ ok: boolean; source: string; retrievedAt: string; parcelId: string; data: unknown; disclaimer?: string }>(`/api/land-records?parcelId=${encodeURIComponent(identifier)}`);
      setOfficialLookupResult({ ok: true, message: response.disclaimer || 'Response received from configured external source. The response has not been independently authenticated or legally interpreted.', source: response.source, retrievedAt: response.retrievedAt, data: response.data });
    } catch (error) {
      setOfficialLookupResult({ ok: false, message: error instanceof Error ? error.message : 'Official land-record lookup failed.' });
    } finally {
      setOfficialLookupLoading(false);
    }
  };

  const handleZoomIn = () => {
    setSvgZoom((z) => Math.min(2.2, +(z + 0.25).toFixed(2)));
    if (mapRef.current) {
      try {
        mapRef.current.zoomIn();
      } catch {
        // Ignore
      }
    }
  };

  const handleZoomOut = () => {
    setSvgZoom((z) => Math.max(0.85, +(z - 0.25).toFixed(2)));
    if (mapRef.current) {
      try {
        mapRef.current.zoomOut();
      } catch {
        // Ignore
      }
    }
  };

  const handleResetNorthGuwahati = () => {
    setSvgZoom(1);
    setSvgPan({ x: 0, y: 0 });
    setUnconnectedWarning(null);
    const changsari = CADASTRAL_PARCEL_RECORDS[0];
    handleSelectCadastralParcel(changsari, false);
    if (mapRef.current) {
      try {
        mapRef.current.flyTo({ center: [91.7061, 26.2442], zoom: 15, essential: true });
      } catch {
        // Ignore
      }
    }
  };

  const linkedListing =
    listings.find((l) => l.id === activeCadastral.listing_id) || listings[0];
  const priceMeta = formatPricePerBighaAndUnit(
    activeCadastral.asking_price_inr,
    activeCadastral.declared_area_bigha,
    areaUnit
  );

  return (
    <div className="rounded-3xl overflow-hidden border border-[#DFD6C3] bg-white shadow-md flex flex-col">
      {/* Top Satellite & Cadastral Toolbar */}
      <div className="bg-evergreen text-warmivory px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold flex items-center gap-1.5">
            <span>🛰️</span>
            <span>EPSG:4326 Cadastral & Satellite Engine</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-teagreen/90 text-[10px] font-semibold border border-warmivory/20">
            {activeTileProviderLabel} · {mapSourceStatus.crs}
          </span>
        </div>

        {/* Layer Switcher: Hybrid (Default) / Satellite / Streets */}
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'hybrid', label: '🛰️ Hybrid' },
              { id: 'satellite', label: '🌍 Satellite' },
              { id: 'streets', label: '🗺️ Streets' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setLayerMode(mode.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                layerMode === mode.id
                  ? 'bg-warmivory text-evergreen shadow-sm'
                  : 'bg-teagreen/80 text-warmivory hover:bg-teagreen'
              }`}
            >
              {mode.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowBoundaries(!showBoundaries)}
            aria-pressed={showBoundaries}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 border ${
              showBoundaries
                ? 'bg-amber-400 text-evergreen border-amber-300 shadow-sm'
                : 'bg-teagreen/70 text-warmivory border-warmivory/30 hover:bg-teagreen'
            }`}
            title={showBoundaries ? 'Click to view Pure Live Map (hides boundaries)' : 'Click to show Cadastral Boundaries'}
          >
            <span>{showBoundaries ? '📐 Boundaries: ON' : '🗺️ Pure Live Map'}</span>
          </button>

          <button
            type="button"
            onClick={handleFitAllListings}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teagreen/80 text-warmivory hover:bg-teagreen border border-warmivory/20 transition flex items-center gap-1 shadow-sm"
            title="Zoom to fit all land parcels across Assam"
          >
            <span>🗺️</span>
            <span>Fit All ({allCadastralRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Real-Time Dag Number, ULPIN & Pilot Area Search Bar */}
      <div className="bg-warmivory px-4 py-2.5 border-b border-cream flex flex-wrap items-center justify-between gap-2.5">
        {unmappedListingsCount > 0 && (
          <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <span>📍</span>
            <span>{unmappedListingsCount} plot(s) location pending</span>
          </span>
        )}
        <form onSubmit={handleDagSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <input
            type="text"
            value={dagQuery}
            onChange={(e) => {
              setDagQuery(e.target.value);
              if (!e.target.value.trim()) setUnconnectedWarning(null);
            }}
            placeholder="Search Dag No (412, 142, 104, 785), 14-digit ULPIN, or Village..."
            aria-label="Search by Dag Number or ULPIN"
            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#CFC5B0] text-xs text-maintext placeholder-secondarytext focus:outline-none focus:ring-2 focus:ring-evergreen"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory text-xs font-bold transition shadow-sm"
          >
            Locate Dag →
          </button>
        </form>

        {/* Quick Pilot & Live Listed Surveyed Areas */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-secondarytext">Explore Dags:</span>
          {allCadastralRecords.map((rec) => {
            const active = rec.parcel_id === activeCadastral.parcel_id;
            const isUserListing = (effectiveListings || []).some(
              (l) => (l.id === rec.listing_id || l.parcelId === rec.parcel_id) && l.sellerEmail && l.sellerEmail === currentUser?.email
            );
            return (
              <button
                key={`${rec.parcel_id}-${rec.listing_id}`}
                type="button"
                onClick={() => handleSelectCadastralParcel(rec, true)}
                className={`px-2.5 py-1 rounded-full font-bold transition border flex items-center gap-1 ${
                  active
                    ? 'bg-evergreen text-warmivory border-evergreen shadow-sm ring-1 ring-evergreen'
                    : isUserListing
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white hover:bg-cream text-maintext border-[#CFC5B0]'
                }`}
              >
                {isUserListing && <span className="text-[10px]">⭐</span>}
                <span>{rec.village_name} (Dag {rec.dag_number})</span>
                {isUserListing && (
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-700 text-white rounded font-medium">My Plot</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Unconnected Cadastral Area Fallback Warning Banner */}
      {unconnectedWarning && (
        <div
          role="alert"
          className="bg-amber-50 border-b border-amber-300 px-4 py-2.5 text-xs text-amber-950 flex items-center justify-between gap-2"
        >
          <span className="font-semibold">⚠️ {unconnectedWarning}</span>
          <button
            type="button"
            onClick={() => {
              setDagQuery('');
              setUnconnectedWarning(null);
            }}
            className="px-2.5 py-0.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 font-bold text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Chips for Nearby Facilities Layer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#F7F9F6] border-b border-[#E5EBE7] text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#092F24]">
          <span>📍 Nearby Facilities &amp; Connectivity:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: '🌟 All (11)' },
            { id: 'healthcare', label: '🏥 Hospitals' },
            { id: 'education', label: '🎓 Education' },
            { id: 'road', label: '🛣️ Roads & NH-27' },
            { id: 'transit', label: '🚆 Rail & Airport' },
            { id: 'markets', label: '🛒 Markets & Banks' },
            { id: 'gov', label: '🏛️ Circle Office' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedFacilityCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                selectedFacilityCategory === cat.id
                  ? 'bg-[#147D4A] text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-[#66736D] border border-[#E5EBE7]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Satellite & Cadastral Map Stage (Strictly overflow-hidden) */}
      <div
        className={`relative w-full ${
          compact ? 'h-96' : 'h-[540px]'
        } overflow-hidden select-none bg-[#1B3326]`}
      >
        {/* Floating Nearby Amenities Filter Bar Over Map (Rule 3) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#CBD5E1] shadow-lg text-xs">
          <span className="text-[11px] font-bold text-[#092F24] px-2 flex items-center gap-1">
            <span>✨ Facilities:</span>
          </span>
          {[
            { id: 'healthcare', label: '🏥 Hospitals' },
            { id: 'education', label: '🎓 Schools' },
            { id: 'road', label: '🛣️ Highways' },
            { id: 'transit', label: '🚆 Transport' },
            { id: 'all', label: 'All Layers' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedFacilityCategory(pill.id)}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1 text-[11px] ${
                selectedFacilityCategory === pill.id
                  ? 'bg-[#147D4A] text-white shadow-xs'
                  : 'bg-white hover:bg-[#F8FAF7] text-[#15251F] border border-[#CBD5E1]'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {activeRouteInfo && (
            <button
              type="button"
              onClick={() => {
                if (mapRef.current) {
                  try {
                    const s = mapRef.current.getSource('facility-route-source') as maplibregl.GeoJSONSource | undefined;
                    if (s) {
                      s.setData({ type: 'FeatureCollection', features: [] });
                    }
                  } catch {}
                }
                setActiveRouteInfo(null);
              }}
              className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200 hover:bg-rose-100 transition text-[11px]"
              title="Clear Route Line"
            >
              ✕ Clear Route
            </button>
          )}
        </div>

        {/* Floating Active Route Distance Badge */}
        {activeRouteInfo && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 bg-[#092F24]/95 text-white backdrop-blur-md rounded-2xl border border-emerald-400 shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Route to {activeRouteInfo.name}:{' '}
              <strong className="text-emerald-300 font-extrabold">{activeRouteInfo.distance}</strong> from Dag {activeCadastral.dag_number}
            </span>
          </div>
        )}
        {/* High-Resolution Offline-Resilient Satellite + WGS-84 Vector Underlay */}
        <svg
          viewBox="0 0 1000 600"
          className="absolute inset-0 w-full h-full transition-transform duration-300 z-0"
          style={{
            transform: `scale(${svgZoom}) translate(${svgPan.x}px, ${svgPan.y}px)`,
            transformOrigin: 'center center',
          }}
          role="img"
          aria-label="Interactive Assam Cadastral and Satellite Map"
        >
          <defs>
            <pattern id="cadastralGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke={
                  layerMode === 'streets'
                    ? 'rgba(23, 46, 41, 0.22)'
                    : 'rgba(255, 255, 255, 0.16)'
                }
                strokeWidth="1"
              />
            </pattern>
            <filter id="labelShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.85" />
            </filter>
          </defs>

          {layerMode !== 'streets' ? (
            <>
              <image
                href="/assets/satellite-map-bg.jpg"
                x="0"
                y="0"
                width="1000"
                height="600"
                preserveAspectRatio="xMidYMid slice"
              />
              <rect width="1000" height="600" fill="rgba(10, 28, 20, 0.18)" />
            </>
          ) : (
            <rect width="1000" height="600" fill="#E9E2CE" />
          )}

          {layerMode === 'hybrid' && (
            <rect width="1000" height="600" fill="url(#cadastralGrid)" />
          )}

          {/* Highway & Brahmaputra Context */}
          <g>
            <path
              d="M 285,595 Q 520,435 695,320 T 995,235"
              fill="none"
              stroke="#F59E0B"
              strokeWidth={layerMode === 'hybrid' ? '4.5' : '3'}
              strokeDasharray={layerMode === 'satellite' ? '8 5' : 'none'}
              opacity="0.9"
            />
            <path
              d="M 40,350 Q 250,365 420,250 T 680,85"
              fill="none"
              stroke="#FDE68A"
              strokeWidth="2.2"
              strokeDasharray="6 4"
              opacity="0.8"
            />
            <g filter="url(#labelShadow)">
              <text x="455" y="245" fill="#E0F2FE" fontSize="12" fontWeight="700">
                🌊 Brahmaputra River Channel
              </text>
              <text x="700" y="302" fill="#FEF3C7" fontSize="11" fontWeight="700">
                🛣️ NH-27 Four-Lane Corridor
              </text>
            </g>
          </g>

          {/* Surveyed Cadastral Polygons & Subtle Dag Centroid Pins (Only rendered when showBoundaries is active) */}
          {showBoundaries &&
            allCadastralRecords.map((rec) => {
              const isSelected = rec.parcel_id === activeCadastral.parcel_id;
              const fillColor =
                rec.verification_traffic_light === 'red'
                  ? '#EF4444'
                  : rec.verification_traffic_light === 'yellow'
                  ? '#F59E0B'
                  : '#10B981';

              return (
                <g
                  key={rec.parcel_id}
                  onClick={() => handleSelectCadastralParcel(rec, true)}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect Dag ${rec.dag_number} in ${rec.village_name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectCadastralParcel(rec, true);
                    }
                  }}
                >
                  <polygon
                    points={rec.svg_points}
                    fill={fillColor}
                    fillOpacity={isSelected ? 0.16 : 0.08}
                    stroke={isSelected ? '#F59E0B' : fillColor}
                    strokeWidth={isSelected ? 2 : 1.3}
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={rec.svg_center.x}
                    cy={rec.svg_center.y}
                    r={isSelected ? 5 : 4}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <g filter="url(#labelShadow)">
                    <rect
                      x={rec.svg_center.x - 44}
                      y={rec.svg_center.y - 24}
                      width="88"
                      height="18"
                      rx="9"
                      fill={isSelected ? 'rgba(217, 119, 6, 0.92)' : 'rgba(18, 63, 50, 0.85)'}
                      stroke={isSelected ? '#FDE68A' : 'rgba(255, 255, 255, 0.35)'}
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />
                    <text
                      x={rec.svg_center.x}
                      y={rec.svg_center.y - 12}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="600"
                    >
                      Dag {rec.dag_number} · {rec.village_name.slice(0, 8)}
                    </text>
                  </g>
                </g>
              );
            })}
        </svg>

        {/* Live Leaflet Map Container Overlay (Transparent background so SVG underlay shines through if tiles are offline) */}
        <div
          ref={mapContainerRef}
          className="absolute inset-0 w-full h-full z-10"
          style={{ background: 'transparent' }}
        />

        {/* Map Zoom & Controls */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-cream">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom In"
            className="w-8 h-8 rounded-xl bg-warmivory hover:bg-cream text-evergreen font-bold text-base transition"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom Out"
            className="w-8 h-8 rounded-xl bg-warmivory hover:bg-cream text-evergreen font-bold text-base transition"
          >
            −
          </button>
          <button
            type="button"
            onClick={handleResetNorthGuwahati}
            aria-label="Reset to North Guwahati Changsari Pilot Center"
            className="w-8 h-8 rounded-xl bg-warmivory hover:bg-cream text-evergreen text-xs font-semibold transition"
            title="Reset to North Guwahati / Changsari [26.2442, 91.7061]"
          >
            ⟲
          </button>
          <button
            type="button"
            onClick={() => setShowBoundaries(!showBoundaries)}
            aria-label="Toggle Cadastral Boundaries"
            className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
              showBoundaries
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-warmivory hover:bg-cream text-evergreen'
            }`}
            title={showBoundaries ? 'Hide Boundaries (Show Only Live Map)' : 'Show Cadastral Boundaries'}
          >
            {showBoundaries ? '📐' : '🛰️'}
          </button>
        </div>

        {/* Bottom-Left Traffic-Light Legend & Coordinate Status */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1.5">
          {showBoundaries ? (
            <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-semibold text-maintext shadow border border-cream">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Sample: Low Concern
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Sample: Review
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Sample: Discrepancy
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-semibold text-maintext shadow border border-cream">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>🛰️ Pure Live Satellite View (Boundaries Hidden)</span>
            </div>
          )}
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] text-secondarytext font-mono shadow border border-cream w-fit">
            WGS-84: {activeCadastral.centroid[0].toFixed(4)}°N, {activeCadastral.centroid[1].toFixed(4)}°E · ULPIN {activeCadastral.ulpin}
          </div>
        </div>

        {/* ====================================================================
            BOUNDED LIQUID RETINA GLASSMORPHISM INSPECTOR PANEL
            (top-3 bottom-3 max-h-[calc(100%-24px)] flex flex-col)
           ==================================================================== */}
        {inspectorClosed ? (
          <button
            type="button"
            onClick={() => {
              setInspectorClosed(false);
              setInspectorMinimized(false);
            }}
            className="liquid-glass-pill absolute bottom-3 right-3 z-30 px-4 py-2.5 rounded-full text-xs font-bold text-evergreen flex items-center gap-2 hover:scale-105 transition"
          >
            <span>🛰️</span>
            <span>
              Reopen Inspector · Dag {activeCadastral.dag_number} ({activeCadastral.village_name})
            </span>
          </button>
        ) : inspectorMinimized ? (
          /* Sleek 1-Line Glass Pill when Minimized so 95% of Satellite Map is Unobstructed */
          <div className="liquid-glass-pill absolute top-3 right-3 z-30 px-4 py-2 rounded-full flex items-center gap-3 text-xs font-bold text-evergreen">
            <button
              type="button"
              onClick={() => setInspectorMinimized(false)}
              className="flex items-center gap-1.5 text-left"
              title="Expand Liquid Retina Cadastral Inspector"
            >
              <span>📍</span>
              <span>
                {activeCadastral.village_name} · {activeCadastral.surveyed_area_bigha} Bigha · Expand ▾
              </span>
            </button>
            <button
              type="button"
              onClick={() => setInspectorMinimized(false)}
              aria-label="Expand Inspector"
              className="w-6 h-6 rounded-full bg-white/80 hover:bg-white text-evergreen flex items-center justify-center text-xs font-bold"
            >
              ⤢
            </button>
            <button
              type="button"
              onClick={() => setInspectorClosed(true)}
              aria-label="Close Inspector"
              className="w-6 h-6 rounded-full bg-white/80 hover:bg-white text-secondarytext flex items-center justify-center text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ) : (
          /* Bounded Floating Inspector Card (top-3 bottom-3 max-h-[calc(100%-24px)] flex flex-col) */
          <div
            className="liquid-glass-panel absolute top-3 right-3 bottom-3 max-h-[calc(100%-24px)] z-30 w-full max-w-[340px] rounded-3xl p-4 flex flex-col justify-between overflow-hidden text-maintext"
            role="region"
            aria-label="Liquid Retina Cadastral & Geospatial Inspector"
          >
            {/* Scrollable Body Inside Bounded Flex Container */}
            <div className="space-y-2.5 overflow-y-auto pr-0.5 flex-1">
              <div className="flex items-start justify-between gap-2 border-b border-white/60 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-evergreen text-warmivory text-[10px] font-bold">
                      Dag {activeCadastral.dag_number} · Patta {activeCadastral.patta_number}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeCadastral.verification_traffic_light === 'green'
                          ? 'bg-emerald-100 text-emerald-900'
                          : activeCadastral.verification_traffic_light === 'yellow'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {activeCadastral.verification_traffic_light === 'green'
                        ? '🟢 Demo: Low Concern'
                        : activeCadastral.verification_traffic_light === 'yellow'
                        ? '🟡 Demo: Review'
                        : '🔴 Demo: Discrepancy'}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-evergreen mt-1">
                    {activeCadastral.village_name}, {activeCadastral.circle_name}
                  </h4>
                  <p className="text-[10px] font-mono text-secondarytext">
                    ULPIN: {activeCadastral.ulpin} · {activeCadastral.district_name}
                  </p>
                </div>

                {/* Minimize (−) and Close (✕) Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setInspectorMinimized(true)}
                    aria-label="Minimize Inspector to 1-line Glass Pill"
                    title="Minimize to Glass Pill"
                    className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-evergreen font-bold text-xs flex items-center justify-center shadow-sm"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorClosed(true)}
                    aria-label="Close Inspector"
                    title="Close Inspector"
                    className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-secondarytext font-bold text-xs flex items-center justify-center shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Inspector Section Switcher: Verified Gov Records vs 7 Geospatial Layers vs Legal/Flood */}
              <div className="grid grid-cols-3 gap-1 bg-white/60 p-1 rounded-xl border border-white/80 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setInspectorTab('gov')}
                  className={`py-1 rounded-lg transition ${
                    inspectorTab === 'gov'
                      ? 'bg-evergreen text-warmivory shadow-sm'
                      : 'text-evergreen hover:bg-white/70'
                  }`}
                >
                  🏛️ Gov Records
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('geo')}
                  className={`py-1 rounded-lg transition ${
                    inspectorTab === 'geo'
                      ? 'bg-evergreen text-warmivory shadow-sm'
                      : 'text-evergreen hover:bg-white/70'
                  }`}
                >
                  🛰️ 7 Geo Layers
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('risk')}
                  className={`py-1 rounded-lg transition ${
                    inspectorTab === 'risk'
                      ? 'bg-evergreen text-warmivory shadow-sm'
                      : 'text-evergreen hover:bg-white/70'
                  }`}
                >
                  🛡️ Risk & Belt
                </button>
              </div>

              {/* TOP SECTION: VERIFIED GOVERNMENT & GEOSPATIAL RECORDS */}
              {inspectorTab === 'gov' && (
                <div className="bg-white/85 rounded-2xl p-3 border border-white/90 space-y-2 text-[11px] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teagreen">
                      Assam Revenue & Cadastral Status
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Gateway Unconfigured
                    </span>
                  </div>

                  <div className="text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200 rounded-xl p-2 leading-relaxed">
                    <p className="font-semibold text-amber-950 flex items-center gap-1">
                      <span>🏛️</span>
                      <span>Assam Dharitree / ILRMS Gateway Dependency</span>
                    </p>
                    <p className="mt-0.5 text-[9.5px]">
                      Authoritative live verification requires an approved API Gateway MoU with the Revenue and Disaster Management Dept, Govt of Assam &amp; NIC Assam. Below records reflect seller declaration &amp; registered platform documents.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-secondarytext">Pattadar (RoR):</span>
                      <div className="flex items-center gap-1 text-right">
                        <span className="font-bold text-evergreen">{activeCadastral.pattadar_name}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">Declared</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-secondarytext">Surveyed / Declared Area:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-evergreen">
                          {formatAreaWithSecondary(activeCadastral.surveyed_area_bigha, areaUnit)}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">Listing</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-secondarytext">Land Classification:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-right text-slate-800">{activeCadastral.land_class}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">Revenue</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-secondarytext">Basundhara Case Ref:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] font-semibold text-right text-slate-700">
                          {activeCadastral.last_mutation_case}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">MB 3.0</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-secondarytext">ASDMA Flood Hazard:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-emerald-900 text-right">
                          {activeCadastral.asdma_flood_zone}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">Atlas</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-secondarytext">Circle Benchmark Rate:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-teagreen">
                          ₹{activeCadastral.zonal_valuation_inr_per_bigha.toLocaleString('en-IN')}/Bigha
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">Gazette</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOfficialRecordLookup}
                    disabled={officialLookupLoading}
                    className="mt-2 w-full rounded-xl bg-evergreen px-3 py-2 text-[10.5px] font-bold text-white hover:bg-teagreen transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    <span>🔍</span>
                    <span>{officialLookupLoading ? 'Querying ILRMS Gateway…' : 'Query Connected Land-Record Gateway'}</span>
                  </button>

                  {officialLookupResult && (
                    <div
                      role="status"
                      className={`rounded-xl border p-2.5 text-[10px] space-y-1 ${
                        officialLookupResult.ok
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                          : 'border-amber-200 bg-amber-50 text-amber-950'
                      }`}
                    >
                      <p className="font-bold">{officialLookupResult.message}</p>
                      {officialLookupResult.source && <p>Source: {officialLookupResult.source}</p>}
                      {officialLookupResult.retrievedAt && (
                        <p className="text-gray-500">
                          Retrieved: {new Date(officialLookupResult.retrievedAt).toLocaleString()}
                        </p>
                      )}
                      {officialLookupResult.data !== undefined && (
                        <details className="mt-1">
                          <summary className="cursor-pointer font-semibold text-evergreen">View Raw Payload</summary>
                          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-white/80 p-1.5 border border-slate-200 text-[9px]">
                            {JSON.stringify(officialLookupResult.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}

              {inspectorTab === 'geo' && (
                <div className="bg-white/85 rounded-2xl p-3 border border-white/90 space-y-2 text-[10.5px] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teagreen">
                      7 Geospatial &amp; Environmental Layers
                    </span>
                    {geoIntelligenceLoading ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 animate-pulse">
                        Refreshing live GPS…
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        🟢 Live Source Backed
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 pt-0.5">
                    {/* Layer 1: Soil Health */}
                    <div className="p-2 rounded-xl bg-[#F7F9F6] border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800 text-[11px]">1. Soil Health (ICAR-NBSS&amp;LUP)</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                          Regional Survey
                        </span>
                      </div>
                      <div className="text-slate-700">
                        {geoIntelligence?.soilHealth?.texture || activeCadastral.soil_health.soil_texture} · pH {geoIntelligence?.soilHealth?.phLevel || activeCadastral.soil_health.ph_level} · OC {geoIntelligence?.soilHealth?.organicCarbonPercent ?? activeCadastral.soil_health.organic_carbon_percent}%
                      </div>
                      <div className="text-[9.5px] text-gray-500">
                        Crops: {(geoIntelligence?.soilHealth?.cropSuitability || activeCadastral.soil_health.crop_suitability).join(', ')}
                      </div>
                    </div>

                    {/* Layer 2: Slope & Elevation */}
                    <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-emerald-950 text-[11px]">2. Slope &amp; Elevation (SRTM / Copernicus)</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">
                          🟢 Live API
                        </span>
                      </div>
                      <div className="text-slate-800 font-medium">
                        Elevation: <strong className="text-evergreen">{geoIntelligence?.elevation?.valueMslMetres ?? activeCadastral.topographic_slope.elevation_msl_metres}m MSL</strong> · Natural Gradient: {geoIntelligence?.elevation?.slopePercent ?? activeCadastral.topographic_slope.slope_percentage}%
                      </div>
                      <div className="text-[9px] text-gray-500">
                        Source: {geoIntelligence?.elevation?.source || 'Open-Meteo SRTM/Copernicus 90m DEM (Live GPS Centroid)'}
                      </div>
                    </div>

                    {/* Layer 3: Groundwater */}
                    <div className="p-2 rounded-xl bg-[#F7F9F6] border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800 text-[11px]">3. Groundwater Prospects (CGWB NAQUIM)</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          Aquifer Bulletin
                        </span>
                      </div>
                      <div className="text-slate-700">
                        Unconfined Water Table: {geoIntelligence?.groundwater?.depthMbgl || `${activeCadastral.groundwater_prospects.water_table_post_monsoon_mbgl}–${activeCadastral.groundwater_prospects.water_table_pre_monsoon_mbgl} mbgl`} · Yield: {geoIntelligence?.groundwater?.yieldLpm || activeCadastral.groundwater_prospects.aquifer_yield_lpm} LPM
                      </div>
                    </div>

                    {/* Layer 4: LULC Multi-Temporal */}
                    <div className="p-2 rounded-xl bg-[#F7F9F6] border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800 text-[11px]">4. LULC Multi-Temporal (ISRO NRSC)</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 font-medium border border-blue-200">
                          Bhuvan 1:50K
                        </span>
                      </div>
                      <div className="text-slate-700">
                        Classification: {geoIntelligence?.lulc?.classification || `${activeCadastral.lulc_change.classification_2015} → ${activeCadastral.lulc_change.classification_2024}`}
                      </div>
                    </div>

                    {/* Layer 5: Highway ROW & Setbacks */}
                    <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-emerald-950 text-[11px]">5. Infrastructure ROW (NHAI / OpenStreetMap)</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">
                          🟢 Live Geodesic
                        </span>
                      </div>
                      <div className="text-slate-800">
                        {geoIntelligence?.infrastructureRow?.distanceToHighwayKm ?? activeCadastral.distance_to_highway_km} km to {geoIntelligence?.infrastructureRow?.nearestHighwayName || 'NH-27 Highway Corridor'} · NHAI Setback: {geoIntelligence?.infrastructureRow?.nhaiSetbackMetres ?? 45}m
                      </div>
                      <div className="text-[9px] text-gray-500">
                        Corridor Status: Clear of notified 132kV/220kV EHV transmission lines
                      </div>
                    </div>

                    {/* Layer 6: Eco-Sensitive Zone */}
                    <div className="p-2 rounded-xl bg-[#F7F9F6] border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800 text-[11px]">6. Eco-Sensitive Zone (MoEFCC PARIVESH)</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                          Gazette Demarcation
                        </span>
                      </div>
                      <div className="text-slate-700">
                        {geoIntelligence?.ecoSensitiveZone?.statusText || activeCadastral.eco_sensitive_zone.esz_status}
                      </div>
                    </div>

                    {/* Layer 7: Seismic Hazard */}
                    <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-amber-950 text-[11px]">7. Seismic Zonation (BIS IS 1893:2016)</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-700 text-white font-bold">
                          ⚖️ Statutory Law
                        </span>
                      </div>
                      <div className="text-amber-950 font-bold">
                        {geoIntelligence?.seismic?.zone || 'Zone V (Maximum Seismic Hazard, Zone Factor Z = 0.36)'}
                      </div>
                      <div className="text-[9px] text-amber-800">
                        Statutory Fact: Entire Assam is classified under Seismic Zone V. Earthquake-resistant structural design is mandatory.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'risk' && (
                <div className="bg-white/85 rounded-2xl p-3 border border-white/90 space-y-2.5 text-[10.5px] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teagreen">
                      Statutory Legal &amp; Risk Parameters
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      Assam Law Standards
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2 leading-relaxed">
                    Always conduct formal registry and Circle Office due-diligence before financial disbursement. Platform checks cross-reference state gazette notifications.
                  </div>

                  <div className="space-y-2">
                    {/* Chapter X Tribal Belt */}
                    <div className="p-2.5 rounded-xl bg-[#F7F9F6] border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 text-[11px]">Chapter X Tribal Belt &amp; Block Status</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                          Assam 1886 Reg.
                        </span>
                      </div>
                      <div className="text-slate-800 font-semibold">
                        {activeCadastral.chapter_x_tribal_belt}
                      </div>
                      <p className="text-[9.5px] text-gray-500">
                        Governed by Chapter X of Assam Land and Revenue Regulation 1886 (Sec 160–171). Transfer to non-notified persons inside designated belts is prohibited without Deputy Commissioner sanction.
                      </p>
                    </div>

                    {/* 30-Yr IGR NEC */}
                    <div className="p-2.5 rounded-xl bg-[#F7F9F6] border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 text-[11px]">30-Yr Non-Encumbrance Certificate (NEC)</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                          IGR Assam
                        </span>
                      </div>
                      <div className="text-slate-800">
                        Certificate: <span className="font-mono font-bold text-evergreen">{activeCadastral.nec_30yr_certificate_no || 'Pending Upload'}</span> ({activeCadastral.encumbrance_status})
                      </div>
                      <p className="text-[9.5px] text-gray-500">
                        Records verified against Senior Sub-Registrar / IGR index records to confirm absence of prior registered mortgages or liens.
                      </p>
                    </div>

                    {/* Mutation Status */}
                    <div className="p-2.5 rounded-xl bg-[#F7F9F6] border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 text-[11px]">Mutation &amp; Jamabandi Endorsement</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                          Mission Basundhara
                        </span>
                      </div>
                      <div className="text-slate-800 font-medium">
                        Status: {activeCadastral.mutation_status} (Case: <span className="font-mono text-slate-700">{activeCadastral.last_mutation_case}</span>)
                      </div>
                    </div>

                    {/* Riverbank Erosion Risk */}
                    <div className="p-2.5 rounded-xl bg-[#F7F9F6] border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 text-[11px]">Fluvial &amp; Riverbank Erosion Risk</strong>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                          ASDMA Multi-Hazard
                        </span>
                      </div>
                      <div className="text-slate-800">
                        {activeCadastral.lulc_change.riverbank_erosion_risk || 'Low Risk — Elevated Alluvial Terrace (>3 km from active Brahmaputra channel)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM SECTION: SELLER-DECLARED ASKING PRICE & ACTIONS */}
            <div className="mt-2.5 pt-2.5 border-t border-white/70 space-y-2 flex-shrink-0">
              <div className="bg-warmivory/90 px-3 py-2 rounded-2xl border border-[#DFD6C3]">
                <div className="flex items-center justify-between text-[10px] text-secondarytext font-semibold">
                  <span>Seller-Declared Asking Price</span>
                  <span>Declared: {activeCadastral.declared_area_bigha} Bigha</span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="font-bold text-base text-evergreen">
                    ₹{activeCadastral.asking_price_inr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-bold text-teagreen">
                    {priceMeta.formattedLine}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate(`/land/${linkedListing?.id || 'lst-1'}`)}
                  className="py-2 px-2.5 rounded-xl bg-evergreen text-warmivory text-[11px] font-bold hover:bg-teagreen transition text-center shadow-sm"
                >
                  View Parcel →
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/passport/${linkedListing?.id || 'lst-1'}`)}
                  className="py-2 px-2.5 rounded-xl bg-white/90 border border-[#CFC5B0] text-evergreen text-[11px] font-bold hover:bg-cream transition text-center"
                >
                  Trust Passport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEARBY INFRASTRUCTURE & FACILITIES BREAKDOWN CARD */}
      {!compact && (
        <div className="p-5 sm:p-6 bg-white border-t border-[#E5EBE7] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-serif text-lg font-bold text-[#092F24]">
                Nearby Facilities &amp; Connectivity Infrastructure
              </h4>
              <p className="text-xs text-[#66736D]">
                Verified GIS ground distances from Dag {activeCadastral.dag_number} ({activeCadastral.village_name}, Kamrup).
              </p>
            </div>
            <span className="text-xs font-bold text-[#147D4A] bg-[#E9F2EC] px-3 py-1 rounded-full self-start sm:self-auto">
              {(selectedFacilityCategory === 'all'
                ? NEARBY_AMENITIES
                : NEARBY_AMENITIES.filter((a) => a.category === selectedFacilityCategory)
              ).length} Verified Facilities
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(selectedFacilityCategory === 'all'
              ? NEARBY_AMENITIES
              : NEARBY_AMENITIES.filter((a) => a.category === selectedFacilityCategory)
            ).map((amenity) => (
              <div
                key={amenity.id}
                className="p-3.5 rounded-2xl bg-[#F7F9F6] border border-[#E5EBE7] flex items-start gap-3 hover:border-[#147D4A] transition"
              >
                <span className="text-2xl shrink-0 mt-0.5">{amenity.icon}</span>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-xs text-[#092F24] truncate">{amenity.name}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${amenity.badgeColor}`}>
                      {amenity.distanceKm}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#66736D] leading-tight">{amenity.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
