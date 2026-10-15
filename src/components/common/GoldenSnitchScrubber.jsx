import React from 'react';

/**
 * GoldenSnitchScrubber — The Golden Snitch Scrubber Thumb & Glider (金色飞贼播放进度游标)
 * Vector SVG featuring the central golden core with intricate silver wings:
 * - Glides across audio scrubbers in Podcast and Studio modes
 * - Subtle aerodynamic wing flap on hover / dragging
 * - Strictly 100% Zero-Emoji Compliant
 */
export function GoldenSnitchScrubber({
  progress = 0,
  isHovered = false,
  isDragging = false,
  size = 26,
  className = ''
}) {
  const active = isHovered || isDragging;

  return (
    <div
      className={`golden-snitch inline-flex items-center justify-center select-none pointer-events-none transition-transform duration-200 ${
        active ? 'scale-110 drop-shadow-md' : 'drop-shadow-sm'
      } ${className}`}
      style={{
        width: size * 1.8,
        height: size
      }}
      title="金色飞贼进度指针 (Golden Snitch)"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 50"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gold orb gradient */}
          <radialGradient id="snitchGoldGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </radialGradient>

          {/* Silver wing gradient */}
          <linearGradient id="snitchWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Left Wing */}
        <path
          d="M 43 25 C 32 10 12 5 2 12 C 10 20 28 26 43 27 Z"
          fill="url(#snitchWingGrad)"
          stroke="#94a3b8"
          strokeWidth="0.8"
          className={active ? 'animate-pulse' : ''}
          style={{
            transformOrigin: '43px 25px',
            transform: active ? 'rotate(-6deg)' : 'none',
            transition: 'transform 0.15s ease'
          }}
        />

        {/* Right Wing */}
        <path
          d="M 57 25 C 68 10 88 5 98 12 C 90 20 72 26 57 27 Z"
          fill="url(#snitchWingGrad)"
          stroke="#94a3b8"
          strokeWidth="0.8"
          className={active ? 'animate-pulse' : ''}
          style={{
            transformOrigin: '57px 25px',
            transform: active ? 'rotate(6deg)' : 'none',
            transition: 'transform 0.15s ease'
          }}
        />

        {/* Delicate wing vein filaments */}
        <path
          d="M 38 24 Q 22 15 8 13"
          stroke="#ffffff"
          strokeWidth="0.6"
          strokeDasharray="2,1"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M 62 24 Q 78 15 92 13"
          stroke="#ffffff"
          strokeWidth="0.6"
          strokeDasharray="2,1"
          fill="none"
          opacity="0.8"
        />

        {/* Central Golden Sphere */}
        <circle
          cx="50"
          cy="25"
          r="9"
          fill="url(#snitchGoldGrad)"
          stroke="#78350f"
          strokeWidth="0.8"
        />

        {/* Sphere Engraving Seam Details */}
        <circle
          cx="50"
          cy="25"
          r="6.5"
          fill="none"
          stroke="#b45309"
          strokeWidth="0.5"
          strokeDasharray="3,1.5"
          opacity="0.7"
        />

        {/* Specular Glint */}
        <circle
          cx="47.5"
          cy="22.5"
          r="2"
          fill="#ffffff"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

export default GoldenSnitchScrubber;
