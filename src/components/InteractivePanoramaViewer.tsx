import React, { useState, useRef } from 'react';
import { Compass, RotateCw, MapPin, Eye, Maximize2, ShieldCheck } from 'lucide-react';

interface InteractivePanoramaViewerProps {
  title?: string;
  roadWidth?: string;
  coverImage?: string;
}

export const InteractivePanoramaViewer: React.FC<InteractivePanoramaViewerProps> = ({
  title = 'Changsari 2.5 Bigha Plot',
  roadWidth = '18ft Blacktop Approach Road',
  coverImage = '/assets/parcel-agricultural.jpg',
}) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    setRotation((prev) => (prev + delta * 0.4) % 360);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const delta = e.touches[0].clientX - startX;
    setRotation((prev) => (prev + delta * 0.4) % 360);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-[#092F24] select-none border border-[#E5EBE7]">
      {/* 360 Draggable Viewport Canvas */}
      <div
        className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Parallax Background Strip */}
        <div
          className="absolute inset-0 w-[240%] h-full flex transition-transform duration-75"
          style={{
            transform: `translateX(-${(rotation + 360) % 100}%)`,
            backgroundImage: `url(${coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'contrast(1.05) saturate(1.1)',
          }}
        >
          {/* Subtle 360 Cylindrical Lighting Gradient */}
          <div className="w-full h-full bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        </div>

        {/* Interactive Hotspot Pins on the 360 View */}
        <div
          className="absolute top-1/2 left-[30%] -translate-y-1/2 cursor-pointer z-20 group"
          onClick={() => setActiveHotspot('road')}
        >
          <div className="w-9 h-9 rounded-full bg-[#147D4A] text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
            🛣️
          </div>
          <div className="absolute top-11 -left-12 px-3 py-1.5 rounded-xl bg-[#092F24]/90 text-white text-[11px] font-bold whitespace-nowrap shadow-xl border border-white/20 backdrop-blur-md">
            {roadWidth}
          </div>
        </div>

        <div
          className="absolute top-[42%] left-[65%] -translate-y-1/2 cursor-pointer z-20 group"
          onClick={() => setActiveHotspot('pillar')}
        >
          <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
            📍
          </div>
          <div className="absolute top-11 -left-14 px-3 py-1.5 rounded-xl bg-[#092F24]/90 text-white text-[11px] font-bold whitespace-nowrap shadow-xl border border-white/20 backdrop-blur-md">
            Concrete Boundary Pillar #4
          </div>
        </div>

        {/* Compass & Rotation HUD Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#092F24]/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-white text-xs font-bold shadow-md">
          <Compass size={14} className="text-[#35A66B] animate-spin" style={{ animationDuration: '10s' }} />
          <span>Interactive 360° Ground Inspection</span>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] font-medium border border-white/10">
          <RotateCw size={12} className="text-[#B5E4A3]" />
          <span>Click &amp; Drag to Rotate Horizon</span>
        </div>

        {/* Active Hotspot Inspector Card */}
        {activeHotspot && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 w-80 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-[#E5EBE7] text-[#15251F] space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#147D4A] uppercase tracking-wider">
                {activeHotspot === 'road' ? 'Direct Road Frontage' : 'Survey Cadastral Pillar'}
              </span>
              <button
                type="button"
                onClick={() => setActiveHotspot(null)}
                className="text-xs text-[#66736D] hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#66736D] leading-relaxed">
              {activeHotspot === 'road'
                ? 'Panchayat-certified 18ft blacktop road connection with unobstructed heavy vehicle access directly to NH-27.'
                : 'Permanent concrete boundary marker verified against official Dag survey coordinates.'}
            </p>
          </div>
        )}

        {/* Bottom Horizon Track Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white text-xs">
          <span>West Boundary</span>
          <span className="text-[#35A66B] font-bold">•</span>
          <span className="text-white font-bold">Road Frontage</span>
          <span className="text-[#35A66B] font-bold">•</span>
          <span>East Elevation</span>
        </div>
      </div>
    </div>
  );
};
