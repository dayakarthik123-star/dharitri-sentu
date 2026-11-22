import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { CADASTRAL_PARCEL_RECORDS } from '../../services/cadastralService';
import { SEED_LISTINGS } from '../../data/seedData';
import { CadastralParcelRecord } from '../../types/cadastral';
import { API_MODE, apiRequest } from '../../services/apiClient';

export interface StructuredBullet {
  icon: 'check' | 'warn' | 'info';
  label: string;
  detail: string;
}

export interface ChatTurnAction {
  label: string;
  to: string;
  primary?: boolean;
}

export interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  detectedLangLabel: string;
  title?: string;
  summary: string;
  bullets?: StructuredBullet[];
  citations?: string[];
  actions?: ChatTurnAction[];
  timestamp: string;
}

export type DomainIntent =
  | 'PARCEL_INSPECTION'
  | 'PATTA_COMPARISON'
  | 'TRIBAL_BELT'
  | 'FLOOD_ZONATION'
  | 'LAND_UNIT_CALC'
  | 'MISSION_BASUNDHARA'
  | 'BUYING_CHECKLIST'
  | 'GEOSPATIAL_LAYERS'
  | 'DYNAMIC_FALLBACK';

const SUGGESTED_PROMPTS = [
  {
    label: 'Analyze Parcel AS-KMP-001 (Dag 412)',
    query: 'Analyze Parcel AS-KMP-001 (Dag 412 in Changsari) and explain the area variance and price.',
  },
  {
    label: 'Eksona vs. Miyadi Patta Rules',
    query: 'What is the legal difference between Eksona (Annual) Patta and Miyadi (Periodic) Patta in Assam?',
  },
  {
    label: 'Chapter X Tribal Belt Restrictions',
    query: 'Explain Chapter X Tribal Belt & Block restrictions under Sections 160-162 of ALRR 1886.',
  },
  {
    label: 'ASDMA Flood Hazard Zones 1–3',
    query: 'How does ASDMA Flood Hazard Zonation (Zone 1, Zone 2, Zone 3) and the 500m Brahmaputra buffer work?',
  },
  {
    label: 'Convert 2.5 Bigha to Katha, Lessa & Sq.Ft.',
    query: 'Convert 2.5 Bigha into Katha, Lessa, Sq. Ft., and Acre under Assam revenue measurement rules.',
  },
  {
    label: 'Mission Basundhara 3.0 & Mutation',
    query: 'How does online digital mutation, Nocira, and Jamabandi update work under Mission Basundhara 3.0?',
  },
  {
    label: 'Required Buying Documents Checklist',
    query: 'What documents are required in the due diligence checklist before buying land in Assam?',
  },
  {
    label: 'অসমীয়াত মাটি পৰীক্ষা (Assamese)',
    query: 'কামৰূপৰ চাংসাৰিত দাগ ৪১২ ৰ মাটি কেনেকৈ কিনিম আৰু একচনা পট্টা কি?',
  },
  {
    label: 'हिन्दी / Hinglish ज़मीन सलाह',
    query: 'Assam mein zameen kharidne ke liye Jamabandi patta aur flood zone kaise check karein?',
  },
];

export const TWELVE_CAPABILITY_PILLARS = [
  {
    id: 'pillar-1',
    number: '01',
    title: 'EPSG:4326 Cadastral & Satellite Engine',
    source: 'MapTiler / Esri World Imagery + Surveyed WGS-84 Polygons',
    summary: 'Real-time Dag and 14-digit ULPIN search with glowing centroid pins and Liquid Retina Glass Inspector.',
    route: '/explore',
  },
  {
    id: 'pillar-2',
    number: '02',
    title: 'Traffic-Light Land Trust Passport',
    source: 'Dharitree Assam RoR + Seller Declaration Cross-Check',
    summary: 'Instant Green (Verified), Yellow (Warning), and Red (Issue Found) legal readiness indicators.',
    route: '/passport/lst-1',
  },
  {
    id: 'pillar-3',
    number: '03',
    title: 'Automated Discrepancy Detection Engine',
    source: 'Survey Area vs Declared Bigha-Katha-Lessa Audit',
    summary: 'Flags area variances (e.g., 2.50 vs 2.35 Bigha) and Dag number mismatches before any deposit is paid.',
    route: '/discrepancies',
  },
  {
    id: 'pillar-4',
    number: '04',
    title: 'Mission Basundhara 3.0 Mutation Tracker',
    source: 'Assam Revenue & Disaster Management Case Status',
    summary: 'Displays live mutation, partition, and conversion case identifiers for every surveyed parcel.',
    route: '/trust-centre',
  },
  {
    id: 'pillar-5',
    number: '05',
    title: 'Chapter X Tribal Belt & Block Safeguard',
    source: 'Assam Land and Revenue Regulation, 1886',
    summary: 'Automatically highlights protected belt transfer restrictions (such as Ghopa Dag 318 in Baksa).',
    route: '/discrepancies',
  },
  {
    id: 'pillar-6',
    number: '06',
    title: '30-Year IGR Encumbrance & Deed Lineage',
    source: 'Inspector General of Registration (IGR) Assam',
    summary: 'Links Non-Encumbrance Certificate (NEC) references and registered sale deed chains.',
    route: '/landlocker',
  },
  {
    id: 'pillar-7',
    number: '07',
    title: 'VEDAS / ICAR Soil Health & Crop Suitability',
    source: 'SAC ISRO VEDAS & ICAR Soil Health Card',
    summary: 'Provides soil pH, organic carbon %, texture, and suitability for Tea, Sali Paddy, and Horticulture.',
    route: '/explore',
  },
  {
    id: 'pillar-8',
    number: '08',
    title: 'ISRO Bhuvan CartoDEM Elevation & Slope',
    source: 'ISRO Bhuvan 10m Digital Elevation Model',
    summary: 'Measures mean sea level elevation (m), slope %, and natural drainage gradients.',
    route: '/explore',
  },
  {
    id: 'pillar-9',
    number: '09',
    title: 'ASDMA Flood Hazard & Riverbank Erosion Analytics',
    source: 'Assam State Disaster Management Authority + MOSDAC',
    summary: 'Combines multi-year flood inundation zones with 2015–2024 satellite LULC change detection.',
    route: '/explore',
  },
  {
    id: 'pillar-10',
    number: '10',
    title: 'CGWB Groundwater, ROW & PARIVESH ESZ Buffers',
    source: 'CGWB Bhuvan-Bhujal + NESDR + MoEFCC PARIVESH',
    summary: 'Tracks pre/post-monsoon water table depth, NHAI highway setbacks, and Eco-Sensitive Zone buffers.',
    route: '/explore',
  },
  {
    id: 'pillar-11',
    number: '11',
    title: 'GSI Seismic Micro-Zonation (Zone V)',
    source: 'Geological Survey of India & ASDMA Micro-Zonation',
    summary: 'Reports liquefaction resistance class and proximity to active faults in Assam Zone V.',
    route: '/explore',
  },
  {
    id: 'pillar-12',
    number: '12',
    title: 'Multilingual Voice & Text AI Guide',
    source: 'Assamese, Hindi, Hinglish & English Speech/Text Engine',
    summary: 'Detects user language automatically and answers with structured, citation-backed UI cards.',
    route: '/assistant',
  },
];

/**
 * Pure Hindi / Hinglish detection helper.
 * Strictly excludes generic Assam administrative terms (bigha, katha, lessa, patta, mutation, dag, jamabandi, chitha)
 * so English queries containing regional revenue terms are never misclassified as Hindi.
 */
export function isHindiOrHinglish(query: string): boolean {
  const trimmed = query.trim();
  // 1. Explicit Devanagari script (U+0900..U+097F)
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return true;
  }
  // 2. Explicit Hindi conversational/grammar words only (never domain nouns like bigha/patta/dag/mutation)
  const lower = trimmed.toLowerCase();
  const hindiGrammarRegex =
    /\b(kya|kaise|chahiye|hai|hain|mein|aur|batao|bataiye|kharidna|zameen|kagaz|naksha|daam|kitna|kahan|kyun|mera|apना|apna|karein|karna)\b/;
  return hindiGrammarRegex.test(lower);
}

/**
 * Separates language detection from domain intent classification.
 */
export function detectQueryLanguage(
  query: string,
  fallbackLang: 'en' | 'as' | 'hi' = 'en'
): { code: 'en' | 'as' | 'hi' | 'hinglish'; label: string } {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check Assamese / Bengali Unicode block (U+0980..U+09FF)
  if (/[\u0980-\u09FF]/.test(trimmed)) {
    return { code: 'as', label: 'অসমীয়া (Assamese)' };
  }

  // 2. Check Devanagari Unicode block (U+0900..U+097F)
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return { code: 'hi', label: 'हिन्दी (Hindi)' };
  }

  // 3. Check Romanized Assamese conversational tokens (excluding generic English/land terms)
  if (/\b(mati|kenekoi|kinim|kiba|nomoskar|axom|changsari-t|kene|kot|kom|bhal)\b/.test(lower)) {
    return { code: 'as', label: 'অসমীয়া (Assamese)' };
  }

  // 4. Check Romanized Hinglish grammar tokens via strict `isHindiOrHinglish`
  if (isHindiOrHinglish(trimmed)) {
    return { code: 'hinglish', label: 'Hinglish (Hindi + EN)' };
  }

  // 5. If the query contains clear English words/syntax, keep it in English even if UI language is switched,
  // unless there are no English indicators and fallbackLang is set.
  if (/[a-zA-Z]/.test(trimmed)) {
    return { code: 'en', label: 'English' };
  }

  if (fallbackLang === 'as') return { code: 'as', label: 'অসমীয়া (Assamese)' };
  if (fallbackLang === 'hi') return { code: 'hi', label: 'हिन्दी (Hindi)' };
  return { code: 'en', label: 'English' };
}

/**
 * Normalize Assamese and Devanagari digits to ASCII digits so Dag/Parcel lookups work in all scripts.
 */
function normalizeDigits(input: string): string {
  return input
    .replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));
}

/**
 * Matches a specific parcel from `CADASTRAL_PARCEL_RECORDS` or `SEED_LISTINGS`
 * when the query mentions a parcel ID (`AS-KMP-001`), ULPIN, Dag number (`412`, `142`, `104`, `785`, `219`, `530`, `318`), or village name.
 */
export function findReferencedParcel(query: string): CadastralParcelRecord | undefined {
  const norm = normalizeDigits(query).toLowerCase();

  // 1. Check explicit parcel_id or ULPIN match
  for (const rec of CADASTRAL_PARCEL_RECORDS) {
    if (
      norm.includes(rec.parcel_id.toLowerCase()) ||
      norm.includes(rec.ulpin.toLowerCase())
    ) {
      return rec;
    }
  }

  // 2. Check SEED_LISTINGS parcelId (e.g., AS-KMP-002 -> maps to lst-2 / AS-KMP-104)
  for (const lst of SEED_LISTINGS) {
    if (norm.includes(lst.parcelId.toLowerCase())) {
      const mapped = CADASTRAL_PARCEL_RECORDS.find((r) => r.listing_id === lst.id);
      if (mapped) return mapped;
    }
  }

  // 3. Check explicit Dag number word boundaries
  for (const rec of CADASTRAL_PARCEL_RECORDS) {
    const dagRegex = new RegExp(`\\b(dag\\s*#?\\s*)?${rec.dag_number}\\b`, 'i');
    if (dagRegex.test(norm)) {
      return rec;
    }
  }

  // 4. Check village names when paired with parcel/dag/inspect/check context
  for (const rec of CADASTRAL_PARCEL_RECORDS) {
    const vLower = rec.village_name.toLowerCase();
    if (norm.includes(vLower)) {
      return rec;
    }
  }
  if (norm.includes('চাংসাৰি')) return CADASTRAL_PARCEL_RECORDS[0];
  if (norm.includes('আমিনগাঁও')) return CADASTRAL_PARCEL_RECORDS[1];
  if (norm.includes('খানাপাৰা') || norm.includes('সোণাপুৰ') || norm.includes('sonapur')) {
    return CADASTRAL_PARCEL_RECORDS.find((r) => r.dag_number === '104');
  }
  if (norm.includes('চিনামৰা') || norm.includes('cinnamara')) {
    return CADASTRAL_PARCEL_RECORDS.find((r) => r.dag_number === '785');
  }
  if (norm.includes('চৌকিডিঙী') || norm.includes('chowkidinghee')) {
    return CADASTRAL_PARCEL_RECORDS.find((r) => r.dag_number === '219');
  }
  if (norm.includes('চামগুৰি') || norm.includes('samaguri')) {
    return CADASTRAL_PARCEL_RECORDS.find((r) => r.dag_number === '530');
  }
  if (norm.includes('ঘোপা') || norm.includes('বাক্সা') || norm.includes('ghopa')) {
    return CADASTRAL_PARCEL_RECORDS.find((r) => r.dag_number === '318');
  }

  return undefined;
}

/**
 * Classifies user query into one of 9 distinct domain intents.
 */
export function classifyDomainIntent(query: string): DomainIntent {
  const norm = normalizeDigits(query).toLowerCase();

  // Check if user is asking about Eksona vs Miyadi Patta specifically
  if (
    /\b(eksona|ekchona|annual patta|miyadi|myadi|periodic patta|patta conversion|eksona vs|miyadi vs)\b/.test(
      norm
    ) ||
    norm.includes('একচনা') ||
    norm.includes('ম্যাদী') ||
    norm.includes('एकसाला') ||
    norm.includes('मियादी')
  ) {
    return 'PATTA_COMPARISON';
  }

  // Check if user is asking about Chapter X Tribal Belt & Block restrictions (without a specific parcel or specifically about Tribal Belt law)
  if (
    /\b(tribal belt|tribal block|chapter x|chapter 10|section 160|section 161|section 162|alrr 1886|protected belt|protected class|btr|boko|dimoria|rani)\b/.test(
      norm
    ) ||
    norm.includes('ট্ৰাইবেল বেল্ট') ||
    norm.includes('জনজাতীয় বেল্ট') ||
    norm.includes('ट्राइबल बेल्ट')
  ) {
    // If they specifically ask about Chapter X / Tribal Belt rules, return TRIBAL_BELT intent
    return 'TRIBAL_BELT';
  }

  // Check if user is asking about ASDMA Flood Hazard Zonation (Zone 1, 2, 3, riverbank buffer)
  if (
    /\b(flood|asdma|zonation|zone 1|zone 2|zone 3|500m|riverbank|erosion|inundation|brahmaputra buffer|waterlogging|hfl)\b/.test(
      norm
    ) &&
    !norm.includes('dag 412') &&
    !norm.includes('as-kmp-001')
  ) {
    return 'FLOOD_ZONATION';
  }
  if (norm.includes('বানপানী') || norm.includes('बाढ़')) {
    if (!findReferencedParcel(norm)) {
      return 'FLOOD_ZONATION';
    }
  }

  // Check if user is asking for Land Unit Measurements & Calculations (Bigha, Katha, Lessa, Sq. Ft., Acre, Hectare)
  if (
    /\b(how many|convert|conversion|calculation|calculate|lessa|katha|sq\.?\s*ft|square feet|14400|14,400|1337|hectare|unit|measurement)\b/.test(
      norm
    ) ||
    (/\b(bigha)\b/.test(norm) && /\b(katha|lessa|acre|sqft|sq ft|feet|meter|metre|equal)\b/.test(norm)) ||
    norm.includes('লেচা') ||
    norm.includes('কঠা')
  ) {
    return 'LAND_UNIT_CALC';
  }

  // Check if user is asking about Mission Basundhara 3.0, Digital Mutation, Nocira, Jamabandi, Chitha, Lot Mandal
  if (
    /\b(mission basundhara|basundhara 3\.0|basundhara|mutation|namjari|nocira|chitha|lot mandal|sewa setu|epanjeeyan|e-panjeeyan|succession|partition)\b/.test(
      norm
    ) &&
    !findReferencedParcel(norm)
  ) {
    return 'MISSION_BASUNDHARA';
  }
  if ((norm.includes('মিছন বসুন্ধৰা') || norm.includes('নামজাৰি')) && !findReferencedParcel(norm)) {
    return 'MISSION_BASUNDHARA';
  }

  // Check if user is asking about Required Buying Documents / Due Diligence Checklist
  if (
    /\b(document|documents|checklist|due diligence|nec|non-encumbrance|encumbrance|form 26|khajana|land revenue receipt|trace map|what to check|before buying|buying guide|circle rate|zonal valuation)\b/.test(
      norm
    ) &&
    !findReferencedParcel(norm)
  ) {
    return 'BUYING_CHECKLIST';
  }

  // Check if user is asking about Geospatial / Scientific Layers (Soil, Slope, Groundwater, Seismic Zone V)
  if (
    /\b(soil|vedas|icar|cartodem|slope|groundwater|cgwb|seismic|zone v|liquefaction|esz|parivesh|lulc|7 scientific|geospatial)\b/.test(
      norm
    ) &&
    !norm.includes('412') &&
    !norm.includes('142') &&
    !norm.includes('104')
  ) {
    return 'GEOSPATIAL_LAYERS';
  }

  // Check if user references any specific parcel / Dag / village
  if (findReferencedParcel(norm)) {
    return 'PARCEL_INSPECTION';
  }

  // Check broader Hindi/Assamese buying questions
  if (
    /\b(kharidna|kinim|buy|purchase|verify|check)\b/.test(norm) ||
    norm.includes('মাটি কেনেকৈ কিনিম') ||
    norm.includes('जमाबंदी')
  ) {
    return 'BUYING_CHECKLIST';
  }

  return 'DYNAMIC_FALLBACK';
}

export function buildStructuredAssistantTurn(
  question: string,
  fallbackLang: 'en' | 'as' | 'hi' = 'en'
): Omit<ChatTurn, 'id' | 'sender' | 'timestamp'> {
  const langInfo = detectQueryLanguage(question, fallbackLang);
  const intent = classifyDomainIntent(question);
  const norm = normalizeDigits(question);
  const matchedParcel = findReferencedParcel(question);

  // ============================================================================
  // INTENT 1: SPECIFIC PARCEL INSPECTION (AS-KMP-001, Dag 412, 142, 104, 785, 219, 530, 318)
  // ============================================================================
  if (intent === 'PARCEL_INSPECTION' && matchedParcel) {
    const p = matchedParcel;
    const areaDiff = +(Math.abs(p.declared_area_bigha - p.surveyed_area_bigha)).toFixed(2);
    const hasMismatch = areaDiff > 0.01;
    const pricePerBigha = Math.round(p.asking_price_inr / p.declared_area_bigha);

    if (langInfo.code === 'as') {
      return {
        detectedLangLabel: langInfo.label,
        title: `ভূমি নিৰীক্ষণ প্রতিবেদন — ${p.localized_names.as} (${p.parcel_id})`,
        summary: `ধৰিত্ৰী সেতুৱে ${p.village_name}ৰ দাগ ${p.dag_number} (পট্টা নং ${p.patta_number}, ULPIN: ${p.ulpin}) ৰ চৰকাৰী তথ্য আৰু ভূ-স্থানিক স্তৰসমূহ পৰীক্ষা কৰিছে:`,
        bullets: [
          {
            icon: hasMismatch ? 'warn' : 'check',
            label: `পট্টাদাৰ আৰু মাটিকালি (${p.pattadar_name} · ${p.tenure_type})`,
            detail: hasMismatch
              ? `বিক্ৰেতাই ${p.declared_area_bigha} বিঘা ঘোষণা কৰিছে, কিন্তু জৰীপ নথিত ${p.surveyed_area_bigha} বিঘা আছে (${areaDiff} বিঘাৰ পাৰ্থক্য)।`
              : `বিক্ৰেতাৰ ঘোষিত ${p.declared_area_bigha} বিঘা মাটিকালি চৰকাৰী জৰীপ নথিৰ সৈতে সম্পূর্ণ মিলিছে।`,
          },
          {
            icon: p.chapter_x_tribal_belt.includes('Within') ? 'warn' : 'check',
            label: 'নামজাৰি, বোজা-মুক্ত (NEC) আৰু ট্ৰাইবেল বেল্ট স্থিতি',
            detail: `নামজাৰি গোচৰ: ${p.last_mutation_case} (${p.mutation_status}) · ৩০ বছৰীয়া NEC: ${p.nec_30yr_certificate_no} · ${p.chapter_x_tribal_belt}।`,
          },
          {
            icon: 'info',
            label: 'বানপানীৰ শংকা আৰু মূল্য তুলনা (ASDMA & IGR)',
            detail: `বানপানী স্তৰ: ${p.asdma_flood_zone}। বিক্ৰেতাৰ মূল্য: ₹${p.asking_price_inr.toLocaleString('en-IN')} (প্ৰতি বিঘাত ₹${pricePerBigha.toLocaleString('en-IN')}) বনাম চৰকাৰী আঞ্চলিক মূল্য ₹${p.zonal_valuation_inr_per_bigha.toLocaleString('en-IN')}/বিঘা।`,
          },
        ],
        citations: ['Dharitree Assam RoR', 'Mission Basundhara 3.0', 'IGR Assam', 'ASDMA', 'ULPIN Bhu-Aadhar'],
        actions: [
          { label: `🛰️ দাগ ${p.dag_number} মেপত চাওক`, to: '/explore', primary: true },
          { label: '🛡️ Trust Passport চাওক', to: `/passport/${p.listing_id}` },
        ],
      };
    }

    if (langInfo.code === 'hi' || langInfo.code === 'hinglish') {
      return {
        detectedLangLabel: langInfo.label,
        title: `Parcel Inspection Report — ${p.village_name} Dag ${p.dag_number} (${p.parcel_id})`,
        summary: `Plot ${p.parcel_id} (Dag ${p.dag_number}, Patta ${p.patta_number}, 14-digit ULPIN ${p.ulpin}) ka Dharitree RoR aur 21 geospatial layers ke saath milaan:`,
        bullets: [
          {
            icon: hasMismatch ? 'warn' : 'check',
            label: `Pattadar & Area Audit (${p.pattadar_name} · ${p.tenure_type})`,
            detail: hasMismatch
              ? `Seller ne ${p.declared_area_bigha} Bigha declare kiya hai jabki EPSG:4326 survey polygon ${p.surveyed_area_bigha} Bigha dikhata hai (${areaDiff} Bigha variance flagged).`
              : `Declared area (${p.declared_area_bigha} Bigha) aur surveyed cadastral record (${p.surveyed_area_bigha} Bigha) 100% match karte hain.`,
          },
          {
            icon: p.chapter_x_tribal_belt.includes('Within') ? 'warn' : 'check',
            label: 'Mutation, 30-Yr NEC & Chapter X Tribal Belt Status',
            detail: `Basundhara Case: ${p.last_mutation_case} (${p.mutation_status}) · NEC Ref: ${p.nec_30yr_certificate_no} · Tribal Belt: ${p.chapter_x_tribal_belt}.`,
          },
          {
            icon: 'info',
            label: 'ASDMA Flood Zone & Zonal Valuation Benchmark',
            detail: `Flood Zone: ${p.asdma_flood_zone}. Asking Price: ₹${p.asking_price_inr.toLocaleString('en-IN')} (₹${pricePerBigha.toLocaleString('en-IN')}/Bigha) vs IGR Circle Rate ₹${p.zonal_valuation_inr_per_bigha.toLocaleString('en-IN')}/Bigha.`,
          },
        ],
        citations: ['Dharitree Assam RoR', 'ULPIN Bhu-Aadhar', 'Mission Basundhara 3.0', 'IGR Assam', 'ASDMA'],
        actions: [
          { label: `🛰️ Locate Dag ${p.dag_number} on Map`, to: '/explore', primary: true },
          { label: '🛡️ Open Land Trust Passport', to: `/passport/${p.listing_id}` },
        ],
      };
    }

    return {
      detectedLangLabel: langInfo.label,
      title: `Cadastral & Legal Inspection — ${p.village_name} Dag ${p.dag_number} (${p.parcel_id})`,
      summary: `Parcel ${p.parcel_id} in ${p.circle_name} Circle, ${p.district_name} (Dag ${p.dag_number} · Patta ${p.patta_number} · 14-Digit ULPIN Bhu-Aadhar ${p.ulpin}) cross-checked against Dharitree RoR and survey geometry:`,
      bullets: [
        {
          icon: hasMismatch ? 'warn' : 'check',
          label: hasMismatch
            ? `Survey Area Variance Flagged (${p.declared_area_bigha.toFixed(2)} vs ${p.surveyed_area_bigha.toFixed(2)} Bigha)`
            : `Surveyed Area Verified (${p.surveyed_area_bigha.toFixed(2)} Bigha Match)`,
          detail: hasMismatch
            ? `Seller declared ${p.declared_area_bigha.toFixed(2)} Bigha, whereas the WGS-84 surveyed cadastral polygon measures ${p.surveyed_area_bigha.toFixed(2)} Bigha (${areaDiff} Bigha variance). Request a Lot Mandal trace map verification before paying earnest money.`
            : `Recorded Pattadar ${p.pattadar_name} holds a verified ${p.tenure_type} (${p.land_class}) with zero area discrepancy between seller declaration and revenue survey.`,
        },
        {
          icon: p.chapter_x_tribal_belt.includes('Within') ? 'warn' : 'check',
          label: 'Title Lineage, Mutation & Chapter X Statutory Status',
          detail: `RoR Ref: ${p.ror_jamabandi_ref} · Pattadar: ${p.pattadar_name} · Mutation: ${p.last_mutation_case} (${p.mutation_status}) · 30-Yr IGR NEC: ${p.nec_30yr_certificate_no} · ${p.chapter_x_tribal_belt}.`,
        },
        {
          icon: 'info',
          label: 'Price Benchmark, ASDMA Flood Hazard & Soil Profile',
          detail: `Asking Price: ₹${p.asking_price_inr.toLocaleString('en-IN')} (₹${pricePerBigha.toLocaleString('en-IN')}/Bigha) vs IGR Circle Benchmark ₹${p.zonal_valuation_inr_per_bigha.toLocaleString('en-IN')}/Bigha. Flood Zone: ${p.asdma_flood_zone}. Soil: pH ${p.soil_health.ph_level} (${p.soil_health.soil_texture}).`,
        },
      ],
      citations: ['Dharitree Assam RoR', 'ULPIN Bhu-Aadhar', 'Mission Basundhara 3.0', 'IGR Assam', 'ASDMA'],
      actions: [
        { label: `🛰️ Inspect Dag ${p.dag_number} on Satellite Map`, to: '/explore', primary: true },
        { label: '🛡️ View Land Trust Passport', to: `/passport/${p.listing_id}` },
        { label: '📋 Start 9-Step Due Diligence', to: '/due-diligence' },
      ],
    };
  }

  // ============================================================================
  // INTENT 2: EKSONA (ANNUAL) VS. MIYADI (PERIODIC) PATTA & CONVERSION RULES
  // ============================================================================
  if (intent === 'PATTA_COMPARISON') {
    if (langInfo.code === 'as') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'একচনা (Annual) বনাম ম্যাদী (Periodic) পট্টা — অসম ভূমি আইন',
        summary:
          'অসম ভূমি আৰু ৰাজহ নিয়মাৱলী ১৮৮৬ অনুসৰি একচনা পট্টা আৰু ম্যাদী পট্টাৰ মাজত গুৰুত্বপূৰ্ণ আইনী পাৰ্থক্য আছে:',
        bullets: [
          {
            icon: 'warn',
            label: 'একচনা পট্টা (Eksona / Annual Patta) — হস্তান্তৰ নিষিদ্ধ',
            detail:
              'একচনা পট্টা কেৱল এবছৰীয়া ভোগ-দখলৰ অনুজ্ঞাপত্ৰ। ইয়াত পট্টাদাৰৰ স্থায়ী মালিকীস্বত্ব নাথাকে আৰু চৰকাৰী ম্যাদীকৰণ নোহোৱাকৈ ইয়াক পঞ্জীয়নভুক্ত বিক্ৰী দলিলযোগে বিক্ৰী কৰিব নোৱাৰি।',
          },
          {
            icon: 'check',
            label: 'ম্যাদী পট্টা (Miyadi / Periodic Patta) — স্থায়ী আৰু হস্তান্তৰযোগ্য',
            detail:
              'ম্যাদী পট্টাত পট্টাদাৰক স্থায়ী, উত্তৰাধিকাৰীসূত্ৰে লাভ কৰা আৰু হস্তান্তৰযোগ্য (Transferable) অধিকাৰ প্ৰদান কৰা হয়। বেংক ঋণ আৰু পঞ্জীয়নভুক্ত বিক্ৰীৰ বাবে ম্যাদী পট্টা বাধ্যতামূলক।',
          },
          {
            icon: 'info',
            label: 'মিছন বসুন্ধৰা ২.০/৩.০ ৰ জৰিয়তে একচনাৰ পৰা ম্যাদীলৈ ৰূপান্তৰ',
            detail:
              'সেৱা সেতু (Sewa Setu) প’ৰ্টেলৰ জৰিয়তে নিৰ্ধাৰিত প্ৰিমিয়াম পৰিশোধ কৰি যোগ্য একচনা মাটি ম্যাদী পট্টালৈ ৰূপান্তৰ কৰাৰ পিছতহে ক্ৰয়-বিক্ৰয় কৰক।',
          },
        ],
        citations: ['ALRR 1886', 'Mission Basundhara 3.0', 'Sewa Setu Assam', 'IGR Assam'],
        actions: [
          { label: '🛡️ পট্টা আৰু নথি পৰীক্ষা (Trust Centre)', to: '/trust-centre', primary: true },
          { label: '🔍 বিসংগতি ইঞ্জিন চাওক', to: '/discrepancies' },
        ],
      };
    }

    if (langInfo.code === 'hi' || langInfo.code === 'hinglish') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'Eksona (Annual) vs. Miyadi (Periodic) Patta — Legal Transfer Rules',
        summary:
          'Assam Land and Revenue Regulation (ALRR) 1886 ke tahat zameen kharidने se pehle Patta type check karna sabse zaroori hai:',
        bullets: [
          {
            icon: 'warn',
            label: 'Eksona Patta (Annual Lease) — Direct Sale Prohibited',
            detail:
              'Eksona Patta sirf 1-saal ka non-transferable occupation license hota hai. Bina Mission Basundhara conversion ke Eksona zameen ki registered Sale Deed (IGR e-Panjeeyan) nahi ho sakti.',
          },
          {
            icon: 'check',
            label: 'Miyadi Patta (Periodic / Permanent Title) — Safe to Buy',
            detail:
              'Miyadi Patta heritable aur transferable freehold/periodic title deta hai. Is par bank mortgage, NOC aur online mutation kanooni roop se valid hain.',
          },
          {
            icon: 'info',
            label: 'Mission Basundhara Conversion Process',
            detail:
              'Seller ko pehle Sewa Setu portal par government conversion premium jama karke Eksona se Miyadi Patta mein convert karana zaroori hai.',
          },
        ],
        citations: ['ALRR 1886', 'Mission Basundhara 3.0', 'Sewa Setu Assam', 'IGR e-Panjeeyan'],
        actions: [
          { label: '🛡️ Open Trust Centre', to: '/trust-centre', primary: true },
          { label: '📋 View Buyer Checklist', to: '/due-diligence' },
        ],
      };
    }

    return {
      detectedLangLabel: langInfo.label,
      title: 'Eksona (Annual) vs. Miyadi (Periodic) Patta — Statutory Comparison',
      summary:
        'Under the Assam Land and Revenue Regulation, 1886, verifying whether a plot holds a Miyadi (Periodic) Patta or an Eksona (Annual) Patta is the first legal gate in buyer due diligence:',
      bullets: [
        {
          icon: 'warn',
          label: 'Eksona (Annual) Patta — Non-Transferable Without Conversion',
          detail:
            'An Eksona Patta confers only a year-to-year right of occupancy and cultivation. It carries no right of transfer, mortgage, or sub-letting, and IGR Assam blocks registered sale deeds on unconverted Eksona plots.',
        },
        {
          icon: 'check',
          label: 'Miyadi (Periodic) Patta — Heritable & Transferable Title',
          detail:
            'A Miyadi Patta grants permanent, heritable, and transferable ownership rights subject to payment of land revenue (Khajana) and Chapter X Tribal Belt rules.',
        },
        {
          icon: 'info',
          label: 'Mission Basundhara 2.0 / 3.0 Conversion Pathway',
          detail:
            'Eligible Eksona pattadars can apply online via Sewa Setu for conversion to Miyadi Patta upon Lot Mandal field verification and payment of the notified zonal conversion premium.',
        },
      ],
      citations: ['Assam Land & Revenue Regulation 1886', 'Mission Basundhara 3.0', 'Sewa Setu Portal', 'IGR Assam'],
      actions: [
        { label: '🛡️ Inspect Patta Status on Map', to: '/explore', primary: true },
        { label: '📋 Open 9-Step Buyer Checklist', to: '/due-diligence' },
      ],
    };
  }

  // ============================================================================
  // INTENT 3: CHAPTER X TRIBAL BELT & BLOCK RESTRICTIONS (SECTIONS 160–162 ALRR 1886)
  // ============================================================================
  if (intent === 'TRIBAL_BELT') {
    if (langInfo.code === 'as') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'অধ্যায় X (Chapter X) ট্ৰাইবেল বেল্ট আৰু ব্লকৰ আইনী নিষেধাজ্ঞা',
        summary:
          'অসম ভূমি আৰু ৰাজহ নিয়মাৱলী ১৮৮৬ ৰ অধ্যায় X (ধাৰা ১৬০–১৬২) অনুসৰি সংৰক্ষিত জনজাতীয় বেল্ট আৰু ব্লকত মাটি হস্তান্তৰৰ কঠোৰ নিয়ম আছে:',
        bullets: [
          {
            icon: 'warn',
            label: 'ধাৰা ১৬০–১৬২: অ-সংৰক্ষিত শ্ৰেণীৰ ক্ৰেতালৈ হস্তান্তৰ নিষিদ্ধ',
            detail:
              'বাক্সা (ঘোপা দাগ ৩১৮), বকো, ডিমৰীয়া, ৰাণী, মাজুলী আৰু BTR অঞ্চলৰ সংৰক্ষিত বেল্টত অধিসূচিত সংৰক্ষিত জনগোষ্ঠীৰ বাহিৰে আন ব্যক্তিলৈ মাটি বিক্ৰী বা হস্তান্তৰ আইনমতে অমান্য।',
          },
          {
            icon: 'check',
            label: 'যোগ্য ক্ৰেতা আৰু চক্ৰ বিষয়াৰ (Circle Officer) অনুমোদন',
            detail:
              'কেৱল অধিসূচিত সংৰক্ষিত শ্ৰেণীৰ স্থায়ী বাসিন্দাই চক্ৰ বিষয়া আৰু জিলা আয়ুক্তৰ পূৰ্বানুমতি সাপেক্ষে এনে মাটি ক্ৰয় কৰিব পাৰে।',
          },
          {
            icon: 'info',
            label: 'ধৰিত্ৰী সেতুৰ স্বয়ংক্ৰিয় সুৰক্ষা সংকেত',
            detail:
              'সংৰক্ষিত বেল্টত থকা প্লটসমূহত (যেনে AS-BKS-318) আমাৰ প্লেটফৰ্মে স্বয়ংক্ৰিয়ভাৱে ৰঙা সতৰ্কবাণী দেখুৱায়।',
          },
        ],
        citations: ['ALRR 1886 Chapter X (Sec 160–162)', 'Dharitree Assam', 'BTR / Revenue Dept Assam'],
        actions: [
          { label: '🔍 বাক্সা দাগ ৩১৮ বিসংগতি চাওক', to: '/discrepancies', primary: true },
          { label: '🛰️ মেপত সংৰক্ষিত বেল্ট চাওক', to: '/explore' },
        ],
      };
    }

    if (langInfo.code === 'hi' || langInfo.code === 'hinglish') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'Chapter X Tribal Belt & Block Restrictions (Sections 160–162 ALRR 1886)',
        summary:
          'Assam Land and Revenue Regulation, 1886 ke Chapter X (Sections 160–162) ke tahat Protected Tribal Belts aur Blocks mein zameen transfer par statutory rok hai:',
        bullets: [
          {
            icon: 'warn',
            label: 'Statutory Bar Against Alienation to Non-Protected Classes',
            detail:
              'Boko, Dimoria, Rani, Baksa (Ghopa Dag 318), Majuli aur BTR districts ke notified Tribal Belts mein non-protected buyers ko zameen bechna, lease dena ya gift karna kanoonan void hai.',
          },
          {
            icon: 'check',
            label: 'Protected Indigenous Classes & DC / CO NOC',
            detail:
              'Sirf notified protected classes (ST Plains/Hills, notified indigenous communities) ke bonafide buyers hi Circle Officer aur Deputy Commissioner ki permission se transfer le sakte hain.',
          },
          {
            icon: 'info',
            label: 'Live Platform Alert on Ghopa Dag 318 (AS-BKS-318)',
            detail:
              'Dharitri Sentu Discrepancy Engine Ghopa Dag 318 par Chapter X restriction aur 0.20 Bigha area variance ko Red Flag ke saath highlight karta hai.',
          },
        ],
        citations: ['ALRR 1886 Chapter X (Sec 160–162)', 'Dharitree Assam', 'Mission Basundhara 3.0'],
        actions: [
          { label: '🔍 Open Discrepancy Engine', to: '/discrepancies', primary: true },
          { label: '🛰️ Inspect Dag 318 on Map', to: '/explore' },
        ],
      };
    }

    return {
      detectedLangLabel: langInfo.label,
      title: 'Chapter X Tribal Belt & Block Safeguards (Sections 160–162, ALRR 1886)',
      summary:
        'Chapter X of the Assam Land and Revenue Regulation, 1886 (Sections 160–162) enforces strict statutory protections over notified Tribal Belts and Blocks across Assam (including Baksa, Boko, Dimoria, Rani, Majuli, and BTR):',
      bullets: [
        {
          icon: 'warn',
          label: 'Statutory Prohibition on Transfer to Non-Protected Buyers (Sec. 162)',
          detail:
            'No land holder in a notified Tribal Belt or Block may transfer, sell, mortgage, or lease land to any person outside the notified protected classes. Any agreement violating Section 162 is void ab initio and subject to summary eviction.',
        },
        {
          icon: 'check',
          label: 'Mandatory Circle Officer & DC Eligibility Verification',
          detail:
            'Even transfers between eligible protected-class buyers require prior Circle Officer scrutiny and Deputy Commissioner permission via Mission Basundhara / Sewa Setu.',
        },
        {
          icon: 'info',
          label: 'Live Example — Ghopa Dag 318 in Baksa (Parcel AS-BKS-318)',
          detail:
            'Parcel AS-BKS-318 (ULPIN 18240318007605) is flagged Red in our Discrepancy Engine both for falling within a Chapter X Protected Tribal Belt and for a 0.20 Bigha area variance (2.00 declared vs 1.80 surveyed Bigha).',
        },
      ],
      citations: ['ALRR 1886 Chapter X (Sec 160–162)', 'Dharitree Assam', 'Mission Basundhara 3.0', 'IGR Assam'],
      actions: [
        { label: '🔍 Inspect Chapter X Flag in Discrepancy Engine', to: '/discrepancies', primary: true },
        { label: '🛰️ View Baksa Dag 318 on Map', to: '/explore' },
      ],
    };
  }

  // ============================================================================
  // INTENT 4: ASDMA FLOOD HAZARD ZONATION & BRAHMAPUTRA BUFFER RULES
  // ============================================================================
  if (intent === 'FLOOD_ZONATION') {
    if (langInfo.code === 'as') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'ASDMA বানপানীৰ শংকা শ্ৰেণীবিভাজন (Zone 1, 2, 3) আৰু ব্ৰহ্মপুত্ৰ বাফাৰ নিয়ম',
        summary:
          'অসম ৰাজ্যিক দুৰ্যোগ ব্যৱস্থাপনা প্ৰাধিকৰণ (ASDMA) আৰু ISRO Bhuvan উপগ্ৰহ তথ্যৰ ভিত্তিত মাটিৰ বানপানী আৰু গৰাখহনীয়াৰ শংকা তিনিটা ভাগত ভাগ কৰা হয়:',
        bullets: [
          {
            icon: 'check',
            label: 'জ’ন ১ — ওখ আৰু সুৰক্ষিত ভূমি (High Terrace / Minimal Flood Hazard)',
            detail:
              'সৰ্বোচ্চ বানপানী স্তৰৰ (HFL) পৰা +১০ মিটাৰৰ ওপৰত অৱস্থিত ওখ মাটি (যেনে খানাপাৰা দাগ ১০৪, আমিনগাঁও দাগ ১৪২ আৰু চিনামৰা দাগ ৭৮৫)। আৱাসিক আৰু বাণিজ্যিক নিৰ্মাণৰ বাবে উপযুক্ত।',
          },
          {
            icon: 'warn',
            label: 'জ’ন ২ — মধ্যমীয়া ঋতুগত জলবন্দী অঞ্চল (Moderate Seasonal Waterlogging)',
            detail:
              'বাৰিষা কালত সাময়িকভাৱে পানী জমা হ’ব পৰা অঞ্চল। নিৰ্মাণৰ পূৰ্বে ওখ প্লিন্থ (Stilt / Elevated Plinth) আৰু উপযুক্ত নলা-নৰ্দমাৰ ব্যৱস্থা কৰাটো আবশ্যক।',
          },
          {
            icon: 'warn',
            label: 'জ’ন ৩ — সক্ৰিয় বানপানী অঞ্চল আৰু ৫০০ মিটাৰ নদীপাৰ বাফাৰ (Active Floodplain)',
            detail:
              'ব্ৰহ্মপুত্ৰ বা ইয়াৰ উপনৈসমূহৰ সক্ৰিয় পাৰৰ পৰা ৫০০ মিটাৰৰ ভিতৰত স্থায়ী পকী নিৰ্মাণ নিষিদ্ধ আৰু ইয়াত তীব্ৰ গৰাখহনীয়াৰ শংকা থাকে।',
          },
        ],
        citations: ['ASDMA Flood Atlas', 'ISRO Bhuvan CartoDEM', 'MOSDAC LULC', 'NESDR'],
        actions: [
          { label: '🛰️ মেপত বানপানী স্তৰ পৰীক্ষা কৰক', to: '/explore', primary: true },
          { label: '🏛️ ১২ টা প্ৰযুক্তি স্তম্ভ চাওক', to: '/capabilities' },
        ],
      };
    }

    if (langInfo.code === 'hi' || langInfo.code === 'hinglish') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'ASDMA Flood Hazard Zonation (Zone 1, 2, 3) & 500m Riverbank Buffer',
        summary:
          'Assam State Disaster Management Authority (ASDMA) multi-year satellite inundation atlas aur ISRO CartoDEM elevation ke hisaab se plots ko 3 flood zones mein classify kiya jata hai:',
        bullets: [
          {
            icon: 'check',
            label: 'Zone 1 — High Terrace / Safe Upland (Low Hazard)',
            detail:
              'High Flood Level (HFL) se +10m se +14m upar sthit plots (jaise Khanapara Dag 104, Amingaon Dag 142, Changsari Dag 412). Yahan flood aur erosion risk minimal hai.',
          },
          {
            icon: 'warn',
            label: 'Zone 2 — Moderate Seasonal Waterlogging Zone',
            detail:
              'Low-lying alluvial plains jahan monsoon mein drainage slow rehta hai. Yahan elevated plinth (+1.5m above road crest) aur retaining bund zaroori hai.',
          },
          {
            icon: 'warn',
            label: 'Zone 3 — Active Floodplain & 500m Brahmaputra Erosion Buffer',
            detail:
              'Active river bankline ke 500m buffer ke andar permanent construction restricted hai kyunki bankline migration aur seasonal inundation ka high risk hota hai.',
          },
        ],
        citations: ['ASDMA Flood Hazard Atlas', 'ISRO Bhuvan CartoDEM 10m', 'MOSDAC Multi-Temporal LULC'],
        actions: [
          { label: '🛰️ Check Flood Zones on Satellite Map', to: '/explore', primary: true },
          { label: '📋 Open Buyer Verification Checklist', to: '/due-diligence' },
        ],
      };
    }

    return {
      detectedLangLabel: langInfo.label,
      title: 'ASDMA Flood Hazard Zonation & 500m Brahmaputra Riverbank Buffer Rules',
      summary:
        'Dharitri Sentu integrates the Assam State Disaster Management Authority (ASDMA) multi-year flood inundation atlas with ISRO Bhuvan 10m CartoDEM elevation models to classify flood and erosion risk across three statutory tiers:',
      bullets: [
        {
          icon: 'check',
          label: 'Zone 1 (Safe Elevated Terrace / Piedmont Bench)',
          detail:
            'Parcels situated +10m to +15m above Highest Flood Level (HFL) with >1.5% natural drainage slope (e.g., Khanapara Dag 104 at 67.2m MSL, Amingaon Dag 142 at 64.5m MSL, Cinnamara Dag 785 at 94.0m MSL). Approved for homestead and commercial construction.',
        },
        {
          icon: 'warn',
          label: 'Zone 2 (Moderate Seasonal Waterlogging / Embankment-Protected Plain)',
          detail:
            'Low-gradient alluvial basins (such as Kolong or Dibrugarh dyke-protected plains) subject to monsoon sheet flow. Requires elevated structural plinths (+1.2m above road crown) and engineered perimeter drains.',
        },
        {
          icon: 'warn',
          label: 'Zone 3 (Active Floodplain & Mandatory 500m Riverbank Erosion Buffer)',
          detail:
            'Areas within the active Brahmaputra/tributary floodway or inside the 500m riverbank erosion setback. Permanent non-agricultural construction is restricted due to annual inundation and bankline shift.',
        },
      ],
      citations: ['ASDMA Flood Hazard Atlas', 'ISRO Bhuvan CartoDEM (10m)', 'MOSDAC 2015–2024 LULC', 'Water Resources Dept Assam'],
      actions: [
        { label: '🛰️ Inspect Flood & Elevation Layers on Map', to: '/explore', primary: true },
        { label: '🏛️ Explore All 12 Geospatial Pillars', to: '/capabilities' },
      ],
    };
  }

  // ============================================================================
  // INTENT 5: ASSAM LAND UNIT MEASUREMENTS & DYNAMIC CALCULATIONS
  // ============================================================================
  if (intent === 'LAND_UNIT_CALC') {
    // Extract numeric quantity if user asked e.g. "Convert 2.5 Bigha" or "3 Bigha"
    const numMatch = norm.match(/(\d+(?:\.\d+)?)\s*(bigha|katha|lessa|acre)/i);
    const inputVal = numMatch ? parseFloat(numMatch[1]) : 1;
    const inputUnit = numMatch ? numMatch[2].toLowerCase() : 'bigha';

    let bighaQty = inputVal;
    if (inputUnit === 'katha') bighaQty = inputVal / 5;
    else if (inputUnit === 'lessa') bighaQty = inputVal / 100;
    else if (inputUnit === 'acre') bighaQty = inputVal / 0.3305785;

    const kathaTotal = +(bighaQty * 5).toFixed(2);
    const lessaTotal = +(bighaQty * 100).toFixed(1);
    const sqftTotal = Math.round(bighaQty * 14400);
    const sqmTotal = +(bighaQty * 1337.8038).toFixed(1);
    const acreTotal = +(bighaQty * 0.3305785).toFixed(3);
    const hectareTotal = +(bighaQty * 0.13378).toFixed(4);

    if (langInfo.code === 'as') {
      return {
        detectedLangLabel: langInfo.label,
        title: `অসমৰ মাটিৰ জোখ-মাখৰ হিচাপ (${bighaQty} বিঘা = ${sqftTotal.toLocaleString('en-IN')} বৰ্গফুট)`,
        summary:
          'অসম ৰাজহ বিভাগৰ মানক ভূমি জোখ-মাখৰ সূত্ৰ (১ বিঘা = ৫ কঠা = ১০০ লেচা = ১৪,৪০০ বৰ্গফুট ≈ ১,৩৩৭.৮ বৰ্গমিটাৰ):',
        bullets: [
          {
            icon: 'check',
            label: `${bighaQty} বিঘাৰ সম্পূৰ্ণ ৰূপান্তৰ হিচাপ`,
            detail: `${bighaQty} বিঘা = ${kathaTotal} কঠা = ${lessaTotal} লেচা = ${sqftTotal.toLocaleString('en-IN')} বৰ্গফুট (${sqmTotal.toLocaleString('en-IN')} বৰ্গমিটাৰ) = ${acreTotal} একৰ (${hectareTotal} হেক্টৰ)।`,
          },
          {
            icon: 'info',
            label: 'মানক অসম ভূমি একক সূত্ৰ (Standard Conversion Table)',
            detail:
              '১ বিঘা = ৫ কঠা (১৪,৪০০ বৰ্গফুট) · ১ কঠা = ২০ লেচা (২,৮৮০ বৰ্গফুট) · ১ লেচা = ১৪৪ বৰ্গফুট (১২ ফুট × ১২ ফুট = ১ নল)। ৩.০২৫ বিঘা ≈ ১ একৰ।',
          },
          {
            icon: 'check',
            label: 'হেডাৰত থকা তাৎক্ষণিক একক পৰিবৰ্তক (Unit Switcher)',
            detail:
              'আপুনি ওপৰৰ মেনুত থকা "📐 Unit" ড্ৰপডাউন ব্যৱহাৰ কৰি সমগ্ৰ ৱেবছাইটৰ মাটিকালি আৰু মূল্য বিঘা, একৰ, কঠা বা বৰ্গফুটলৈ সলনি কৰিব পাৰে।',
          },
        ],
        citations: ['Assam Land Revenue Manual', 'Dharitree Cadastral Survey Standards'],
        actions: [
          { label: '📈 মূল্য আৰু মাটিকালি কেলকুলেটৰ খোলক', to: '/price-explorer', primary: true },
          { label: '🛰️ মেপত মাটিকালি চাওক', to: '/explore' },
        ],
      };
    }

    if (langInfo.code === 'hi' || langInfo.code === 'hinglish') {
      return {
        detectedLangLabel: langInfo.label,
        title: `Assam Land Unit Calculator — ${bighaQty} Bigha = ${sqftTotal.toLocaleString('en-IN')} Sq. Ft.`,
        summary:
          'Assam Revenue Survey standard ke anusar 1 Bigha = 5 Katha = 100 Lessa = 14,400 sq. ft. (≈ 1,337.8 sq. m) hota hai:',
        bullets: [
          {
            icon: 'check',
            label: `Exact Conversion for ${bighaQty} Bigha`,
            detail: `${bighaQty} Bigha = ${kathaTotal} Katha = ${lessaTotal} Lessa = ${sqftTotal.toLocaleString('en-IN')} sq. ft. (${sqmTotal.toLocaleString('en-IN')} sq. m) = ${acreTotal} Acre (${hectareTotal} Hectare).`,
          },
          {
            icon: 'info',
            label: 'Katha & Lessa Formula Breakdown',
            detail:
              '1 Bigha = 5 Katha (14,400 sq. ft.) · 1 Katha = 20 Lessa (2,880 sq. ft.) · 1 Lessa = 144 sq. ft. · 1 Acre ≈ 3.025 Bigha · 1 Hectare ≈ 7.475 Bigha.',
          },
          {
            icon: 'check',
            label: 'Global Unit Switcher Available in Header',
            detail:
              'Top navigation bar mein "📐 Unit" dropdown se aap sabhi listings ka rate aur area Bigha, Acre, Katha, Lessa ya Sq.Ft. mein dekh sakte hain.',
          },
        ],
        citations: ['Assam Land Records Manual', 'Directorate of Land Records & Surveys Assam'],
        actions: [
          { label: '📈 Open Price & Area Calculator', to: '/price-explorer', primary: true },
          { label: '🛡️ Open Trust Centre Converter', to: '/trust-centre' },
        ],
      };
    }

    return {
      detectedLangLabel: langInfo.label,
      title: `Assam Land Measurement & Unit Conversion (${bighaQty} Bigha = ${sqftTotal.toLocaleString('en-IN')} Sq. Ft.)`,
      summary:
        'In Assam Brahmaputra Valley revenue surveys, land area is recorded in Bigha, Katha, and Lessa (1 Bigha = 5 Katha = 100 Lessa = 14,400 sq. ft. ≈ 1,337.8 sq. m):',
      bullets: [
        {
          icon: 'check',
          label: `Computed Breakdown for ${bighaQty} Bigha`,
          detail: `${bighaQty} Bigha = ${kathaTotal} Katha = ${lessaTotal} Lessa = ${sqftTotal.toLocaleString('en-IN')} sq. ft. (${sqmTotal.toLocaleString('en-IN')} sq. m) = ${acreTotal} Acre = ${hectareTotal} Hectare.`,
        },
        {
          icon: 'info',
          label: 'Official Assam Revenue Unit Reference Table',
          detail:
            '• 1 Lessa = 144 sq. ft. (13.38 sq. m)\n• 1 Katha = 20 Lessa = 2,880 sq. ft. (267.56 sq. m)\n• 1 Bigha = 5 Katha = 100 Lessa = 14,400 sq. ft. (1,337.80 sq. m ≈ 0.3306 Acre)\n• 1 Acre = 3.025 Bigha (43,560 sq. ft.) · 1 Hectare = 7.4749 Bigha (10,000 sq. m).',
        },
        {
          icon: 'check',
          label: 'Live Platform-Wide Unit Converter',
          detail:
            'Switch the "📐 Unit" selector in the top header at any time to recalculate every parcel card, map inspector badge, and price-per-unit benchmark across Bigha, Acre, Katha, Lessa, Sq. Ft., and Hectare.',
        },
      ],
      citations: ['Directorate of Land Records & Surveys (DLRS) Assam', 'Dharitree RoR Standards'],
      actions: [
        { label: '📈 Open Price & Unit Explorer', to: '/price-explorer', primary: true },
        { label: '🛡️ Open Trust Centre', to: '/trust-centre' },
      ],
    };
  }

  // ============================================================================
  // INTENT 6: MISSION BASUNDHARA 3.0 & DIGITAL MUTATION / NOCIRA / JAMABANDI
  // ============================================================================
  if (intent === 'MISSION_BASUNDHARA') {
    if (langInfo.code === 'as') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'মিছন বসুন্ধৰা ৩.০ — অনলাইন নামজাৰি (Mutation), নচিৰা আৰু জমাবন্দী উন্নীতকৰণ',
        summary:
          'অসম চৰকাৰৰ মিছন বসুন্ধৰা ৩.০ আৰু সেৱা সেতু (Sewa Setu) প’ৰ্টেলৰ জৰিয়তে মাটি কিনা-বেচাৰ পিছত নামজাৰি আৰু চিঠা সংশোধনৰ পদক্ষেপসমূহ:',
        bullets: [
          {
            icon: 'check',
            label: 'পদক্ষেপ ১: নচিৰা (NOC) আৰু ই-পঞ্জীয়ন (IGR e-Panjeeyan)',
            detail:
              'বিক্ৰী দলিল পঞ্জীয়নৰ পূৰ্বে চক্ৰ বিষয়াৰ কাৰ্যালয়ৰ পৰা মাটি হস্তান্তৰৰ NOC লাভ কৰা হয় আৰু উপ-পঞ্জীয়কৰ কাৰ্যালয়ত দলিল পঞ্জীয়ন কৰা হয়।',
          },
          {
            icon: 'check',
            label: 'পদক্ষেপ ২: লট মণ্ডলৰ ক্ষেত্ৰ পৰিদৰ্শন আৰু চিঠা (Chitha) সংশোধন',
            detail:
              'সেৱা সেতুৰ জৰিয়তে অনলাইন নামজাৰি আবেদন দাখিল হোৱাৰ পিছত লট মণ্ডলে দাগ আৰু চৌহদ পৰীক্ষা কৰি চক্ৰ বিষয়াৰ অনুমোদনৰ বাবে চিঠাত টোকা দিয়ে।',
          },
          {
            icon: 'info',
            label: 'পদক্ষেপ ৩: ধৰিত্ৰী (Dharitree) জমাবন্দীত নতুন পট্টাদাৰৰ নাম সংযোজন',
            detail:
              'চক্ৰ বিষয়াৰ নিষ্পত্তি আদেশৰ পিছত ধৰিত্ৰী প’ৰ্টেলৰ জমাবন্দী (RoR) নথিত ক্ৰেতাৰ নাম স্বয়ংক্ৰিয়ভাৱে অন্তৰ্ভুক্ত হয়।',
          },
        ],
        citations: ['Mission Basundhara 3.0', 'Sewa Setu Assam', 'Dharitree RoR', 'IGR e-Panjeeyan'],
        actions: [
          { label: '📋 ৯-স্তৰীয় ডিউ-ডিলিজেন্স তালিকা', to: '/due-diligence', primary: true },
          { label: '🛰️ মেপত নামজাৰি স্থিতি চাওক', to: '/explore' },
        ],
      };
    }

    if (langInfo.code === 'hi' || langInfo.code === 'hinglish') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'Mission Basundhara 3.0 — Online Digital Mutation, Chitha & Jamabandi Workflow',
        summary:
          'Assam mein Sale Deed registration ke baad Sewa Setu aur Mission Basundhara 3.0 ke zariye online mutation (Namjari) ke 3 mukhya steps hain:',
        bullets: [
          {
            icon: 'check',
            label: 'Step 1: Pre-Registration NOC & IGR e-Panjeeyan Deed',
            detail:
              'Co-pattadars aur Circle Office se Land Transfer NOC milne ke baad Sub-Registrar office mein Sale Deed register hoti hai aur auto-mutation docket generate hota hai.',
          },
          {
            icon: 'check',
            label: 'Step 2: Lot Mandal Field Verification & Chitha Endorsement',
            detail:
              'Lot Mandal physical possession aur trace map verify karke village Chitha register mein mutation entry (jaise MB3/MUT/2025/KMP/08412) record karte hain.',
          },
          {
            icon: 'info',
            label: 'Step 3: Circle Officer Order & Updated Dharitree Jamabandi',
            detail:
              'Circle Officer (CO) ke digital signature ke baad Dharitree Jamabandi (RoR) mein buyer ka naam official Pattadar ke roop mein update ho jata hai.',
          },
        ],
        citations: ['Mission Basundhara 3.0', 'Sewa Setu Portal', 'Dharitree Assam', 'IGR e-Panjeeyan'],
        actions: [
          { label: '📋 Open 9-Step Buyer Checklist', to: '/due-diligence', primary: true },
          { label: '🛡️ View Trust Centre', to: '/trust-centre' },
        ],
      };
    }

    return {
      detectedLangLabel: langInfo.label,
      title: 'Mission Basundhara 3.0 — Digital Mutation, Chitha & Jamabandi Workflow',
      summary:
        'Under Assam’s Mission Basundhara 3.0 and Integrated Land Records Management System (ILRMS / Dharitree), title mutation and record-of-rights updates follow a structured four-stage digital pipeline:',
      bullets: [
        {
          icon: 'check',
          label: '1. Transfer NOC & e-Panjeeyan Deed Registration',
          detail:
            'Seller and buyer obtain a statutory Land Transfer NOC via Sewa Setu, verify IGR Zonal Valuation benchmarks, and execute the registered sale deed triggers an online mutation docket.',
        },
        {
          icon: 'check',
          label: '2. Lot Mandal Field & Trace Map Verification',
          detail:
            'The Circle Lot Mandal verifies physical possession, checks co-pattadar notices, validates Bigha-Katha-Lessa boundaries against the village trace map, and records the field note in the village Chitha.',
        },
        {
          icon: 'info',
          label: '3. Circle Officer Disposal & Jamabandi (RoR) Update',
          detail:
            'Once the Circle Officer signs off on the mutation or partition case (e.g., MB3/MUT/2025/KMP/08412), the updated Jamabandi reflects the buyer as the recorded Pattadar linked to the 14-digit ULPIN.',
        },
      ],
      citations: ['Mission Basundhara 3.0', 'Sewa Setu Assam', 'Dharitree ILRMS', 'IGR e-Panjeeyan'],
      actions: [
        { label: '📋 Open Guided Due-Diligence Tracker', to: '/due-diligence', primary: true },
        { label: '🔒 Open LandLocker Document Vault', to: '/landlocker' },
      ],
    };
  }

  // ============================================================================
  // INTENT 7: REQUIRED BUYING DOCUMENTS (DUE DILIGENCE CHECKLIST)
  // ============================================================================
  if (intent === 'BUYING_CHECKLIST') {
    if (langInfo.code === 'as') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'অসমত মাটি কিনাৰ পূৰ্বে পৰীক্ষা কৰিবলগীয়া ৬ খন বাধ্যতামূলক নথি',
        summary:
          'ধৰিত্ৰী সেতুৰ ৯-স্তৰীয় ডিউ-ডিলিজেন্স তালিকা অনুসৰি যিকোনো মাটিৰ বাবে অগ্ৰিম ধন দিয়াৰ পূৰ্বে এই ৬ খন নথি সংগ্ৰহ আৰু পৰীক্ষা কৰক:',
        bullets: [
          {
            icon: 'check',
            label: '১. শেহতীয়া জমাবন্দী (Jamabandi / RoR) আৰু ম্যাদী পট্টা',
            detail:
              'ধৰিত্ৰী প’ৰ্টেলৰ পৰা দাগ নম্বৰ, পট্টা নম্বৰ, মাটিকালি (বিঘা-কঠা-লেচা) আৰু পট্টাদাৰৰ নাম মিলোৱাটো নিশ্চিত কৰক।',
          },
          {
            icon: 'check',
            label: '২. ৩০ বছৰীয়া বোজা-মুক্ত প্ৰমাণপত্ৰ (30-Year NEC Form 26) আৰু খাজনা ৰচিদ',
            detail:
              'IGR Assam ৰ পৰা বিগত ৩০ বছৰত মাটিডোখৰত কোনো বেংক বন্ধক বা বিবাদ নথকাৰ প্ৰমাণপত্ৰ আৰু হালনাগাদ খাজনা ৰচিদ (Land Revenue Receipt) চাওক।',
          },
          {
            icon: 'warn',
            label: '৩. লট মণ্ডলৰ ট্ৰেচ মেপ (Trace Map) আৰু ভূমি হস্তান্তৰ NOC',
            detail:
              'মাটিৰ বাস্তৱ সীমা জৰীপ নথিৰ সৈতে মিলে নে নাই চাবলৈ ট্ৰেচ মেপ আৰু সহ-পট্টাদাৰ তথা জিলা প্ৰশাসনৰ NOC পৰীক্ষা কৰক।',
          },
        ],
        citations: ['Dharitree Assam', 'IGR Assam (Form 26 NEC)', 'Sewa Setu NOC', 'LandLocker Vault'],
        actions: [
          { label: '📋 ৯-স্তৰীয় ডিউ-ডিলিজেন্স তালিকা খোলক', to: '/due-diligence', primary: true },
          { label: '🔒 LandLocker নথি ভঁৰাল চাওক', to: '/landlocker' },
        ],
      };
    }

    if (langInfo.code === 'hi' || langInfo.code === 'hinglish') {
      return {
        detectedLangLabel: langInfo.label,
        title: 'Assam Land Buying Due-Diligence Checklist — 6 Mandatory Documents',
        summary:
          'Assam mein kisi bhi plot ke liye token/advance dene se pehle Dharitri Sentu ke 9-step verification workflow mein yeh 6 documents zaroor check karein:',
        bullets: [
          {
            icon: 'check',
            label: '1. Certified Jamabandi (RoR) & Up-to-Date Khajana Receipt',
            detail:
              'Dharitree RoR copy mein Pattadar ka naam, Dag/Patta number, Miyadi tenure status aur latest Land Revenue (Khajana) tax receipt match karein.',
          },
          {
            icon: 'check',
            label: '2. 30-Year Non-Encumbrance Certificate (IGR Form 26 NEC)',
            detail:
              'Sub-Registrar / IGR Assam se pichle 30 saal ka title chain aur Nil Encumbrance Certificate verify karein taaki koi active bank loan ya mortgage na ho.',
          },
          {
            icon: 'warn',
            label: '3. Lot Mandal Trace Map, Co-Pattadar NOC & Zonal Rate Check',
            detail:
              'Physical Bigha-Katha-Lessa boundary ke liye signed Trace Map, DC/Circle Officer Transfer NOC aur IGR Circle Rate valuation zaroor dekhein.',
          },
        ],
        citations: ['Dharitree Assam RoR', 'IGR Assam Form 26 NEC', 'Sewa Setu Transfer NOC', 'ASDMA'],
        actions: [
          { label: '📋 Open 9-Step Due-Diligence Checklist', to: '/due-diligence', primary: true },
          { label: '🔒 Inspect LandLocker Documents', to: '/landlocker' },
        ],
      };
    }

    return {
      detectedLangLabel: langInfo.label,
      title: 'Essential Land Buying Due-Diligence Checklist (Assam Revenue & IGR Standards)',
      summary:
        'Before signing an agreement to sell or paying earnest money in Assam, verify these 6 statutory documents in your Dharitri Sentu Due-Diligence Workspace:',
      bullets: [
        {
          icon: 'check',
          label: '1. Certified Jamabandi (RoR) & Miyadi Patta Extract',
          detail:
            'Confirm that the seller is the recorded Pattadar on Dharitree, the tenure is Miyadi (Periodic) rather than unconverted Eksona, and the declared Bigha-Katha-Lessa matches the survey polygon.',
        },
        {
          icon: 'check',
          label: '2. 30-Year Non-Encumbrance Certificate (NEC Form 26) & Khajana Receipt',
          detail:
            'Inspect the 30-year IGR Assam search certificate (e.g., NEC-IGR-2026-KMP-88912) to rule out unreleased mortgages or prior sale deeds, alongside an up-to-date Land Revenue (Khajana) receipt.',
        },
        {
          icon: 'warn',
          label: '3. Lot Mandal Trace Map, Transfer NOC & Zonal Benchmark Check',
          detail:
            'Verify the signed Revenue Circle Trace Map on site, secure Co-Pattadar / DC Transfer NOC (confirming the plot is outside Chapter X Tribal Belts), and compare the asking price against IGR Zonal Valuation.',
        },
      ],
      citations: ['Dharitree Assam RoR', 'IGR Assam Form 26 NEC', 'Sewa Setu NOC', 'Mission Basundhara 3.0'],
      actions: [
        { label: '📋 Launch 9-Step Due-Diligence Checklist', to: '/due-diligence', primary: true },
        { label: '🔒 View Sample Deeds in LandLocker', to: '/landlocker' },
      ],
    };
  }

  // ============================================================================
  // INTENT 8: GEOSPATIAL & SCIENTIFIC LAYERS (SOIL, SLOPE, GROUNDWATER, SEISMIC)
  // ============================================================================
  if (intent === 'GEOSPATIAL_LAYERS') {
    return {
      detectedLangLabel: langInfo.label,
      title: '7 Scientific Geospatial Datasets — Soil, Slope, Groundwater & Seismic Zone V',
      summary:
        'Every surveyed parcel on Dharitri Sentu combines 14 government revenue checkpoints with 7 scientific satellite and subsurface datasets:',
      bullets: [
        {
          icon: 'check',
          label: '1. VEDAS / ICAR Soil Health & ISRO CartoDEM Slope',
          detail:
            'Reports soil pH (e.g., pH 4.95 in Cinnamara Dag 785 ideal for Tea; pH 5.65 in Changsari Dag 412 for Sali Paddy), organic carbon %, elevation in metres MSL, and natural drainage slope %.',
        },
        {
          icon: 'check',
          label: '2. CGWB Groundwater & MOSDAC Multi-Temporal LULC (2015–2024)',
          detail:
            'Tracks pre/post-monsoon water table depth (mbgl), aquifer yield (LPM), BIS IS-10500 potability, and 10-year satellite land-use history to ensure no illegal wetland reclamation.',
        },
        {
          icon: 'info',
          label: '3. NESDR ROW Setbacks, PARIVESH ESZ & GSI Seismic Micro-Zonation',
          detail:
            'Verifies NHAI highway and powerline right-of-way clearances, distance to Eco-Sensitive Zones (Amchang, Hollongapar, Manas), and liquefaction resistance in Assam Seismic Zone V.',
        },
      ],
      citations: ['SAC ISRO VEDAS / ICAR', 'ISRO Bhuvan CartoDEM', 'CGWB Bhujal', 'MoEFCC PARIVESH', 'GSI / ASDMA'],
      actions: [
        { label: '🛰️ Open 7 Geo Layers in Map Inspector', to: '/explore', primary: true },
        { label: '🏛️ View All 12 Capability Pillars', to: '/capabilities' },
      ],
    };
  }

  // ============================================================================
  // INTENT 9: DYNAMIC CONTEXT-AWARE FALLBACK (Echoes User Query Terms Directly)
  // ============================================================================
  const cleanPreview = question.trim().slice(0, 90);

  if (langInfo.code === 'as') {
    return {
      detectedLangLabel: langInfo.label,
      title: `আপোনাৰ প্ৰশ্নৰ বিশ্লেষণ: "${cleanPreview}"`,
      summary: `আপুনি "${cleanPreview}" সন্দৰ্ভত তথ্য বিচাৰিছে। ধৰিত্ৰী সেতুত সংযুক্ত ৭ টা পাইলট দাগ (৪১২, ১৪২, ১০৪, ৭৮৫, ২১৯, ৫৩০, ৩১৮) আৰু অসম ভূমি নিয়মসমূহৰ ভিত্তিত তলৰ বিকল্পসমূহ চাওক:`,
      bullets: [
        {
          icon: 'check',
          label: 'নিৰ্দিষ্ট দাগ বা প্লট পৰীক্ষা (Dag 412, 142, 104, 785, 219, 530, 318)',
          detail:
            'যিকোনো দাগ নম্বৰ বা ১৪-অংকৰ ULPIN লিখিলে পট্টাদাৰৰ নাম, মাটিকালিৰ তুলনা আৰু মূল্য লগে লগে দেখুওৱা হয়।',
        },
        {
          icon: 'info',
          label: 'পট্টা আইন, ট্ৰাইবেল বেল্ট, বানপানী জ’ন আৰু বিঘা-কঠা গণনা',
          detail:
            'একচনা বনাম ম্যাদী পট্টা, অধ্যায় X ট্ৰাইবেল বেল্ট, ASDMA বানপানী জ’ন বা ১ বিঘা = ১৪,৪০০ বৰ্গফুটৰ হিচাপ সুধিব পাৰে।',
        },
      ],
      citations: ['Dharitree Assam', 'Mission Basundhara 3.0', 'IGR Assam', 'ASDMA'],
      actions: [
        { label: '🛰️ ইন্টাৰেক্টিভ মেপ খোলক (/explore)', to: '/explore', primary: true },
        { label: '📋 ডিউ-ডিলিজেন্স তালিকা (/due-diligence)', to: '/due-diligence' },
      ],
    };
  }

  if (langInfo.code === 'hi' || langInfo.code === 'hinglish') {
    return {
      detectedLangLabel: langInfo.label,
      title: `Query Analysis: "${cleanPreview}"`,
      summary: `Aapke sawal ("${cleanPreview}") ke liye Dharitri Sentu ke 14 government revenue checkpoints aur 7 geospatial datasets se relevant guidance नीचे di gayi hai:`,
      bullets: [
        {
          icon: 'check',
          label: 'Specific Dag & Parcel Lookup (Dag 412, 142, 104, 785, 219, 530, 318)',
          detail:
            'Kisi bhi plot ka Dag number ya Parcel ID (jaise AS-KMP-001 ya Dag 142) puchne par exact Pattadar, Bigha area variance aur Circle Rate milta hai.',
        },
        {
          icon: 'info',
          label: 'Legal & Technical Topics Supported',
          detail:
            'Aap Eksona vs Miyadi Patta, Chapter X Tribal Belt rules, ASDMA Flood Zones 1-3, Bigha-Katha-Lessa conversion ya Mission Basundhara 3.0 mutation ke baare mein puch sakte hain.',
        },
      ],
      citations: ['Dharitree Assam', 'Mission Basundhara 3.0', 'IGR Assam', 'ASDMA'],
      actions: [
        { label: '🛰️ Explore Satellite Map', to: '/explore', primary: true },
        { label: '📋 Open Buyer Checklist', to: '/due-diligence' },
      ],
    };
  }

  return {
    detectedLangLabel: langInfo.label,
    title: `Advisory Guidance for: "${cleanPreview}"`,
    summary: `Regarding your query ("${cleanPreview}"), Dharitri Sentu provides instant verification across 7 surveyed Assam pilot parcels and 8 statutory domain modules:`,
    bullets: [
      {
        icon: 'check',
        label: 'Inspect Any Surveyed Parcel by Dag or ULPIN',
        detail:
          'Ask about Changsari Dag 412 (AS-KMP-001), Amingaon Dag 142 (AS-KMP-142), Khanapara Dag 104 (AS-KMP-104), Cinnamara Dag 785 (AS-JRT-785), Chowkidinghee Dag 219 (AS-DBR-219), Samaguri Dag 530 (AS-NGN-530), or Ghopa Dag 318 (AS-BKS-318).',
      },
      {
        icon: 'info',
        label: 'Statutory & Geospatial Domain Modules',
        detail:
          'Ask about (1) Eksona vs. Miyadi Patta conversion, (2) Chapter X Tribal Belt rules (Sec 160–162 ALRR 1886), (3) ASDMA Flood Hazard Zones 1–3 & 500m riverbank buffer, (4) Bigha-Katha-Lessa calculations, or (5) Mission Basundhara 3.0 digital mutation.',
      },
      {
        icon: 'check',
        label: 'Direct Verification Workflows',
        detail:
          'Use the Interactive Satellite Map to inspect WGS-84 parcel polygons or open the 9-step Buyer Verification Checklist to track documents.',
      },
    ],
    citations: ['Dharitree Assam RoR', 'Mission Basundhara 3.0', 'IGR Assam', 'ASDMA', 'ISRO Bhuvan'],
    actions: [
      { label: '🛰️ Open Interactive Satellite Map (/explore)', to: '/explore', primary: true },
      { label: '📋 Open 9-Step Due Diligence (/due-diligence)', to: '/due-diligence' },
    ],
  };
}

export const VoiceAssistantPage: React.FC = () => {
  const { language, t } = useApp();
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'm-0',
      sender: 'assistant',
      detectedLangLabel: 'English · অসমীয়া · हिन्दी · Hinglish',
      title: 'Nomoskar! Welcome to the Dharitri Sentu Multi-Intent AI Land Advisor',
      summary:
        'Ask in English, Assamese, Hindi, or Hinglish about any specific parcel (Dag 412, 142, 104, 785, 219, 530, 318), Eksona vs. Miyadi Patta rules, Chapter X Tribal Belts, ASDMA Flood Zones 1–3, Bigha-to-Sq.Ft. conversions, Mission Basundhara 3.0 mutation, or required buying documents.',
      bullets: [
        {
          icon: 'check',
          label: 'Decoupled Language & Multi-Intent Domain Engine',
          detail:
            'Recognizes Assam revenue terms (Bigha, Katha, Lessa, Patta, Dag, Mutation) in English without misclassifying language, while supporting full Assamese and Hindi/Hinglish responses.',
        },
        {
          icon: 'info',
          label: 'Evidence sources and platform modules',
          detail:
            'Uses the data sources actually configured for this deployment. Demonstration records are labelled and are not official land records.',
        },
      ],
      citations: ['Demonstration records', 'Configured sources only'],
      actions: [
        { label: '🛰️ Open Interactive Parcel Map', to: '/explore', primary: true },
        { label: '📋 Open Due-Diligence Checklist', to: '/due-diligence' },
      ],
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeakMuted, setAutoSpeakMuted] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const speakText = (textToSpeak: string, langCode: string) => {
    if (autoSpeakMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang =
        langCode.includes('Assamese')
          ? 'as-IN'
          : langCode.includes('Hindi') || langCode.includes('Hinglish')
          ? 'hi-IN'
          : 'en-IN';
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeaking(false);
    }
  };

  const sendQuestion = (questionText: string) => {
    if (!questionText.trim()) return;
    const detected = detectQueryLanguage(questionText, language);

    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      sender: 'user',
      detectedLangLabel: detected.label,
      summary: questionText.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    const structured = buildStructuredAssistantTurn(questionText, language);
    const botTurn: ChatTurn = {
      id: `b-${Date.now() + 1}`,
      sender: 'assistant',
      ...structured,
      timestamp: new Date().toLocaleTimeString(),
    };

    setInput('');
    if (API_MODE) {
      setMessages((prev) => [...prev, userTurn]);
      setAiLoading(true);
      apiRequest<{ answer: string; sourceStatus?: string; language?: string }>('/api/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ message: questionText.trim(), language, context: 'Full-screen Dharitri land intelligence assistant' }),
      }).then((response) => {
        const detectedLangLabel = language === 'as' ? 'অসমীয়া (Assamese)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English';
        const answerTurn: ChatTurn = {
          id: `b-${Date.now() + 1}`,
          sender: 'assistant',
          detectedLangLabel,
          title: t('askDharitri'),
          summary: response.answer,
          bullets: [{ icon: 'info', label: language === 'as' ? 'AI-ৰ উত্তৰ' : language === 'hi' ? 'AI उत्तर' : 'AI-generated guidance', detail: response.sourceStatus || 'AI-generated guidance. Not an official record or legal conclusion.' }],
          citations: [],
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, answerTurn]);
        if (!autoSpeakMuted) speakText(answerTurn.summary, detectedLangLabel);
      }).catch((error) => {
        setVoiceNote(error instanceof Error ? error.message : 'Gemini is unavailable. No simulated answer was substituted.');
      }).finally(() => setAiLoading(false));
      return;
    }

    setMessages((prev) => [...prev, userTurn, botTurn]);

    if (!autoSpeakMuted) {
      const spokenSummary = `${structured.title ? structured.title + '. ' : ''}${structured.summary}`;
      speakText(spokenSummary, structured.detectedLangLabel);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNote(
        'Browser speech recognition is unavailable in this environment. Select any domain prompt chip or type below.'
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = language === 'as' ? 'as-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      setListening(true);
      setVoiceNote('Listening via microphone — speak in Assamese, Hindi, Hinglish, or English...');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setListening(false);
        setVoiceNote(null);
        if (transcript) sendQuestion(transcript);
      };
      recognition.onerror = () => {
        setListening(false);
        setVoiceNote('Microphone access declined or unavailable. Using text input below.');
      };
      recognition.onend = () => setListening(false);
      recognition.start();
    } catch {
      setListening(false);
      setVoiceNote('Speech input unavailable in this browser context.');
    }
  };

  const handleSpeakLastReply = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceNote('Speech synthesis (TTS) is not supported in this browser.');
      return;
    }
    const lastBot = [...messages].reverse().find((m) => m.sender === 'assistant');
    if (!lastBot) return;
    window.speechSynthesis.cancel();
    const fullText = [
      lastBot.title,
      lastBot.summary,
      ...(lastBot.bullets?.map((b) => `${b.label}: ${b.detail}`) || []),
    ]
      .filter(Boolean)
      .join('. ');
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang =
      lastBot.detectedLangLabel.includes('Assamese')
        ? 'as-IN'
        : lastBot.detectedLangLabel.includes('Hindi') || lastBot.detectedLangLabel.includes('Hinglish')
        ? 'hi-IN'
        : 'en-IN';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cream pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
            Multi-Intent Legal, Cadastral & Geospatial AI Advisor
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
            Dharitri Sentu Guided Assistant
          </h1>
          <p className="text-xs sm:text-sm text-secondarytext mt-1 max-w-3xl">
            Ask in <strong>English</strong>, <strong>অসমীয়া (Assamese)</strong>, <strong>हिन्दी (Hindi)</strong>, or <strong>Romanized Hinglish</strong>. Supports parcel inspection, Eksona vs. Miyadi Patta law, Chapter X Tribal Belts, ASDMA Flood Zones, Bigha-Katha-Lessa calculations, and Mission Basundhara 3.0 workflows.
          </p>
        </div>

        {/* Audio / Mute Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextMuted = !autoSpeakMuted;
              setAutoSpeakMuted(nextMuted);
              if (nextMuted) handleStopSpeaking();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              autoSpeakMuted
                ? 'bg-warmivory text-secondarytext border-[#CFC5B0]'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            {autoSpeakMuted ? '🔇 Voice Output Muted' : '🔊 Auto-Voice Enabled'}
          </button>
          <button
            type="button"
            onClick={handleSpeakLastReply}
            className="px-3.5 py-2 rounded-xl bg-palesky text-evergreen text-xs font-bold border border-mistyblue hover:bg-mistyblue transition"
          >
            ▶️ Read Last Card Aloud
          </button>
          {speaking && (
            <button
              type="button"
              onClick={handleStopSpeaking}
              className="px-3.5 py-2 rounded-xl bg-red-100 text-red-900 text-xs font-bold border border-red-300"
            >
              ⏹ Stop Audio
            </button>
          )}
        </div>
      </div>

      {/* Visual Audio Wave Banner when Microphone is Listening or TTS is Speaking */}
      {(listening || speaking || voiceNote) && (
        <div className="p-3.5 rounded-2xl bg-palesky border border-mistyblue text-xs text-evergreen flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {(listening || speaking) && (
              <div className="flex items-end gap-1 h-4" aria-hidden="true">
                <span className="w-1 h-2 bg-evergreen rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-teagreen rounded-full animate-bounce" />
                <span className="w-1 h-3 bg-evergreen rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-teagreen rounded-full animate-bounce" />
              </div>
            )}
            <span className="font-semibold">
              {voiceNote ||
                (listening
                  ? 'Listening for Assamese, Hindi, Hinglish, or English voice input...'
                  : 'Speaking assistant response aloud...')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setVoiceNote(null);
              handleStopSpeaking();
            }}
            className="font-bold px-2 py-0.5 rounded bg-white/80 hover:bg-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Multi-Intent Suggested Query Chips */}
      <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm space-y-2.5">
        <div className="text-xs font-bold text-evergreen">
          Test Multi-Intent Domain & Multilingual Queries (Click any topic chip):
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => sendQuestion(item.query)}
              className="px-3.5 py-1.5 rounded-full bg-warmivory hover:bg-evergreen hover:text-warmivory text-xs font-semibold text-maintext transition border border-[#CFC5B0]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Structured ChatTurn Transcript Window */}
      <div className="bg-white rounded-3xl border border-[#DFD6C3] p-5 sm:p-6 space-y-4 shadow-md">
        <div className="max-h-[520px] overflow-y-auto space-y-4 pr-1">
          {aiLoading && <div role="status" className="p-3 rounded-xl bg-[#EAF2E6] text-[#173F35] text-sm font-semibold">{t('loading')} · Gemini is preparing an evidence-aware response…</div>}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'user' ? (
                <div className="max-w-xl p-4 rounded-2xl rounded-br-none bg-evergreen text-warmivory text-xs leading-relaxed shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-1 opacity-85 text-[10px] font-semibold">
                    <span>👤 You ({m.detectedLangLabel})</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <p className="font-medium text-sm">{m.summary}</p>
                </div>
              ) : (
                /* Structured Assistant UI Card (Zero raw markdown # or * artifacts) */
                <div className="max-w-3xl w-full rounded-3xl border border-mistyblue bg-palesky/55 overflow-hidden shadow-sm">
                  {/* Card Title Banner */}
                  <div className="bg-evergreen text-warmivory px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🌱</span>
                      <span className="font-serif font-bold text-sm">
                        {m.title || 'Dharitri Sentu Evidence Summary'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teagreen text-[10px] font-bold">
                      {m.detectedLangLabel} · {m.timestamp}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-3.5 text-xs">
                    <p className="text-maintext font-medium leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                      {m.summary}
                    </p>

                    {/* Structured Bullet Points with Semantic Icons */}
                    {m.bullets && m.bullets.length > 0 && (
                      <div className="space-y-2">
                        {m.bullets.map((b, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                              b.icon === 'warn'
                                ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                                : b.icon === 'check'
                                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                                : 'bg-white/90 border-[#DFD6C3] text-maintext'
                            }`}
                          >
                            <span className="text-sm mt-0.5">
                              {b.icon === 'warn' ? '⚠️' : b.icon === 'check' ? '✅' : 'ℹ️'}
                            </span>
                            <div>
                              <div className="font-bold">{b.label}</div>
                              <div className="text-[11px] opacity-90 mt-0.5 leading-relaxed whitespace-pre-line">
                                {b.detail}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citation Badges */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondarytext mr-1">
                          Referenced Datasets:
                        </span>
                        {m.citations.map((cit) => (
                          <span
                            key={cit}
                            className="px-2.5 py-0.5 rounded-full bg-white border border-[#CFC5B0] text-[10px] font-bold text-evergreen"
                          >
                            🏛️ {cit}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 1-Click Action Buttons */}
                    {m.actions && m.actions.length > 0 && (
                      <div className="pt-2 border-t border-mistyblue flex flex-wrap items-center gap-2">
                        {m.actions.map((act) => (
                          <Link
                            key={act.label}
                            to={act.to}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                              act.primary
                                ? 'bg-evergreen text-warmivory hover:bg-teagreen'
                                : 'bg-white text-evergreen border border-[#CFC5B0] hover:bg-cream'
                            }`}
                          >
                            {act.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Voice + Text Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-cream"
        >
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`px-4 py-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
              listening
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-palesky hover:bg-mistyblue text-evergreen border-mistyblue'
            }`}
          >
            <span>🎙️</span>
            <span>{listening ? 'Listening...' : 'Speak (AS / HI / EN)'}</span>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Dag 412 / 142, Eksona vs Miyadi Patta, Chapter X Tribal Belt, Flood Zones, or Bigha conversion..."
            aria-label="Ask the Dharitri Sentu Assistant"
            className="flex-1 px-4 py-3 rounded-2xl bg-warmivory border border-[#CFC5B0] text-xs sm:text-sm text-maintext focus:outline-none focus:ring-2 focus:ring-evergreen"
          />

          <button
            type="submit"
            disabled={aiLoading}
            className="px-6 py-3 rounded-2xl bg-evergreen hover:bg-teagreen text-warmivory text-xs sm:text-sm font-bold transition shadow-sm disabled:opacity-50"
          >
            {aiLoading ? 'Thinking…' : 'Send Question →'}
          </button>
        </form>
      </div>

      {/* 12 Core Platform & Geospatial Capability Pillars */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
              Connected Architecture
            </span>
            <h2 className="font-serif text-2xl font-bold text-evergreen">
              12 Core Land-Transparency & Geospatial Pillars
            </h2>
          </div>
          <Link
            to="/capabilities"
            className="text-xs font-bold text-evergreen hover:underline"
          >
            View Full Architecture Matrix →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TWELVE_CAPABILITY_PILLARS.map((p) => (
            <Link
              key={p.id}
              to={p.route}
              className="group bg-white rounded-3xl p-5 border border-[#DFD6C3] hover:border-evergreen shadow-sm hover:shadow-md transition flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-palesky text-evergreen font-mono font-bold">
                    Pillar {p.number}
                  </span>
                  <span className="text-[11px] font-semibold text-teagreen group-hover:translate-x-0.5 transition">
                    Open →
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-evergreen">{p.title}</h3>
                <p className="text-[11px] font-semibold text-earthaccent">{p.source}</p>
                <p className="text-xs text-secondarytext leading-relaxed">{p.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
