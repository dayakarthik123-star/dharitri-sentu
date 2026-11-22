import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../app/AppContext';
import { MessageSquare, Calendar, Check, Clock, Paperclip, Send, User, MapPin, Sparkles, RotateCcw } from 'lucide-react';
import {
  parseVisitDateTime,
  getQuickDatePresets,
  POPULAR_TIME_SLOTS,
  formatFriendlyDate,
  formatFriendlyTime,
} from '../../utils/visitDateUtils';

interface InquiryMessage {
  id: string;
  sender: 'buyer' | 'seller';
  senderName: string;
  timestamp: string;
  text: string;
  attachment?: string;
}

interface SiteVisit {
  id: string;
  buyerName: string;
  buyerPhone: string;
  property: string;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Pending Confirmation' | 'Rescheduled';
  visitType: 'Physical On-Site Visit' | 'Guided Virtual Tour';
  notes: string;
}

export const BuyerInquiriesVisitsPage: React.FC = () => {
  const {
    currentUser,
    enquiries,
    sendEnquiryMessage,
    siteVisits,
    updateSiteVisitStatus,
    rescheduleSiteVisit,
    refreshServerState,
    showToast,
    t,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'inquiries' | 'visits'>('inquiries');
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [rescheduleTime, setRescheduleTime] = useState<string>('11:00');

  // Live polling for incoming buyer messages
  useEffect(() => {
    const timer = setInterval(() => {
      refreshServerState().catch(() => {});
    }, 2000);
    return () => clearInterval(timer);
  }, [refreshServerState]);

  const fallbackEnquiry = {
    id: 'ENQ-001',
    listingId: 'lst-1',
    parcelId: 'AS-KMP-001',
    listingTitle: 'Changsari 2.5 Bigha Highway-Facing Plot',
    buyerEmail: 'ananya@dharitrisentu.in',
    buyerName: 'Ananya Baruah',
    sellerEmail: 'pranabjyoti@dharitrisentu.in',
    subject: 'Boundary variance on southern bund (0.15 Bigha)',
    message: 'Hello Pranabjyoti-da, I noticed in the due-diligence report that there is a 0.15 Bigha boundary variance on the southern drain bund against the synthetic Jamabandi. Could you please clarify if a fresh survey sketch has been ordered?',
    status: 'Sent' as const,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    replies: [],
  };

  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>('ENQ-001');

  const activeUser = currentUser || {
    id: 'usr-seller-1',
    name: 'Pranabjyoti Kalita',
    email: 'pranabjyoti@dharitrisentu.in',
    role: 'seller' as const,
    district: 'Kamrup',
  };
  const currentUserId = activeUser.id;

  const targetEnquiry = enquiries.find((e) => e.id === selectedEnquiryId) || enquiries[0] || fallbackEnquiry;

  // Dynamic message thread synchronized from shared global state
  const messages = useMemo(() => {
    const list: (InquiryMessage & { senderId?: string })[] = [];
    if (targetEnquiry.message) {
      list.push({
        id: `msg-${targetEnquiry.id}-orig`,
        senderId: 'usr-buyer-1',
        sender: 'buyer' as const,
        senderName: targetEnquiry.buyerName || 'Ananya Baruah',
        timestamp: targetEnquiry.createdAt
          ? new Date(targetEnquiry.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Recent',
        text: targetEnquiry.message,
      });
    }
    for (let idx = 0; idx < (targetEnquiry.replies || []).length; idx++) {
      const r = targetEnquiry.replies[idx];
      const text = r.message?.trim() || '';
      if (!text) continue;
      // Canonical role priority: inspect senderRole and senderId first
      const isSeller = r.senderRole
        ? r.senderRole === 'seller'
        : (
          r.senderId === 'usr-seller-1' ||
          r.senderId === 'usr-seller-2' ||
          (currentUser?.role === 'seller' && r.senderId === currentUser.id) ||
          (!text.toLowerCase().includes('i am interested') &&
           !text.toLowerCase().includes('hello pranabjyoti') &&
           !text.toLowerCase().includes('hello monideepa'))
        );
      const senderRole = isSeller ? 'seller' : 'buyer';

      // Deduplicate twin messages from same sender
      const msgTimeMs = r.timestamp ? new Date(r.timestamp).getTime() : 0;
      const isDuplicate = list.some(
        (m) =>
          m.id === r.id ||
          (m.text?.trim() === text && m.sender === senderRole) ||
          (m.text?.trim() === text && msgTimeMs > 0 && Math.abs(msgTimeMs - (m as any).rawTimestampMs) < 15000)
      );
      if (isDuplicate) continue;

      list.push({
        id: r.id || `msg-${targetEnquiry.id}-rep-${idx}`,
        senderId: isSeller ? (currentUser?.id || 'usr-seller-1') : 'usr-buyer-1',
        sender: senderRole,
        senderName: isSeller ? 'You' : (targetEnquiry.buyerName || 'Ananya Baruah'),
        timestamp: r.timestamp
          ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Recent',
        rawTimestampMs: msgTimeMs,
        text: r.message,
      } as any);
    }
    return list;
  }, [targetEnquiry, currentUser]);

  const [replyInput, setReplyInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [selectedEnquiryId, messages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    sendEnquiryMessage(targetEnquiry.id, replyInput.trim(), 'seller', currentUserId);
    setReplyInput('');
  };

  const handleConfirmVisit = (visitId: string) => {
    updateSiteVisitStatus(visitId, 'Confirmed by Seller');
  };

  const handleOpenRescheduleModal = (visit: any) => {
    setSelectedVisitForReschedule(visit);
    const parsed = parseVisitDateTime(visit.dateTime);
    setRescheduleDate(parsed.isoDate);
    setRescheduleTime(parsed.isoTime);
    setIsRescheduleModalOpen(true);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitForReschedule) return;
    const friendlyDate = formatFriendlyDate(rescheduleDate);
    const friendlyTime = formatFriendlyTime(rescheduleTime);
    const formatted = `${friendlyDate} at ${friendlyTime}`;
    rescheduleSiteVisit(selectedVisitForReschedule.id, formatted);
    setIsRescheduleModalOpen(false);
    setSelectedVisitForReschedule(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span>Seller Workspace</span>
            <span>&gt;</span>
            <span className="text-[#15803D] font-bold">Buyer Inquiries &amp; Visits</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            Buyer Inquiries &amp; Site Visits
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Communicate directly with verified prospective buyers, answer boundary queries, and manage on-site and virtual visits.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-[#F8FAF7] p-1.5 rounded-2xl border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'bg-[#0D261C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare size={14} />
            <span>Inquiries &amp; Questions (1 Active)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'visits'
                ? 'bg-[#0D261C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar size={14} />
            <span>Scheduled Visits ({siteVisits.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INQUIRIES & QUESTIONS */}
      {activeTab === 'inquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inquiry List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
              Active Inquiries ({enquiries.length})
            </div>

            {enquiries.map((enq) => {
              const isSelected = enq.id === targetEnquiry.id;
              const latestMsg = (enq.replies && enq.replies.length > 0)
                ? enq.replies[enq.replies.length - 1].message
                : enq.message;
              const buyerName = enq.buyerName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Ananya Baruah';

              return (
                <div
                  key={enq.id}
                  onClick={() => setSelectedEnquiryId(enq.id)}
                  className={`p-4 rounded-2xl bg-white shadow-xs space-y-2 cursor-pointer transition ${
                    isSelected ? 'border-2 border-[#15803D] bg-emerald-50/30' : 'border border-[#E2E8F0] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0D261C]">{buyerName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {enq.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">
                    {enq.listingTitle || 'Assam Land Parcel'}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    &ldquo;{latestMsg}&rdquo;
                  </p>
                  <div className="text-[10px] text-gray-400 pt-1 flex justify-between">
                    <span>Verified KYC Buyer</span>
                    <span>{enq.replies?.length ? `${enq.replies.length} replies` : 'New inquiry'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Chat Conversation (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-[560px]">
            {/* Conversation Header */}
            <div className="p-4 bg-[#F8FAF7] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm">
                  {(targetEnquiry.buyerName || 'A').slice(0, 1)}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0D261C] flex items-center gap-2">
                    <span>{targetEnquiry.buyerName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Ananya Baruah'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                      Verified KYC Buyer
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Inquiry on: <strong>{targetEnquiry.listingTitle || 'Land Parcel'} (Dag #{targetEnquiry.parcelId || 'AS-KMP-001'})</strong>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Direct Buyer Thread
                </span>
              </div>
            </div>

            {/* Messages Body - Authentic WhatsApp Design */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-2 bg-[#EFEAE2]/70 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]"
            >
              {/* WhatsApp Date Separator */}
              <div className="flex justify-center my-2">
                <span className="bg-white/90 backdrop-blur-xs text-[#54656F] text-[11px] font-semibold px-3 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wide border border-slate-200/60 select-none">
                  {t('Today')}
                </span>
              </div>

              {messages.map((msg: InquiryMessage & { senderId?: string; senderRole?: string }) => {
                const isMe = msg.sender === 'seller' || msg.senderRole === 'seller';
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
                      {/* Incoming message sender name and badge */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-100">
                          <span className="text-xs font-bold text-[#0D261C]">
                            {targetEnquiry.buyerName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Ananya Baruah'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            • {t('Verified Buyer')}
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

            {/* WhatsApp Style Reply Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#F0F2F5] border-t border-[#E2E8F0] flex items-center gap-2">
              <button
                type="button"
                onClick={() => showToast('Attachment dialog opened. You can attach PDFs or trace maps.')}
                className="p-2.5 rounded-full bg-white text-gray-500 hover:text-gray-800 transition shadow-2xs hover:bg-slate-50 cursor-pointer"
                title={t('Attach Document or Trace Map')}
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                placeholder={t('Write an inquiry response or boundary update...')}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] shadow-2xs"
              />

              <button
                type="submit"
                disabled={!replyInput.trim()}
                className="p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-[#008069] hover:bg-[#006A57] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title={t('Send Reply')}
              >
                <Send size={16} />
                <span className="hidden sm:inline">{t('Send Reply')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULED SITE VISITS */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {siteVisits.map((visit) => {
              const isConfirmed = visit.status === 'Confirmed' || visit.status === 'Confirmed by Seller';
              const isCancelled = visit.status === 'Cancelled';

              return (
                <div
                  key={visit.id}
                  className={`rounded-3xl border p-5 space-y-4 shadow-sm flex flex-col justify-between transition ${
                    isCancelled
                      ? 'opacity-60 bg-slate-50/80 border-slate-200'
                      : 'bg-white border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#15803D] border border-emerald-200">
                        {visit.visitType}
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isConfirmed
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}
                      >
                        ✓ {visit.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-base font-bold text-[#0D261C]">
                        {visit.buyerName}
                      </h3>
                      <div className="text-xs text-gray-500 mt-0.5">{visit.buyerPhone}</div>
                    </div>

                    {/* Prominent Inspection Date & Time Badges */}
                    {(() => {
                      const parsed = parseVisitDateTime(visit.dateTime);
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 rounded-xl border border-emerald-200/80">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#0D261C] text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Calendar size={13} className="text-emerald-400" />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">
                                Inspection Date
                              </span>
                              <strong className="text-xs font-bold text-[#0D261C]">
                                {parsed.displayDate}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Clock size={13} />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wider block">
                                Time Slot
                              </span>
                              <strong className="text-xs font-bold text-[#0D261C]">
                                {parsed.displayTime}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="p-2.5 bg-[#F8FAF7] rounded-xl border border-[#E2E8F0] space-y-1 text-xs">
                      <div><strong>{t('Property')}:</strong> {visit.propertyName}</div>
                      <div><strong>{t('Meeting Point')}:</strong> {visit.meetingPoint || 'On Plot Frontage'}</div>
                    </div>

                    <p className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-xl italic">
                      &ldquo;{visit.notes}&rdquo;
                    </p>
                  </div>

                  {!isCancelled && (
                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenRescheduleModal(visit)}
                        className="py-1.5 px-3 rounded-xl border border-[#E2E8F0] text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <RotateCcw size={13} />
                        <span>{t('Reschedule')}</span>
                      </button>

                      {!isConfirmed ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmVisit(visit.id)}
                          className="py-1.5 px-3 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white text-xs font-bold transition shadow-xs"
                        >
                          {t('Confirm Visit')}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-[#166534] flex items-center gap-1">
                          ✓ {t('Confirmed')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SELLER RESCHEDULE MODAL */}
      {isRescheduleModalOpen && selectedVisitForReschedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3.5">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#0D261C]">
                  Reschedule Site Inspection
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Propose a new inspection date and time slot for {selectedVisitForReschedule.buyerName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div className="p-3 bg-[#F8FAF7] rounded-2xl border border-[#E2E8F0] text-xs space-y-0.5">
                <div className="font-bold text-[#0D261C]">
                  {selectedVisitForReschedule.propertyName}
                </div>
                <div className="text-gray-500 text-[11px]">
                  Buyer: <strong>{selectedVisitForReschedule.buyerName}</strong> ({selectedVisitForReschedule.buyerPhone})
                </div>
              </div>

              {/* Step 1: Inspection Date Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0D261C] uppercase tracking-wider">
                    Select New Date:
                  </label>
                  <span className="text-[11px] font-bold text-[#15803D] flex items-center gap-1">
                    <Calendar size={13} />
                    <span>{formatFriendlyDate(rescheduleDate)}</span>
                  </span>
                </div>

                {/* Quick Date Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getQuickDatePresets().map((preset) => {
                    const isSelected = rescheduleDate === preset.dateStr;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setRescheduleDate(preset.dateStr)}
                        className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#0D261C] text-white border-[#0D261C] shadow-xs'
                            : 'bg-white hover:bg-emerald-50/60 text-gray-800 border-[#CBD5E1]'
                        }`}
                      >
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-300' : 'text-[#0D261C]'}`}>
                          {preset.label}
                        </span>
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          {preset.subtext}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500">
                    Or select exact date from calendar:
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0D261C] bg-white focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>
              </div>

              {/* Step 2: Preferred Time Slot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0D261C] uppercase tracking-wider">
                    Select Time Slot:
                  </label>
                  <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                    <Clock size={13} />
                    <span>{formatFriendlyTime(rescheduleTime)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_TIME_SLOTS.map((slot) => {
                    const isSelected = rescheduleTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setRescheduleTime(slot.time)}
                        className={`p-2 rounded-xl text-center border transition ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold'
                            : 'bg-white hover:bg-amber-50/60 text-gray-800 border-[#CBD5E1]'
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
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0D261C] bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Live Preview Pill */}
              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#15803D] shrink-0" />
                  <span className="text-[#0D261C] font-medium">New Proposed Schedule:</span>
                </div>
                <div className="font-bold text-[#0D261C] flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 shadow-2xs">
                    📅 {formatFriendlyDate(rescheduleDate)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 shadow-2xs">
                    ⏰ {formatFriendlyTime(rescheduleTime)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white text-xs font-bold transition shadow-sm"
                >
                  Save Rescheduled Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
