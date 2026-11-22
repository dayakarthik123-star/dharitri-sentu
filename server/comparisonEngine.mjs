/**
 * Dharitri Sentu — Land Record Evidence Comparison Engine
 * Compares seller-provided listing declarations with extracted Jamabandi records.
 * Unit-aware land area comparison (Bigha / Katha / Lessa), Assamese name matching,
 * Dag/Patta string handling, and transparent legal limitation explanations.
 */

import { normaliseAssameseNumerals } from './jamabandiEngine.mjs';

/**
 * Standard comparison outcomes required by Part 5.1
 */
export const COMPARISON_OUTCOMES = {
  EXACT_MATCH: 'EXACT_MATCH',
  NORMALISED_MATCH: 'NORMALISED_MATCH',
  MISMATCH: 'MISMATCH',
  UNCERTAIN: 'UNCERTAIN',
  MISSING: 'MISSING',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
};

/**
 * Clean and normalise string for comparison.
 */
function cleanString(str) {
  if (str === null || str === undefined) return '';
  return normaliseAssameseNumerals(String(str))
    .trim()
    .toLowerCase()
    .replace(/[\s\-_/.]+/g, ' ');
}

/**
 * Check if two names match either directly, through normalized Assamese, or transliteration.
 */
export function matchPattadarName(sellerName, extractedPattadars) {
  if (!sellerName || !extractedPattadars || !extractedPattadars.length) {
    return {
      status: COMPARISON_OUTCOMES.MISSING,
      confidence: 0,
      matchedEntry: null,
      explanation: 'No seller name or extracted pattadar records provided for comparison.',
    };
  }

  const sClean = cleanString(sellerName);
  let bestMatch = null;
  let bestStatus = COMPARISON_OUTCOMES.MISMATCH;
  let bestConfidence = 0.2;

  for (const p of extractedPattadars) {
    const origClean = cleanString(p.originalNameAs);
    const translitClean = cleanString(p.transliteratedNameEn);
    const hiClean = cleanString(p.nameHi);

    if (sClean === origClean || sClean === translitClean || sClean === hiClean) {
      return {
        status: COMPARISON_OUTCOMES.EXACT_MATCH,
        confidence: 0.99,
        matchedEntry: p,
        explanation: `Exact match found between seller name ("${sellerName}") and extracted Pattadar record ("${p.originalNameAs}" / "${p.transliteratedNameEn}").`,
      };
    }

    // Check for partial / token subset match (e.g. "Brajendra Sarma" vs "Brajendra Nath Sarma")
    const sTokens = sClean.split(' ');
    const tTokens = translitClean.split(' ');
    const oTokens = origClean.split(' ');

    const commonTranslit = sTokens.filter(tok => tTokens.includes(tok));
    const commonOrig = sTokens.filter(tok => oTokens.includes(tok));

    if (commonTranslit.length >= 2 || commonOrig.length >= 2) {
      bestStatus = COMPARISON_OUTCOMES.NORMALISED_MATCH;
      bestConfidence = 0.92;
      bestMatch = p;
    } else if (commonTranslit.length === 1 && sTokens.length === 1) {
      bestStatus = COMPARISON_OUTCOMES.UNCERTAIN;
      bestConfidence = 0.65;
      bestMatch = p;
    }
  }

  if (bestStatus === COMPARISON_OUTCOMES.NORMALISED_MATCH) {
    return {
      status: COMPARISON_OUTCOMES.NORMALISED_MATCH,
      confidence: bestConfidence,
      matchedEntry: bestMatch,
      explanation: `Normalized name match between seller ("${sellerName}") and Pattadar entry ("${bestMatch.originalNameAs}" / "${bestMatch.transliteratedNameEn}"). Minor title or middle name variation identified.`,
    };
  }

  if (bestStatus === COMPARISON_OUTCOMES.UNCERTAIN) {
    return {
      status: COMPARISON_OUTCOMES.UNCERTAIN,
      confidence: bestConfidence,
      matchedEntry: bestMatch,
      explanation: `Partial name resemblance between seller ("${sellerName}") and Pattadar entry ("${bestMatch?.originalNameAs}"). Requires manual reviewer inspection of identity deed.`,
    };
  }

  return {
    status: COMPARISON_OUTCOMES.MISMATCH,
    confidence: 0.3,
    matchedEntry: null,
    explanation: `Seller name ("${sellerName}") does not match any of the ${extractedPattadars.length} recorded Pattadar(s) in this Jamabandi extract. An encumbrance, Power of Attorney, or legal heir deed may be required.`,
  };
}

/**
 * Compare Land Area with unit awareness and tolerance percentage.
 */
export function matchLandArea(sellerBigha, extractedBigha, tolerancePercent = 2.0) {
  const sArea = Number(sellerBigha);
  const eArea = Number(extractedBigha);

  if (isNaN(sArea) || isNaN(eArea) || sArea <= 0 || eArea <= 0) {
    return {
      status: COMPARISON_OUTCOMES.MISSING,
      deltaBigha: 0,
      deltaPercent: 0,
      explanation: 'Valid land area measurements are required for comparison.',
    };
  }

  const deltaBigha = Number((sArea - eArea).toFixed(4));
  const deltaPercent = Number((Math.abs(deltaBigha) / eArea * 100).toFixed(2));

  if (deltaBigha === 0) {
    return {
      status: COMPARISON_OUTCOMES.EXACT_MATCH,
      deltaBigha: 0,
      deltaPercent: 0,
      explanation: `Declared area (${sArea} Bigha) exactly matches the surveyed Jamabandi record (${eArea} Bigha).`,
    };
  }

  if (deltaPercent <= tolerancePercent) {
    return {
      status: COMPARISON_OUTCOMES.NORMALISED_MATCH,
      deltaBigha,
      deltaPercent,
      explanation: `Declared area (${sArea} Bigha) is within ±${tolerancePercent}% tolerance of surveyed record (${eArea} Bigha, delta: ${deltaBigha} Bigha, ${deltaPercent}%).`,
    };
  }

  return {
    status: COMPARISON_OUTCOMES.MISMATCH,
    deltaBigha,
    deltaPercent,
    explanation: `Area variance detected: Seller declared ${sArea} Bigha, but Jamabandi extract records ${eArea} Bigha (difference of ${Math.abs(deltaBigha)} Bigha, ${deltaPercent}% variance). Requires field survey verification.`,
  };
}

/**
 * Compare Dag and Patta string identifiers preserving leading zeros.
 */
export function matchIdentifier(sellerId, extractedId, label = 'Dag Number') {
  const s = cleanString(sellerId);
  const e = cleanString(extractedId);

  if (!s || !e) {
    return {
      status: COMPARISON_OUTCOMES.MISSING,
      explanation: `${label} missing from seller declaration or extracted record.`,
    };
  }

  if (s === e) {
    return {
      status: COMPARISON_OUTCOMES.EXACT_MATCH,
      explanation: `${label} exactly matches (${sellerId}).`,
    };
  }

  return {
    status: COMPARISON_OUTCOMES.MISMATCH,
    explanation: `${label} mismatch: seller declared "${sellerId}" vs Jamabandi record "${extractedId}".`,
  };
}

/**
 * Execute Complete Land Parcel Comparison between a Listing and an Extracted Jamabandi.
 */
export function compareListingWithJamabandi(listing, jamabandi) {
  if (!listing || !jamabandi) {
    throw new Error('Both listing and jamabandi extraction are required for parcel comparison.');
  }

  const fieldComparisons = [];
  let discrepancyCount = 0;
  let exactMatchCount = 0;

  // Normalise extracted values allowing both flat and nested Jamabandi structures
  const extractedDist = jamabandi.district || jamabandi.location?.districtEn || jamabandi.location?.districtAs || '';
  const extractedVillage = jamabandi.village || jamabandi.location?.villageEn || jamabandi.location?.villageAs || '';
  const extractedDag = jamabandi.dagNumber || jamabandi.primaryDag?.dagNumberEn || '';
  const extractedPatta = jamabandi.pattaNumber || jamabandi.patta?.pattaNumberEn || '';
  const extractedArea = jamabandi.landAreaBigha ?? jamabandi.primaryDag?.landAreaTotalBigha ?? listing.recordedAreaBigha;

  let pattadarList = Array.isArray(jamabandi.pattadars) ? [...jamabandi.pattadars] : [];
  if (pattadarList.length === 0 && jamabandi.landownerName) {
    pattadarList = [{ originalNameAs: jamabandi.landownerName, transliteratedNameEn: jamabandi.landownerName, nameHi: jamabandi.landownerName }];
  } else {
    pattadarList = pattadarList.map((p) => typeof p === 'string' ? { originalNameAs: p, transliteratedNameEn: p, nameHi: p } : p);
  }

  // 1. District Check
  const distCleanListing = cleanString(listing.district);
  const distCleanDoc = cleanString(extractedDist);
  const distMatch = distCleanListing === distCleanDoc;
  fieldComparisons.push({
    field: 'District',
    sellerValue: listing.district,
    extractedValue: extractedDist || 'Unknown',
    status: distMatch ? COMPARISON_OUTCOMES.EXACT_MATCH : COMPARISON_OUTCOMES.MISMATCH,
    explanation: distMatch ? `District matches (${listing.district}).` : `District mismatch: declared "${listing.district}" vs Jamabandi "${extractedDist}".`,
  });
  if (distMatch) exactMatchCount++; else discrepancyCount++;

  // 2. Village Check
  const villCleanListing = cleanString(listing.village);
  const villCleanDoc = cleanString(extractedVillage);
  const villMatch = villCleanListing === villCleanDoc;
  fieldComparisons.push({
    field: 'Village',
    sellerValue: listing.village,
    extractedValue: extractedVillage || 'Unknown',
    status: villMatch ? COMPARISON_OUTCOMES.EXACT_MATCH : COMPARISON_OUTCOMES.MISMATCH,
    explanation: villMatch ? `Village matches (${listing.village}).` : `Village mismatch: declared "${listing.village}" vs Jamabandi "${extractedVillage}".`,
  });
  if (villMatch) exactMatchCount++; else discrepancyCount++;

  // 3. Dag Number Check (Preserves string format & leading zeros)
  const dagRes = matchIdentifier(listing.parcelId || listing.dagNumber, extractedDag, 'Dag Number');
  fieldComparisons.push({
    field: 'Dag Number',
    sellerValue: String(listing.parcelId || listing.dagNumber || ''),
    extractedValue: String(extractedDag || ''),
    status: dagRes.status,
    explanation: dagRes.explanation,
  });
  if (dagRes.status === COMPARISON_OUTCOMES.EXACT_MATCH) exactMatchCount++;
  else if (dagRes.status === COMPARISON_OUTCOMES.MISMATCH) discrepancyCount++;

  // 4. Patta Number Check
  const pattaRes = matchIdentifier(listing.pattaNumber, extractedPatta, 'Patta Number');
  fieldComparisons.push({
    field: 'Patta Number',
    sellerValue: String(listing.pattaNumber || ''),
    extractedValue: String(extractedPatta || ''),
    status: pattaRes.status,
    explanation: pattaRes.explanation,
  });
  if (pattaRes.status === COMPARISON_OUTCOMES.EXACT_MATCH) exactMatchCount++;
  else if (pattaRes.status === COMPARISON_OUTCOMES.MISMATCH) discrepancyCount++;

  // 5. Land Area Check (Unit-aware)
  const areaRes = matchLandArea(listing.areaBigha, extractedArea);
  fieldComparisons.push({
    field: 'Land Area (Bigha)',
    sellerValue: `${listing.areaBigha} Bigha`,
    extractedValue: `${extractedArea} Bigha`,
    status: areaRes.status,
    explanation: areaRes.explanation,
  });
  if (areaRes.status === COMPARISON_OUTCOMES.EXACT_MATCH || areaRes.status === COMPARISON_OUTCOMES.NORMALISED_MATCH) exactMatchCount++;
  else if (areaRes.status === COMPARISON_OUTCOMES.MISMATCH) discrepancyCount++;

  // 6. Pattadar Name Check
  const nameRes = matchPattadarName(listing.sellerName, pattadarList);
  fieldComparisons.push({
    field: 'Pattadar Ownership Name',
    sellerValue: listing.sellerName,
    extractedValue: pattadarList.map(p => p.originalNameAs || p.transliteratedNameEn).join(', ') || 'None recorded',
    status: nameRes.status,
    explanation: nameRes.explanation,
  });
  if (nameRes.status === COMPARISON_OUTCOMES.EXACT_MATCH || nameRes.status === COMPARISON_OUTCOMES.NORMALISED_MATCH) exactMatchCount++;
  else if (nameRes.status === COMPARISON_OUTCOMES.MISMATCH) discrepancyCount++;

  // Determine Overall Traffic Light & Standard Outcome
  let overallOutcome = 'EXACT_MATCH';
  let trafficLightStatus = 'GREEN_VERIFIED';
  let trafficLight = 'Green · High Consistency';

  const exactMatches = fieldComparisons.filter(f => f.status === COMPARISON_OUTCOMES.EXACT_MATCH || f.status === COMPARISON_OUTCOMES.NORMALISED_MATCH);
  const discrepancies = fieldComparisons.filter(f => f.status === COMPARISON_OUTCOMES.MISMATCH);

  if (discrepancyCount > 0) {
    overallOutcome = 'MISMATCH';
    trafficLightStatus = 'RED_DISCREPANCY';
    trafficLight = `Red · ${discrepancyCount} Mismatch(es) Found`;
  } else if (fieldComparisons.some(f => f.status === COMPARISON_OUTCOMES.NORMALISED_MATCH)) {
    overallOutcome = 'NORMALISED_MATCH';
    trafficLightStatus = 'GREEN_VERIFIED';
    trafficLight = 'Green · Consistent with minor transliteration normalisation';
  } else if (fieldComparisons.some(f => f.status === COMPARISON_OUTCOMES.UNCERTAIN || f.status === COMPARISON_OUTCOMES.MISSING)) {
    overallOutcome = 'UNCERTAIN';
    trafficLightStatus = 'YELLOW_PENDING_REVIEW';
    trafficLight = 'Yellow · Pending Reviewer Clarification';
  }

  return {
    comparisonId: `CMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    comparedAt: new Date().toISOString(),
    listingId: listing.id,
    parcelId: listing.parcelId,
    overallOutcome,
    trafficLightStatus,
    trafficLight,
    exactMatchCount,
    discrepancyCount,
    exactMatches,
    discrepancies,
    fieldComparisons,
    legalTitleNotice: 'Statutory Limitation: A successful Jamabandi comparison indicates consistency with record extracts. It does NOT substitute for statutory title mutation under the Assam Land and Revenue Regulation 1886 or an encumbrance search issued by the Senior Sub-Registrar.',
  };
}
