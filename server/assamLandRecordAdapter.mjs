/**
 * Authorised Assam Government Land-Record Adapter (Stage 6)
 *
 * Interface for querying official Assam Revenue Department systems:
 *  - ILRMS (Integrated Land Records Management System) / Dharitree
 *  - Landhub API Gateway / API Setu Assam Land Records
 *
 * CRITICAL GOVERNMENT INTEGRATION RULE:
 * Never invent API endpoints, credentials, responses or fake verified outcomes.
 * If external credentials or endpoints are not configured, return 'verification_unavailable'
 * and clearly explain that government verification requires authorised departmental connectivity.
 */

export function getAssamLandRecordConfig() {
  const endpoint = String(process.env.ASSAM_LAND_RECORDS_LOOKUP_URL || '').trim();
  const apiKey = String(process.env.ASSAM_LAND_RECORDS_API_KEY || '').trim();

  const isConfigured = Boolean(
    endpoint &&
      apiKey &&
      !/^(your_|placeholder|replace_me)/i.test(apiKey) &&
      !endpoint.includes('ilrms.assam.gov.in/') // Protect against unauthorized scraping of citizen portal
  );

  return {
    configured: isConfigured,
    endpointUrl: endpoint || null,
    status: isConfigured
      ? 'Authorised Assam Land-Record API gateway is configured.'
      : 'Authorised Assam ILRMS / Dharitree gateway is NOT configured. Government source lookup is unavailable.',
  };
}

/**
 * Query the authorised Assam land-record service for an authoritative parcel record.
 *
 * @param {string} parcelId - Dag number or parcel identifier (e.g. 'AS-KMP-001', '142')
 * @param {object} context - Additional search parameters (district, village, patta)
 * @returns {Promise<{
 *   status: 'verified_source' | 'verification_unavailable' | 'not_found' | 'error',
 *   sourceName: string,
 *   retrievedAt: string,
 *   data: object | null,
 *   message: string,
 *   disclaimer: string
 * }>}
 */
export async function lookupAssamLandRecord(parcelId, context = {}) {
  const config = getAssamLandRecordConfig();

  if (!config.configured) {
    return {
      status: 'verification_unavailable',
      sourceName: 'Assam ILRMS / Dharitree Gateway (Unconfigured)',
      retrievedAt: new Date().toISOString(),
      data: null,
      message:
        'Official government land-record verification is currently unavailable. Dharitri Sentu requires an authorised API gateway agreement with the Revenue and Disaster Management Department, Government of Assam.',
      disclaimer:
        'Without live governmental API access, submitted land documents cannot be automatically cross-referenced against the master revenue database.',
    };
  }

  try {
    const url = new URL(config.endpointUrl);
    if (url.protocol !== 'https:') {
      throw new Error('Configured land-record gateway must use HTTPS.');
    }

    url.searchParams.set('parcelId', parcelId);
    if (context.district) url.searchParams.set('district', context.district);
    if (context.village) url.searchParams.set('village', context.village);
    if (context.pattaNumber) url.searchParams.set('pattaNumber', context.pattaNumber);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.ASSAM_LAND_RECORDS_API_KEY}`,
        Accept: 'application/json',
        'User-Agent': 'DharitriSentu-LandEvidenceEngine/1.0',
      },
      signal: controller.signal,
      redirect: 'error',
    });

    clearTimeout(timeout);

    if (response.status === 404) {
      return {
        status: 'not_found',
        sourceName: 'Assam ILRMS Official Gateway',
        retrievedAt: new Date().toISOString(),
        data: null,
        message: `No official land record was found for parcel ${parcelId} in the queried revenue circle.`,
        disclaimer: 'Verify the Dag number, Patta number, and revenue village spelling.',
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        sourceName: 'Assam ILRMS Official Gateway',
        retrievedAt: new Date().toISOString(),
        data: null,
        message: `Authorised land-record gateway returned HTTP error ${response.status}.`,
        disclaimer: 'The upstream government service was temporarily unreachable.',
      };
    }

    const payload = await response.json();
    return {
      status: 'verified_source',
      sourceName: 'Assam ILRMS Official Gateway',
      retrievedAt: new Date().toISOString(),
      data: payload,
      message: `Authoritative land record retrieved for parcel ${parcelId}.`,
      disclaimer:
        'Official data retrieved under authorized government integration. Always subject to pending mutation applications.',
    };
  } catch (error) {
    return {
      status: 'error',
      sourceName: 'Assam ILRMS Gateway',
      retrievedAt: new Date().toISOString(),
      data: null,
      message: `Failed to query authorised land-record gateway: ${error instanceof Error ? error.message : String(error)}`,
      disclaimer: 'External gateway request failed.',
    };
  }
}
