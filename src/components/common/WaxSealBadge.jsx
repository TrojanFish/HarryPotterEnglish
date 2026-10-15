import React from 'react';

/**
 * WaxSealBadge — Classical Hogwarts Wax Seal Stamp (火漆印章)
 * Procedural SVG with scalloped organic wax edge and debossed monogram:
 * - Represents O.W.L.s mastery, completed chapter certification, or house pride
 * - Strictly 100% Zero-Emoji Compliant
 */
export function WaxSealBadge({
  text = 'O',
  size = 28,
  color = '#991b1b', // Deep crimson wax
  title = '霍格沃茨火漆印章认证 · 大师级无杖掌握',
  className = ''
}) {
  return (
    <div
      className={`wax-seal relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      title={title}
      aria-label={title}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scalloped organic wax border */}
        <circle cx="50" cy="50" r="48" fill={color} />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="3,3" opacity="0.6" />
        <circle cx="50" cy="50" r="36" fill={color} stroke="#7f1d1d" strokeWidth="1.5" />
        
        {/* Inner debossed monogram text */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fef08a"
          fontSize="40"
          fontFamily='"Cinzel", "Cinzel Decorative", Georgia, serif'
          fontWeight="bold"
          letterSpacing="1"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}

export default WaxSealBadge;
