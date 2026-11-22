-- ============================================================================
-- DHARITRI SENTU — ASSAM CADASTRAL & GEOSPATIAL PARCELS POSTGIS SCHEMA (EPSG:4326)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS assam_cadastral_parcels (
  parcel_id VARCHAR(32) PRIMARY KEY,
  listing_id VARCHAR(32) NOT NULL,
  ulpin CHAR(14) UNIQUE NOT NULL,
  district_code VARCHAR(16) NOT NULL,
  district_name VARCHAR(64) NOT NULL,
  circle_code VARCHAR(24) NOT NULL,
  circle_name VARCHAR(64) NOT NULL,
  mouza VARCHAR(64) NOT NULL,
  village_lgd_code VARCHAR(16) NOT NULL,
  village_name VARCHAR(64) NOT NULL,
  dag_number VARCHAR(16) NOT NULL,
  patta_number VARCHAR(16) NOT NULL,
  ror_jamabandi_ref VARCHAR(64) NOT NULL,
  pattadar_name VARCHAR(128) NOT NULL,
  land_class VARCHAR(64) NOT NULL,
  tenure_type VARCHAR(64) NOT NULL,
  surveyed_area_bigha NUMERIC(8,2) NOT NULL,
  declared_area_bigha NUMERIC(8,2) NOT NULL,
  zonal_valuation_inr_per_bigha INTEGER NOT NULL,
  asking_price_inr INTEGER NOT NULL,
  last_mutation_case VARCHAR(64) NOT NULL,
  mutation_status VARCHAR(64) NOT NULL,
  chapter_x_tribal_belt VARCHAR(64) NOT NULL,
  asdma_flood_zone VARCHAR(64) NOT NULL,
  soil_ph NUMERIC(4,2),
  elevation_msl_metres NUMERIC(6,1),
  seismic_zone VARCHAR(32),
  centroid_lat NUMERIC(9,6) NOT NULL,
  centroid_lng NUMERIC(9,6) NOT NULL,
  geom GEOMETRY(Polygon, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assam_cadastral_geom ON assam_cadastral_parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_assam_cadastral_dag ON assam_cadastral_parcels (dag_number);
CREATE INDEX IF NOT EXISTS idx_assam_cadastral_ulpin ON assam_cadastral_parcels (ulpin);

INSERT INTO assam_cadastral_parcels (
  parcel_id, listing_id, ulpin, district_code, district_name, circle_code, circle_name,
  mouza, village_lgd_code, village_name, dag_number, patta_number, ror_jamabandi_ref,
  pattadar_name, land_class, tenure_type, surveyed_area_bigha, declared_area_bigha,
  zonal_valuation_inr_per_bigha, asking_price_inr, last_mutation_case, mutation_status,
  chapter_x_tribal_belt, asdma_flood_zone, soil_ph, elevation_msl_metres, seismic_zone,
  centroid_lat, centroid_lng, geom
) VALUES
(
  'AS-KMP-001', 'lst-1', '18290412008901', 'AS-18-KMP', 'Kamrup', 'CIR-NGHY-04', 'North Guwahati',
  'Silasindurighopa Mouza', 'LGD-280412', 'Changsari', '412', '89', 'DHAR-ROR-2025-KMP-412',
  'Pranabjyoti Kalita', 'Agricultural (Rupit / Sali)', 'Myadi Patta (Periodic)', 2.35, 2.50,
  680000, 1800000, 'MB3/MUT/2025/KMP/08412', 'Disposed — Approved on Dharitree',
  'Outside Protected Tribal Belt', 'Low Hazard (Elevated River Terrace)', 5.65, 58.4, 'Zone V (High)',
  26.244200, 91.706100,
  ST_GeomFromText('POLYGON((91.7048 26.2451, 91.7073 26.2453, 91.7076 26.2433, 91.7050 26.2431, 91.7048 26.2451))', 4326)
),
(
  'AS-KMP-104', 'lst-2', '18290104021504', 'AS-18-KMM', 'Kamrup Metropolitan', 'CIR-DISP-01', 'Dispur',
  'Beltola Mouza', 'LGD-280104', 'Khanapara', '104', '215', 'DHAR-ROR-2025-KMM-104',
  'Pranabjyoti Kalita', 'Bari (Homestead / Commercial Corridor)', 'Myadi Patta (Periodic)', 3.00, 3.00,
  700000, 2200000, 'MB3/MUT/2025/KMM/01104', 'Disposed — Approved on Dharitree',
  'Outside Protected Tribal Belt', 'Minimal Hazard (Piedmont Uplands)', 5.80, 67.2, 'Zone V (High)',
  26.121400, 91.816600,
  ST_GeomFromText('POLYGON((91.8152 26.1224, 91.8178 26.1226, 91.8180 26.1205, 91.8154 26.1203, 91.8152 26.1224))', 4326)
),
(
  'AS-JRT-785', 'lst-5', '18150785006409', 'AS-18-JRT', 'Jorhat', 'CIR-JRTE-02', 'Jorhat East',
  'Cinnamara Mouza', 'LGD-281785', 'Cinnamara Tea Estate', '785', '64', 'DHAR-ROR-2025-JRT-785',
  'Monideepa Gogoi', 'Tea Periodic Patta (High Tableland)', 'Myadi Patta (Tea Grant)', 4.20, 4.20,
  720000, 3100000, 'MB3/MUT/2025/JRT/09785', 'Disposed — Approved on Dharitree',
  'Outside Protected Tribal Belt', 'Minimal Hazard (Well-Drained Tea Bench)', 4.95, 94.0, 'Zone V (High)',
  26.715900, 94.225700,
  ST_GeomFromText('POLYGON((94.2240 26.7170, 94.2272 26.7173, 94.2275 26.7148, 94.2242 26.7145, 94.2240 26.7170))', 4326)
),
(
  'AS-DBR-219', 'lst-3', '18160219011207', 'AS-18-DBR', 'Dibrugarh', 'CIR-DBRE-01', 'Dibrugarh East',
  'Mancotta Mouza', 'LGD-282219', 'Chowkidinghee', '219', '112', 'DHAR-ROR-2025-DBR-219',
  'Monideepa Gogoi', 'Tea Garden & Homestead Periphery', 'Myadi Patta (Periodic)', 4.50, 4.50,
  760000, 3600000, 'MB3/PART/2025/DBR/03219', 'Under Circle Officer Verification',
  'Outside Protected Tribal Belt', 'Low-Moderate Seasonal Drainage Zone', 5.10, 108.5, 'Zone V (High)',
  27.472700, 94.912600,
  ST_GeomFromText('POLYGON((94.9110 27.4738, 94.9141 27.4740, 94.9143 27.4716, 94.9112 27.4714, 94.9110 27.4738))', 4326)
),
(
  'AS-NGN-530', 'lst-6', '18100530009802', 'AS-18-NGN', 'Nagaon', 'CIR-SMGR-03', 'Samaguri',
  'Bheleuguri Mouza', 'LGD-283530', 'Samaguri', '530', '98', 'DHAR-ROR-2025-NGN-530',
  'Pranabjyoti Kalita', 'Agricultural (Double-Crop Sali & Bao)', 'Myadi Patta (Periodic)', 3.50, 3.50,
  590000, 2150000, 'MB3/MUT/2025/NGN/04530', 'Disposed — Approved on Dharitree',
  'Outside Protected Tribal Belt', 'Low Flood Plain (Embankment Protected)', 6.10, 63.8, 'Zone V (High)',
  26.411400, 92.849000,
  ST_GeomFromText('POLYGON((92.8475 26.4125, 92.8504 26.4127, 92.8506 26.4104, 92.8477 26.4102, 92.8475 26.4125))', 4326)
),
(
  'AS-BKS-318', 'lst-4', '18240318007605', 'AS-18-BKS', 'Baksa', 'CIR-BKSA-02', 'Baksa',
  'Ghopa Mouza', 'LGD-284318', 'Ghopa', '318', '76', 'DHAR-ROR-2025-BKS-318',
  'Pranabjyoti Kalita', 'Agricultural & Protected Belt Margin', 'Myadi Patta (Restricted Belt)', 1.80, 2.00,
  620000, 1450000, 'MB3/CONV/2025/BKS/07318', 'Flagged — Chapter X Protected Belt Review',
  'Within Chapter X Tribal Belt (Prior Verification Required)', 'Low Hazard (Sub-Himalayan Bhabar Zone)', 5.85, 81.2, 'Zone V (High)',
  26.590200, 91.423400,
  ST_GeomFromText('POLYGON((91.4220 26.5912, 91.4246 26.5914, 91.4248 26.5893, 91.4222 26.5891, 91.4220 26.5912))', 4326)
);
