import { describe, it, expect } from 'vitest';
import {
  calculateHighwayProximity,
  calculateEcoSensitiveZone,
  getLiveElevationMsl,
  getAuthoritativeGeoIntelligence
} from '../server/geoIntelligenceService.mjs';

describe('Authoritative Geospatial Intelligence & Real Data Integrations', () => {
  it('1. Geodesic Highway Engine: computes distance to Changsari NH-27 correctly', () => {
    // Changsari centroid [26.2442, 91.7061]
    const highway = calculateHighwayProximity(26.2442, 91.7061);
    expect(highway.distanceKm).toBeLessThan(2.0);
    expect(highway.nearestHighway).toContain('NH-27');
    expect(highway.setbackMetres).toBeGreaterThanOrEqual(30);
    expect(highway.source).toContain('OpenStreetMap');
  });

  it('2. Eco-Sensitive Zone: evaluates distance to Deepor Beel sanctuary accurately', () => {
    const esz = calculateEcoSensitiveZone(26.2442, 91.7061);
    expect(typeof esz.distanceKm).toBe('number');
    expect(esz.distanceKm).toBeGreaterThan(5); // ~13.8 km from Deepor Beel
    expect(esz.isOutsideEsz).toBe(true);
    expect(esz.source).toContain('PARIVESH');
  });

  it('3. Live Elevation: returns real elevation meters MSL for Assam coordinates', async () => {
    const elev = await getLiveElevationMsl(26.2442, 91.7061);
    expect(typeof elev.elevationMsl).toBe('number');
    expect(elev.elevationMsl).toBeGreaterThan(20);
    expect(elev.elevationMsl).toBeLessThan(300);
    expect(elev.source).toBeTruthy();
  });

  it('4. Full Geo-Intelligence Bundle: includes all 7 statutory and environmental layers', async () => {
    const bundle = await getAuthoritativeGeoIntelligence('AS-KMP-001', 26.2442, 91.7061, 'Kamrup', 'Changsari');
    expect(bundle.parcelId).toBe('AS-KMP-001');
    expect(bundle.seismic.zone).toContain('Zone V');
    expect(bundle.seismic.authority).toContain('BIS IS 1893:2016');
    expect(bundle.soilHealth.source).toContain('ICAR');
    expect(bundle.groundwater.source).toContain('CGWB');
    expect(bundle.lulc.source).toContain('ISRO');
    expect(bundle.infrastructureRow.source).toContain('OpenStreetMap');
    expect(bundle.ecoSensitiveZone.source).toContain('PARIVESH');
  });
});
