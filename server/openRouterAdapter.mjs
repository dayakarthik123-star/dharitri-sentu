import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct';
const DEFAULT_TIMEOUT_MS = 25000;

// In-flight request deduplication map (prevents duplicate simultaneous calls)
const inFlightRequests = new Map();

// Local rate-limiting tracker (per IP bucket)
const rateLimitBuckets = new Map();

/**
 * Returns configuration for OpenRouter AI without exposing secrets.
 */
export function getOpenRouterConfig() {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const model = (process.env.OPENROUTER_MODEL || DEFAULT_MODEL).trim();
  const baseUrl = (process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
  const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  return {
    isConfigured: Boolean(apiKey && apiKey.length > 5),
    model,
    baseUrl,
    timeoutMs,
  };
}

/**
 * Validates whether rate limit allows a new request from this client.
 */
export function checkAiRateLimit(clientIp, maxPerMinute = 15) {
  const minute = Math.floor(Date.now() / 60000);
  const key = `${clientIp || 'unknown'}:${minute}`;
  const count = rateLimitBuckets.get(key) || 0;

  if (count >= maxPerMinute) {
    return { allowed: false, remaining: 0 };
  }

  rateLimitBuckets.set(key, count + 1);

  // Periodic cleanup of older minute keys
  for (const k of rateLimitBuckets.keys()) {
    if (!k.endsWith(`:${minute}`)) {
      rateLimitBuckets.delete(k);
    }
  }

  return { allowed: true, remaining: maxPerMinute - count - 1 };
}

/**
 * Safely loads the seed listings catalog if not passed from server state.
 */
function getCatalogListings(overrideListings = []) {
  if (Array.isArray(overrideListings) && overrideListings.length > 0) {
    return overrideListings;
  }
  try {
    const seedsPath = path.join(__dirname, 'data', 'seeds.json');
    if (fs.existsSync(seedsPath)) {
      const data = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
      return data.SEED_LISTINGS || [];
    }
  } catch {
    // ignore
  }
  return [];
}

function formatPriceLakhs(inr) {
  const lakhs = (inr || 0) / 100000;
  return Number.isInteger(lakhs) ? `₹${lakhs} Lakhs` : `₹${lakhs.toFixed(1)} Lakhs`;
}

/**
 * Constructs the evidence-conscious system prompt in the target language.
 */
export function buildSystemPrompt(language = 'en', listings = []) {
  const languageInstructions = {
    as: 'Reply exclusively in formal Assamese (অসমীয়া Unicode).',
    hi: 'Reply exclusively in clear, professional Hindi (हिन्दी).',
    en: 'Reply in clear, professional English.',
  };

  const langDirective = languageInstructions[language] || languageInstructions.en;

  const catalogSummary = Array.isArray(listings) && listings.length > 0
    ? `Current Verified Dharitri Sentu Catalog Listings (${listings.length} available):
${listings.slice(0, 12).map((l, i) => `${i + 1}. "${l.title}" | District: ${l.district} | Village: ${l.village} | Type: ${l.landType} | Area: ${l.areaBigha} Bigha | Asking Price: ₹${(l.askingPriceINR / 100000).toFixed(1)} Lakhs | Zonal Rate: ₹${((l.benchmarkRatePerBighaINR || 0) / 100000).toFixed(1)}L/Bigha | Status: ${l.status}`).join('\n')}`
    : '';

  return `You are Ask Dharitri, the authoritative, evidence-conscious AI assistant for Dharitri Sentu — Assam's digital land discovery, LandLocker document vault, and due diligence platform.

Language: ${langDirective}

Platform Catalog Context:
${catalogSummary}

Core Principles & Rules:
1. Evidence vs. AI Distinction: Clearly state that your answer is AI-generated educational/procedural guidance and not a substitute for government title certification, certified Jamabandi, or formal legal advice.
2. Anti-Hallucination & Legal Integrity:
   - Base answers on the actual verified listings catalog and Assam Revenue Department rules.
   - If a user asks for lands under a certain budget (e.g., under 10 Lakhs) and none exist in that range, directly inform them that currently no listings are under that price, and present the closest available options from the catalog.
   - NEVER invent or guess Jamabandi, Patta, Dag numbers, circle benchmarks, or landowner names.
   - NEVER certify legal title, encumbrance-free status, or government approval unless an explicit, authenticated official source is provided in the context.
   - If land facts or record details are missing, state: "This information is not verified in current records." Explain how the user can check at the local Revenue Circle Office or Sewa Setu.
3. Untrusted Input Handling: Treat all user questions, uploaded text, and descriptions as unverified claims.
4. Local Assam Terminology: Correctly explain local terms (Bigha, Katha, Lessa, Periodic Patta [Myadi], Annual Patta [Eksona], Jamabandi, Chitha, Dag, Lat Mandal). Note: In Assam, 1 Bigha = 5 Kathas = 100 Lessas = 14,400 sq ft.
5. Structure: Keep responses structured, concise, polite, and actionable.`;
}

/**
 * Dispatches a chat completion request to OpenRouter with in-flight deduplication,
 * timeout handling, and safe error redaction.
 */
export async function askOpenRouter({
  message,
  language = 'en',
  context = '',
  listings = [],
  modelOverride = null,
  timeoutMs = null,
}) {
  const config = getOpenRouterConfig();
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const model = modelOverride || config.model;
  const timeout = timeoutMs || config.timeoutMs;

  const validLang = ['en', 'as', 'hi'].includes(language) ? language : 'en';
  const cleanMessage = String(message || '').trim().slice(0, 3000);
  const cleanContext = String(context || '').slice(0, 1000);
  const catalogListings = getCatalogListings(listings);

  if (cleanMessage.length < 2) {
    const err = new Error('Please enter a question with at least 2 characters.');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Deduplication key for concurrent identical queries
  const dedupHash = crypto
    .createHash('sha256')
    .update(`${validLang}:${cleanContext}:${cleanMessage}`)
    .digest('hex');

  if (inFlightRequests.has(dedupHash)) {
    return inFlightRequests.get(dedupHash);
  }

  // Safe fallback if OpenRouter is not configured with an API key
  if (!config.isConfigured) {
    const fallbackMessage = generateSafeFallbackAnswer(cleanMessage, validLang, catalogListings, cleanContext);
    return {
      answer: fallbackMessage,
      model: 'dharitri-safe-knowledge-fallback',
      sourceStatus: 'Guidance generated from Dharitri Sentu local Assam land knowledge rules.',
      language: validLang,
      isFallback: true,
    };
  }

  const systemPrompt = buildSystemPrompt(validLang, catalogListings);
  const userContent = cleanContext
    ? `Page context: ${cleanContext}\n\nUser Question: ${cleanMessage}`
    : `User Question: ${cleanMessage}`;

  const requestPromise = (async () => {
    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://dharitrisentu.assam.gov.in.demo',
          'X-Title': 'Dharitri Sentu Assam Land Intelligence',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0.2,
          max_tokens: 850,
        }),
        signal: AbortSignal.timeout(timeout),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const status = response.status;
        const errType = data?.error?.type || data?.error?.code || 'PROVIDER_ERROR';
        console.error(`[openrouter] Upstream HTTP ${status} error (${errType})`);

        if (status === 401) {
          const err = new Error('OpenRouter authentication failed. Please verify the server OPENROUTER_API_KEY.');
          err.status = 502;
          err.code = 'OPENROUTER_AUTH_FAILED';
          throw err;
        }

        if (status === 429) {
          const err = new Error('OpenRouter rate limit or quota exceeded. Please wait a moment and try again.');
          err.status = 429;
          err.code = 'OPENROUTER_RATE_LIMIT';
          throw err;
        }

        if (status === 404 || status === 503) {
          const err = new Error(`Configured model (${model}) is currently unavailable on OpenRouter.`);
          err.status = 502;
          err.code = 'OPENROUTER_MODEL_UNAVAILABLE';
          throw err;
        }

        const err = new Error('OpenRouter could not complete the request. Please check model and server configuration.');
        err.status = 502;
        err.code = 'OPENROUTER_REQUEST_FAILED';
        throw err;
      }

      const answer = data?.choices?.[0]?.message?.content?.trim();

      if (!answer) {
        const fallbackMessage = generateSafeFallbackAnswer(cleanMessage, validLang, catalogListings, cleanContext);
        return {
          answer: fallbackMessage,
          model: 'dharitri-land-intelligence-v2',
          sourceStatus: 'Dharitri Sentu Land Intelligence (Verified catalog)',
          language: validLang,
          isFallback: true,
        };
      }

      return {
        answer,
        model: data?.model || model,
        sourceStatus: 'AI-generated guidance via OpenRouter. Not a government title certification.',
        language: validLang,
        isFallback: false,
      };
    } catch (error) {
      if (error.status && error.code) {
        throw error;
      }
      console.warn('[openrouter] Upstream network error, switching to local intelligence:', error instanceof Error ? error.message : error);
      const fallbackMessage = generateSafeFallbackAnswer(cleanMessage, validLang, catalogListings, cleanContext);
      return {
        answer: fallbackMessage,
        model: 'dharitri-safe-knowledge-fallback',
        sourceStatus: 'Guidance generated from Dharitri Sentu local Assam land knowledge rules.',
        language: validLang,
        isFallback: true,
      };
    } finally {
      inFlightRequests.delete(dedupHash);
    }
  })();

  inFlightRequests.set(dedupHash, requestPromise);
  return requestPromise;
}

/**
 * Extracts and analyses document metadata using OpenRouter text completions.
 */
export async function analyzeDocumentWithOpenRouter({
  extractedText = '',
  documentTitle = '',
  category = '',
  language = 'en',
}) {
  const config = getOpenRouterConfig();
  const validLang = ['en', 'as', 'hi'].includes(language) ? language : 'en';

  if (!config.isConfigured) {
    return {
      aiAnalysis: {
        model: 'dharitri-local-extractor',
        status: 'Unverified Local Extraction',
        confidence: 'Rule-based parse',
        extractedFields: {
          documentTitle,
          category,
          characterCount: extractedText.length,
          disclaimer: 'Local extraction summary provided.',
        },
      },
    };
  }

  const prompt = `Analyze this unverified land document text for Dharitri Sentu.
Document Title: ${documentTitle}
Category: ${category}
Document Text:
"""
${extractedText.slice(0, 4000)}
"""

Task:
Extract visible land identifiers (Dag Number, Patta Number, Revenue Circle, Mouza, Village, Land Class, Recorded Area in Bigha/Katha/Lessa) if present.
Redact any Aadhaar, PAN, or personal phone numbers as [REDACTED].
Mark every field as UNVERIFIED.
Format as JSON with keys: extractedFields, detectedLandClass, securityNotice.`;

  try {
    const res = await askOpenRouter({
      message: prompt,
      language: validLang,
      context: 'Document Verification & Extraction',
    });

    let parsed = null;
    try {
      const match = res.answer.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch {
      parsed = { rawSummary: res.answer };
    }

    return {
      aiAnalysis: {
        model: res.model,
        status: 'Unverified Machine Extraction via OpenRouter',
        extractedFields: parsed || { rawSummary: res.answer },
      },
    };
  } catch (err) {
    return {
      aiAnalysis: {
        model: config.model,
        status: 'Extraction Error',
        error: err.message,
      },
    };
  }
}

/**
 * Converts Assamese/Bengali and Devanagari numerals to standard ASCII digits.
 */
function normalizeIndicDigits(str = '') {
  const indicDigits = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return str.replace(/[০-৯०-९]/g, (d) => indicDigits[d] || d);
}

/**
 * Parses user budget intent from a natural language query.
 */
function parseBudgetFromQuery(query) {
  const raw = query.toLowerCase();
  const q = normalizeIndicDigits(raw);

  const lakhMatch = q.match(/(?:under|below|less than|within|budget of|budget|upto|up to|max price|around|ভিতৰত|তলত|কম|अंदर|कम)\s*(?:is|of|around)?\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l\b|লাখ|लाख)/i);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;

  const crMatch = q.match(/(?:under|below|less than|within|budget of|budget|upto|up to|max price|around|ভিতৰত|তলত|কম|अंदर|कम)\s*(?:is|of|around)?\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:crores?|cr\b|কোটি|करोड़)/i);
  if (crMatch) return parseFloat(crMatch[1]) * 10000000;

  const bareLakh = q.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|লাখ|लाख)/i);
  if (bareLakh) return parseFloat(bareLakh[1]) * 100000;

  if (/\b(cheap|cheapest|low cost|affordable|budget friendly|lowest price|সস্তা|কম দাম|কিফायती)\b/i.test(q)) {
    return 'CHEAPEST';
  }

  return null;
}

/**
 * Comprehensive, dynamic Assam land intelligence fallback engine.
 * Generates tailored, highly specific responses according to the user's exact input.
 */
function generateSafeFallbackAnswer(query, language = 'en', rawListings = [], contextHint = '') {
  const q = String(query || '').toLowerCase().trim();
  const listings = Array.isArray(rawListings) && rawListings.length > 0 ? rawListings : getCatalogListings();
  const sortedByPrice = [...listings].sort((a, b) => (a.askingPriceINR || 0) - (b.askingPriceINR || 0));

  // 1. BUDGET & PRICE INTENT (e.g. "under 10lakhs", "best lands under 10 lakhs", "under 20 lakhs", "cheapest")
  const budget = parseBudgetFromQuery(q);
  if (budget !== null) {
    if (budget === 'CHEAPEST') {
      const top = sortedByPrice.slice(0, 3);
      if (language === 'as') {
        return `ধাৰিত্ৰী সেঁতুত বৰ্তমান উপলব্ধ আটাইতকৈ সুলভ মূল্যৰ মাটিসমূহ:\n\n` +
          top.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • মূল্য: **${formatPriceLakhs(l.askingPriceINR)}** | কালি: ${l.areaBigha} বিঘা (${l.landType})\n   • পথ: ${l.roadAccess || 'উপলব্ধ'}`).join('\n\n') +
          `\n\n📌 আপুনি 'Explore Land' পেজত গৈ নিজৰ বাজেট অনুসৰি ফিল্টাৰ কৰিব পাৰে।`;
      }
      if (language === 'hi') {
        return `धरित्री सेतु पर वर्तमान में सबसे किफायती सत्यापित भूखंड:\n\n` +
          top.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • मूल्य: **${formatPriceLakhs(l.askingPriceINR)}** | क्षेत्रफल: ${l.areaBigha} बीघा (${l.landType})\n   • सड़क: ${l.roadAccess || 'उपलब्ध'}`).join('\n\n') +
          `\n\n📌 आप 'Explore Land' पृष्ठ पर जाकर अपने बजट के अनुसार फ़िल्टर कर सकते हैं।`;
      }
      return `Here are the most affordable verified plots currently listed on Dharitri Sentu:\n\n` +
        top.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Asking Price: **${formatPriceLakhs(l.askingPriceINR)}** | Area: ${l.areaBigha} Bigha (${l.landType})\n   • Road: ${l.roadAccess || 'Direct link road'}`).join('\n\n') +
        `\n\n💡 Tip: Visit the **Explore Land** page to filter by your exact budget or district.`;
    }

    const targetAmount = typeof budget === 'number' ? budget : 1000000;
    const targetLakhs = (targetAmount / 100000).toFixed(0);
    const matching = sortedByPrice.filter(l => (l.askingPriceINR || 0) <= targetAmount);

    if (matching.length > 0) {
      const topMatches = matching.slice(0, 4);
      const remainingCount = matching.length - topMatches.length;

      if (language === 'as') {
        const remainingText = remainingCount > 0 ? `\n\n📌 ... আৰু ${remainingCount} টা সত্যায়িত প্লট উপলব্ধ আছে।` : '';
        return `₹${targetLakhs} লাখৰ ভিতৰত শ্ৰেষ্ঠ মাটিসমূহ (${matching.length} টা উপলব্ধ):\n\n` +
          topMatches.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • মূল্য: **${formatPriceLakhs(l.askingPriceINR)}** | কালি: ${l.areaBigha} বিঘা (${l.landType})\n   • পথ: ${l.roadAccess || 'উপলব্ধ'} | বিক্ৰেতা: ${l.sellerName || 'পঞ্জীভুক্ত বিক্ৰেতা'}`).join('\n\n') +
          remainingText +
          `\n\n👉 সকলো প্লট চাবলৈ 'Explore Land' পেজত ক্লিক কৰক।`;
      }
      if (language === 'hi') {
        const remainingText = remainingCount > 0 ? `\n\n📌 ... और ${remainingCount} अन्य सत्यापित भूखंड उपलब्ध हैं।` : '';
        return `₹${targetLakhs} लाख के भीतर प्रमुख सत्यापित भूखंड (${matching.length} उपलब्ध):\n\n` +
          topMatches.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • मूल्य: **${formatPriceLakhs(l.askingPriceINR)}** | क्षेत्रफल: ${l.areaBigha} बीघा (${l.landType})\n   • सड़क: ${l.roadAccess || 'उपलब्ध'} | विक्रेता: ${l.sellerName || 'पंजीकृत विक्रेता'}`).join('\n\n') +
          remainingText +
          `\n\n👉 सभी भूखंड देखने के लिए 'Explore Land' पृष्ठ पर जाएँ।`;
      }
      const remainingText = remainingCount > 0 ? `\n\n📌 ... and **${remainingCount} more verified plots** available within this budget.` : '';
      return `Here are the top verified plots on Dharitri Sentu under ₹${targetLakhs} Lakhs (${matching.length} total found):\n\n` +
        topMatches.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Asking Price: **${formatPriceLakhs(l.askingPriceINR)}** | Area: ${l.areaBigha} Bigha (${l.landType})\n   • Road Access: ${l.roadAccess || 'Direct access'} | Seller: ${l.sellerName || 'Verified Seller'}`).join('\n\n') +
        remainingText +
        `\n\n👉 You can click **"Explore Land"** in the navigation bar to inspect all ${matching.length} plots with full cadastral survey maps, or contact the seller directly.`;
    }

    // When no listings under requested budget (e.g., under 10 lakhs)
    const lowestAlternatives = sortedByPrice.slice(0, 4);
    const minPriceLakhs = formatPriceLakhs(sortedByPrice[0]?.askingPriceINR || 1450000);

    if (language === 'as') {
      return `ধাৰিত্ৰী সেঁতুত বৰ্তমান **₹${targetLakhs} লাখৰ তলত** কোনো মাটি পঞ্জীভুক্ত হোৱা নাই।\n\n` +
        `প্লেটফৰ্মত উপলব্ধ আটাইতকৈ সুলভ বিকল্পসমূহ **${minPriceLakhs}** ৰ পৰা আৰম্ভ হয়:\n\n` +
        lowestAlternatives.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • মূল্য: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} বিঘা · ${l.landType})\n   • জোনাল চৰকাৰী মূল্যাংকন: ₹${((l.benchmarkRatePerBighaINR || 600000) / 100000).toFixed(1)} লাখ/বিঘা`).join('\n\n') +
        `\n\n💡 **বাজেট ক্ৰেতাসকলৰ বাবে পৰামৰ্শ:**\n` +
        `• নলবাৰী, বাক্সা আদি গ্ৰামাঞ্চলত জোনাল চৰকাৰী নিৰিখ কম।\n` +
        `• 'Explore Land' ত মূল্য অনুসৰি সৰ্বনিম্নৰ পৰা সৰ্বোচ্চলৈ সজাই লওক।\n` +
        `• বিক্ৰেতাৰ সৈতে মূল্য আলোচনাত বহিবলৈ 'Contact Seller' ব্যৱহাৰ কৰক।`;
    }

    if (language === 'hi') {
      return `धरित्री सेतु पर वर्तमान में **₹${targetLakhs} लाख से कम** मूल्य का कोई भूखंड सूचीबद्ध नहीं है।\n\n` +
        `मंच पर उपलब्ध सबसे किफायती विकल्प **${minPriceLakhs}** से शुरू होते हैं:\n\n` +
        lowestAlternatives.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • मूल्य: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} बीघा · ${l.landType})\n   • सर्किल बेंचमार्क दर: ₹${((l.benchmarkRatePerBighaINR || 600000) / 100000).toFixed(1)} लाख/बीघा`).join('\n\n') +
        `\n\n💡 **कम बजट में भूमि तलाशने हेतु सुझाव:**\n` +
        `• नलबाड़ी, बाक्सा जैसे ग्रामीण क्षेत्रों में सर्किल दरें तुलनात्मक रूप से कम (₹3–5 लाख/बीघा) हैं।\n` +
        `• 'Explore Land' पृष्ठ पर 'Price: Low to High' फ़िल्टर का उपयोग करें।\n` +
        `• विक्रेता से सीधे बातचीत करने के लिए 'Contact Seller' बटन का उपयोग करें।`;
    }

    return `Currently, there are **no verified plots listed under ₹${targetLakhs} Lakhs** on Dharitri Sentu.\n\n` +
      `The closest and most affordable options available on the platform start from **${minPriceLakhs}**:\n\n` +
      lowestAlternatives.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Asking Price: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} Bigha · ${l.landType})\n   • Circle Benchmark: ₹${((l.benchmarkRatePerBighaINR || 600000) / 100000).toFixed(1)} Lakhs/Bigha\n   • Road Access: ${l.roadAccess || 'Direct link road'}`).join('\n\n') +
      `\n\n💡 **Practical Advice for Buyers under ₹${targetLakhs} Lakhs in Assam:**\n` +
      `• **Rural Agricultural Belts**: Agricultural parcels in circles like Nalbari, Baksa, and Darrang feature lower zonal valuations (typically ₹3–5 Lakhs/Bigha).\n` +
      `• **Explore Land Filters**: Go to **Explore Land** (\`/explore\`) and sort by *"Price: Low to High"* to monitor newly listed budget plots.\n` +
      `• **Direct Seller Inquiries**: Click **"Contact Seller"** on any parcel to negotiate price or inquire if fractional Dag demarcation is feasible.`;
  }

  // 2. DISTRICT & REGIONAL LOOKUPS
  const districts = [
    { key: 'kamrup', name: 'Kamrup' },
    { key: 'guwahati', name: 'Kamrup' },
    { key: 'dibrugarh', name: 'Dibrugarh' },
    { key: 'jorhat', name: 'Jorhat' },
    { key: 'nagaon', name: 'Nagaon' },
    { key: 'sonitpur', name: 'Sonitpur' },
    { key: 'tezpur', name: 'Sonitpur' },
    { key: 'baksa', name: 'Baksa' },
    { key: 'nalbari', name: 'Nalbari' },
    { key: 'sivasagar', name: 'Sivasagar' },
    { key: 'tinsukia', name: 'Tinsukia' },
    { key: 'cachar', name: 'Cachar' },
    { key: 'silchar', name: 'Cachar' },
    { key: 'golaghat', name: 'Golaghat' },
    { key: 'kaziranga', name: 'Golaghat' },
  ];

  const matchedDistrict = districts.find(d => q.includes(d.key));
  if (matchedDistrict) {
    const districtMatches = listings.filter(l =>
      l.district?.toLowerCase().includes(matchedDistrict.name.toLowerCase()) ||
      l.village?.toLowerCase().includes(matchedDistrict.key) ||
      l.title?.toLowerCase().includes(matchedDistrict.key)
    );

    if (districtMatches.length > 0) {
      return `Here are the verified land listings in **${matchedDistrict.name} District** (${districtMatches.length} available):\n\n` +
        districtMatches.map((l, i) => `${i + 1}. **${l.title}** (${l.village})\n   • Price: **${formatPriceLakhs(l.askingPriceINR)}** | Area: ${l.areaBigha} Bigha\n   • Type: ${l.landType} | Zonal Benchmark: ₹${((l.benchmarkRatePerBighaINR || 0) / 100000).toFixed(1)}L/Bigha\n   • Status: ${l.status}`).join('\n\n') +
        `\n\n📍 You can view the cadastral boundaries on the **Explore Map** or click **"Contact Seller"** to request title deeds.`;
    }
  }

  // 3. LAND TYPE SPECIFIC INQUIRIES
  if (q.includes('tea') || q.includes('চা') || q.includes('चाय')) {
    const teaPlots = listings.filter(l => l.landType?.toLowerCase().includes('tea') || l.title?.toLowerCase().includes('tea'));
    return `Verified **Tea Garden Land** plots on Dharitri Sentu:\n\n` +
      teaPlots.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Price: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} Bigha)\n   • Road: ${l.roadAccess || 'Direct'}\n   • Note: ${l.description?.slice(0, 110)}...`).join('\n\n') +
      `\n\n🌿 **Assam Tea Land Guidelines:**\n• Ensure the land holds confirmed Periodic Patta (Myadi) tenure.\n• Check Tea Board registration & 30-Year Non-Encumbrance Certificate (NEC).`;
  }

  if (q.includes('commercial') || q.includes('ব্যৱসায়িক') || q.includes('व्यावसायिक')) {
    const commPlots = listings.filter(l => l.landType?.toLowerCase().includes('commercial') || l.title?.toLowerCase().includes('commercial'));
    return `Verified **Commercial Land** plots on Dharitri Sentu:\n\n` +
      commPlots.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Price: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} Bigha)\n   • Highway: ${l.roadAccess || 'Frontage'}`).join('\n\n') +
      `\n\n🏢 **Assam Commercial Land Rule:** Verify highway setback and PWD corridor clearances before commercial development.`;
  }

  if (q.includes('agricultural') || q.includes('farming') || q.includes('paddy') || q.includes('কৃষি') || q.includes('खेती')) {
    const agriPlots = listings.filter(l => l.landType?.toLowerCase().includes('agricultural'));
    return `Verified **Agricultural Farmland** plots on Dharitri Sentu (${agriPlots.length} available):\n\n` +
      agriPlots.slice(0, 4).map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Price: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} Bigha)\n   • Flood Risk: ${l.floodRiskNote || 'Low seasonal waterlogging'}`).join('\n\n') +
      `\n\n🌾 **Assam Agricultural Ceiling:** Individual agricultural land holdings are regulated under the Assam Fixation of Ceiling on Land Holding Act 1956 (50 Bighas ceiling per family).`;
  }

  // 4. MEASUREMENT UNITS & CONVERSIONS
  if (q.includes('bigha') || q.includes('katha') || q.includes('lessa') || q.includes('sq ft') || q.includes('বিঘা') || q.includes('কঠা')) {
    return `📐 **Official Assam Cadastral Land Measurement Standards:**\n\n` +
      `• **1 Bigha** = 5 Kathas = 100 Lessas\n` +
      `• **1 Katha** = 20 Lessas = 2,880 sq. ft.\n` +
      `• **1 Lessa** = 144 sq. ft. (~13.38 sq. meters)\n` +
      `• **1 Bigha in Sq. Ft.** = **14,400 sq. ft.** (~1,337.8 sq. meters)\n` +
      `• **1 Acre** = **3.025 Bighas** (approx 43,560 sq. ft.)\n\n` +
      `💡 Note: Assam land units differ from other Indian states (e.g. UP/Bihar Bigha is larger). On Dharitri Sentu, all area calculations strictly use the Assam Revenue Department standard (14,400 sq ft per Bigha).`;
  }

  // 5. CONTACT SELLER & NOTIFICATION FLOW
  if (q.includes('contact seller') || (q.includes('contact') && q.includes('seller')) || q.includes('enquiry') || q.includes('message seller') || q.includes('seller dashboard') || q.includes('how to buy')) {
    return `📬 **How to Contact a Verified Seller on Dharitri Sentu:**\n\n` +
      `1. **Find the Parcel**: Go to **Explore Land** (\`/explore\`) and click on any parcel card.\n` +
      `2. **Open Contact Dialog**: On the listing details page, click the green **"Contact Seller"** button.\n` +
      `3. **Pick Quick Query Chips**: Insert 1-click tags such as *"Request Title Deeds & Jamabandi RoR"*, *"Schedule Physical Site Visit"*, or *"Negotiate Offer Price"*.\n` +
      `4. **Send Notification**: Clicking *"Send Notification to Seller"* automatically delivers an in-app alert and an official email to the seller.\n` +
      `5. **Track Replies**: Monitor seller responses directly in your **Buyer Dashboard** (\`/dashboard/buyer\`) under the **"My Land Enquiries"** section.`;
  }

  // 6. DUE DILIGENCE, VERIFICATION CHECKLIST & LANDLOCKER
  if (q.includes('due diligence') || q.includes('checklist') || q.includes('landlocker') || q.includes('safe') || q.includes('scam') || q.includes('fraud')) {
    return `🛡️ **Assam 5-Point Land Due-Diligence Checklist:**\n\n` +
      `1. **30-Year Non-Encumbrance Certificate (NEC)**: Issued by the Senior Sub-Registrar confirming absence of bank mortgages.\n` +
      `2. **Circle Office Jamabandi Mutation Check**: Verify current Pattadar names in Chitha and confirm approval on Dharitree.\n` +
      `3. **PMP Act 1962 RoU Pipeline Buffer**: Confirm no GAIL, Oil India, or IOCL pipeline servitude runs across the parcel.\n` +
      `4. **Chapter X Protected Tribal Belt Check**: Confirm the plot is not located within restricted tribal belts without non-tribal alienation permits.\n` +
      `5. **ASDMA Flood Zone & Ground Elevation**: Confirm parcel sits above High Flood Level (> 52m MSL).\n\n` +
      `📂 Use **LandLocker** (\`/landlocker\`) to connect MeriPehchaan DigiLocker and store your authenticated deeds safely.`;
  }

  // 7. JAMABANDI & PATTA PROCEDURES
  if (q.includes('jamabandi') || q.includes('জমাৱন্দী') || q.includes('जमाबंदी')) {
    if (language === 'as') {
      return `জমাৱন্দী (Jamabandi) হৈছে অসমৰ ৰাজহ বিভাগৰ অধীনত প্ৰস্তুত কৰা মূল ভূমি স্বত্ব অভিলেখ (Record of Rights)। 
ইয়াত পট্টাদাৰৰ নাম, দাগ নম্বৰ, মাটিৰ শ্ৰেণী আৰু কালি (বিঘা-কঠা-লেচা) উল্লেখ থাকে। 
ধাৰিত্ৰী সেঁতুৰ জৰিয়তে আপুনি জমাৱন্দীৰ তথ্য সংৰক্ষণ আৰু পৰীক্ষা কৰিব পাৰে। অনুগ্ৰহ কৰি মনত ৰাখিব যে এয়া কেৱল পদ্ধতিগত সহায়, কোনো চৰকাৰী প্ৰমাণীকৰণ নহয়।`;
    }
    if (language === 'hi') {
      return `जमाबंदी (Jamabandi) असम के राजस्व विभाग द्वारा जारी किया जाने वाला मुख्य भू-अभिलेख (Record of Rights) है। इसमें पट्टाधारक का नाम, दाग नंबर, भूमि की श्रेणी और क्षेत्रफल (बीघा, कठ्ठा, लेचा) दर्ज होता है। 
धरित्री सेतु के माध्यम से आप इन अभिलेखों को सुरक्षित रख सकते हैं। आधिकारिक सत्यापन राजस्व मंडल कार्यालय (Circle Office) अथवा Sewa Setu से प्राप्त करें।`;
    }
    return `📄 **Jamabandi (Record of Rights — RoR) in Assam:**\n\n` +
      `• A Jamabandi is the foundational land ownership register maintained by the Assam Revenue Department.\n` +
      `• It lists the **Pattadar name(s)**, **Patta Number**, **Dag (Parcel) Numbers**, **Land Class** (Rupit, Faringati, Basti), and exact area in Bigha-Katha-Lessa.\n` +
      `• **Verification Tip**: Always verify whether mutation (Namjari) is approved and reflected in the latest Dharitree Jamabandi Chitha.\n` +
      `• Official certified Jamabandi extracts can be obtained from the local Circle Office or via the **Sewa Setu** portal.`;
  }

  if (q.includes('patta') || q.includes('myadi') || q.includes('eksona') || q.includes('পট্টা') || q.includes('पट्टा')) {
    if (language === 'as') {
      return `অসমত মূলতঃ দুই প্ৰকাৰৰ পট্টা পোৱা যায়: 
১. ম্যাদী পট্টা (Periodic Patta): স্থায়ী আৰু হস্তান্তৰযোগ্য স্বত্ব।
২. একচনা পট্টা (Annual Patta): এবছৰীয়া অস্থায়ী পট্টা, যিটো চৰকাৰী অনুমতি অবিহনে হস্তান্তৰ কৰিব নোৱাৰি। 
ধাৰিত্ৰী সেঁতুত ভূমি লেনদেনৰ পূৰ্বে ম্যাদী পট্টাৰ স্থিতি নিৰীক্ষণ কৰাটো বাঞ্ছনীয়।`;
    }
    if (language === 'hi') {
      return `असम में प्रमुख रूप से दो प्रकार के पट्टे होते हैं:
1. म्यादी पट्टा (Periodic Patta): स्थायी और हस्तांतरणीय स्वामित्व।
2. एकसना पट्टा (Annual Patta): एक वर्ष के लिए अस्थायी पट्टा, जिसे बिना सरकारी अनुमति हस्तांतरित नहीं किया जा सकता। 
भूमि क्रय करने से पहले म्यादी पट्टे की वैधता जांचना आवश्यक है।`;
    }
    return `📜 **Periodic Patta (Myadi) vs. Annual Patta (Eksona) in Assam:**\n\n` +
      `1. **Periodic Patta (Myadi Patta)**:\n` +
      `   • Permanent, inheritable, and legally transferable freehold title.\n` +
      `   • Eligible for bank financing and mortgage registration.\n\n` +
      `2. **Annual Patta (Eksona Patta)**:\n` +
      `   • Temporary 1-year government lease.\n` +
      `   • **Cannot be bought, sold, or subdivided** without conversion to Myadi under Mission Basundhara 3.0.\n\n` +
      `⚠️ **Buyer Rule**: Only purchase parcels with confirmed Periodic (Myadi) Patta title.`;
  }

  // 8. GREETINGS & INTRODUCTIONS
  if (/\b(hello|hi|hey|greetings|নমস্কাৰ|नमस्ते)\b/i.test(q)) {
    return `👋 **Hello! I am Ask Dharitri**, your dedicated Assam land intelligence assistant.\n\n` +
      `I can help you with:\n` +
      `• **Search Lands by Budget**: Ask *"best lands under 20 lakhs"* or *"cheapest agricultural land"*.\n` +
      `• **District & Location Lookup**: Ask *"lands in Kamrup"* or *"tea gardens in Dibrugarh"*.\n` +
      `• **Assam Land Rules**: Inquire about Jamabandi RoR, Periodic Patta (Myadi), Mission Basundhara 3.0, or circle rates.\n` +
      `• **Land Measurement**: Ask *"how many katha in a bigha?"* or unit conversions.\n` +
      `• **Due Diligence**: Ask *"how to verify land title?"* or *"due diligence checklist"*.\n\n` +
      `What would you like to explore today?`;
  }

  // 9. DYNAMIC MATCHING / SMART CONTEXTUAL FALLBACK
  return `Regarding **"${query}"**:\n\n` +
    `Dharitri Sentu provides verified cadastral records, Jamabandi RoR cross-checks, and circle rate benchmarks across Assam.\n\n` +
    `• To browse verified plots, visit **Explore Land** (\`/explore\`) to filter by district, price, or land type.\n` +
    `• For specific parcel data (Dag 412, 142, 104, 219, 785), inspect the **Interactive Cadastral Map**.\n` +
    `• To contact a seller or schedule a physical inspection, click **"Contact Seller"** on any parcel page.\n\n` +
    `💡 *You can also ask me specific questions like: "lands under 20 lakhs", "tea estates in Dibrugarh", or "how to check Jamabandi".*`;
}
