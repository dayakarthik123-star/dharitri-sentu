// ============================================================================
// DHARITRI SENTU — COMPLETE 21 GOVERNMENT & GEOSPATIAL DATASETS TYPE SCHEMA
// ============================================================================

export interface SoilHealthDataset {
  source: 'VEDAS / ICAR Soil Health Card';
  ph_level: number;
  organic_carbon_percent: number;
  soil_texture: string;
  drainage_capacity: string;
  crop_suitability: string[];
}

export interface TopographicSlopeDataset {
  source: 'ISRO Bhuvan CartoDEM (10m)';
  elevation_msl_metres: number;
  slope_percentage: number;
  natural_drainage_gradient: string;
}

export interface GroundwaterProspectDataset {
  source: 'CGWB / Bhuvan-Bhujal';
  water_table_pre_monsoon_mbgl: number;
  water_table_post_monsoon_mbgl: number;
  aquifer_yield_lpm: number;
  potability_flag: string;
}

export interface MultiTemporalLULCDataset {
  source: 'MOSDAC / Bhuvan 1:50K Multi-Temporal';
  classification_2015: string;
  classification_2020: string;
  classification_2024: string;
  riverbank_erosion_risk: string;
  conversion_regularity: string;
}

export interface InfrastructureROWDataset {
  source: 'Assam Geoportal / NESDR ROW Registry';
  nhai_road_setback_metres: number;
  powerline_buffer_status: string;
  gas_pipeline_distance_metres: number;
}

export interface EcoSensitiveZoneDataset {
  source: 'MoEFCC PARIVESH ESZ & Forest Buffer';
  nearest_protected_area: string;
  distance_to_esz_km: number;
  esz_status: string;
}

export interface SeismicMicroZonationDataset {
  source: 'ASDMA / GSI Seismic Micro-Zonation';
  seismic_zone: string;
  micro_zonation_class: string;
  nearest_active_fault: string;
}

export interface CadastralParcelRecord {
  // 1. Administrative Hierarchy
  parcel_id: string;
  listing_id: string;
  district_code: string;
  district_name: string;
  circle_code: string;
  circle_name: string;
  mouza: string;
  village_lgd_code: string;
  village_name: string;

  // 2. Cadastral Parcel Data (WGS-84 EPSG:4326)
  dag_number: string;
  patta_number: string;
  ulpin: string;
  centroid: [number, number]; // [lat, lng]
  polygon_coords: [number, number][]; // Array of [lat, lng]
  svg_points: string; // Fallback projected viewport points
  svg_center: { x: number; y: number };

  // 3. Ownership & Land Records (Dharitree Assam)
  ror_jamabandi_ref: string;
  pattadar_name: string;
  land_class: string;
  tenure_type: string;
  surveyed_area_bigha: number;
  declared_area_bigha: number;

  // 4. Transaction Documents & 5. Encumbrance Evidence (IGR Assam)
  registered_deed_ref: string;
  nec_30yr_certificate_no: string;
  encumbrance_status: string;

  // 6. Mutation & Case Status (Mission Basundhara 3.0)
  last_mutation_case: string;
  mutation_status: string;

  // 7. Legal Restrictions (Assam Land & Revenue Regulation, 1886)
  chapter_x_tribal_belt: string;

  // 8. Official Valuation & 9. Real Market Prices
  zonal_valuation_inr_per_bigha: number;
  asking_price_inr: number;

  // 10. Environmental Risks (ASDMA)
  asdma_flood_zone: string;

  // 11. Infrastructure & Road Access
  road_access_summary: string;
  distance_to_highway_km: number;

  // 12. Property Listing Evidence & 13. Price Comparables
  verification_traffic_light: 'green' | 'yellow' | 'red';
  verification_badge_label: string;
  comparable_median_per_bigha_inr: number;

  // 14. Multilingual Labels
  localized_names: {
    en: string;
    as: string;
    hi: string;
  };

  // 15–21. 7 Advanced Geospatial Enrichment Datasets
  soil_health: SoilHealthDataset;
  topographic_slope: TopographicSlopeDataset;
  groundwater_prospects: GroundwaterProspectDataset;
  lulc_change: MultiTemporalLULCDataset;
  infrastructure_row: InfrastructureROWDataset;
  eco_sensitive_zone: EcoSensitiveZoneDataset;
  seismic_micro_zonation: SeismicMicroZonationDataset;
}

export interface MapSourceStatus {
  provider: string;
  hasCustomKey: boolean;
  imageryCurrencyLabel: string;
  crs: 'EPSG:4326 (WGS-84)';
  connectedPilotAreas: string[];
}
