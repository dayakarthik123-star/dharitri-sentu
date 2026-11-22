import {
  User,
  Listing,
  DiscrepancyCase,
  DueDiligenceCase,
  Enquiry,
  EnquiryReply,
  LandLockerDocument,
  AuditEvent,
  Language,
  AreaUnit,
} from '../types';
import {
  SEED_USERS,
  SEED_LISTINGS,
  SEED_DISCREPANCIES,
  SEED_CASES,
  SEED_ENQUIRIES,
  SEED_DOCUMENTS,
  SEED_AUDIT_EVENTS,
} from '../data/seedData';

const STORAGE_KEY = 'dharitri_sentu_demo_state_v1';

export interface AppState {
  users: User[];
  currentUser: User | null;
  language: Language;
  areaUnit: AreaUnit;
  introSeen: boolean;
  savedListingIds: string[];
  recentlyViewedIds: string[];
  recentSearches: string[];
  listings: Listing[];
  discrepancies: DiscrepancyCase[];
  cases: DueDiligenceCase[];
  enquiries: Enquiry[];
  documents: LandLockerDocument[];
  auditEvents: AuditEvent[];
}

export function getInitialSeedState(): AppState {
  let lang: Language = 'en';
  try {
    const saved = typeof window !== 'undefined' ? (window.localStorage.getItem('dharitri_lang') as Language) : null;
    if (saved === 'as' || saved === 'hi' || saved === 'en') lang = saved;
  } catch {}
  return {
    users: [...SEED_USERS],
    currentUser: null,
    language: lang,
    areaUnit: 'bigha',
    introSeen: false,
    savedListingIds: ['lst-1', 'lst-2'],
    recentlyViewedIds: ['lst-1', 'lst-2', 'lst-4'],
    recentSearches: ['Kamrup', 'Changsari', 'AS-KMP-001', 'Tea Garden Land'],
    listings: JSON.parse(JSON.stringify(SEED_LISTINGS)),
    discrepancies: JSON.parse(JSON.stringify(SEED_DISCREPANCIES)),
    cases: JSON.parse(JSON.stringify(SEED_CASES)),
    enquiries: JSON.parse(JSON.stringify(SEED_ENQUIRIES)),
    documents: JSON.parse(JSON.stringify(SEED_DOCUMENTS)),
    auditEvents: JSON.parse(JSON.stringify(SEED_AUDIT_EVENTS)),
  };
}

export function loadStateFromStorage(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialSeedState();
    const parsed = JSON.parse(raw);
    const initial = getInitialSeedState();
    const merged = { ...initial, ...parsed };
    merged.users = [...SEED_USERS];
    if (merged.currentUser) {
      merged.currentUser.name = merged.currentUser.name.replace(/\s*\([^)]*\)/g, '').trim();
      if (merged.currentUser.role === 'buyer') {
        merged.currentUser.email = 'ananya@dharitrisentu.in';
        merged.currentUser.name = 'Ananya Baruah';
      } else if (merged.currentUser.role === 'seller') {
        merged.currentUser.email = 'pranabjyoti@dharitrisentu.in';
        merged.currentUser.name = 'Pranabjyoti Kalita';
      } else if (merged.currentUser.role === 'reviewer') {
        merged.currentUser.email = 'debajit@assam.gov.in';
        merged.currentUser.name = 'Debajit Hazarika';
      }
    }
    if (Array.isArray(merged.enquiries)) {
      const unifiedMap = new Map<string, Enquiry>();
      for (const enq of merged.enquiries) {
        // Resolve canonical property ID to eliminate duplicate threads (Single DM Rule)
        let propKey = (enq.listingId || enq.parcelId || 'lst-1').toLowerCase();
        if (propKey === 'as-kmp-001' || propKey === 'lst-1' || enq.listingTitle?.toLowerCase().includes('riverside') || enq.listingTitle?.toLowerCase().includes('changsari')) {
          propKey = 'lst-1';
        } else if (propKey === 'as-kmp-002' || propKey === 'lst-2' || enq.listingTitle?.toLowerCase().includes('sonapur') || enq.listingTitle?.toLowerCase().includes('homestead')) {
          propKey = 'lst-2';
        } else if (propKey === 'as-dbr-008' || propKey === 'lst-3' || enq.listingTitle?.toLowerCase().includes('chabua') || (enq.listingTitle?.toLowerCase().includes('tea') && !enq.listingTitle?.toLowerCase().includes('riverside'))) {
          propKey = 'lst-3';
        }

        const isMonideepa = propKey === 'lst-3';
        const canonicalSellerName = isMonideepa ? 'Monideepa Gogoi' : 'Pranabjyoti Kalita';
        const canonicalSellerEmail = isMonideepa ? 'monideepa@dharitrisentu.in' : 'pranabjyoti@dharitrisentu.in';

        if (!unifiedMap.has(propKey)) {
          unifiedMap.set(propKey, {
            ...enq,
            listingId: propKey,
            sellerName: canonicalSellerName,
            sellerEmail: canonicalSellerEmail,
            replies: [...(enq.replies || [])]
          });
        } else {
          const target = unifiedMap.get(propKey)!;
          if (enq.id.startsWith('ENQ-001') && !target.id.startsWith('ENQ-001')) {
            target.id = enq.id;
          }
          if (enq.message && enq.message.trim() !== target.message?.trim()) {
            const alreadyHas = target.replies.some((r) => r.message?.trim() === enq.message?.trim());
            if (!alreadyHas) {
              target.replies.push({
                id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                senderId: 'usr-buyer-1',
                senderEmail: enq.buyerEmail || 'ananya@dharitrisentu.in',
                senderName: 'Ananya Baruah',
                senderRole: 'buyer',
                message: enq.message,
                timestamp: enq.createdAt || new Date().toISOString()
              });
            }
          }
          for (const r of (enq.replies || [])) {
            const alreadyHas = target.replies.some((tr) => tr.message?.trim() === r.message?.trim());
            if (!alreadyHas) {
              target.replies.push(r);
            }
          }
        }
      }

      // Deep sanitize all enquiry replies: ensure buyer interest messages are strictly attributed to the buyer
      for (const enq of unifiedMap.values()) {
        const cleanedReplies: EnquiryReply[] = [];
        const seenTexts = new Set<string>();
        const isChabua = enq.listingId === 'lst-3' || enq.parcelId === 'AS-DBR-008' || enq.sellerEmail?.includes('monideepa');

        for (const r of (enq.replies || [])) {
          const text = r.message?.trim();
          if (!text) continue;

          // Deduplicate accidental repeated messages
          if (seenTexts.has(text)) continue;
          seenTexts.add(text);

          const isBuyerContent =
            text.toLowerCase().includes('i am interested') ||
            text.toLowerCase().includes('hello pranabjyoti') ||
            text.toLowerCase().includes('hello monideepa') ||
            text.toLowerCase().includes('noticed in the due-diligence') ||
            text.toLowerCase().includes('could you clarify') ||
            text.toLowerCase().includes('regarding the 0.15');

          if (isBuyerContent || r.senderRole === 'buyer' || r.senderId === 'usr-buyer-1' || r.senderId === 'usr-buyer-01') {
            cleanedReplies.push({
              ...r,
              senderId: 'usr-buyer-1',
              senderRole: 'buyer',
              senderName: 'Ananya Baruah',
              senderEmail: 'ananya@dharitrisentu.in',
            });
          } else {
            cleanedReplies.push({
              ...r,
              senderId: isChabua ? 'usr-seller-2' : 'usr-seller-1',
              senderRole: 'seller',
              senderName: isChabua ? 'Monideepa Gogoi' : ((enq as { sellerName?: string }).sellerName || 'Pranabjyoti Kalita'),
              senderEmail: isChabua ? 'monideepa@dharitrisentu.in' : (enq.sellerEmail || 'pranabjyoti@dharitrisentu.in'),
            });
          }
        }
        enq.replies = cleanedReplies;
      }

      merged.enquiries = Array.from(unifiedMap.values());
    }
    return merged;
  } catch {
    return getInitialSeedState();
  }
}

export function saveStateToStorage(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Graceful fallback when storage is restricted in sandboxed iframes
  }
}

export function resetStateInStorage(): AppState {
  const fresh = getInitialSeedState();
  fresh.introSeen = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // Ignore storage error
  }
  return fresh;
}
