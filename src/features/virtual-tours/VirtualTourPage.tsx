import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';

export const VirtualTourPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { listings } = useApp();

  const listing = listings.find((l) => l.id === id || l.parcelId === id) || listings[0];
  const [slideIdx, setSlideIdx] = useState(0);
  const [panoOffset, setPanoOffset] = useState(50);
  const [fullscreenModal, setFullscreenModal] = useState(false);

  const mediaList = listing?.media || [];
  const currentMedia = mediaList[slideIdx] || mediaList[0];

  const nextSlide = () => setSlideIdx((i) => (i + 1) % mediaList.length);
  const prevSlide = () => setSlideIdx((i) => (i - 1 + mediaList.length) % mediaList.length);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') setFullscreenModal(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mediaList.length]);

  if (!listing) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teagreen">
            Interactive 360° Land Tour & Gallery
          </span>
          <h1 className="font-serif text-3xl font-bold text-evergreen">
            Virtual Tour — {listing.title} ({listing.parcelId})
          </h1>
          <p className="text-xs text-secondarytext mt-1">
            Use Previous/Next buttons, keyboard arrow keys (← / →), or the 360° horizon slider.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Select Listing for Virtual Tour"
            value={listing.id}
            onChange={(e) => {
              setSlideIdx(0);
              navigate(`/virtual-tour/${e.target.value}`);
            }}
            className="px-3 py-2 rounded-xl bg-warmivory border border-earthaccent/30 text-xs font-semibold"
          >
            {listings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.parcelId} — {item.title}
              </option>
            ))}
          </select>
          <Link
            to={`/land/${listing.id}`}
            className="px-3.5 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-semibold"
          >
            Exit to Listing ✕
          </Link>
        </div>
      </div>

      {/* Mandatory Media Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
        📷 <strong>Demo Media Notice:</strong> All photographs and simulated 360° views are illustrative demonstration assets. Visual media does <strong>not</strong> verify legal ownership, surveyed boundaries, right-of-way access, or soil/flood safety.
      </div>

      {/* Main Panorama / Gallery Stage */}
      <div className="bg-warmivory rounded-3xl border border-cream p-5 shadow-sm space-y-4">
        <div className="relative h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-evergreen border border-cream">
          <img
            src={currentMedia?.url || '/assets/tea-garden-bg.jpg'}
            alt={currentMedia?.caption}
            className="w-full h-full object-cover transition-all duration-300"
            style={{
              objectPosition: `${panoOffset}% center`,
              transform: currentMedia?.type === 'panorama360' ? 'scale(1.18)' : 'scale(1)',
            }}
          />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-evergreen/90 text-warmivory text-xs font-semibold shadow">
              {currentMedia?.sourceLabel || 'Demo Media'}
            </span>
            <span className="px-3 py-1 rounded-full bg-warmivory/90 text-evergreen text-xs font-bold shadow">
              360° Interactive Horizon
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFullscreenModal(true)}
            className="absolute top-3 right-3 px-3.5 py-1.5 rounded-xl bg-warmivory/95 text-evergreen text-xs font-bold shadow hover:bg-cream"
          >
            ⛶ Fullscreen View
          </button>

          {/* Previous / Next Controls */}
          <button
            type="button"
            aria-label="Previous Image"
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-warmivory/90 hover:bg-warmivory text-evergreen font-bold shadow-md"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next Image"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-warmivory/90 hover:bg-warmivory text-evergreen font-bold shadow-md"
          >
            ›
          </button>

          <div className="absolute bottom-3 inset-x-4 bg-evergreen/85 backdrop-blur-sm text-warmivory p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span>{currentMedia?.caption}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-mistyblue">Pan 360°:</span>
              <input
                type="range"
                aria-label="Pan 360 Horizon"
                min={0}
                max={100}
                value={panoOffset}
                onChange={(e) => setPanoOffset(Number(e.target.value))}
                className="w-28 soft-slider"
              />
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {mediaList.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSlideIdx(idx)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                idx === slideIdx
                  ? 'border-evergreen bg-palesky/70'
                  : 'border-cream bg-warmivory opacity-75 hover:opacity-100'
              }`}
            >
              <img src={m.url} alt={m.caption} className="w-16 h-12 rounded-lg object-cover" />
              <div className="text-xs pr-2">
                <div className="font-semibold text-maintext">View {idx + 1}</div>
                <div className="text-[10px] text-secondarytext">{m.type}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenModal && (
        <div
          role="dialog"
          aria-label="Fullscreen Virtual Tour Modal"
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-warmivory mb-3">
            <span className="text-sm font-semibold">
              {listing.parcelId} — {currentMedia?.caption} (Demo Media)
            </span>
            <button
              type="button"
              onClick={() => setFullscreenModal(false)}
              className="px-4 py-1.5 rounded-xl bg-warmivory text-evergreen text-xs font-bold"
            >
              Close Fullscreen (Esc) ✕
            </button>
          </div>
          <img
            src={currentMedia?.url}
            alt={currentMedia?.caption}
            className="max-h-[78vh] w-auto rounded-2xl object-contain border border-warmivory/20"
          />
        </div>
      )}
    </div>
  );
};
