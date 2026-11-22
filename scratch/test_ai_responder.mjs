import fs from 'node:fs';
import path from 'node:path';

const seeds = JSON.parse(fs.readFileSync('server/data/seeds.json', 'utf8'));
const sampleListings = seeds.SEED_LISTINGS || [];

function formatPriceLakhs(inr) {
  const lakhs = inr / 100000;
  return Number.isInteger(lakhs) ? `₹${lakhs} Lakhs` : `₹${lakhs.toFixed(1)} Lakhs`;
}

function parseBudgetFromQuery(query) {
  const q = query.toLowerCase();
  
  const lakhMatch = q.match(/(?:under|below|less than|within|budget of|budget|upto|up to|max price)\s*(?:is|of|around)?\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l\b|লাখ|लाख)/i);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;

  const crMatch = q.match(/(?:under|below|less than|within|budget of|budget|upto|up to|max price)\s*(?:is|of|around)?\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:crores?|cr\b|কোটি|करोड़)/i);
  if (crMatch) return parseFloat(crMatch[1]) * 10000000;

  const bareLakh = q.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|লাখ|लाख)/i);
  if (bareLakh) return parseFloat(bareLakh[1]) * 100000;

  if (/\b(cheap|cheapest|low cost|affordable|budget friendly|lowest price|সস্তা|কম দাম)\b/i.test(q)) {
    return 'CHEAPEST';
  }

  return null;
}

function handleBudgetQuery(budget, listings, language) {
  const sorted = [...listings].sort((a, b) => (a.askingPriceINR || 0) - (b.askingPriceINR || 0));

  if (budget === 'CHEAPEST') {
    const top = sorted.slice(0, 3);
    if (language === 'as') {
      return `ধাৰিত্ৰী সেঁতুত বৰ্তমান উপলব্ধ আটাইতকৈ সুলভ মূল্যৰ মাটিসমূহ:\n\n` +
        top.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • মূল্য: **${formatPriceLakhs(l.askingPriceINR)}** | কালি: ${l.areaBigha} বিঘা (${l.landType})\n   • পথৰ সুবিধা: ${l.roadAccess || 'উপলব্ধ'}`).join('\n\n') +
        `\n\n📌 আপুনি 'Explore Land' পেজত গৈ নিজৰ বাজেট অনুসৰি ফিল্টাৰ কৰিব পাৰে।`;
    }
    if (language === 'hi') {
      return `धरित्री सेतु पर वर्तमान में सबसे किफायती सत्यापित भूखंड:\n\n` +
        top.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • मूल्य: **${formatPriceLakhs(l.askingPriceINR)}** | क्षेत्रफल: ${l.areaBigha} बीघा (${l.landType})\n   • सड़क संपर्क: ${l.roadAccess || 'उपलब्ध'}`).join('\n\n') +
        `\n\n📌 आप 'Explore Land' पृष्ठ पर जाकर अपने बजट के अनुसार फ़िल्टर कर सकते हैं।`;
    }
    return `Here are the most affordable verified plots currently listed on Dharitri Sentu:\n\n` +
      top.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Price: **${formatPriceLakhs(l.askingPriceINR)}** | Area: ${l.areaBigha} Bigha (${l.landType})\n   • Road Access: ${l.roadAccess || 'Direct road access'}`).join('\n\n') +
      `\n\n💡 Tip: Visit the **Explore Land** page to filter by your exact budget or district.`;
  }

  const targetAmount = typeof budget === 'number' ? budget : 1000000;
  const targetLakhs = (targetAmount / 100000).toFixed(0);
  const matching = sorted.filter(l => (l.askingPriceINR || 0) <= targetAmount);

  if (matching.length > 0) {
    if (language === 'as') {
      return `₹${targetLakhs} লাখৰ ভিতৰত ধাৰিত্ৰী সেঁতুত উপলব্ধ মাটিসমূহ (${matching.length} টা):\n\n` +
        matching.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • মূল্য: **${formatPriceLakhs(l.askingPriceINR)}** | কালি: ${l.areaBigha} বিঘা (${l.landType})\n   • বিক্ৰেতা: ${l.sellerName || 'পঞ্জীভুক্ত বিক্ৰেতা'}`).join('\n\n') +
        `\n\nপ্ৰতিটো প্লটৰ জামাবন্দী আৰু বিতং তথ্য চাবলৈ 'Explore Land' পেজত ক্লিক কৰক।`;
    }
    if (language === 'hi') {
      return `₹${targetLakhs} लाख के भीतर धरित्री सेतु पर उपलब्ध सत्यापित भूखंड (${matching.length} उपलब्ध):\n\n` +
        matching.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • मूल्य: **${formatPriceLakhs(l.askingPriceINR)}** | क्षेत्रफल: ${l.areaBigha} बीघा (${l.landType})\n   • विक्रेता: ${l.sellerName || 'पंजीकृत विक्रेता'}`).join('\n\n') +
        `\n\nप्रत्येक भूखंड की जमाबंदी और विस्तृत जानकारी देखने के लिए 'Explore Land' पर जाएँ।`;
    }
    return `Here are the verified plots on Dharitri Sentu available under ₹${targetLakhs} Lakhs (${matching.length} found):\n\n` +
      matching.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Asking Price: **${formatPriceLakhs(l.askingPriceINR)}** | Area: ${l.areaBigha} Bigha (${l.landType})\n   • Seller: ${l.sellerName || 'Verified Seller'}`).join('\n\n') +
      `\n\n👉 You can click **"View Parcel"** on the Explore page to inspect boundary coordinates, Dag survey records, or contact the verified seller directly.`;
  }

  // No listings under this budget -> Provide clear answer + lowest available alternatives
  const lowestAlternatives = sorted.slice(0, 4);
  const minPriceLakhs = formatPriceLakhs(sorted[0]?.askingPriceINR || 1450000);

  if (language === 'as') {
    return `ধাৰিত্ৰী সেঁতুত বৰ্তমান **₹${targetLakhs} লাখৰ তলত** কোনো মাটি পঞ্জীভুক্ত হোৱা নাই।\n\n` +
      `প্লেটফৰ্মত উপলব্ধ আটাইতকৈ সুলভ মূল্যৰ মাটিসমূহ **${minPriceLakhs}** ৰ পৰা আৰম্ভ হয়:\n\n` +
      lowestAlternatives.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • মূল্য: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} বিঘা · ${l.landType})\n   • চৰকাৰী জোনাল মূল্যাংকন: ₹${((l.benchmarkRatePerBighaINR || 600000) / 100000).toFixed(1)} লাখ/বিঘা`).join('\n\n') +
      `\n\n💡 **বাজেট ক্ৰেতাসকলৰ বাবে দিহা:**\n` +
      `• নলবাৰী, বাক্সা আদি গ্ৰামাঞ্চলত জোনাল চৰকাৰী নিৰিখ তুলনামূলকভাৱে কম।\n` +
      `• আপুনি 'Explore Land' ত সৰ্বোচ্চ মূল্য ফিল্টাৰ কৰি নতুনকৈ তালিকাভুক্ত মাটিৰ খবৰ ৰাখিব পাৰে।\n` +
      `• পোনপটীয়াকৈ বিক্ৰেতাৰ সৈতে কথা পাতিবলৈ 'Contact Seller' সুবিধা ব্যৱহাৰ কৰক।`;
  }

  if (language === 'hi') {
    return `धरित्री सेतु पर वर्तमान में **₹${targetLakhs} लाख से कम** मूल्य का कोई भूखंड सूचीबद्ध नहीं है।\n\n` +
      `मंच पर उपलब्ध सबसे किफायती सत्यापित विकल्प **${minPriceLakhs}** से शुरू होते हैं:\n\n` +
      lowestAlternatives.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • मूल्य: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} बीघा · ${l.landType})\n   • सर्किल बेंचमार्क दर: ₹${((l.benchmarkRatePerBighaINR || 600000) / 100000).toFixed(1)} लाख/बीघा`).join('\n\n') +
      `\n\n💡 **कम बजट में भूमि तलाशने हेतु सुझाव:**\n` +
      `• नलबाड़ी, बाक्सा जैसे ग्रामीण क्षेत्रों में सर्किल दरें तुलनात्मक रूप से कम (₹3–5 लाख/बीघा) हैं।\n` +
      `• 'Explore Land' पृष्ठ पर 'Max Price' सेट करके नए भूखंडों की निगरानी करें।\n` +
      `• विक्रेता से सीधे बातचीत करने के लिए 'Contact Seller' बटन का उपयोग करें।`;
  }

  return `Currently, there are **no verified plots listed under ₹${targetLakhs} Lakhs** on Dharitri Sentu.\n\n` +
    `The closest and most affordable options available on the platform start from **${minPriceLakhs}**:\n\n` +
    lowestAlternatives.map((l, i) => `${i + 1}. **${l.title}** (${l.village}, ${l.district})\n   • Asking Price: **${formatPriceLakhs(l.askingPriceINR)}** (${l.areaBigha} Bigha · ${l.landType})\n   • Circle Benchmark: ₹${((l.benchmarkRatePerBighaINR || 600000) / 100000).toFixed(1)} Lakhs/Bigha\n   • Road: ${l.roadAccess || 'Direct link road'}`).join('\n\n') +
    `\n\n💡 **Practical Advice for Buyers under ₹${targetLakhs} Lakhs:**\n` +
    `• **Rural Agricultural Belts**: Agricultural parcels in circles like Nalbari, Baksa, and Darrang feature lower zonal valuations (typically ₹3–5 Lakhs/Bigha).\n` +
    `• **Explore Land Filters**: Go to **Explore Land** (\`/explore\`) and sort by *"Price: Low to High"* to monitor newly listed budget plots.\n` +
    `• **Direct Seller Inquiries**: Click **"Contact Seller"** on any parcel to negotiate price or inquire if fractional Dag demarcation is feasible.`;
}

console.log(handleBudgetQuery(parseBudgetFromQuery("okay say me the best lands under 10lakhs"), sampleListings, 'en'));
