import fs from 'node:fs';
import path from 'node:path';

const seeds = JSON.parse(fs.readFileSync('server/data/seeds.json', 'utf8'));
const sampleListings = seeds.SEED_LISTINGS || [];

function formatPriceLakhs(inr) {
  const lakhs = (inr || 0) / 100000;
  return Number.isInteger(lakhs) ? `₹${lakhs} Lakhs` : `₹${lakhs.toFixed(1)} Lakhs`;
}

function parseBudgetFromQuery(query) {
  const q = query.toLowerCase();

  const lakhMatch = q.match(/(?:under|below|less than|within|budget of|budget|upto|up to|max price|around)\s*(?:is|of|around)?\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l\b|লাখ|लाख)/i);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;

  const crMatch = q.match(/(?:under|below|less than|within|budget of|budget|upto|up to|max price|around)\s*(?:is|of|around)?\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:crores?|cr\b|কোটি|करोड़)/i);
  if (crMatch) return parseFloat(crMatch[1]) * 10000000;

  const bareLakh = q.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|লাখ|लाख)/i);
  if (bareLakh) return parseFloat(bareLakh[1]) * 100000;

  if (/\b(cheap|cheapest|low cost|affordable|budget friendly|lowest price|সস্তা|কম দাম|किफायती)\b/i.test(q)) {
    return 'CHEAPEST';
  }

  return null;
}

function generateIntelligentAssamAnswer(query, language = 'en', rawListings = []) {
  const q = String(query || '').toLowerCase().trim();
  const listings = Array.isArray(rawListings) && rawListings.length > 0 ? rawListings : sampleListings;
  const sortedByPrice = [...listings].sort((a, b) => (a.askingPriceINR || 0) - (b.askingPriceINR || 0));

  // 1. BUDGET & PRICE QUERIES
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
      if (language === 'as') {
        return `₹${targetLakhs} লাখৰ ভিতৰত ধাৰিত্ৰী সেঁতুত উপলব্ধ মাটিসমূহ (${matching.length} টা উপলব্ধ):\n\n` +
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

    // When no listings under budget
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

  // 2. DISTRICT / LOCATION INQUIRIES
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

  // 3. LAND TYPE QUERIES (Tea garden, commercial, agricultural, homestead)
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

  // 4. MEASUREMENT CONVERSIONS
  if (q.includes('bigha') || q.includes('katha') || q.includes('lessa') || q.includes('sq ft') || q.includes('বিঘা') || q.includes('কঠা')) {
    return `📐 **Official Assam Cadastral Land Measurement Standards:**\n\n` +
      `• **1 Bigha** = 5 Kathas = 100 Lessas\n` +
      `• **1 Katha** = 20 Lessas = 2,880 sq. ft.\n` +
      `• **1 Lessa** = 144 sq. ft. (~13.38 sq. meters)\n` +
      `• **1 Bigha in Sq. Ft.** = **14,400 sq. ft.** (~1,337.8 sq. meters)\n` +
      `• **1 Acre** = **3.025 Bighas** (approx 43,560 sq. ft.)\n\n` +
      `💡 Note: Assam land units differ from other Indian states (e.g. UP/Bihar Bigha is larger). On Dharitri Sentu, all area calculations strictly use the Assam Revenue Department standard (14,400 sq ft per Bigha).`;
  }

  // 5. CONTACT SELLER WORKFLOW
  if (q.includes('contact seller') || q.includes('enquiry') || q.includes('message seller') || q.includes('seller dashboard')) {
    return `📬 **How to Contact a Verified Seller on Dharitri Sentu:**\n\n` +
      `1. **Find the Parcel**: Go to **Explore Land** (\`/explore\`) and click on any parcel card.\n` +
      `2. **Open Contact Dialog**: On the listing details page, click the green **"Contact Seller"** button.\n` +
      `3. **Pick Quick Query Chips**: Insert 1-click tags such as *"Request Title Deeds & Jamabandi RoR"*, *"Schedule Physical Site Visit"*, or *"Negotiate Offer Price"*.\n` +
      `4. **Send Notification**: Clicking *"Send Notification to Seller"* automatically delivers an in-app alert and an official email to the seller.\n` +
      `5. **Track Replies**: Monitor seller responses directly in your **Buyer Dashboard** (\`/dashboard/buyer\`) under the **"My Land Enquiries"** section.`;
  }

  // 6. DUE DILIGENCE & LANDLOCKER
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
    return `📄 **Jamabandi (Record of Rights — RoR) in Assam:**\n\n` +
      `• A Jamabandi is the foundational land ownership register maintained by the Assam Revenue Department.\n` +
      `• It lists the **Pattadar name(s)**, **Patta Number**, **Dag (Parcel) Numbers**, **Land Class** (Rupit, Faringati, Basti), and exact area in Bigha-Katha-Lessa.\n` +
      `• **Verification Tip**: Always verify whether mutation (Namjari) is approved and reflected in the latest Dharitree Jamabandi Chitha.\n` +
      `• Official certified Jamabandi extracts can be obtained from the local Circle Office or via the **Sewa Setu** portal.`;
  }

  if (q.includes('patta') || q.includes('myadi') || q.includes('eksona') || q.includes('পট্টা') || q.includes('पट्टा')) {
    return `📜 **Periodic Patta (Myadi) vs. Annual Patta (Eksona) in Assam:**\n\n` +
      `1. **Periodic Patta (Myadi Patta)**:\n` +
      `   • Permanent, inheritable, and legally transferable freehold title.\n` +
      `   • Eligible for bank financing and mortgage registration.\n\n` +
      `2. **Annual Patta (Eksona Patta)**:\n` +
      `   • Temporary 1-year government lease.\n` +
      `   • **Cannot be bought, sold, or subdivided** without conversion to Myadi under Mission Basundhara 3.0.\n\n` +
      `⚠️ **Buyer Rule**: Only purchase parcels with confirmed Periodic (Myadi) Patta title.`;
  }

  // 8. GREETINGS
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

  // 9. GENERAL SMART FALLBACK
  return `Regarding **"${query}"**:\n\n` +
    `Dharitri Sentu provides verified cadastral records, Jamabandi RoR cross-checks, and circle rate benchmarks across Assam.\n\n` +
    `• To browse verified plots, visit **Explore Land** (\`/explore\`) to filter by district, price, or land type.\n` +
    `• For specific parcel data (Dag 412, 142, 104, 219, 785), inspect the **Interactive Cadastral Map**.\n` +
    `• To contact a seller or schedule a physical inspection, click **"Contact Seller"** on any parcel page.\n\n` +
    `💡 *You can also ask me specific questions like: "lands under 20 lakhs", "tea estates in Dibrugarh", or "how to check Jamabandi".*`;
}

console.log('--- TEST 1: Under 10 lakhs ---');
console.log(generateIntelligentAssamAnswer('okay say me the best lands under 10lakhs', 'en'));
console.log('\n--- TEST 2: Under 20 lakhs ---');
console.log(generateIntelligentAssamAnswer('show me lands under 20 lakhs', 'en'));
console.log('\n--- TEST 3: Lands in Kamrup ---');
console.log(generateIntelligentAssamAnswer('lands in Kamrup', 'en'));
console.log('\n--- TEST 4: Bigha to Katha ---');
console.log(generateIntelligentAssamAnswer('how many katha in a bigha in assam', 'en'));
console.log('\n--- TEST 5: How to contact seller ---');
console.log(generateIntelligentAssamAnswer('how to contact seller', 'en'));
