import React, { useMemo } from 'react';

interface LeafConfig {
  id: number;
  left: string;
  size: number;
  duration: string;
  delay: string;
  initialRotate: number;
  opacity: number;
  tint: string;
}

const DETERMINISTIC_LEAVES: LeafConfig[] = [
  { id: 1, left: '5%', size: 26, duration: '15s', delay: '-2.5s', initialRotate: 15, opacity: 0.65, tint: '#769B63' },
  { id: 2, left: '14%', size: 20, duration: '18s', delay: '-7.2s', initialRotate: -25, opacity: 0.50, tint: '#426B42' },
  { id: 3, left: '25%', size: 32, duration: '16s', delay: '-4.1s', initialRotate: 40, opacity: 0.62, tint: '#769B63' },
  { id: 4, left: '37%', size: 22, duration: '19s', delay: '-11.5s', initialRotate: -12, opacity: 0.48, tint: '#5B8752' },
  { id: 5, left: '49%', size: 28, duration: '14s', delay: '-1.7s', initialRotate: 28, opacity: 0.60, tint: '#769B63' },
  { id: 6, left: '61%', size: 24, duration: '17s', delay: '-9.4s', initialRotate: -35, opacity: 0.54, tint: '#426B42' },
  { id: 7, left: '72%', size: 34, duration: '15.5s', delay: '-5.6s', initialRotate: 20, opacity: 0.66, tint: '#769B63' },
  { id: 8, left: '81%', size: 21, duration: '20s', delay: '-13.2s', initialRotate: -18, opacity: 0.46, tint: '#5B8752' },
  { id: 9, left: '89%', size: 29, duration: '16.5s', delay: '-3.8s', initialRotate: 32, opacity: 0.58, tint: '#769B63' },
  { id: 10, left: '95%', size: 23, duration: '18.5s', delay: '-8.9s', initialRotate: -22, opacity: 0.52, tint: '#426B42' },
];

export interface AmbientLeavesProps {
  count?: number;
  inHeroOnly?: boolean;
}

export const AmbientLeaves: React.FC<AmbientLeavesProps> = ({
  count = 10,
  inHeroOnly = true,
}) => {
  const leaves = useMemo(() => DETERMINISTIC_LEAVES.slice(0, count), [count]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none inset-0 overflow-hidden z-10 ${
        inHeroOnly ? 'absolute' : 'fixed'
      }`}
    >
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="animate-leaf-float absolute -top-10"
          style={{
            left: leaf.left,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            animationDuration: leaf.duration,
            animationDelay: leaf.delay,
            opacity: leaf.opacity,
          }}
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            style={{ transform: `rotate(${leaf.initialRotate}deg)` }}
            className="w-full h-full drop-shadow-sm"
          >
            {/* Natural Camellia sinensis (Assam Tea Leaf) Silhouette */}
            <path
              d="M8 40C8 40 10 16 26 10C36 6 42 8 42 8C42 8 40 24 28 34C18 42 8 40 8 40Z"
              fill={leaf.tint}
              fillOpacity="0.86"
            />
            {/* Primary Midrib Vein */}
            <path
              d="M8 40C16 32 26 20 40 10"
              stroke="#123F32"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {/* Delicate Lateral Botanical Veins */}
            <path
              d="M18 30C17 24 19 20 22 17M25 23C25 18 27 15 31 13M22 27C27 27 31 26 34 23"
              stroke="#F8F5EC"
              strokeOpacity="0.55"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};
