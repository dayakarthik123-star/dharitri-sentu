import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AmbientLeaves } from './AmbientLeaves';
import { useApp } from '../app/AppContext';

export const CinematicIntro: React.FC = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      // Clear old legacy key that was permanently blocking the intro
      try {
        window.localStorage.removeItem('dharitri_sentu_intro_seen_v1');
      } catch {
        /* ignore */
      }

      // If ?intro is in the URL, always show
      if (window.location.search.includes('intro')) {
        return true;
      }
    }

    // Only show on root path '/'
    if (location.pathname !== '/') return false;

    // By default on homepage load, show the cinematic intro
    try {
      return window.sessionStorage.getItem('dharitri_intro_dismissed_session') !== '1';
    } catch {
      return true;
    }
  });

  // Intro animation stages:
  // 1. landscape: slow zoom and atmospheric mist
  // 2. wordmark: reveal of "DHARITRI SENTU" with gold accents
  // 3. tagline: graceful fade-in of "A Trusted Bridge to Assam's Land"
  // 4. ready: interactive actions active
  // 5. exiting: smooth transition into the application
  const [stage, setStage] = useState<'landscape' | 'wordmark' | 'tagline' | 'ready' | 'exiting'>('landscape');

  // Listen for replay events from Header or Hero actions
  useEffect(() => {
    const handleReplay = () => {
      setVisible(true);
      setStage('landscape');
      setTimeout(() => setStage('wordmark'), 250);
      setTimeout(() => setStage('tagline'), 800);
      setTimeout(() => setStage('ready'), 1400);
    };

    window.addEventListener('dharitri:replay-intro', handleReplay);
    return () => window.removeEventListener('dharitri:replay-intro', handleReplay);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setStage('ready');
      return;
    }

    const t1 = setTimeout(() => setStage('wordmark'), 300);
    const t2 = setTimeout(() => setStage('tagline'), 900);
    const t3 = setTimeout(() => setStage('ready'), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [visible]);

  // Lock body & html scroll completely so no scrollbar appears on the intro screen
  useEffect(() => {
    if (visible && stage !== 'exiting') {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevHtmlOverflow || '';
      };
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [visible, stage]);

  const handleEnterWebsite = (targetPath = '/') => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    setStage('exiting');
    try {
      window.sessionStorage.setItem('dharitri_intro_dismissed_session', '1');
      window.localStorage.removeItem('dharitri_sentu_intro_seen_v1');
    } catch {
      /* storage unavailable in private mode */
    }
    setTimeout(() => {
      setVisible(false);
      navigate(targetPath);
    }, 400);
  };

  const handleSkipIntro = () => {
    handleEnterWebsite('/');
  };

  // If not currently visible, render nothing
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dharitri Sentu Cinematic Assam Introduction"
      className={`fixed inset-0 z-[9999] w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-[#071F18] transition-opacity duration-700 ${
        stage === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* SCENE 1 — AUTHENTIC ASSAM LANDSCAPE (Tea gardens & Brahmaputra mist with slow zoom) */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out ${
          stage === 'landscape' ? 'scale-100' : 'scale-110'
        }`}
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(7, 31, 24, 0.42) 0%, rgba(7, 31, 24, 0.68) 50%, rgba(7, 31, 24, 0.94) 100%), url('/assets/tea-garden-bg.jpg')`,
        }}
      />

      {/* Atmospheric Mist & Assam Brahmaputra River Contour Silhouettes */}
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 w-full h-64 pointer-events-none opacity-40"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="#1C4535"
          fillOpacity="0.4"
          d="M0,192L80,186.7C160,181,320,171,480,181.3C640,192,800,224,960,218.7C1120,213,1280,171,1360,149.3L1440,128L1440,320L0,320Z"
        />
        <path
          fill="#0B2B21"
          fillOpacity="0.6"
          d="M0,256L96,240C192,224,384,192,576,197.3C768,203,960,245,1152,250.7C1344,256,1392,224,1440,208L1440,320L0,320Z"
        />
      </svg>

      {/* Subtle Cadastral Parcel Geometry Motif */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
      >
        <polygon
          points="140,80 320,60 350,220 160,240"
          stroke="#B8DDA0"
          strokeWidth="1.2"
          fill="none"
          strokeDasharray="4 4"
        />
        <polygon
          points="620,130 860,110 880,280 640,300"
          stroke="#B8DDA0"
          strokeWidth="1.2"
          fill="none"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Ambient Assam Tea Leaves Motion */}
      <AmbientLeaves inHeroOnly={true} count={10} />

      {/* Immediately Accessible Working "Skip Intro" Control */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSkipIntro}
          className="px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 text-[#E5EDE7] text-xs font-semibold backdrop-blur-md border border-white/20 transition focus:outline-none focus:ring-2 focus:ring-[#B8DDA0]"
        >
          {t('skipIntro')} →
        </button>
      </div>

      {/* Central Content Container */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl">
        {/* Institutional Emblem */}
        <div className="mb-4 w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-xl">
          <img src="/assets/logo.svg" alt="Dharitri Sentu Emblem" className="w-10 h-10 object-contain" />
        </div>

        {/* Institutional Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-[#B8DDA0]/30 text-[#D4EBC8] text-[11px] font-bold tracking-widest uppercase mb-4 backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B8DDA0] animate-pulse" />
          <span>Assam Land Intelligence & Verification</span>
        </div>

        {/* SCENE 2 — DHARITRI SENTU WORDMARK (Warm ivory with muted-gold accents) */}
        <div
          className={`transition-all duration-1000 transform ${
            stage === 'landscape'
              ? 'opacity-0 translate-y-4 scale-95'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-extrabold tracking-[0.24em] text-[#F8FAF7] uppercase select-none drop-shadow-lg">
            Dharitri Sentu
          </h1>

          {/* Restrained Muted-Gold Accent Divider */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="w-12 sm:w-20 h-[1.5px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
            <span className="text-[#C5A059] text-xs">✦</span>
            <span className="w-12 sm:w-20 h-[1.5px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
          </div>
        </div>

        {/* SCENE 3 — TAGLINE ("A Trusted Bridge to Assam's Land") */}
        <div
          className={`transition-all duration-800 delay-100 transform ${
            stage === 'landscape' || stage === 'wordmark'
              ? 'opacity-0 translate-y-3'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <p className="text-xl sm:text-2xl md:text-3xl font-serif italic text-[#F1EAD9] font-medium tracking-wide mt-4 drop-shadow">
            &ldquo;A Trusted Bridge to Assam&apos;s Land&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-[#A8C3AF] font-medium tracking-wider uppercase mt-2">
            অসম ভূমি তথ্য আৰু প্ৰামাণিক প্ৰৱেশদ্বাৰ · Land, Evidence &amp; Trust
          </p>
        </div>

        {/* SCENE 4 — TRANSITION ACTIONS (Enter platform or quick authentication links) */}
        <div
          className={`mt-9 flex flex-col items-center gap-4 transition-all duration-700 ${
            stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={() => handleEnterWebsite('/')}
            className="px-9 py-4 rounded-2xl bg-[#B8DDA0] hover:bg-[#CEE8C0] text-[#0A241B] text-sm sm:text-base font-bold shadow-2xl transition transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-[#B8DDA0]/40 border border-[#A2CD85]"
          >
            Enter Dharitri Sentu →
          </button>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#E5EDE7] bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/15 shadow-sm">
            <button
              type="button"
              onClick={() => handleEnterWebsite('/login')}
              className="hover:underline hover:text-[#B8DDA0] transition"
            >
              🔑 {t('navLogin')}
            </button>
            <span className="text-white/40">·</span>
            <button
              type="button"
              onClick={() => handleEnterWebsite('/signup')}
              className="hover:underline hover:text-[#B8DDA0] transition"
            >
              📝 {t('navSignUp')}
            </button>
            <span className="text-white/40">·</span>
            <button
              type="button"
              onClick={() => handleEnterWebsite('/official/login')}
              className="hover:underline text-[#F3D086] transition"
            >
              🏛️ Official Reviewer Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
