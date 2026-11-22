import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import {
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Navigation,
  Video,
  UserCheck,
  Building,
  Plus,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  parseVisitDateTime,
  getQuickDatePresets,
  POPULAR_TIME_SLOTS,
  formatFriendlyDate,
  formatFriendlyTime,
} from '../../utils/visitDateUtils';

export interface ChatMessage {
  id: string;
  senderId?: string;
  recipientId?: string;
  sender: 'buyer' | 'seller';
  senderRole?: 'buyer' | 'seller' | 'reviewer';
  senderName: string;
  timestamp: string;
  text: string;
}

export interface ChatThread {
  id: string;
  sellerName: string;
  sellerEmail: string;
  propertyTitle: string;
  parcelId: string;
  unreadCount: number;
  lastUpdated: string;
  messages: ChatMessage[];
}

export const BuyerInquiriesVisitsHub: React.FC = () => {
  const {
    currentUser,
    listings,
    enquiries,
    sendEnquiryMessage,
    siteVisits,
    addSiteVisit,
    rescheduleSiteVisit,
    cancelSiteVisit,
    refreshServerState,
    showToast,
    t,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const visits = siteVisits || [];

  // Live polling for incoming seller responses
  useEffect(() => {
    const timer = setInterval(() => {
      refreshServerState().catch(() => {});
    }, 2000);
    return () => clearInterval(timer);
  }, [refreshServerState]);

  // Primary Tabs: 'inquiries' (Messages & Inquiries) | 'visits' (Scheduled Site Visits)
  const initialTab = searchParams.get('tab') === 'visits' ? 'visits' : 'inquiries';
  const [activeTab, setActiveTab] = useState<'inquiries' | 'visits'>(initialTab);

  // Dynamic conversations mapped directly from shared global enquiries - Single DM Rule
  const threads: ChatThread[] = useMemo(() => {
    if (!enquiries || enquiries.length === 0) {
      return [
        {
          id: 'ENQ-001',
          sellerName: 'Pranabjyoti Kalita',
          sellerEmail: 'pranabjyoti@dharitrisentu.in',
          propertyTitle: 'Changsari 2.5 Bigha Highway-Facing Plot',
          parcelId: 'AS-KMP-001',
          unreadCount: 1,
          lastUpdated: '10:45 AM',
          messages: [
            {
              id: 'msg-1',
              sender: 'buyer',
              senderName: currentUser?.name || 'Ananya Baruah',
              timestamp: 'Yesterday at 4:30 PM',
              text: 'Hello Pranabjyoti-da, I noticed in the due-diligence report that there is a 0.15 Bigha boundary variance on the southern drain bund against the synthetic Jamabandi. Could you please clarify if a fresh survey sketch has been ordered?',
            },
            {
              id: 'msg-2',
              sender: 'seller',
              senderName: 'Pranabjyoti Kalita',
              timestamp: 'Today at 10:45 AM',
              text: 'I have requested the Lot Mondal to remeasure the southern boundary. Will upload the new trace map by tomorrow.',
            },
          ],
        },
      ];
    }

    // Group enquiries by Single DM key: canonical parcel / listing ID
    const threadMap = new Map<string, {
      id: string;
      sellerName: string;
      sellerEmail: string;
      propertyTitle: string;
      parcelId: string;
      unreadCount: number;
      messages: ChatMessage[];
      latestTimestampMs: number;
      lastUpdated: string;
    }>();

    for (const enq of enquiries) {
      let canonicalListingId = 'lst-1';
      if (enq.listingId === 'lst-1' || enq.parcelId === 'AS-KMP-001' || enq.listingTitle?.toLowerCase().includes('riverside') || enq.listingTitle?.toLowerCase().includes('changsari')) {
        canonicalListingId = 'lst-1';
      } else if (enq.listingId === 'lst-2' || enq.parcelId === 'AS-KMP-002' || enq.listingTitle?.toLowerCase().includes('sonapur') || enq.listingTitle?.toLowerCase().includes('homestead')) {
        canonicalListingId = 'lst-2';
      } else if (enq.listingId === 'lst-3' || enq.parcelId === 'AS-DBR-008' || enq.listingTitle?.toLowerCase().includes('chabua') || (enq.listingTitle?.toLowerCase().includes('tea') && !enq.listingTitle?.toLowerCase().includes('riverside'))) {
        canonicalListingId = 'lst-3';
      } else {
        const found = listings.find((l) => l.id === enq.listingId || l.parcelId === enq.parcelId || l.title === enq.listingTitle);
        canonicalListingId = found ? found.id : (enq.listingId || enq.parcelId || 'lst-1');
      }

      const listing = listings.find((l) => l.id === canonicalListingId);
      const isChabua = canonicalListingId === 'lst-3';
      const sellerName = isChabua ? 'Monideepa Gogoi' : (listing?.sellerName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Pranabjyoti Kalita');
      const sellerEmail = isChabua ? 'monideepa@dharitrisentu.in' : (listing?.sellerEmail || 'pranabjyoti@dharitrisentu.in');
      const propertyTitle = listing?.title || enq.listingTitle || 'Assam Land Parcel';
      const parcelId = listing?.parcelId || enq.parcelId || (canonicalListingId === 'lst-1' ? 'AS-KMP-001' : canonicalListingId === 'lst-2' ? 'AS-KMP-002' : 'AS-DBR-008');

      // Canonical Single DM Key: Exactly ONE thread per land parcel!
      const dmKey = canonicalListingId;

      // Build message items from this enquiry
      const enqMsgs: ChatMessage[] = [];
      const buyerId = enq.buyerId || 'usr-buyer-1';
      const sellerId = isChabua ? 'usr-seller-2' : (enq.sellerId || 'usr-seller-1');

      if (enq.message && enq.message.trim()) {
        enqMsgs.push({
          id: `msg-${enq.id}-orig`,
          senderId: buyerId,
          recipientId: sellerId,
          sender: 'buyer',
          senderRole: 'buyer',
          senderName: enq.buyerName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Ananya Baruah',
          timestamp: enq.createdAt ? new Date(enq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
          text: enq.message,
        });
      }

      for (let idx = 0; idx < (enq.replies || []).length; idx++) {
        const r = enq.replies[idx];
        const text = r.message?.trim() || '';
        if (!text) continue;
        const isBuyerContent =
          text.toLowerCase().includes('i am interested') ||
          text.toLowerCase().includes('hello pranabjyoti') ||
          text.toLowerCase().includes('hello monideepa') ||
          text.toLowerCase().includes('noticed in the due-diligence') ||
          text.toLowerCase().includes('boundary variance');
        const isBuyer = r.senderRole
          ? r.senderRole === 'buyer'
          : (r.senderId === 'usr-buyer-1' || isBuyerContent);
        const msgSenderId = r.senderId || (isBuyer ? buyerId : sellerId);
        const msgSenderRole = (r.senderRole || (isBuyer ? 'buyer' : 'seller')) as 'buyer' | 'seller';

        // Deduplicate twin messages from same sender
        const msgTimeMs = r.timestamp ? new Date(r.timestamp).getTime() : 0;
        const isDuplicate = enqMsgs.some(
          (em) =>
            em.id === r.id ||
            (em.text?.trim() === text && em.sender === (isBuyer ? 'buyer' : 'seller')) ||
            (em.text?.trim() === text && msgTimeMs > 0 && Math.abs(msgTimeMs - ((em as any).rawTimestampMs || 0)) < 15000)
        );
        if (isDuplicate) continue;

        enqMsgs.push({
          id: r.id || `msg-${enq.id}-rep-${idx}`,
          senderId: msgSenderId,
          recipientId: isBuyer ? sellerId : buyerId,
          sender: isBuyer ? 'buyer' : 'seller',
          senderRole: msgSenderRole,
          senderName: isBuyer ? (enq.buyerName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Ananya Baruah') : sellerName,
          timestamp: r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          rawTimestampMs: msgTimeMs,
          text: r.message,
        } as any);
      }

      const existing = threadMap.get(dmKey);
      if (!existing) {
        const createdMs = enq.createdAt ? new Date(enq.createdAt).getTime() : Date.now();
        threadMap.set(dmKey, {
          id: enq.id,
          sellerName,
          sellerEmail,
          propertyTitle,
          parcelId,
          unreadCount: enq.status === 'Replied' ? 1 : 0,
          messages: enqMsgs,
          latestTimestampMs: createdMs,
          lastUpdated: enqMsgs[enqMsgs.length - 1]?.timestamp || 'Recent',
        });
      } else {
        // Merge into existing thread (Single DM Rule!)
        if (enq.id.startsWith('ENQ-001') && !existing.id.startsWith('ENQ-001')) {
          existing.id = enq.id;
        }
        for (const m of enqMsgs) {
          const isDuplicate = existing.messages.some((em) => em.id === m.id || (em.text?.trim() === m.text?.trim() && em.sender === m.sender));
          if (!isDuplicate) {
            existing.messages.push(m);
          }
        }
        if (enq.status === 'Replied') existing.unreadCount = Math.max(existing.unreadCount, 1);
        const enqMs = enq.createdAt ? new Date(enq.createdAt).getTime() : Date.now();
        if (enqMs > existing.latestTimestampMs) {
          existing.latestTimestampMs = enqMs;
          existing.lastUpdated = existing.messages[existing.messages.length - 1]?.timestamp || 'Recent';
        }
      }
    }

    return Array.from(threadMap.values()).map((t) => ({
      id: t.id,
      sellerName: t.sellerName,
      sellerEmail: t.sellerEmail,
      propertyTitle: t.propertyTitle,
      parcelId: t.parcelId,
      unreadCount: t.unreadCount,
      lastUpdated: t.lastUpdated,
      messages: t.messages,
    }));
  }, [enquiries, listings, currentUser]);

  const [activeThreadId, setActiveThreadId] = useState<string>('ENQ-001');
  const [replyText, setReplyText] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeThreadId, activeThread?.messages.length]);

  // Modal State for New Visit Booking & Rescheduling
  const defaultDateIso = useMemo(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  }, []);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<any | null>(null);
  const [newVisitDate, setNewVisitDate] = useState<string>(defaultDateIso);
  const [newVisitTime, setNewVisitTime] = useState<string>('11:00');
  const [newVisitType, setNewVisitType] = useState<'Physical Meeting' | '360° Virtual Tour'>('Physical Meeting');
  const [newVisitListingId, setNewVisitListingId] = useState(listings[0]?.id || 'lst-1');

  // Handle URL Query Parameters (e.g. redirected from Contact Seller, Listing Detail, or DueDiligence)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'inquiries' || tabParam === 'visits') {
      setActiveTab(tabParam);
    }

    const actionParam = searchParams.get('action');
    const listingIdParam = searchParams.get('listingId');
    if (actionParam === 'schedule') {
      setActiveTab('visits');
      if (listingIdParam) {
        setNewVisitListingId(listingIdParam);
      }
      setSelectedVisitForReschedule(null);
      setNewVisitDate(defaultDateIso);
      setNewVisitTime('11:00');
      setIsScheduleModalOpen(true);
    }

    const threadParam = searchParams.get('thread');
    const draftParam = searchParams.get('draft');
    const propertyIdParam = searchParams.get('propertyId');
    const topic = searchParams.get('topic');
    const parcel = searchParams.get('parcel');

    if (threadParam) {
      setActiveTab('inquiries');
      setActiveThreadId(threadParam);
      if (draftParam) {
        setReplyText(draftParam);
      }
    } else if (propertyIdParam) {
      setActiveTab('inquiries');
      const matched = threads.find((t) => t.id === propertyIdParam || t.parcelId === propertyIdParam);
      if (matched) {
        setActiveThreadId(matched.id);
      }
      if (draftParam) {
        setReplyText(draftParam);
      }
    } else if (topic === 'boundary') {
      setActiveTab('inquiries');
      if (threads.length > 0) {
        setActiveThreadId(threads[0].id);
      }
      setReplyText(
        'Regarding the 0.15 Bigha boundary variance on parcel ' +
          (parcel || 'AS-KMP-001') +
          ': Has the Lot Mondal completed the remeasurement, and has the revised trace sketch been stamped?'
      );
    } else if (draftParam) {
      setActiveTab('inquiries');
      setReplyText(draftParam);
    }
  }, [searchParams, threads, defaultDateIso]);

  const activeUser = currentUser || {
    id: 'usr-buyer-1',
    name: 'Ananya Baruah',
    email: 'ananya@dharitrisentu.in',
    role: 'buyer' as const,
    district: 'Kamrup',
  };
  const currentUserId = activeUser.id;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    sendEnquiryMessage(activeThread.id, replyText.trim(), 'buyer', currentUserId);
    setReplyText('');
  };

  const handleCancelVisit = (visitId: string, propertyName: string) => {
    cancelSiteVisit(visitId);
  };

  const handleOpenReschedule = (visit: any) => {
    setSelectedVisitForReschedule(visit);
    const parsed = parseVisitDateTime(visit.dateTime);
    setNewVisitDate(parsed.isoDate);
    setNewVisitTime(parsed.isoTime);
    if (visit.visitType) {
      setNewVisitType(visit.visitType);
    }
    setIsScheduleModalOpen(true);
  };

  const handleConfirmScheduleOrReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    const friendlyDate = formatFriendlyDate(newVisitDate);
    const friendlyTime = formatFriendlyTime(newVisitTime);
    const formattedDateTime = `${friendlyDate} at ${friendlyTime}`;

    if (selectedVisitForReschedule) {
      // Reschedule existing visit
      rescheduleSiteVisit(selectedVisitForReschedule.id, formattedDateTime);
    } else {
      // Schedule new visit
      const listing = listings.find((l) => l.id === newVisitListingId) || listings[0];
      addSiteVisit({
        propertyName: listing.title,
        parcelId: listing.parcelId,
        location: `${listing.village}, ${listing.district}`,
        dateTime: formattedDateTime,
        visitType: newVisitType,
        status: 'Pending Confirmation',
        buyerName: currentUser?.name || 'Ananya Baruah',
        buyerEmail: currentUser?.email || 'ananya@dharitrisentu.in',
        buyerPhone: '+91 98640 12345',
        sellerName: listing.sellerName,
        sellerEmail: listing.sellerEmail,
        sellerPhone: '+91-94350-00202',
        meetingPoint: newVisitType === 'Physical Meeting' ? `At plot frontage (Dag #${listing.parcelId})` : 'Live 360° Portal',
        notes: 'Inspection requested by buyer',
      });
    }

    setIsScheduleModalOpen(false);
    setSelectedVisitForReschedule(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5EBE7] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F2EC] text-[#147D4A] text-xs font-bold mb-1.5">
            <Compass size={13} />
            <span>{t('Buyer Communication & Inspection Desk')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#092F24] font-heading">
            {t('Site Visits & Inquiries')}
          </h1>
          <p className="text-xs sm:text-sm text-[#66736D] mt-1">
            {t('Direct communication hub with land sellers')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#F7F9F6] border border-[#E5EBE7] rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inquiries');
              setSearchParams({ tab: 'inquiries' });
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'bg-[#092F24] text-white shadow-sm'
                : 'text-[#66736D] hover:text-[#092F24] hover:bg-white/60'
            }`}
          >
            <MessageSquare size={16} />
            <span>{t('Messages & Inquiries')}</span>
            {threads.some((t) => t.unreadCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('visits');
              setSearchParams({ tab: 'visits' });
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'visits'
                ? 'bg-[#092F24] text-white shadow-sm'
                : 'text-[#66736D] hover:text-[#092F24] hover:bg-white/60'
            }`}
          >
            <Calendar size={16} />
            <span>{t('Scheduled Site Visits')} ({visits.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MESSAGES & INQUIRIES (INBOX VIEW) */}
      {activeTab === 'inquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl border border-[#E5EBE7] shadow-sm overflow-hidden min-h-[620px]">
          {/* Left Column: Active Chat List (4 cols) */}
          <div className="lg:col-span-4 border-r border-[#E5EBE7] flex flex-col">
            <div className="p-4 border-b border-[#E5EBE7] bg-[#F7F9F6] flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#66736D]">
                {t('Active Conversations')} ({threads.length})
              </span>
              <span className="text-[11px] font-semibold text-[#147D4A]">
                {t('Verified Land Seller')}
              </span>
            </div>

            <div className="divide-y divide-[#E5EBE7] overflow-y-auto flex-1">
              {threads.map((thread) => {
                const isSelected = thread.id === activeThread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setActiveThreadId(thread.id);
                    }}
                    className={`w-full text-left p-4 transition flex items-start gap-3 ${
                      isSelected ? 'bg-[#E9F2EC]/60 border-l-4 border-l-[#147D4A]' : 'hover:bg-[#F7F9F6]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#103D30] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {thread.sellerName.slice(0, 1)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs sm:text-sm text-[#092F24] truncate">
                          Seller: {thread.sellerName}
                        </span>
                        <span className="text-[10px] text-[#66736D] shrink-0 font-medium">
                          {thread.lastUpdated}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-[#147D4A] truncate">
                        {thread.propertyTitle}
                      </div>

                      <p className="text-xs text-[#66736D] truncate">
                        {thread.messages[thread.messages.length - 1]?.text}
                      </p>
                    </div>

                    {thread.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Chat Window (8 cols) */}
          <div className="lg:col-span-8 flex flex-col bg-[#FDFEFC]">
            {/* Thread Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5EBE7] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E9F2EC] text-[#147D4A] flex items-center justify-center font-bold text-base">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#092F24]">
                      {activeThread.sellerName}
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                      {t('Verified Landowner')}
                    </span>
                  </div>
                  <p className="text-xs text-[#66736D]">
                    {t('Inquiry on:')} <strong>{activeThread.propertyTitle}</strong> ({t('Dag')} #{activeThread.parcelId})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Link
                  to={`/land/${activeThread.parcelId}`}
                  className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#092F24] hover:bg-[#F8FAF7] transition"
                >
                  {t('View Plot Details')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVisitForReschedule(null);
                    setNewVisitListingId(listings[0]?.id || 'lst-1');
                    setIsScheduleModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#147D4A] text-white text-xs font-bold hover:bg-[#103D30] transition shadow-xs flex items-center gap-1.5"
                >
                  <Calendar size={13} />
                  <span>{t('Book Site Visit')}</span>
                </button>
              </div>
            </div>

            {/* Conversation Messages - Authentic WhatsApp Format */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-2 bg-[#EFEAE2]/70 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]"
            >
              <div className="flex justify-center my-2">
                <span className="bg-white/90 backdrop-blur-xs text-[#54656F] text-[11px] font-semibold px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wide border border-slate-200/60 select-none">
                  {t('Today')}
                </span>
              </div>

              {activeThread.messages.map((msg) => {
                const isMe = msg.sender === 'buyer' || msg.senderRole === 'buyer';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2.5`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative text-left ${
                        isMe
                          ? 'bg-[#0D261C] text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 rounded-tl-xs border border-[#E2E8F0]'
                      }`}
                    >
                      {/* Incoming sender name header with badge */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-100">
                          <span className="text-xs font-bold text-[#0D261C]">{msg.senderName || activeThread.sellerName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            • {t('Verified Seller')}
                          </span>
                        </div>
                      )}

                      <div className={`text-[13px] leading-relaxed break-words whitespace-pre-wrap font-sans ${isMe ? 'text-white' : 'text-slate-800'}`}>
                        {msg.text}
                      </div>

                      {/* Small timestamp underneath */}
                      <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none font-medium ${isMe ? 'text-emerald-200/80' : 'text-slate-400'}`}>
                        <span>{isMe ? `${t('You')} • ${msg.timestamp}` : msg.timestamp}</span>
                        {isMe && (
                          <span className="text-emerald-400 font-bold text-xs leading-none" title="Delivered & Read">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Box - WhatsApp Style */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#F0F2F5] border-t border-[#E2E8F0] flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('Type your message here...')}
                className="flex-1 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm text-[#111B21] focus:outline-none focus:ring-2 focus:ring-[#008069] shadow-2xs"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-[#008069] hover:bg-[#006A57] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
                title={t('Send')}
              >
                <Send size={16} />
                <span className="hidden sm:inline">{t('Send')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULED SITE VISITS */}
      {activeTab === 'visits' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#092F24]">
                Upcoming Scheduled Site Visits
              </h2>
              <p className="text-xs text-[#66736D]">
                On-ground physical plot walkthroughs and 360° interactive virtual tours booked with landowners.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedVisitForReschedule(null);
                setNewVisitListingId(listings[0]?.id || 'lst-1');
                setIsScheduleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#147D4A] hover:bg-[#103D30] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Schedule New Site Visit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visits.map((visit) => {
              const isCancelled = visit.status === 'Cancelled';
              return (
                <div
                  key={visit.id}
                  className={`rounded-3xl border p-6 shadow-sm space-y-4 transition ${
                    isCancelled
                      ? 'opacity-60 bg-slate-50/80 border-slate-200'
                      : 'bg-white border-[#E5EBE7] hover:border-[#147D4A]'
                  }`}
                >
                  {/* Header & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#E5EBE7] pb-3.5">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#147D4A] uppercase tracking-wider">
                        Plot ID: {visit.parcelId}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-[#092F24]">
                        {visit.propertyName}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shrink-0 ${
                        isCancelled
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : visit.status === 'Confirmed by Seller'
                          ? 'bg-[#DCFCE7] text-[#166534] border-emerald-200'
                          : visit.status === 'Rescheduled'
                          ? 'bg-[#FEF3C7] text-[#92400E] border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      ✓ {visit.status}
                    </span>
                  </div>

                  {/* Prominent Inspection Date & Time Badges */}
                  {(() => {
                    const parsed = parseVisitDateTime(visit.dateTime);
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 rounded-2xl border border-emerald-200/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#092F24] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Calendar size={15} className="text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                              Inspection Date
                            </span>
                            <strong className="text-xs font-bold text-[#092F24]">
                              {parsed.displayDate}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Clock size={15} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                              Time Slot
                            </span>
                            <strong className="text-xs font-bold text-[#092F24]">
                              {parsed.displayTime}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Details Grid */}
                  <div className="space-y-2.5 text-xs text-[#15251F]">

                    <div className="flex items-center gap-2">
                      {visit.visitType === 'Physical Meeting' ? (
                        <MapPin size={15} className="text-[#147D4A] shrink-0" />
                      ) : (
                        <Video size={15} className="text-[#147D4A] shrink-0" />
                      )}
                      <span>
                        Visit Type:{' '}
                        <strong className="text-[#092F24]">
                          {visit.visitType}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Building size={15} className="text-[#66736D] shrink-0 mt-0.5" />
                      <span className="text-[#66736D]">
                        Meeting Point: <strong className="text-[#15251F]">{visit.meetingPoint}</strong>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E5EBE7] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#66736D] block text-[11px]">Accompanying Landowner:</span>
                        <strong className="text-[#092F24]">{visit.sellerName}</strong>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#147D4A]">
                        {visit.sellerPhone}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons - Hidden if Cancelled */}
                  {!isCancelled && (
                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#E5EBE7]">
                      <button
                        type="button"
                        onClick={() => handleOpenReschedule(visit)}
                        className="flex-1 py-2 px-3 rounded-xl border border-[#CBD5E1] text-[#092F24] hover:bg-[#F8FAF7] text-xs font-bold transition text-center flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={13} />
                        <span>Reschedule</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelVisit(visit.id, visit.propertyName)}
                        className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition text-center"
                      >
                        Cancel
                      </button>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          visit.location
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-[#092F24] hover:bg-[#147D4A] text-white text-xs font-bold transition text-center flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Navigation size={13} />
                        <span>Get Directions</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHEDULE / RESCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E5EBE7] shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-start justify-between border-b border-[#E5EBE7] pb-3.5">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#092F24]">
                  {selectedVisitForReschedule ? 'Reschedule Site Visit' : 'Schedule a New Site Visit'}
                </h3>
                <p className="text-xs text-[#66736D] mt-0.5">
                  Coordinate date and time with the verified plot owner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmScheduleOrReschedule} className="space-y-4">
              {!selectedVisitForReschedule && (
                <div>
                  <label className="block text-xs font-bold text-[#15251F] uppercase tracking-wider mb-1">
                    Select Land Parcel:
                  </label>
                  <select
                    value={newVisitListingId}
                    onChange={(e) => setNewVisitListingId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#092F24] bg-white"
                  >
                    {listings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.village}, {l.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 1: Inspection Date Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#15251F] uppercase tracking-wider">
                    Select Inspection Date:
                  </label>
                  <span className="text-[11px] font-bold text-[#147D4A] flex items-center gap-1">
                    <Calendar size={13} />
                    <span>{formatFriendlyDate(newVisitDate)}</span>
                  </span>
                </div>

                {/* Quick Date Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getQuickDatePresets().map((preset) => {
                    const isSelected = newVisitDate === preset.dateStr;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setNewVisitDate(preset.dateStr)}
                        className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#092F24] text-white border-[#092F24] shadow-xs'
                            : 'bg-white hover:bg-emerald-50/60 text-[#15251F] border-[#CBD5E1]'
                        }`}
                      >
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-300' : 'text-[#092F24]'}`}>
                          {preset.label}
                        </span>
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          {preset.subtext}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Native Date Picker */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500">
                    Or choose specific date from calendar:
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newVisitDate}
                    onChange={(e) => setNewVisitDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#092F24] bg-white focus:outline-none focus:ring-2 focus:ring-[#147D4A]"
                  />
                </div>
              </div>

              {/* Step 2: Preferred Time Slot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#15251F] uppercase tracking-wider">
                    Preferred Time Slot:
                  </label>
                  <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                    <Clock size={13} />
                    <span>{formatFriendlyTime(newVisitTime)}</span>
                  </span>
                </div>

                {/* Popular Time Slots */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_TIME_SLOTS.map((slot) => {
                    const isSelected = newVisitTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setNewVisitTime(slot.time)}
                        className={`p-2 rounded-xl text-center border transition ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold'
                            : 'bg-white hover:bg-amber-50/60 text-[#15251F] border-[#CBD5E1]'
                        }`}
                      >
                        <span className="text-xs font-bold block">{slot.label}</span>
                        <span className={`text-[9px] block ${isSelected ? 'text-amber-100' : 'text-gray-500'}`}>
                          {slot.period}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500">
                    Or set custom time:
                  </label>
                  <input
                    type="time"
                    required
                    value={newVisitTime}
                    onChange={(e) => setNewVisitTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#092F24] bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Live Preview Pill */}
              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#147D4A] shrink-0" />
                  <span className="text-[#092F24] font-medium">Selected Schedule:</span>
                </div>
                <div className="font-bold text-[#092F24] flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 shadow-2xs">
                    📅 {formatFriendlyDate(newVisitDate)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 shadow-2xs">
                    ⏰ {formatFriendlyTime(newVisitTime)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#15251F] uppercase tracking-wider mb-1.5">
                  Inspection Mode:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewVisitType('Physical Meeting')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      newVisitType === 'Physical Meeting'
                        ? 'bg-[#092F24] text-white border-[#092F24]'
                        : 'bg-white text-[#15251F] border-[#CBD5E1]'
                    }`}
                  >
                    📍 Physical Ground Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVisitType('360° Virtual Tour')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      newVisitType === '360° Virtual Tour'
                        ? 'bg-[#092F24] text-white border-[#092F24]'
                        : 'bg-white text-[#15251F] border-[#CBD5E1]'
                    }`}
                  >
                    🌐 360° Virtual Walkthrough
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5EBE7]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#66736D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#147D4A] hover:bg-[#103D30] text-white text-xs font-bold transition shadow-sm"
                >
                  {selectedVisitForReschedule ? 'Confirm Reschedule' : 'Submit Visit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
