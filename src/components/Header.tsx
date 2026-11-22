import React, { useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, Home, Compass, MapPinned, FolderLock, FileCheck2, BarChart3,
  UserRound, Settings, Store, ShieldCheck, ClipboardCheck, CircleHelp,
  LogOut, Languages, Ruler, ChevronRight, Sparkles, ScanSearch, Plus,
  ArrowUpRight, LayoutDashboard, Bell, Heart, ArrowLeftRight, ChevronDown, Check,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../app/AppContext';
import { Language, AreaUnit } from '../types';
import { AREA_UNIT_META } from '../utils/landUnitsAndBadges';

interface MenuItem { label: string; path: string; icon: LucideIcon; }
interface MenuGroup { label: string; items: MenuItem[]; }

export const Header: React.FC = () => {
  const { currentUser, enquiries, language, setLanguage, areaUnit, setAreaUnit, logout, t } = useApp();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ds_read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const isOfficial = location.pathname.startsWith('/official') || currentUser?.role === 'reviewer';

  useEffect(() => { setOpen(false); setShowNotifications(false); setShowUserDropdown(false); }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [open]);

  // Clean, human-friendly user name without "(Demo)"
  const cleanDisplayName =
    currentUser?.name?.replace(/\s*\([^)]*\)/g, '').trim() ||
    (currentUser?.role === 'buyer'
      ? 'Ananya Baruah'
      : currentUser?.role === 'seller'
      ? 'Pranabjyoti Kalita'
      : currentUser?.role === 'reviewer'
      ? 'Debajit Hazarika'
      : 'User');

  const groups: MenuGroup[] = useMemo(() => {
    if (currentUser?.role === 'reviewer') return [
      { label: 'Official Verifier Portal', items: [
        { label: 'Verification Queue (Dashboard)', path: '/official/dashboard', icon: LayoutDashboard },
        { label: 'Active Case Inspector', path: '/official/inspector/lst-1', icon: ClipboardCheck },
        { label: 'Discrepancy & Seller Clarifications', path: '/official/discrepancies', icon: ScanSearch },
        { label: 'Completed Sign-Off Audit Log', path: '/official/audit', icon: ShieldCheck },
        { label: 'Official Profile', path: '/profile', icon: UserRound },
      ] },
    ];
    if (currentUser?.role === 'seller') return [
      { label: 'Seller Workspace', items: [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Seller Dashboard', path: '/dashboard/seller', icon: LayoutDashboard },
        { label: 'My Properties', path: '/seller/properties', icon: Store },
        { label: 'Create a Listing', path: '/sell/new', icon: Plus },
        { label: 'Buyer Inquiries & Visits', path: '/seller/inquiries', icon: MessageSquare },
        { label: 'LandLocker (My Documents)', path: '/landlocker', icon: FolderLock },
        { label: 'Verification & Action Center', path: '/seller/verification', icon: ShieldCheck },
        { label: 'Ask Dharitri', path: '/assistant', icon: Sparkles },
      ] },
    ];

    // Default Buyer Journey: exact order requested with Home at the top
    return [
      { label: 'Buyer Workspace', items: [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Buyer Dashboard', path: '/dashboard/buyer', icon: LayoutDashboard },
        { label: 'Explore Land (Live Map)', path: '/explore', icon: MapPinned },
        { label: 'Shortlisted & Compare', path: '/shortlisted', icon: Heart },
        { label: 'Property Verification', path: '/due-diligence', icon: ShieldCheck },
        { label: 'LandLocker (Docs & KYC)', path: '/landlocker', icon: FolderLock },
        { label: 'Site Visits & Inquiries', path: '/buyer/inquiries', icon: MessageSquare },
        { label: 'Price & Stamp Duty Calculator', path: '/price-explorer', icon: BarChart3 },
        { label: 'Ask Dharitri', path: '/assistant', icon: Sparkles },
      ] },
    ];
  }, [currentUser?.role, language]);

  const targetEnquiry = enquiries?.find((e) => e.id === 'ENQ-001') || enquiries?.[0];
  const lastReply = targetEnquiry?.replies && targetEnquiry.replies.length > 0
    ? targetEnquiry.replies[targetEnquiry.replies.length - 1]
    : null;

  const notifications = useMemo(() => {
    const isSeller = currentUser?.role === 'seller';
    const isReviewer = currentUser?.role === 'reviewer';

    if (isReviewer) {
      return [
        {
          id: 'notif-rev-queue',
          title: '3 New Deeds in Review Queue',
          desc: 'Kamrup Circle: Changsari & Sonapur verification dossiers awaiting sign-off.',
          time: '10m ago',
          link: '/official/dashboard',
          unread: !readNotifIds.includes('notif-rev-queue'),
        },
        {
          id: 'notif-rev-hash',
          title: 'SHA-256 Hash Verified',
          desc: 'Jamabandi extract DOC-LL-001 integrity confirmed against LandLocker ledger.',
          time: '1h ago',
          link: '/official/audit',
          unread: !readNotifIds.includes('notif-rev-hash'),
        },
      ];
    }

    if (isSeller) {
      const msgText = lastReply?.senderRole === 'buyer'
        ? lastReply.message
        : targetEnquiry?.message || 'Hello Pranabjyoti-da, I noticed a 0.15 Bigha boundary variance on the southern bund...';
      const truncated = msgText.length > 80 ? msgText.slice(0, 80) + '...' : msgText;

      return [
        {
          id: `notif-seller-inq-${targetEnquiry?.id || '001'}`,
          title: `Buyer Inquiry: ${targetEnquiry?.buyerName || 'Ananya Baruah'}`,
          desc: `${targetEnquiry?.listingTitle || 'Changsari 2.5 Bigha Plot'}: "${truncated}"`,
          time: lastReply?.timestamp ? 'Recently' : '15m ago',
          link: '/seller/inquiries',
          unread: !readNotifIds.includes(`notif-seller-inq-${targetEnquiry?.id || '001'}`),
        },
        {
          id: 'notif-seller-verify',
          title: 'Jamabandi Pre-Check Verified',
          desc: 'Dag 412, Patta 89 record verified against Revenue Circle records.',
          time: '1h ago',
          link: '/seller/verification',
          unread: !readNotifIds.includes('notif-seller-verify'),
        },
        {
          id: 'notif-seller-visit',
          title: 'Scheduled Site Visit Request',
          desc: 'Physical Meeting with Ananya Baruah confirmed for Nov 10, 2026.',
          time: 'Yesterday',
          link: '/seller/inquiries?tab=visits',
          unread: false,
        },
      ];
    }

    // Buyer / default
    const msgText = lastReply?.senderRole === 'seller'
      ? lastReply.message
      : 'I have requested the Lot Mondal to remeasure the southern boundary.';
    const truncated = msgText.length > 80 ? msgText.slice(0, 80) + '...' : msgText;

    return [
      {
        id: `notif-buyer-rep-${targetEnquiry?.id || '001'}`,
        title: 'Seller Replied to Inquiry',
        desc: `Pranabjyoti Kalita: "${truncated}"`,
        time: lastReply?.timestamp ? 'Recently' : '12m ago',
        link: '/buyer/inquiries',
        unread: !readNotifIds.includes(`notif-buyer-rep-${targetEnquiry?.id || '001'}`),
      },
      {
        id: 'notif-buyer-jamabandi',
        title: 'Jamabandi & NEC Verified',
        desc: 'Changsari 2.5 Bigha Plot record matched official Dharitree 30-year register.',
        time: '1h ago',
        link: '/due-diligence',
        unread: !readNotifIds.includes('notif-buyer-jamabandi'),
      },
      {
        id: 'notif-buyer-kyc',
        title: 'DigiLocker KYC Ready',
        desc: 'Paperless identity verification is linked and active for your buyer account.',
        time: 'Yesterday',
        link: '/landlocker',
        unread: false,
      },
    ];
  }, [currentUser?.role, enquiries, targetEnquiry, lastReply, readNotifIds]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('ds_read_notifications', JSON.stringify(allIds));
    } catch {}
  };

  const markAsRead = (id: string) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('ds_read_notifications', JSON.stringify(updated));
      } catch {}
    }
  };

  useEffect(() => {
    // Automatically mark notifications as read when visiting their destination page
    const matchingNotifs = notifications.filter(
      (n) => n.link && (location.pathname === n.link.split('?')[0] || (n.link.includes('/inquiries') && location.pathname.includes('/inquiries')))
    );
    if (matchingNotifs.some((n) => n.unread)) {
      setReadNotifIds((prev) => {
        const idsToAdd = matchingNotifs.map((n) => n.id).filter((id) => !prev.includes(id));
        if (idsToAdd.length === 0) return prev;
        const updated = [...prev, ...idsToAdd];
        try {
          localStorage.setItem('ds_read_notifications', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [location.pathname, notifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      <header className={`ds-header sticky top-0 z-40 ${isOfficial ? 'ds-header-official' : ''}`}>
        <div className="ds-header-inner">
          {/* Left Brand & Menu Trigger */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label={t(open ? 'menuClose' : 'menuOpen')}
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="ds-menu-trigger"
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>
            <Link
              to={currentUser?.role === 'reviewer' ? "/official/dashboard" : "/"}
              className="ds-brand min-w-0"
              aria-label="Dharitri Sentu home"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
            >
              <img src="/assets/logo.svg" alt="" className="ds-brand-mark" />
              <span className="min-w-0">
                <span className="ds-brand-name">Dharitri Sentu</span>
                <span className="ds-brand-sub">
                  {currentUser?.role === 'reviewer' ? 'OFFICIAL VERIFICATION PORTAL' : 'LAND · EVIDENCE · TRUST'}
                </span>
              </span>
            </Link>
          </div>

          {/* Right Clean Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reviewer Jurisdiction & Session Security Badges */}
            {currentUser?.role === 'reviewer' && (
              <div className="hidden lg:flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091F16] border border-[#225740] text-[#B5E4A3] text-xs font-bold shadow-xs">
                  <span>📍</span>
                  <span>Jurisdiction: Changsari Revenue Circle (Kamrup)</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091F16] border border-[#225740] text-emerald-300 text-xs font-medium">
                  <span>🔒</span>
                  <span>Secure Session Active (IP Logged)</span>
                </div>
              </div>
            )}

            {/* 1. Interactive Unit Switcher Dropdown */}
            <div className="relative inline-flex items-center">
              <label
                htmlFor="header-unit-switcher"
                className="inline-flex items-center gap-1.5 bg-[#16362A] border border-[#456252] hover:border-[#B5E4A3] text-[#E5EDE7] rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                title="Change Platform Land Unit"
              >
                <Ruler size={13} className="text-[#B5E4A3]" />
                <span className="hidden sm:inline">Unit:</span>
                <select
                  id="header-unit-switcher"
                  aria-label="Change Platform Land Unit"
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                  className="bg-transparent border-0 text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
                >
                  <option value="bigha" className="bg-[#0D261C] text-white">Bigha</option>
                  <option value="katha" className="bg-[#0D261C] text-white">Katha</option>
                  <option value="lessa" className="bg-[#0D261C] text-white">Lessa</option>
                  <option value="acre" className="bg-[#0D261C] text-white">Acre</option>
                  <option value="sqft" className="bg-[#0D261C] text-white">Sq. Ft.</option>
                </select>
              </label>
            </div>

            {/* 2. Clean Language Selector Dropdown */}
            <label
              htmlFor="header-language-select"
              className="inline-flex items-center gap-1.5 bg-[#16362A] border border-[#456252] hover:border-[#B5E4A3] text-[#E5EDE7] rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
              title="Change Language"
            >
              <Languages size={13} className="text-[#B5E4A3]" />
              <select
                id="header-language-select"
                aria-label="Change Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent border-0 text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-[#0D261C] text-white">EN — English</option>
                <option value="as" className="bg-[#0D261C] text-white">অসমীয়া — Assamese</option>
                <option value="hi" className="bg-[#0D261C] text-white">हिन्दी — Hindi</option>
              </select>
            </label>

            {/* 3. Notification Bell Icon with Red Dot Badge */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-[#16362A] border border-[#456252] hover:border-[#B5E4A3] text-[#E5EDE7] transition"
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 text-slate-800"
                  >
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Bell size={14} className="text-emerald-700" />
                        <span>{t('Notifications & Alerts')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAllAsRead();
                            }}
                            className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                          >
                            {t('Mark all as read')}
                          </button>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {unreadCount} {t('New')}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <Link
                          key={n.id}
                          to={n.link}
                          onClick={() => {
                            markAsRead(n.id);
                            setShowNotifications(false);
                          }}
                          className={`p-3.5 block transition hover:bg-slate-50 relative ${
                            n.unread ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />}
                              <span>{t(n.title)}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">{t(n.time)}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{t(n.desc)}</p>
                        </Link>
                      ))}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                      <Link
                        to="/due-diligence"
                        onClick={() => setShowNotifications(false)}
                        className="text-[11px] font-bold text-emerald-800 hover:underline"
                      >
                        View Verification Hub →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. User Profile Pill with Role Tag & Dropdown */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="ds-account-button flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#16362A] border border-[#456252] hover:border-[#B5E4A3] transition text-left"
                >
                  <span className="ds-avatar w-7 h-7 text-xs bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold">
                    {cleanDisplayName.charAt(0)}
                  </span>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-white leading-tight">{cleanDisplayName}</div>
                    <div className="text-[10px] text-[#B5E4A3] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B5E4A3] inline-block" />
                      <span>
                        {currentUser?.role === 'seller'
                          ? 'Verified Seller'
                          : currentUser?.role === 'reviewer'
                          ? 'Authorized Verifier'
                          : 'Verified Buyer'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 text-slate-800"
                    >
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <div className="font-bold text-xs text-slate-900">{cleanDisplayName}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {currentUser?.role === 'seller'
                            ? 'Verified Seller Workspace'
                            : currentUser?.role === 'reviewer'
                            ? 'Official Verifier Portal'
                            : 'Verified Buyer Account'}
                        </div>
                      </div>

                      <div className="p-1 space-y-0.5 text-xs font-medium">
                        {currentUser?.role === 'seller' ? (
                          <>
                            <Link
                              to="/dashboard/seller"
                              onClick={() => {
                                setShowUserDropdown(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700"
                            >
                              <LayoutDashboard size={14} />
                              <span>Seller Dashboard</span>
                            </Link>
                            <Link
                              to="/seller/properties"
                              onClick={() => {
                                setShowUserDropdown(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700"
                            >
                              <Store size={14} />
                              <span>My Properties</span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => {
                                setShowUserDropdown(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700"
                            >
                              <Settings size={14} />
                              <span>Account & Security</span>
                            </Link>
                          </>
                        ) : currentUser?.role === 'reviewer' ? (
                          <>
                            <Link
                              to="/official/dashboard"
                              onClick={() => {
                                setShowUserDropdown(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700"
                            >
                              <LayoutDashboard size={14} />
                              <span>Verification Queue</span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => {
                                setShowUserDropdown(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700"
                            >
                              <UserRound size={14} />
                              <span>Official Profile</span>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/dashboard/buyer"
                              onClick={() => {
                                setShowUserDropdown(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700"
                            >
                              <LayoutDashboard size={14} />
                              <span>Buyer Dashboard</span>
                            </Link>
                            <Link
                              to="/shortlisted"
                              onClick={() => {
                                setShowUserDropdown(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700"
                            >
                              <Heart size={14} />
                              <span>Shortlisted Properties</span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => {
                                setShowUserDropdown(false);
                                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-slate-700"
                            >
                              <Settings size={14} />
                              <span>Account & Security</span>
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="p-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={async () => {
                            setShowUserDropdown(false);
                            await logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition text-left"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="ds-login-link text-xs font-bold text-white px-3 py-1.5 hover:text-[#B5E4A3]">
                  Login
                </Link>
                <Link to="/signup" className="ds-signup-link text-xs font-bold bg-[#15803D] hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl transition flex items-center gap-1">
                  <span>Sign Up</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Sidebar Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              className="ds-drawer-backdrop"
              aria-label={t('menuClose')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="ds-drawer bg-[#0D261C] text-white"
              role="dialog"
              aria-modal="true"
              aria-label="Application navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <div className="ds-drawer-head border-b border-white/10 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/assets/logo.svg" alt="" className="ds-brand-mark ds-drawer-logo w-8 h-8" />
                  <div>
                    <div className="ds-drawer-wordmark text-white font-serif font-bold text-lg tracking-tight">
                      DHARITRI SENTU
                    </div>
                    <div className="ds-drawer-caption text-[#B5E4A3] text-[9px] font-bold tracking-widest">
                      ASSAM LAND TRUST
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ds-drawer-close text-white/70 hover:text-white"
                  aria-label={t('menuClose')}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="ds-drawer-body p-5 space-y-6 overflow-y-auto">
                {/* Clean User Profile Card in Drawer */}
                {currentUser && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                      {cleanDisplayName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-bold text-sm truncate">{cleanDisplayName}</div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#B5E4A3] text-[10px] font-bold mt-0.5 border border-emerald-500/30">
                        <Check size={10} />
                        <span>
                          {currentUser.role === 'reviewer'
                            ? '✓ Verified Reviewer'
                            : currentUser.role === 'seller'
                            ? '✓ Verified Seller'
                            : '✓ Verified Buyer'}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Navigation Groups in Logical Step-by-Step Order */}
                {groups.map((group) => (
                  <section className="space-y-2" key={group.label}>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#B5E4A3]/80 px-2">
                      {group.label}
                    </h2>
                    <nav className="space-y-1">
                      {group.items.map((item) => {
                        const active =
                          location.pathname === item.path ||
                          (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                        const Icon = item.icon;
                        return (
                          <Link
                            key={`${item.path}-${item.label}`}
                            to={item.path}
                            aria-current={active ? 'page' : undefined}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                              active
                                ? 'bg-[#15803D] text-white shadow-sm'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                            onClick={() => {
                              setOpen(false);
                              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                            }}
                          >
                            <span className="shrink-0">
                              <Icon size={16} strokeWidth={1.8} />
                            </span>
                            <span className="flex-1 min-w-0">{item.label}</span>
                            <ChevronRight size={14} className="text-white/40" />
                          </Link>
                        );
                      })}
                    </nav>
                  </section>
                ))}

                {/* Drawer Footer Actions */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  {currentUser ? (
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-rose-600/30 text-rose-300 text-xs font-bold transition border border-white/10"
                      onClick={async () => {
                        await logout();
                        setOpen(false);
                        navigate('/');
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold text-center"
                        onClick={() => {
                          setOpen(false);
                          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        }}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        className="py-2.5 rounded-xl bg-[#15803D] hover:bg-emerald-600 text-white text-xs font-bold text-center"
                        onClick={() => {
                          setOpen(false);
                          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        }}
                      >
                        Register
                      </Link>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Dharitri Sentu Land Intelligence · Statutory Verification Workflow
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
