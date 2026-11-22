import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { API_MODE, apiRequest } from '../services/apiClient';
import {
  buildStructuredAssistantTurn,
  ChatTurn,
} from '../features/voice-assistant/VoiceAssistantPage';

const FormattedChatMessage: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split('\n\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed text-maintext">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              const isItem = /^\s*(\d+[\.\)]|\•|\-|\👉|\💡|\📌|📍)\s+/.test(trimmed);
              const parts = line.split(/(\*\*[^*]+\*\*)/g);

              return (
                <div
                  key={lIdx}
                  className={`${
                    isItem
                      ? 'pl-2.5 py-1 border-l-2 border-emerald-500/50 bg-[#F4F1EA] rounded-r-lg my-1'
                      : ''
                  } leading-relaxed`}
                >
                  {parts.map((part, partIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <strong key={partIdx} className="font-bold text-evergreen">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return <span key={partIdx}>{part}</span>;
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const AskDharitriChatbot: React.FC = () => {
  const { language, currentUser, t } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>(() => [
    {
      id: 'welcome-floating-1',
      sender: 'assistant',
      detectedLangLabel:
        language === 'as'
          ? 'অসমীয়া (Assamese)'
          : language === 'hi'
          ? 'हिन्दी (Hindi)'
          : 'English',
      title: 'Ask Dharitri — Assam Land & Legal Assistant',
      summary:
        'Namaskar! Ask me about any land listing, Dag/Patta rules, LandLocker verification stages, Chapter X Tribal Belt rules, Bigha-to-Acre conversion, or how to use the current page.',
      bullets: [
        {
          icon: 'check',
          label: 'Contextual & Multilingual',
          detail: 'Ask in English, Assamese (অসমীয়া), or Hindi (हिन्दी).',
        },
        {
          icon: 'info',
          label: 'Evidence-Driven Guidance',
          detail: 'Clearly distinguishes seller-submitted claims from reference survey records.',
        },
      ],
      citations: ['Dharitree Assam RoR', 'ALRR 1886', 'Mission Basundhara 3.0'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, isOpen, isLoading]);

  const getPageContextHint = (): string => {
    const p = location.pathname;
    if (p.startsWith('/landlocker')) return 'LandLocker Document Workspace';
    if (p.startsWith('/explore')) return 'Interactive Satellite & Parcel Explorer';
    if (p.startsWith('/dashboard/buyer')) return 'Buyer Dashboard';
    if (p.startsWith('/dashboard/seller')) return 'Seller Dashboard';
    if (p.startsWith('/sell/new')) return 'Seller Listing & 15-Photo Submission';
    if (p.startsWith('/passport')) return 'Land Trust Passport';
    if (p.startsWith('/discrepancies')) return 'Discrepancy Engine';
    if (p.startsWith('/cases') || p.startsWith('/due-diligence')) return '9-Step Due-Diligence Tracker';
    return 'Public Homepage';
  };

  const handleSend = (customQuery?: string) => {
    const q = (customQuery ?? input).trim();
    if (!q) return;

    setErrorState(null);
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      sender: 'user',
      detectedLangLabel: language.toUpperCase(),
      summary: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTurns((prev) => [...prev, userTurn]);
    if (!customQuery) setInput('');
    setIsLoading(true);

    // Connected mode uses the server-side intelligent Assam land engine.
    if (API_MODE) {
      apiRequest<{ answer: string; sourceStatus?: string; language?: string }>('/api/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ message: q, language, context: getPageContextHint() }),
      }).then((response) => {
        const assistantTurn: ChatTurn = {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          detectedLangLabel: language === 'as' ? 'অসমীয়া (Assamese)' : language === 'hi' ? 'हिन्दी (Hindi)' : 'English',
          title: 'Ask Dharitri · Assam Land Intelligence',
          summary: response.answer,
          bullets: [{ icon: 'info', label: 'Land Intelligence Guidance', detail: response.sourceStatus || 'Verified platform catalog and Assam Revenue records.' }],
          citations: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setTurns((prev) => [...prev, assistantTurn]);
      }).catch((error) => {
        setErrorState(error instanceof Error ? error.message : 'Ask Dharitri Land Intelligence is temporarily unavailable.');
      }).finally(() => setIsLoading(false));
      return;
    }

    setTimeout(() => {
      try {
        const lower = q.toLowerCase();
        // Enforce role-based restriction: Sellers cannot query future land-value projections
        if (
          currentUser?.role === 'seller' &&
          /\b(projection|forecast|future value|10-year|10 year|appreciation|growth rate)\b/.test(lower)
        ) {
          const restrictedTurn: ChatTurn = {
            id: `a-${Date.now()}`,
            sender: 'assistant',
            detectedLangLabel:
              language === 'as'
                ? 'অসমীয়া (Assamese)'
                : language === 'hi'
                ? 'हिन्दी (Hindi)'
                : 'English',
            title: t('sellerValuationBlockedTitle'),
            summary: t('sellerValuationBlockedDesc'),
            bullets: [
              {
                icon: 'warn',
                label: 'Role-Based Access Policy',
                detail:
                  'Future land-value projections and appreciation scenarios are available only to Buyer accounts.',
              },
              {
                icon: 'check',
                label: 'Seller Asking Price Control',
                detail:
                  'You can set and update your parcel asking price directly in your Seller Dashboard.',
              },
            ],
            citations: ['Dharitri Sentu Role-Based Access Control'],
            actions: [{ label: 'Open Seller Dashboard', to: '/dashboard/seller', primary: true }],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setTurns((prev) => [...prev, restrictedTurn]);
          setIsLoading(false);
          return;
        }

        const structured = buildStructuredAssistantTurn(q, language);
        const assistantTurn: ChatTurn = {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          ...structured,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setTurns((prev) => [...prev, assistantTurn]);
      } catch {
        setErrorState(
          'Ask Dharitri is temporarily unable to process this request. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    }, 180);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Ask Dharitri AI Assistant"
          className="mb-3 w-[350px] sm:w-[410px] max-h-[560px] bg-white rounded-3xl border-2 border-evergreen shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-evergreen text-warmivory px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-leafgreen/30 border border-warmivory/30 flex items-center justify-center text-base">
                🤖
              </span>
              <div>
                <div className="font-serif font-bold text-sm leading-tight">
                  {t('askDharitri')}
                </div>
                <div className="text-[10px] text-warmivory/80">
                  {getPageContextHint()} · {currentUser ? `Role: ${currentUser.role.toUpperCase()}` : 'Guest'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/assistant');
                }}
                title="Open Fullscreen Assistant"
                className="px-2 py-1 rounded-lg bg-teagreen text-warmivory text-[10px] font-bold hover:bg-leafgreen transition"
              >
                Full View ⤢
              </button>
              <button
                type="button"
                aria-label="Close Ask Dharitri Chat"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-warmivory flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="bg-warmivory px-3 py-2 border-b border-cream flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {[
              { label: 'Dag 412 Check', q: 'Analyze Parcel AS-KMP-001 (Dag 412)' },
              { label: 'Eksona vs Miyadi', q: 'Difference between Eksona and Miyadi Patta' },
              { label: '2.5 Bigha in Acre', q: 'Convert 2.5 Bigha to Katha, Lessa and Acre' },
              { label: 'অসমীয়া সহায়', q: 'কামৰূপৰ চাংসাৰিত দাগ ৪১২ ৰ মাটি কেনেকৈ কিনিম?' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSend(chip.q)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-cream text-evergreen border border-[#CFC5B0] font-semibold whitespace-nowrap transition"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Conversation History */}
          <div
            ref={scrollRef}
            className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-warmivory/50 max-h-[340px]"
          >
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`flex flex-col ${
                  turn.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl p-3 text-xs space-y-2 shadow-sm ${
                    turn.sender === 'user'
                      ? 'bg-evergreen text-warmivory rounded-br-none'
                      : 'bg-white text-maintext border border-[#DFD6C3] rounded-bl-none'
                  }`}
                >
                  {turn.title && (
                    <div className="font-serif font-bold text-evergreen text-xs border-b border-cream pb-1">
                      {turn.title}
                    </div>
                  )}
                  {turn.sender === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{turn.summary}</p>
                  ) : (
                    <FormattedChatMessage text={turn.summary} />
                  )}

                  {turn.bullets && turn.bullets.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {turn.bullets.map((b, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-warmivory border border-cream text-[11px]"
                        >
                          <div className="font-bold text-evergreen">
                            {b.icon === 'warn' ? '⚠️ ' : b.icon === 'check' ? '✅ ' : 'ℹ️ '}
                            {b.label}
                          </div>
                          <div className="text-secondarytext mt-0.5">{b.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {turn.citations && turn.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {turn.citations.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded bg-palesky text-evergreen font-semibold text-[10px]"
                        >
                          📚 {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {turn.actions && turn.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {turn.actions.map((act) => (
                        <button
                          key={act.label}
                          type="button"
                          onClick={() => navigate(act.to)}
                          className="px-2.5 py-1 rounded-lg bg-evergreen text-warmivory text-[10px] font-bold hover:bg-teagreen transition"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-secondarytext mt-0.5 px-1">
                  {turn.detectedLangLabel} · {turn.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="p-3 rounded-2xl bg-white border border-cream text-xs text-secondarytext font-medium flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>{t('askDharitriLoading')}</span>
              </div>
            )}

            {errorState && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-semibold"
              >
                ⚠️ {errorState}
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-cream flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('askDharitriPlaceholder')}
              aria-label="Ask Dharitri message input"
              className="flex-1 px-3 py-2 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-xs text-maintext focus:outline-none focus:ring-2 focus:ring-evergreen"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory text-xs font-bold transition shadow-sm"
            >
              {t('askDharitriSend')}
            </button>
          </form>
        </div>
      )}

      {/* Persistent Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Ask Dharitri AI Assistant"
        className="px-4 py-3 rounded-full bg-evergreen hover:bg-teagreen text-warmivory text-xs sm:text-sm font-bold shadow-2xl border-2 border-leafgreen/60 flex items-center gap-2 transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-leafgreen/40"
      >
        <span className="text-base">💬</span>
        <span>{t('askDharitri')}</span>
      </button>
    </div>
  );
};
