import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './app/AppContext';
import { API_MODE } from './services/apiClient';
import { CinematicIntro } from './components/CinematicIntro';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AskDharitriChatbot } from './components/AskDharitriChatbot';
import { HomePage } from './features/marketplace/HomePage';
import { ExplorePage } from './features/marketplace/ExplorePage';
import { ListingDetailPage } from './features/marketplace/ListingDetailPage';
import { CreateListingPage } from './features/marketplace/CreateListingPage';
import { TrustPassportPage } from './features/trust-passport/TrustPassportPage';
import { DiscrepanciesPage } from './features/discrepancies/DiscrepanciesPage';
import { DueDiligencePage } from './features/due-diligence/DueDiligencePage';
import { LandLockerPage } from './features/landlocker/LandLockerPage';
import { VoiceAssistantPage } from './features/voice-assistant/VoiceAssistantPage';
import { VirtualTourPage } from './features/virtual-tours/VirtualTourPage';
import { PriceExplorerPage } from './features/price-projections/PriceExplorerPage';
import { LoginPage, SignupPage } from './features/auth/AuthPages';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import {
  BuyerDashboardPage,
  ReviewerAdminConsolePage,
} from './features/admin/DashboardsAndAdmin';
import { BuyerInquiriesVisitsHub } from './features/buyer/BuyerInquiriesVisitsHub';
import { SellerDashboardPage } from './features/seller/SellerDashboardPage';
import { SellerVerificationActionCenter } from './features/seller/SellerVerificationActionCenter';
import { BuyerInquiriesVisitsPage } from './features/seller/BuyerInquiriesVisitsPage';
import { OfficialLoginPage } from './features/official/OfficialLoginPage';
import { OfficialDashboardPage } from './features/official/OfficialDashboardPage';
import { OfficialReviewerWorkbench } from './features/official/OfficialReviewerWorkbench';
import { OfficialDiscrepanciesPage } from './features/official/OfficialDiscrepanciesPage';
import { OfficialAuditLogPage } from './features/official/OfficialAuditLogPage';
import {
  ForBuyersPage,
  ForSellersPage,
  CapabilitiesPage,
  TrustCentrePage,
  AboutPage,
  PrivacyPage,
  TermsPage,
} from './features/marketplace/InfoPages';
import { UserRole } from './types';
import { ProfileSettingsPage } from './features/profile/ProfileSettingsPage';
import { ShortlistedComparePage } from './features/buyer/ShortlistedComparePage';
import { useGlobalDOMTranslator } from './i18n/useGlobalDOMTranslator';
import { LanguageProvider } from './i18n/LanguageContext';
import { ScrollToTop } from './components/ScrollToTop';

const ToastBanner: React.FC = () => {
  const { toastMessage } = useApp();
  if (!toastMessage) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-evergreen text-warmivory text-xs font-semibold shadow-2xl border border-leafgreen/40 backdrop-blur-md animate-bounce-subtle"
    >
      <span className="w-2 h-2 rounded-full bg-leafgreen animate-ping" />
      <span>{toastMessage}</span>
    </div>
  );
};

/**
 * RoleGuard enforces strict separation between Buyer, Seller, and Official Reviewer routes (Parts 3, 4, 10).
 * If a logged-in user attempts to visit another role's dashboard, they are redirected to their own dashboard.
 */
const RoleGuard: React.FC<{
  allowedRoles: UserRole[];
  allowGuestDemoView?: boolean;
  children: React.ReactElement;
}> = ({ allowedRoles, allowGuestDemoView = false, children }) => {
  const { currentUser, apiReady } = useApp();
  const location = useLocation();

  if (!apiReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-3 border-evergreen border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    if (allowGuestDemoView) return children;
    const isReviewerOnly = allowedRoles.length === 1 && allowedRoles[0] === 'reviewer';
    const loginPath = isReviewerOnly ? '/official/login' : '/login';
    return (
      <Navigate
        to={`${loginPath}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (!allowedRoles.includes(currentUser.role)) {
    const ownDashboard =
      currentUser.role === 'buyer'
        ? '/dashboard/buyer'
        : currentUser.role === 'seller'
        ? '/dashboard/seller'
        : '/official/dashboard';
    return <Navigate to={ownDashboard} replace />;
  }

  return children;
};

export const AppShell: React.FC = () => {
  const { language } = useApp();
  useGlobalDOMTranslator(language);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-maintext">
      <ScrollToTop />
      <CinematicIntro />
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/shortlisted" element={<RoleGuard allowedRoles={['buyer','seller','reviewer']} allowGuestDemoView={true}><ShortlistedComparePage initialTab="saved" /></RoleGuard>} />
          <Route path="/compare" element={<RoleGuard allowedRoles={['buyer','seller','reviewer']} allowGuestDemoView={true}><ShortlistedComparePage initialTab="compare" /></RoleGuard>} />
          <Route path="/land/:id" element={<ListingDetailPage />} />
          <Route path="/properties/:id" element={<ListingDetailPage />} />
          <Route path="/properties" element={<Navigate to="/explore" replace />} />
          <Route path="/buyers" element={<ForBuyersPage />} />
          <Route path="/sellers" element={<ForSellersPage />} />
          <Route path="/capabilities" element={<CapabilitiesPage />} />
          <Route
            path="/sell/new"
            element={
              <RoleGuard allowedRoles={['seller']}>
                <CreateListingPage />
              </RoleGuard>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/official-portal" element={<OfficialLoginPage />} />
          <Route path="/official/login" element={<OfficialLoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<RoleGuard allowedRoles={['buyer','seller','reviewer']}><ProfileSettingsPage /></RoleGuard>} />
          <Route
            path="/dashboard/buyer"
            element={
              <RoleGuard allowedRoles={['buyer']}>
                <BuyerDashboardPage />
              </RoleGuard>
            }
          />
          <Route
            path="/buyer/inquiries"
            element={
              <RoleGuard allowedRoles={['buyer', 'seller', 'reviewer']} allowGuestDemoView={true}>
                <BuyerInquiriesVisitsHub />
              </RoleGuard>
            }
          />
          <Route
            path="/inquiries"
            element={
              <RoleGuard allowedRoles={['buyer', 'seller', 'reviewer']} allowGuestDemoView={true}>
                <BuyerInquiriesVisitsHub />
              </RoleGuard>
            }
          />
          <Route
            path="/buyer/site-visits"
            element={
              <RoleGuard allowedRoles={['buyer', 'seller', 'reviewer']} allowGuestDemoView={true}>
                <BuyerInquiriesVisitsHub />
              </RoleGuard>
            }
          />
          <Route
            path="/dashboard/seller"
            element={
              <RoleGuard allowedRoles={['seller']}>
                <SellerDashboardPage />
              </RoleGuard>
            }
          />
          <Route
            path="/seller/properties"
            element={
              <RoleGuard allowedRoles={['seller']}>
                <SellerDashboardPage />
              </RoleGuard>
            }
          />
          <Route
            path="/seller/inquiries"
            element={
              <RoleGuard allowedRoles={['seller']}>
                <BuyerInquiriesVisitsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/seller/verification"
            element={
              <RoleGuard allowedRoles={['seller']}>
                <SellerVerificationActionCenter />
              </RoleGuard>
            }
          />
          <Route path="/trust-centre" element={<TrustCentrePage />} />
          <Route path="/passport/:id" element={<TrustPassportPage />} />
          <Route path="/discrepancies" element={<RoleGuard allowedRoles={['reviewer']}><OfficialDiscrepanciesPage /></RoleGuard>} />
          <Route path="/cases" element={<RoleGuard allowedRoles={['buyer','seller','reviewer']}><DueDiligencePage /></RoleGuard>} />
          <Route path="/cases/:id" element={<RoleGuard allowedRoles={['buyer','seller','reviewer']}><DueDiligencePage /></RoleGuard>} />
          <Route path="/due-diligence" element={<RoleGuard allowedRoles={['buyer','seller','reviewer']}><DueDiligencePage /></RoleGuard>} />
          <Route path="/landlocker" element={<RoleGuard allowedRoles={['buyer','seller','reviewer']} allowGuestDemoView={true}><LandLockerPage /></RoleGuard>} />
          <Route path="/assistant" element={<VoiceAssistantPage />} />
          <Route path="/virtual-tour/:id" element={<VirtualTourPage />} />
          <Route path="/price-explorer" element={<PriceExplorerPage />} />
          <Route path="/admin/*" element={<Navigate to="/official/dashboard" replace />} />
          <Route path="/official/dashboard" element={<RoleGuard allowedRoles={['reviewer']}><OfficialDashboardPage /></RoleGuard>} />
          <Route path="/official/inspector" element={<RoleGuard allowedRoles={['reviewer']}><OfficialReviewerWorkbench /></RoleGuard>} />
          <Route path="/official/inspector/:id" element={<RoleGuard allowedRoles={['reviewer']}><OfficialReviewerWorkbench /></RoleGuard>} />
          <Route path="/official/reviews" element={<RoleGuard allowedRoles={['reviewer']}><OfficialDashboardPage /></RoleGuard>} />
          <Route path="/official/cases" element={<RoleGuard allowedRoles={['reviewer']}><OfficialDashboardPage /></RoleGuard>} />
          <Route path="/official/discrepancies" element={<RoleGuard allowedRoles={['reviewer']}><OfficialDiscrepanciesPage /></RoleGuard>} />
          <Route path="/official/landlocker" element={<RoleGuard allowedRoles={['reviewer']}><LandLockerPage /></RoleGuard>} />
          <Route path="/official/audit" element={<RoleGuard allowedRoles={['reviewer']}><OfficialAuditLogPage /></RoleGuard>} />
          <Route path="/official/profile" element={<RoleGuard allowedRoles={['reviewer']}><ProfileSettingsPage /></RoleGuard>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <ToastBanner />
      <AskDharitriChatbot />
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
}
