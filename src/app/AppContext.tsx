import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  Language,
  AreaUnit,
  Listing,
  ListingStatus,
  DiscrepancyCase,
  DueDiligenceCase,
  Enquiry,
  EnquiryReply,
  SiteVisit,
  LandLockerDocument,
  AuditEvent,
} from '../types';
import {
  AppState,
  loadStateFromStorage,
  saveStateToStorage,
  resetStateInStorage,
} from '../services/storageService';
import { TRANSLATIONS, FORM_PHRASES_AS, FORM_PHRASES_HI } from '../i18n/translations';
import { UI_DICTIONARY } from '../i18n/dictionary';
import { API_MODE, apiRequest } from '../services/apiClient';
import {
  buildDocumentVerificationPipeline,
  checkListingPublicationGate,
  computeDeterministicSha256Hex,
} from '../services/govIntegrationBoundary';

interface AppContextValue extends AppState {
  apiReady: boolean;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  areaUnit: AreaUnit;
  setAreaUnit: (unit: AreaUnit) => void;
  productionEmptyMode: boolean;
  setProductionEmptyMode: (empty: boolean) => void;
  markIntroSeen: () => void;
  replayIntro: () => void;
  login: (email: string, password?: string) => Promise<{ ok: boolean; message: string; user?: User }>;
  signup: (name: string, email: string, role: 'buyer' | 'seller', district?: string, password?: string) => Promise<{ ok: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  updateProfile: (name: string, district: string) => Promise<{ ok: boolean; message: string }>;
  refreshServerState: () => Promise<void>;
  toggleSavedListing: (listingId: string) => void;
  recordRecentlyViewed: (listingId: string) => void;
  addRecentSearch: (term: string) => void;
  createListing: (newListing: Omit<Listing, 'id' | 'submittedAt' | 'passportSummary'>) => Listing;
  updateListingStatus: (listingId: string, status: ListingStatus, reviewerNote?: string) => { ok: boolean; message: string };
  updateSellerAskingPrice: (listingId: string, newPriceINR: number) => { ok: boolean; message: string };
  submitEnquiry: (
    listingId: string,
    subject: string,
    message: string,
    buyerDetails?: { name?: string; email?: string; phone?: string }
  ) => void;
  replyToEnquiry: (enquiryId: string, message: string) => void;
  sendEnquiryMessage: (enquiryId: string, message: string, senderRole?: 'buyer' | 'seller', senderId?: string) => void;
  getOrCreateConversationThread: (listingId: string, initialDraft?: string) => string;
  siteVisits: SiteVisit[];
  addSiteVisit: (visit: Omit<SiteVisit, 'id'>) => SiteVisit;
  updateSiteVisitStatus: (visitId: string, status: SiteVisit['status']) => void;
  rescheduleSiteVisit: (visitId: string, newDateTime: string) => void;
  cancelSiteVisit: (visitId: string) => void;
  addDiscrepancyNote: (discrepancyId: string, note: string, newStatus?: DiscrepancyCase['status']) => void;
  updateChecklistTask: (caseId: string, taskId: string, status: 'Pending' | 'In Progress' | 'Completed' | 'Needs Attention', note?: string) => void;
  createDueDiligenceCase: (listingId: string) => DueDiligenceCase;
  uploadActualDocument: (file: File, doc: { title: string; category: LandLockerDocument['category']; parcelId: string; declaredAreaBigha?: number; recordedAreaBigha?: number; hasDigitalSignature?: boolean }) => Promise<{ ok: boolean; message: string; document?: LandLockerDocument }>;
  verifyDocumentByReviewer: (docId: string, outcome: 'Approved' | 'Rejected', note?: string) => void;
  shareDocument: (docId: string, targetEmail: string, expiresInDays?: number) => void;
  revokeDocumentAccess: (docId: string) => void;
  resetDemoData: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DEFAULT_SITE_VISITS: SiteVisit[] = [
  {
    id: 'visit-1',
    propertyName: 'Changsari 2.5 Bigha Highway-Facing Plot',
    parcelId: 'AS-KMP-001',
    location: 'Changsari, North Guwahati, Kamrup (Near NH-27)',
    dateTime: 'Nov 10, 2026 at 10:00 AM',
    visitType: 'Physical Meeting',
    status: 'Confirmed by Seller',
    buyerName: 'Ananya Baruah',
    buyerEmail: 'ananya@dharitrisentu.in',
    buyerPhone: '+91 98640 12345',
    sellerName: 'Pranabjyoti Kalita',
    sellerEmail: 'pranabjyoti@dharitrisentu.in',
    sellerPhone: '+91 94350 54321',
    meetingPoint: 'Changsari Circle Revenue Office Gate',
    notes: 'Inspecting southern drainage bund and western approach road.',
  },
  {
    id: 'visit-2',
    propertyName: 'Rural Homestead Plot with Areca Grove',
    parcelId: 'AS-KMP-002',
    location: 'Sonapur, Kamrup Metro',
    dateTime: 'Nov 14, 2026 at 2:30 PM',
    visitType: '360° Virtual Tour',
    status: 'Pending Confirmation',
    buyerName: 'Ananya Baruah',
    buyerEmail: 'ananya@dharitrisentu.in',
    buyerPhone: '+91 98640 12345',
    sellerName: 'Pranabjyoti Kalita',
    sellerEmail: 'pranabjyoti@dharitrisentu.in',
    sellerPhone: '+91 94350 54321',
    meetingPoint: 'Virtual Live Stream Room',
    notes: 'Live guided video walkthrough of areca nut boundary.',
  },
];

const loadSiteVisitsFromStorage = (): SiteVisit[] => {
  try {
    const raw = localStorage.getItem('dharitri_sentu_site_visits');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse stored visits', e);
  }
  return DEFAULT_SITE_VISITS;
};

const saveSiteVisitsToStorage = (visits: SiteVisit[]) => {
  try {
    localStorage.setItem('dharitri_sentu_site_visits', JSON.stringify(visits));
  } catch (e) {
    console.warn('Failed to save visits', e);
  }
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const stored = loadStateFromStorage();
    return API_MODE ? { ...stored, users: [], currentUser: null, documents: [], cases: [], enquiries: [], auditEvents: [] } : stored;
  });
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(loadSiteVisitsFromStorage);
  const [apiReady, setApiReady] = useState(!API_MODE);
  const [areaUnit, setAreaUnitState] = useState<AreaUnit>(() => state.areaUnit || 'bigha');
  const [productionEmptyMode, setProductionEmptyModeState] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    saveSiteVisitsToStorage(siteVisits);
  }, [siteVisits]);

  // Listen for storage events for real-time synchronization across Buyer & Seller tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      const stored = loadStateFromStorage();
      if (stored && stored.enquiries) {
        setState((prev) => ({ ...prev, enquiries: stored.enquiries }));
      }
      const visits = loadSiteVisitsFromStorage();
      if (visits) {
        setSiteVisits(visits);
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('dharitri-message-synced', handleStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('dharitri-message-synced', handleStorageChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!API_MODE) saveStateToStorage(state);
    if (typeof window !== 'undefined') {
      (window as unknown as { globalPropertiesList?: Listing[] }).globalPropertiesList = state.listings;
      try {
        localStorage.setItem('globalPropertiesList', JSON.stringify(state.listings));
      } catch {
        // ignore
      }
    }
  }, [state]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  useEffect(() => {
    if (!API_MODE) return;
    let cancelled = false;
    apiRequest<{ state: AppState }>('/api/auth/me')
      .then((result) => { if (!cancelled) setState(result.state); })
      .catch((error) => {
        if (!cancelled) showToast(`Backend unavailable: ${error instanceof Error ? error.message : 'could not connect'}`);
      })
      .finally(() => { if (!cancelled) setApiReady(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!API_MODE || !apiReady || !state.currentUser) return;
    const timer = window.setTimeout(() => {
      apiRequest<{ state?: AppState }>('/api/state', { method: 'PUT', body: JSON.stringify({ state }) })
        .then((result) => {
          if (result.state) {
            setState((prev) => JSON.stringify(prev) === JSON.stringify(result.state) ? prev : result.state!);
          }
        })
        .catch((error) => {
          showToast(`Could not save changes: ${error instanceof Error ? error.message : 'API error'}`);
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state, apiReady]);

  const refreshServerState = useCallback(async () => {
    if (!API_MODE) return;
    const result = await apiRequest<{ state: AppState }>('/api/auth/me');
    setState(result.state);
  }, []);

  useEffect(() => {
    if (state.areaUnit && state.areaUnit !== areaUnit) setAreaUnitState(state.areaUnit);
    // Keep the picker aligned with preferences loaded from the server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.areaUnit]);

  const setAreaUnit = (unit: AreaUnit) => {
    setAreaUnitState(unit);
    setState((prev) => ({ ...prev, areaUnit: unit }));
    showToast(`Land unit display switched to ${unit.toUpperCase()}`);
  };

  const updateProfile = async (name: string, district: string): Promise<{ ok: boolean; message: string }> => {
    const cleanName = name.trim();
    const cleanDistrict = district.trim();
    if (cleanName.length < 2 || cleanName.length > 100) return { ok: false, message: 'Display name must be between 2 and 100 characters.' };
    if (cleanDistrict.length > 100) return { ok: false, message: 'District must be 100 characters or fewer.' };
    if (!state.currentUser) return { ok: false, message: 'Sign in to update your profile.' };
    if (API_MODE) {
      try {
        const result = await apiRequest<{ ok: boolean; state: AppState; message: string }>('/api/profile', { method: 'PUT', body: JSON.stringify({ name: cleanName, district: cleanDistrict }) });
        setState(result.state);
        showToast(result.message || 'Profile updated.');
        return { ok: true, message: result.message || 'Profile updated.' };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update profile.';
        return { ok: false, message };
      }
    }
    setState((prev) => {
      const updatedUser = prev.currentUser ? { ...prev.currentUser, name: cleanName, district: cleanDistrict || prev.currentUser.district } : null;
      return { ...prev, currentUser: updatedUser, users: prev.users.map((u) => u.id === updatedUser?.id ? updatedUser : u) };
    });
    showToast('Profile updated.');
    return { ok: true, message: 'Profile updated.' };
  };

  const setProductionEmptyMode = (empty: boolean) => {
    setProductionEmptyModeState(empty);
    showToast(
      empty
        ? 'Hid all sample document records for an empty-workspace view'
        : 'Restored sample demonstration records (not government verified)'
    );
  };

  const t = (keyOrPhrase: string): string => {
    if (!keyOrPhrase) return '';
    const lang = state.language || 'en';

    // 1. Direct translation key in locale JSON (e.g. 'navHome', 'brandName')
    if (TRANSLATIONS[lang]?.[keyOrPhrase]) {
      return TRANSLATIONS[lang][keyOrPhrase];
    }

    // 2. Direct dictionary lookup from UI_DICTIONARY
    const cleanPhrase = keyOrPhrase.trim();
    const dict = UI_DICTIONARY[lang] || {};
    if (dict[cleanPhrase]) return dict[cleanPhrase];
    if (dict[cleanPhrase.toUpperCase()]) return dict[cleanPhrase.toUpperCase()];

    // Case-insensitive match in UI_DICTIONARY
    const matchedKey = Object.keys(dict).find((k) => k.toLowerCase() === cleanPhrase.toLowerCase());
    if (matchedKey && dict[matchedKey]) return dict[matchedKey];

    // 3. Direct literal form phrase translation in Assamese or Hindi
    const lowerPhrase = cleanPhrase.toLowerCase();
    if (lang === 'as') {
      if (FORM_PHRASES_AS[lowerPhrase]) return FORM_PHRASES_AS[lowerPhrase];
      if (FORM_PHRASES_AS[cleanPhrase]) return FORM_PHRASES_AS[cleanPhrase];
    } else if (lang === 'hi') {
      if (FORM_PHRASES_HI[lowerPhrase]) return FORM_PHRASES_HI[lowerPhrase];
      if (FORM_PHRASES_HI[cleanPhrase]) return FORM_PHRASES_HI[cleanPhrase];
    }

    // 4. Fallback to English translation key if available
    if (TRANSLATIONS.en?.[keyOrPhrase]) {
      return TRANSLATIONS.en[keyOrPhrase];
    }

    // Prevent leaking code keys like 'navBuyerWorkspace' to user screen
    if (/^[a-z]+[A-Z]/.test(keyOrPhrase)) {
      return '';
    }

    return keyOrPhrase;
  };

  const setLanguage = (language: Language) => {
    try {
      localStorage.setItem('dharitri_lang', language);
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dharitri-language-changed', { detail: { language } }));
    }
    setState((prev) => ({ ...prev, language }));
  };

  const markIntroSeen = () => {
    setState((prev) => ({ ...prev, introSeen: true }));
  };

  const replayIntro = () => {
    setState((prev) => ({ ...prev, introSeen: false }));
  };

  const login = async (email: string, password = 'Demo123!') => {
    let cleanEmail = email.trim().toLowerCase();
    
    // Map persistent user email aliases
    if (cleanEmail === 'buyer@demo.dharitrisentu.test' || cleanEmail === 'ananya@dharitrisentu.in') {
      cleanEmail = 'ananya@dharitrisentu.in';
    } else if (cleanEmail === 'seller@demo.dharitrisentu.test' || cleanEmail === 'pranabjyoti@dharitrisentu.in') {
      cleanEmail = 'pranabjyoti@dharitrisentu.in';
    } else if (cleanEmail === 'reviewer@demo.dharitrisentu.test' || cleanEmail === 'debajit@assam.gov.in' || cleanEmail === 'rev-as-kmp-104' || cleanEmail === 'rev-as-kmp-402') {
      cleanEmail = 'debajit@assam.gov.in';
    }

    if (API_MODE) {
      try {
        const result = await apiRequest<{ ok: boolean; user: User; state: AppState }>('/api/auth/login', {
          method: 'POST', body: JSON.stringify({ email: cleanEmail, password }),
        });
        setState(result.state);
        showToast(`Signed in as ${result.user.name}`);
        return { ok: true, message: 'Logged in', user: result.user };
      } catch (error) {
        // If not a demo user, return error immediately
        const isDemo = ['ananya@dharitrisentu.in', 'pranabjyoti@dharitrisentu.in', 'debajit@assam.gov.in'].includes(cleanEmail);
        if (!isDemo) {
          return { ok: false, message: error instanceof Error ? error.message : 'Unable to sign in.' };
        }
        // Demo accounts can fall back to local offline session if API is unreachable
        console.warn('API login failed for demo user, falling back to local demo state:', error);
      }
    }
    let found = state.users.find((u) => u.email.toLowerCase() === cleanEmail || 
      (cleanEmail === 'ananya@dharitrisentu.in' && (u.email.includes('buyer') || u.name.includes('Ananya'))) ||
      (cleanEmail === 'pranabjyoti@dharitrisentu.in' && (u.email.includes('seller') || u.name.includes('Pranabjyoti'))) ||
      (cleanEmail === 'debajit@assam.gov.in' && (u.email.includes('reviewer') || u.name.includes('Debajit')))
    );
    if (!found && cleanEmail === 'ananya@dharitrisentu.in') {
      found = { id: 'usr-buyer-1', name: 'Ananya Baruah', email: 'ananya@dharitrisentu.in', role: 'buyer', district: 'Kamrup', createdAt: '2026-01-15T09:00:00Z' };
    } else if (!found && cleanEmail === 'pranabjyoti@dharitrisentu.in') {
      found = { id: 'usr-seller-1', name: 'Pranabjyoti Kalita', email: 'pranabjyoti@dharitrisentu.in', role: 'seller', district: 'Kamrup', createdAt: '2026-01-15T09:00:00Z' };
    } else if (!found && cleanEmail === 'debajit@assam.gov.in') {
      found = { id: 'usr-reviewer-1', name: 'Debajit Hazarika', email: 'debajit@assam.gov.in', role: 'reviewer', district: 'North Guwahati / Kamrup', createdAt: '2026-01-15T09:00:00Z' };
    }
    if (!found) {
      return { ok: false, message: 'Account not found. Choose Buyer, Seller, or Reviewer login.' };
    }
    const isMasterPassword = password === 'Demo123!' || password === 'Demo123' || password === 'demo123';
    if (!isMasterPassword && password.length < 6) {
      return { ok: false, message: 'Invalid password. Password must be at least 6 characters (use Demo123! for demo accounts).' };
    }
    // Clean user name from any legacy (Demo) tags
    const normalizedUser: User = {
      ...found,
      name: found.name.replace(/\s*\([^)]*\)/g, '').trim(),
      email: cleanEmail === 'ananya@dharitrisentu.in' ? 'ananya@dharitrisentu.in' : 
             cleanEmail === 'pranabjyoti@dharitrisentu.in' ? 'pranabjyoti@dharitrisentu.in' : 
             cleanEmail === 'debajit@assam.gov.in' ? 'debajit@assam.gov.in' : found.email
    };
    const audit: AuditEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: normalizedUser.email,
      actorRole: normalizedUser.role,
      actionType: 'USER_LOGIN',
      targetId: normalizedUser.id,
      summary: `${normalizedUser.name} logged into the ${normalizedUser.role} workspace.`,
    };
    setState((prev) => ({
      ...prev,
      introSeen: true,
      currentUser: normalizedUser,
      auditEvents: [audit, ...prev.auditEvents],
    }));
    showToast(`Signed in as ${normalizedUser.name}`);
    return { ok: true, message: 'Logged in', user: normalizedUser };
  };

  const signup = async (name: string, email: string, role: 'buyer' | 'seller', district = 'Kamrup', password = '') => {
    const cleanEmail = email.trim().toLowerCase();
    if (API_MODE) {
      try {
        const result = await apiRequest<{ ok: boolean; user: User; state: AppState }>('/api/auth/signup', {
          method: 'POST', body: JSON.stringify({ name, email: cleanEmail, role, district, password }),
        });
        setState(result.state);
        showToast(`Created ${role} account for ${name}`);
        return { ok: true, message: 'Account created', user: result.user };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : 'Unable to create account.' };
      }
    }
    if (role !== 'buyer' && role !== 'seller') {
      return { ok: false, message: 'Public registration permits Buyer or Seller roles only.' };
    }
    if (state.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { ok: false, message: 'An account with this email already exists.' };
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: `${name.trim()} (${role === 'buyer' ? 'Buyer' : 'Seller'})`,
      role,
      district,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      introSeen: true,
      users: [...prev.users, newUser],
      currentUser: newUser,
    }));
    showToast(`Created ${role} account for ${name}`);
    return { ok: true, message: 'Account created', user: newUser };
  };

  const logout = async () => {
    if (API_MODE) {
      try {
        await apiRequest('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
        const result = await apiRequest<{ state: AppState }>('/api/state');
        setState(result.state);
      } catch {
        setState((prev) => ({ ...prev, currentUser: null, users: [], documents: [], cases: [], enquiries: [], auditEvents: [] }));
      }
      showToast('Signed out successfully');
      return;
    }
    setState((prev) => ({ ...prev, currentUser: null }));
    showToast('Signed out successfully');
  };

  const toggleSavedListing = (listingId: string) => {
    setState((prev) => {
      const exists = prev.savedListingIds.includes(listingId);
      const next = exists
        ? prev.savedListingIds.filter((id) => id !== listingId)
        : [...prev.savedListingIds, listingId];
      showToast(exists ? 'Removed parcel from saved list' : 'Saved parcel to Buyer Dashboard');
      return { ...prev, savedListingIds: next };
    });
  };

  const recordRecentlyViewed = (listingId: string) => {
    setState((prev) => {
      const filtered = prev.recentlyViewedIds.filter((id) => id !== listingId);
      return { ...prev, recentlyViewedIds: [listingId, ...filtered].slice(0, 6) };
    });
  };

  const addRecentSearch = (term: string) => {
    if (!term.trim()) return;
    setState((prev) => {
      const filtered = prev.recentSearches.filter((s) => s.toLowerCase() !== term.trim().toLowerCase());
      return { ...prev, recentSearches: [term.trim(), ...filtered].slice(0, 8) };
    });
  };

  const createListing = (newListingData: Omit<Listing, 'id' | 'submittedAt' | 'passportSummary'>): Listing => {
    const id = `lst-${Date.now()}`;
    const hasAreaMismatch = Math.abs(newListingData.areaBigha - newListingData.recordedAreaBigha) > 0.01;
    const initialStatus: ListingStatus =
      newListingData.status === 'Draft'
        ? 'Draft'
        : hasAreaMismatch
        ? 'Discrepancy Requires Attention'
        : 'Awaiting Review';

    const created: Listing = {
      ...newListingData,
      id,
      status: initialStatus,
      submittedAt: new Date().toISOString(),
      latitude: newListingData.latitude ?? newListingData.mapCenter?.lat,
      longitude: newListingData.longitude ?? newListingData.mapCenter?.lng,
      locationAccuracy: newListingData.locationAccuracy || (newListingData.latitude || newListingData.mapCenter?.lat ? 'precise_parcel' : 'pending'),
      passportSummary: {
        matchedCount: hasAreaMismatch ? 3 : 4,
        discrepancyCount: hasAreaMismatch ? 1 : 0,
        pendingCount: 2,
        notCheckedCount: 1,
        overallStatus: hasAreaMismatch ? 'Mismatch Found' : 'Pending Authorised Review',
        lastReviewedAt: new Date().toISOString(),
        comparisons: [
          {
            field: 'Plot / Dag Number',
            sellerSubmittedValue: newListingData.parcelId,
            demoReferenceValue: newListingData.parcelId,
            sourceLabel: 'Seller Submission vs Revenue Index',
            sourceTimestamp: new Date().toISOString().slice(0, 10),
            status: 'Evidence Supplied',
            explanation: 'Submitted by seller; queued for verification check.',
          },
          {
            field: 'Land Area (Bigha / Acre)',
            sellerSubmittedValue: `${newListingData.areaBigha} Bigha (${(newListingData.areaBigha * 0.3306).toFixed(2)} Acre)`,
            demoReferenceValue: `${newListingData.recordedAreaBigha} Bigha (${(newListingData.recordedAreaBigha * 0.3306).toFixed(2)} Acre)`,
            sourceLabel: 'Seller Entry vs Survey Record',
            sourceTimestamp: new Date().toISOString().slice(0, 10),
            status: hasAreaMismatch ? 'Mismatch Found' : 'Matched Against Demo Data',
            explanation: hasAreaMismatch
              ? 'Difference detected between seller listed area and survey record.'
              : 'Seller listed area matches recorded survey area.',
          },
        ],
      },
    };

    const audit: AuditEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: created.sellerEmail,
      actorRole: 'seller',
      actionType: 'LISTING_CREATED',
      targetId: created.parcelId,
      summary: `Seller submitted listing "${created.title}" (${created.parcelId}) with status "${created.status}" and ${created.media.length} photo(s).`,
    };

    setState((prev) => {
      const updatedListings = [created, ...prev.listings];
      if (typeof window !== 'undefined') {
        (window as unknown as { globalPropertiesList?: Listing[] }).globalPropertiesList = updatedListings;
        try {
          localStorage.setItem('globalPropertiesList', JSON.stringify(updatedListings));
        } catch {
          // ignore
        }
        window.dispatchEvent(new CustomEvent('dharitri-listing-created', { detail: { listing: created } }));
      }
      return {
        ...prev,
        listings: updatedListings,
        auditEvents: [audit, ...prev.auditEvents],
      };
    });
    showToast(`Listing "${created.title}" saved (${created.status})`);
    return created;
  };

  const updateListingStatus = (
    listingId: string,
    status: ListingStatus,
    reviewerNote?: string
  ): { ok: boolean; message: string } => {
    const target = state.listings.find((l) => l.id === listingId);
    if (!target) return { ok: false, message: 'Listing not found.' };

    // Backend / service publication gate check before publishing to marketplace
    if (!API_MODE && (status === 'Approved for Listing' || status === 'Published as Demo Listing')) {
      const gate = checkListingPublicationGate(target);
      if (!gate.canPublish) {
        const msg = `Publication gate blocked: ${gate.blockingReasons.join(' ')}`;
        showToast(msg);
        return { ok: false, message: msg };
      }
    }

    setState((prev) => {
      const updatedListings = prev.listings.map((l) =>
        l.id === listingId
          ? {
              ...l,
              status,
              rejectionReason:
                status === 'Rejected with Reason' || status === 'Rejected'
                  ? reviewerNote || 'Requires supporting ownership clarification.'
                  : l.rejectionReason,
              passportSummary: {
                ...(l.passportSummary || {
                  matchedCount: 4,
                  discrepancyCount: 0,
                  pendingCount: 1,
                  notCheckedCount: 1,
                  comparisons: [],
                }),
                overallStatus:
                  status === 'Published as Demo Listing' || status === 'Approved for Listing'
                    ? ('Reviewed in Demo' as const)
                    : (l.passportSummary?.overallStatus || 'Pending Authorised Review'),
                lastReviewedAt: new Date().toISOString(),
              },
            }
          : l
      );
      const audit: AuditEvent = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorEmail: prev.currentUser?.email || 'reviewer@demo.dharitrisentu.test',
        actorRole: prev.currentUser?.role || 'reviewer',
        actionType: 'LISTING_MODERATION',
        targetId: target.parcelId,
        summary: `Updated ${target.parcelId} status to "${status}". ${reviewerNote ? `Note: ${reviewerNote}` : ''}`,
      };
      return {
        ...prev,
        listings: updatedListings,
        auditEvents: [audit, ...prev.auditEvents],
      };
    });
    showToast(`Updated listing status to "${status}"`);
    return { ok: true, message: `Updated listing status to "${status}"` };
  };

  const updateSellerAskingPrice = (
    listingId: string,
    newPriceINR: number
  ): { ok: boolean; message: string } => {
    if (!newPriceINR || newPriceINR <= 0) {
      return { ok: false, message: 'Asking price must be greater than zero.' };
    }
    setState((prev) => ({
      ...prev,
      listings: prev.listings.map((l) =>
        l.id === listingId ? { ...l, askingPriceINR: Math.round(newPriceINR) } : l
      ),
    }));
    showToast(`Updated asking price to ₹${Math.round(newPriceINR).toLocaleString('en-IN')}`);
    return { ok: true, message: 'Asking price updated' };
  };

  const submitEnquiry = (
    listingId: string,
    subject: string,
    message: string,
    buyerDetails?: { name?: string; email?: string; phone?: string }
  ) => {
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) return;
    const buyerEmail = buyerDetails?.email || state.currentUser?.email || 'ananya@dharitrisentu.in';
    const buyerName = buyerDetails?.name || state.currentUser?.name || 'Ananya Baruah';
    const buyerPhone = buyerDetails?.phone || '';
    const isMonideepa = listing.parcelId === 'AS-DBR-008' || listing.id === 'lst-3' || listing.sellerEmail?.includes('seller2');
    const sellerEmail = isMonideepa ? 'monideepa@dharitrisentu.in' : (listing.sellerEmail || 'pranabjyoti@dharitrisentu.in');

    // Single DM Rule: Check if conversation already exists for this property and seller
    const existing = state.enquiries.find((e) =>
      (e.listingId === listingId || e.parcelId === listing.parcelId) &&
      (e.sellerEmail?.toLowerCase() === sellerEmail.toLowerCase() || (!e.sellerEmail))
    );

    if (existing) {
      sendEnquiryMessage(existing.id, message, 'buyer');
      showToast(`Message added to existing conversation with seller for ${listing.title}`);
      return;
    }

    const newEnq: Enquiry = {
      id: `ENQ-00${state.enquiries.length + 1}`,
      listingId: listing.id,
      parcelId: listing.parcelId,
      listingTitle: listing.title,
      buyerEmail,
      buyerName,
      buyerPhone,
      sellerEmail,
      subject,
      message,
      status: 'Sent',
      createdAt: new Date().toISOString(),
      replies: [],
    };
    const audit: AuditEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: buyerEmail,
      actorRole: (state.currentUser?.role || 'buyer') as UserRole,
      actionType: 'ENQUIRY_SENT',
      targetId: newEnq.id,
      summary: `Buyer sent enquiry "${subject}" regarding ${listing.title}.`,
    };
    setState((prev) => ({
      ...prev,
      enquiries: [newEnq, ...prev.enquiries],
      auditEvents: [audit, ...prev.auditEvents],
    }));

    if (API_MODE) {
      apiRequest('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({ listingId: listing.id, content: message, subject }),
      }).catch((err) => console.warn('API inquiry submit notice:', err));
    }

    showToast(`Enquiry sent to seller for ${listing.title}`);
  };

  const getOrCreateConversationThread = (listingId: string, initialDraft?: string): string => {
    const listing = state.listings.find((l) => l.id === listingId);
    const buyerEmail = state.currentUser?.email || 'ananya@dharitrisentu.in';
    const isMonideepa = listing?.parcelId === 'AS-DBR-008' || listing?.id === 'lst-3' || listing?.sellerEmail?.includes('seller2');
    const sellerEmail = isMonideepa ? 'monideepa@dharitrisentu.in' : (listing?.sellerEmail || 'pranabjyoti@dharitrisentu.in');
    const sellerName = isMonideepa ? 'Monideepa Gogoi' : (listing?.sellerName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Pranabjyoti Kalita');

    // Single DM Rule: Check if a thread already exists for this property
    const targetListingId = listing ? listing.id : listingId;
    const targetParcelId = listing?.parcelId;
    const existing = state.enquiries.find((e) =>
      e.listingId === targetListingId ||
      (targetParcelId && e.parcelId === targetParcelId) ||
      (e.id === 'ENQ-001' && (targetListingId === 'lst-1' || targetParcelId === 'AS-KMP-001')) ||
      (e.id === 'ENQ-002' && (targetListingId === 'lst-2' || targetParcelId === 'AS-KMP-002')) ||
      (e.listingTitle && listing?.title && e.listingTitle.toLowerCase() === listing.title.toLowerCase())
    );

    if (existing) {
      if (initialDraft && initialDraft.trim()) {
        sendEnquiryMessage(existing.id, initialDraft.trim(), 'buyer');
      }
      return existing.id;
    }

    // Create exactly one new thread
    const newId = `ENQ-00${state.enquiries.length + 1}`;
    const newEnq: Enquiry = {
      id: newId,
      conversationId: newId,
      listingId: targetListingId,
      parcelId: targetParcelId || 'AS-KMP-001',
      listingTitle: listing?.title || 'Assam Land Parcel',
      buyerId: state.currentUser?.id || 'usr-buyer-1',
      sellerId: isMonideepa ? 'usr-seller-2' : 'usr-seller-1',
      buyerEmail,
      buyerName: state.currentUser?.name || 'Ananya Baruah',
      buyerPhone: '',
      sellerEmail,
      sellerName,
      subject: `Inquiry regarding ${listing?.title || 'Land Parcel'}`,
      message: initialDraft?.trim() || '',
      status: 'Sent',
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setState((prev) => {
      const updated = [newEnq, ...prev.enquiries];
      try {
        const stored = loadStateFromStorage();
        saveStateToStorage({ ...stored, enquiries: updated });
      } catch (e) {
        console.warn('Storage sync error:', e);
      }
      return { ...prev, enquiries: updated };
    });

    return newId;
  };

  const sendEnquiryMessage = (
    enquiryId: string,
    message: string,
    senderRole?: 'buyer' | 'seller',
    senderId?: string
  ) => {
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    const isChabua = enq?.listingId === 'lst-3' || enq?.parcelId === 'AS-DBR-008' || enq?.sellerEmail?.includes('monideepa');

    // Strict role determination: use explicit role if provided, otherwise active logged-in user role
    const role: 'buyer' | 'seller' = senderRole || (state.currentUser?.role === 'seller' ? 'seller' : 'buyer');
    const effectiveSenderId = (state.currentUser && state.currentUser.role === role)
      ? state.currentUser.id
      : (senderId || (role === 'buyer' ? 'usr-buyer-1' : (isChabua ? 'usr-seller-2' : 'usr-seller-1')));

    let senderName = role === 'buyer' ? 'Ananya Baruah' : (isChabua ? 'Monideepa Gogoi' : 'Pranabjyoti Kalita');
    let senderEmail = role === 'buyer' ? 'ananya@dharitrisentu.in' : (isChabua ? 'monideepa@dharitrisentu.in' : 'pranabjyoti@dharitrisentu.in');

    if (state.currentUser && state.currentUser.role === role) {
      senderName = state.currentUser.name;
      senderEmail = state.currentUser.email;
    } else if (enq) {
      if (role === 'seller') {
        senderName = isChabua ? 'Monideepa Gogoi' : (enq.sellerEmail?.includes('monideepa') ? 'Monideepa Gogoi' : (enq.sellerName || 'Pranabjyoti Kalita'));
        senderEmail = isChabua ? 'monideepa@dharitrisentu.in' : (enq.sellerEmail || 'pranabjyoti@dharitrisentu.in');
      } else {
        senderName = enq.buyerName || 'Ananya Baruah';
        senderEmail = enq.buyerEmail || 'ananya@dharitrisentu.in';
      }
    }

    const optimisticId = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    setState((prev) => {
      let found = false;
      const updated = prev.enquiries.map((e) => {
        if (e.id !== enquiryId) return e;
        found = true;
        const newReply: EnquiryReply = {
          id: optimisticId,
          conversationId: enquiryId,
          listingId: e.listingId,
          senderId: effectiveSenderId,
          recipientId: role === 'buyer' ? (isChabua ? 'usr-seller-2' : 'usr-seller-1') : 'usr-buyer-1',
          senderEmail,
          senderName,
          senderRole: role as UserRole,
          message: message.trim(),
          timestamp: new Date().toISOString(),
        };
        return {
          ...e,
          status: role === 'seller' ? ('Replied' as const) : ('Follow-up Requested' as const),
          replies: [...(e.replies || []), newReply],
        };
      });

      // If this enquiry didn't exist in local state yet, find or create one from demo
      let finalEnquiries = updated;
      if (!found) {
        const newReply: EnquiryReply = {
          id: optimisticId,
          conversationId: enquiryId,
          listingId: 'lst-1',
          senderId: effectiveSenderId,
          recipientId: role === 'buyer' ? 'usr-seller-1' : 'usr-buyer-1',
          senderEmail,
          senderName,
          senderRole: role as UserRole,
          message: message.trim(),
          timestamp: new Date().toISOString(),
        };
        if (prev.enquiries.length > 0) {
          const first = prev.enquiries[0];
          finalEnquiries = [{
            ...first,
            replies: [...(first.replies || []), newReply]
          }, ...prev.enquiries.slice(1)];
        } else {
          finalEnquiries = [{
            id: enquiryId || 'ENQ-001',
            listingId: 'lst-1',
            parcelId: 'AS-KMP-001',
            listingTitle: 'Changsari 2.5 Bigha Highway-Facing Plot',
            buyerEmail: 'ananya@dharitrisentu.in',
            buyerName: 'Ananya Baruah',
            sellerEmail: 'pranabjyoti@dharitrisentu.in',
            subject: 'Boundary variance inquiry (0.15 Bigha)',
            message: 'Hello Pranabjyoti-da, I noticed in the due-diligence report that there is a 0.15 Bigha boundary variance on the southern drain bund against the synthetic Jamabandi. Could you please clarify if a fresh survey sketch has been ordered?',
            status: role === 'seller' ? 'Replied' : 'Sent',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            replies: [newReply],
          }];
        }
      }

      // Persist immediately to localStorage for instant cross-tab sync
      try {
        const stored = loadStateFromStorage();
        saveStateToStorage({ ...stored, enquiries: finalEnquiries });
        window.dispatchEvent(new CustomEvent('dharitri-message-synced', { detail: { enquiryId, message, senderRole: role, senderId: effectiveSenderId } }));
      } catch (e) {
        console.warn('Storage sync error:', e);
      }

      return { ...prev, enquiries: finalEnquiries };
    });

    if (API_MODE) {
      apiRequest<{ ok: boolean; message?: any }>(`/api/conversations/${enquiryId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: message.trim() }),
      }).then((res) => {
        if (res && res.message && res.message.id) {
          setState((prev) => {
            const updated = prev.enquiries.map((e) => {
              if (e.id !== enquiryId) return e;
              return {
                ...e,
                replies: (e.replies || []).map((r) =>
                  r.id === optimisticId ? { ...r, id: res.message.id, timestamp: res.message.createdAt || r.timestamp } : r
                ),
              };
            });
            try {
              const stored = loadStateFromStorage();
              saveStateToStorage({ ...stored, enquiries: updated });
            } catch (err) {
              // Ignore
            }
            return { ...prev, enquiries: updated };
          });
        }
      }).catch(() => {
        return apiRequest('/api/notifications/seller-reply', {
          method: 'POST',
          body: JSON.stringify({ enquiryId, message: message.trim(), senderRole: role, senderName, senderEmail }),
        });
      }).catch((err) => console.warn('Reply dispatch error:', err));
    }
    showToast(role === 'buyer' ? `Message sent to seller ${isChabua ? 'Monideepa Gogoi' : 'Pranabjyoti Kalita'}` : 'Reply sent to buyer Ananya Baruah');
  };

  const replyToEnquiry = (enquiryId: string, message: string) => {
    sendEnquiryMessage(enquiryId, message, 'seller');
  };

  const addSiteVisit = (visitData: Omit<SiteVisit, 'id'>): SiteVisit => {
    const newVisit: SiteVisit = {
      ...visitData,
      id: `visit-${Date.now()}`,
    };
    setSiteVisits((prev) => {
      const updated = [newVisit, ...prev];
      saveSiteVisitsToStorage(updated);
      window.dispatchEvent(new CustomEvent('dharitri-message-synced', { detail: { visitId: newVisit.id } }));
      return updated;
    });
    showToast(`Site visit scheduled for ${newVisit.propertyName}`);
    return newVisit;
  };

  const updateSiteVisitStatus = (visitId: string, status: SiteVisit['status']) => {
    setSiteVisits((prev) => {
      const updated = prev.map((v) => (v.id === visitId ? { ...v, status } : v));
      saveSiteVisitsToStorage(updated);
      window.dispatchEvent(new CustomEvent('dharitri-message-synced', { detail: { visitId, status } }));
      return updated;
    });
    showToast(`Site visit status updated: ${status}`);
  };

  const rescheduleSiteVisit = (visitId: string, newDateTime: string) => {
    setSiteVisits((prev) => {
      const updated = prev.map((v) =>
        v.id === visitId ? { ...v, dateTime: newDateTime, status: 'Rescheduled' as const } : v
      );
      saveSiteVisitsToStorage(updated);
      window.dispatchEvent(new CustomEvent('dharitri-message-synced', { detail: { visitId, newDateTime } }));
      return updated;
    });
    showToast(`Site visit rescheduled to ${newDateTime}`);
  };

  const cancelSiteVisit = (visitId: string) => {
    setSiteVisits((prev) => {
      const updated = prev.map((v) =>
        v.id === visitId ? { ...v, status: 'Cancelled' as const } : v
      );
      saveSiteVisitsToStorage(updated);
      window.dispatchEvent(new CustomEvent('dharitri-message-synced', { detail: { visitId } }));
      return updated;
    });
    showToast('Site visit cancelled.');
  };

  const addDiscrepancyNote = (
    discrepancyId: string,
    note: string,
    newStatus?: DiscrepancyCase['status']
  ) => {
    if (API_MODE && state.currentUser?.role !== 'reviewer') { showToast('Reviewer access is required to change a discrepancy.'); return; }
    const actor = state.currentUser || {
      email: 'reviewer@demo.dharitrisentu.test',
      name: 'Debajit Hazarika (Reviewer)',
      role: 'reviewer' as UserRole,
    };
    setState((prev) => {
      const updated = prev.discrepancies.map((d) => {
        if (d.id !== discrepancyId) return d;
        return {
          ...d,
          status: newStatus || d.status,
          updatedAt: new Date().toISOString(),
          reviewerNotes: note.trim()
            ? [
                ...d.reviewerNotes,
                {
                  id: `rn-${Date.now()}`,
                  author: actor.name,
                  note: note.trim(),
                  timestamp: new Date().toISOString(),
                },
              ]
            : d.reviewerNotes,
        };
      });
      const audit: AuditEvent = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorEmail: actor.email,
        actorRole: actor.role,
        actionType: 'DISCREPANCY_REVIEW',
        targetId: discrepancyId,
        summary: `Updated discrepancy ${discrepancyId} (${newStatus || 'Note added'}): ${note}`,
      };
      return { ...prev, discrepancies: updated, auditEvents: [audit, ...prev.auditEvents] };
    });
    showToast(`Updated discrepancy record ${discrepancyId}`);
  };

  const updateChecklistTask = (
    caseId: string,
    taskId: string,
    status: 'Pending' | 'In Progress' | 'Completed' | 'Needs Attention',
    note?: string
  ) => {
    const actor = state.currentUser || {
      email: 'buyer@demo.dharitrisentu.test',
      name: 'Ananya Baruah (Buyer)',
      role: 'buyer' as UserRole,
    };
    setState((prev) => {
      const updated = prev.cases.map((c) => {
        if (c.id !== caseId) return c;
        const nextTasks = c.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status,
                note: note !== undefined ? note : t.note,
                updatedAt: new Date().toISOString(),
              }
            : t
        );
        const allDone = nextTasks.every((t) => t.status === 'Completed');
        return {
          ...c,
          status: allDone ? ('Completed in Demo' as const) : ('In Progress' as const),
          updatedAt: new Date().toISOString(),
          tasks: nextTasks,
          timeline: [
            {
              id: `ev-${Date.now()}`,
              actor: actor.name,
              role: actor.role,
              action: `Updated task "${nextTasks.find((t) => t.id === taskId)?.title}" to ${status}`,
              timestamp: new Date().toISOString(),
            },
            ...c.timeline,
          ],
        };
      });
      return { ...prev, cases: updated };
    });
    showToast(`Checklist task updated to ${status}`);
  };

  const createDueDiligenceCase = (listingId: string): DueDiligenceCase => {
    const existing = state.cases.find((c) => c.listingId === listingId);
    if (existing) {
      showToast(`Opened Due-Diligence Case ${existing.id}`);
      return existing;
    }
    const listing = state.listings.find((l) => l.id === listingId) || state.listings[0];
    const newCase: DueDiligenceCase = {
      id: `DD-2026-00${state.cases.length + 1}`,
      parcelId: listing.parcelId,
      listingId: listing.id,
      buyerEmail: state.currentUser?.email || 'buyer@demo.dharitrisentu.test',
      sellerEmail: listing.sellerEmail,
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summaryNote: `Guided buyer verification checklist initiated for ${listing.title}.`,
      tasks: [
        {
          id: `t1-${Date.now()}`,
          titleKey: 'confirmParcelRef',
          title: `1. Confirm plot number and satellite map location (${listing.parcelId})`,
          responsibleRole: 'buyer',
          status: 'Completed',
          note: 'Plot boundaries checked on satellite map.',
          evidenceReference: listing.parcelId,
          updatedAt: new Date().toISOString(),
        },
        {
          id: `t2-${Date.now()}`,
          titleKey: 'reviewAvailableEvidence',
          title: '2. Review seller ownership documents & Trust Passport',
          responsibleRole: 'buyer',
          status: 'In Progress',
          note: 'Checking traffic-light indicators on Land Trust Passport.',
          evidenceReference: 'Trust Passport',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `t3-${Date.now()}`,
          titleKey: 'compareSuppliedFields',
          title: '3. Cross-check declared Bigha/Acre area against survey records',
          responsibleRole: 'reviewer',
          status: 'Pending',
          note: 'Queued for discrepancy engine verification.',
          evidenceReference: 'Discrepancy Engine',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `t4-${Date.now()}`,
          titleKey: 'requestMissingDocs',
          title: '4. Request trace map or area clarification if needed',
          responsibleRole: 'buyer',
          status: 'Pending',
          note: 'Pending review of initial documents.',
          evidenceReference: 'LandLocker',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `t5-${Date.now()}`,
          titleKey: 'reviewEncumbrance',
          title: '5. Verify non-encumbrance and clear title status',
          responsibleRole: 'reviewer',
          status: 'Pending',
          note: 'Pending.',
          evidenceReference: 'Pending',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `t6-${Date.now()}`,
          titleKey: 'reviewLocationInfo',
          title: '6. Inspect road access and terrain elevation on-site or via 360° tour',
          responsibleRole: 'buyer',
          status: 'Pending',
          note: 'Pending virtual tour inspection.',
          evidenceReference: 'Virtual Tour',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `t7-${Date.now()}`,
          titleKey: 'recordOutstandingIssues',
          title: '7. Resolve any flagged warnings or record mismatches',
          responsibleRole: 'buyer',
          status: 'Pending',
          note: 'Pending.',
          evidenceReference: 'Pending',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `t8-${Date.now()}`,
          titleKey: 'completeHumanReview',
          title: '8. Complete reviewer sign-off in verification workflow',
          responsibleRole: 'reviewer',
          status: 'Pending',
          note: 'Pending.',
          evidenceReference: 'Pending',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `t9-${Date.now()}`,
          titleKey: 'saveFinalCaseSummary',
          title: '9. Export final buyer verification summary',
          responsibleRole: 'buyer',
          status: 'Pending',
          note: 'Pending.',
          evidenceReference: 'Pending',
          updatedAt: new Date().toISOString(),
        },
      ],
      timeline: [
        {
          id: `ev-${Date.now()}`,
          actor: state.currentUser?.name || 'Ananya Baruah (Buyer)',
          role: state.currentUser?.role || 'buyer',
          action: `Started Buyer Verification Checklist for ${listing.title}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setState((prev) => ({ ...prev, cases: [newCase, ...prev.cases] }));
    showToast(`Started Verification Case ${newCase.id}`);
    return newCase;
  };

  const uploadActualDocument = async (
    file: File,
    doc: { title: string; category: LandLockerDocument['category']; parcelId: string; declaredAreaBigha?: number; recordedAreaBigha?: number; hasDigitalSignature?: boolean }
  ): Promise<{ ok: boolean; message: string; document?: LandLockerDocument }> => {
    if (!API_MODE) {
      return { ok: false, message: 'Secure file upload needs the backend. Start the API server and set VITE_API_MODE=true; this demo-only mode will not pretend to store the file.' };
    }
    if (!state.currentUser) return { ok: false, message: 'Sign in before uploading documents.' };
    const form = new FormData();
    form.set('file', file, file.name);
    form.set('title', doc.title);
    form.set('category', doc.category);
    form.set('parcelId', doc.parcelId);
    if (doc.declaredAreaBigha !== undefined) form.set('declaredAreaBigha', String(doc.declaredAreaBigha));
    if (doc.recordedAreaBigha !== undefined) form.set('recordedAreaBigha', String(doc.recordedAreaBigha));
    if (doc.hasDigitalSignature !== undefined) form.set('hasDigitalSignature', String(doc.hasDigitalSignature));
    try {
      const result = await apiRequest<{ ok: boolean; document: LandLockerDocument; message: string }>('/api/documents', { method: 'POST', body: form });
      setState((prev) => ({ ...prev, documents: [result.document, ...prev.documents.filter((d) => d.id !== result.document.id)] }));
      showToast(result.message);
      return { ok: true, message: result.message, document: result.document };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Document upload failed.' };
    }
  };

  const verifyDocumentByReviewer = async (
    docId: string,
    outcome: 'Approved' | 'Rejected',
    note?: string
  ) => {
    if (API_MODE) {
      try {
        const result = await apiRequest<{ document: LandLockerDocument; message: string }>(`/api/documents/${encodeURIComponent(docId)}/review`, {
          method: 'POST', body: JSON.stringify({ outcome, note }),
        });
        setState((prev) => ({ ...prev, documents: prev.documents.map((d) => d.id === docId ? result.document : d) }));
        showToast(result.message);
      } catch (error) { showToast(error instanceof Error ? error.message : 'Reviewer action failed.'); }
      return;
    }
    const actor = state.currentUser?.email || 'reviewer@demo.dharitrisentu.test';
    setState((prev) => {
      const updated = prev.documents.map((d) => {
        if (d.id !== docId) return d;
        const hash = d.sha256Hash || computeDeterministicSha256Hex(d.title + d.id);
        const pipeline = buildDocumentVerificationPipeline({
          title: d.title,
          fileType: d.fileType,
          fileSizeKB: d.fileSizeKB,
          sha256Hash: hash,
          parcelId: d.parcelId,
          declaredAreaBigha: d.extractedFields?.recordedAreaBigha ?? 2.0,
          recordedAreaBigha: d.extractedFields?.recordedAreaBigha ?? 2.0,
          hasDigitalSignature:
            d.extractedFields?.digitalSignatureStatus === 'Present (Verified Certificate)',
          reviewerStatus: outcome,
        });
        return {
          ...d,
          sha256Hash: hash,
          verificationStatus: pipeline.verificationStatus,
          pipelineStages: pipeline.stages,
          consentHistory: [
            {
              id: `ch-${Date.now()}`,
              action: 'Verified' as const,
              actorEmail: actor,
              timestamp: new Date().toISOString(),
              note: `Reviewer outcome: ${pipeline.verificationStatus}. ${note || ''}`,
            },
            ...d.consentHistory,
          ],
        };
      });
      return { ...prev, documents: updated };
    });
    showToast(
      outcome === 'Approved'
        ? 'Document verified by Authorised Reviewer'
        : 'Document flagged for resubmission by Reviewer'
    );
  };

  const shareDocument = async (docId: string, targetEmail: string, expiresInDays = 14) => {
    if (API_MODE) {
      try {
        const result = await apiRequest<{ document: LandLockerDocument; message: string }>(`/api/documents/${encodeURIComponent(docId)}/share`, {
          method: 'POST', body: JSON.stringify({ targetEmail, expiresInDays }),
        });
        setState((prev) => ({ ...prev, documents: prev.documents.map((d) => d.id === docId ? result.document : d) }));
        showToast(result.message);
      } catch (error) { showToast(error instanceof Error ? error.message : 'Could not share document.'); }
      return;
    }
    const actor = state.currentUser?.email || 'seller@demo.dharitrisentu.test';
    const expiryDate = new Date(Date.now() + expiresInDays * 86400000).toISOString();
    setState((prev) => {
      const updated = prev.documents.map((d) => {
        if (d.id !== docId) return d;
        const nextShared = d.sharedWithEmails.includes(targetEmail)
          ? d.sharedWithEmails
          : [...d.sharedWithEmails, targetEmail];
        const status: LandLockerDocument['status'] = targetEmail.includes('buyer')
          ? 'Shared with Buyer'
          : 'Shared with Reviewer';
        return {
          ...d,
          status,
          sharedWithEmails: nextShared,
          consentExpiresAt: expiryDate,
          consentHistory: [
            {
              id: `ch-${Date.now()}`,
              action: 'Shared' as const,
              actorEmail: actor,
              targetEmail,
              timestamp: new Date().toISOString(),
              note: `Granted time-limited view permission to ${targetEmail} (expires ${expiryDate.slice(0, 10)}).`,
            },
            ...d.consentHistory,
          ],
        };
      });
      return { ...prev, documents: updated };
    });
    showToast(`Shared document access with ${targetEmail} (valid ${expiresInDays} days)`);
  };

  const revokeDocumentAccess = async (docId: string) => {
    if (API_MODE) {
      try {
        const result = await apiRequest<{ document: LandLockerDocument; message: string }>(`/api/documents/${encodeURIComponent(docId)}/shares`, { method: 'DELETE' });
        setState((prev) => ({ ...prev, documents: prev.documents.map((d) => d.id === docId ? result.document : d) }));
        showToast(result.message);
      } catch (error) { showToast(error instanceof Error ? error.message : 'Could not revoke access.'); }
      return;
    }
    const actor = state.currentUser?.email || 'seller@demo.dharitrisentu.test';
    setState((prev) => {
      const updated = prev.documents.map((d) => {
        if (d.id !== docId) return d;
        return {
          ...d,
          status: 'Access Revoked' as const,
          sharedWithEmails: [],
          consentExpiresAt: undefined,
          consentHistory: [
            {
              id: `ch-${Date.now()}`,
              action: 'Access Revoked' as const,
              actorEmail: actor,
              timestamp: new Date().toISOString(),
              note: 'Owner revoked all shared access in LandLocker immediately.',
            },
            ...d.consentHistory,
          ],
        };
      });
      return { ...prev, documents: updated };
    });
    showToast('Revoked shared access for document');
  };

  const resetDemoData = () => {
    if (API_MODE) {
      showToast('Global demo reset is disabled in API mode to protect real users and records.');
      return;
    }
    const fresh = resetStateInStorage();
    setState(fresh);
    setProductionEmptyModeState(false);
    showToast('Restored initial listings and records');
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        apiReady,
        t,
        setLanguage,
        areaUnit,
        setAreaUnit,
        productionEmptyMode,
        setProductionEmptyMode,
        markIntroSeen,
        replayIntro,
        login,
        signup,
        logout,
        updateProfile,
        refreshServerState,
        toggleSavedListing,
        recordRecentlyViewed,
        addRecentSearch,
        createListing,
        updateListingStatus,
        updateSellerAskingPrice,
        submitEnquiry,
        replyToEnquiry,
        sendEnquiryMessage,
        getOrCreateConversationThread,
        siteVisits,
        addSiteVisit,
        updateSiteVisitStatus,
        rescheduleSiteVisit,
        cancelSiteVisit,
        addDiscrepancyNote,
        updateChecklistTask,
        createDueDiligenceCase,
        uploadActualDocument,
        verifyDocumentByReviewer,
        shareDocument,
        revokeDocumentAccess,
        resetDemoData,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
