import type { SVGProps } from 'react';

const PRIMARY = '#0c1825';
const ACCENT_AMBER = '#d97706';
const ACCENT_ROSE = '#be185d';
const ACCENT_TEAL = '#0891b2';
const ACCENT_EMERALD = '#059669';

/**
 * Aptixora mark — three interlocking shapes (circle=laundry/water,
 * square=barbershop/precision, triangle=salon/elegance) forming an
 * ixora-inspired flower. Represents three industries merging into one platform.
 */
export function AptixoraLogo({ size = 32, className = '', ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="aptFlowerA" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor={ACCENT_AMBER} />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="aptFlowerB" x1="64" y1="0" x2="0" y2="64">
          <stop offset="0" stopColor={ACCENT_ROSE} />
          <stop offset="1" stopColor="#831843" />
        </linearGradient>
        <linearGradient id="aptFlowerC" x1="0" y1="64" x2="64" y2="0">
          <stop offset="0" stopColor={ACCENT_TEAL} />
          <stop offset="1" stopColor="#155e75" />
        </linearGradient>
        <linearGradient id="aptFlowerD" x1="32" y1="0" x2="32" y2="64">
          <stop offset="0" stopColor={ACCENT_EMERALD} />
          <stop offset="1" stopColor="#065f46" />
        </linearGradient>
        <radialGradient id="aptCore" cx="32" cy="32" r="8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Four interlocking petals (Ixora-inspired) — top, right, bottom, left */}
      {/* Top petal — amber (warmth, craft) */}
      <path
        d="M32 6 C 40 10, 44 18, 42 26 C 38 24, 34 22, 32 22 C 30 22, 26 24, 22 26 C 20 18, 24 10, 32 6 Z"
        fill="url(#aptFlowerA)"
      />
      {/* Right petal — rose (elegance) */}
      <path
        d="M58 32 C 54 40, 46 44, 38 42 C 40 38, 42 34, 42 32 C 42 30, 40 26, 38 22 C 46 20, 54 24, 58 32 Z"
        fill="url(#aptFlowerB)"
      />
      {/* Bottom petal — teal (water/freshness) */}
      <path
        d="M32 58 C 24 54, 20 46, 22 38 C 26 40, 30 42, 32 42 C 34 42, 38 40, 42 38 C 44 46, 40 54, 32 58 Z"
        fill="url(#aptFlowerC)"
      />
      {/* Left petal — emerald (growth) */}
      <path
        d="M6 32 C 10 24, 18 20, 26 22 C 24 26, 22 30, 22 32 C 22 34, 24 38, 26 42 C 18 44, 10 40, 6 32 Z"
        fill="url(#aptFlowerD)"
      />

      {/* Interlocking "A" core — abstract letter A from three geometric shapes */}
      {/* The "A" crossbar + stem */}
      <g transform="translate(32 32)">
        {/* Triangle (apex of A) — cream/white */}
        <path
          d="M -7 5 L 0 -9 L 7 5 Z"
          fill="#fdf6e9"
          stroke={PRIMARY}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Square base (the A's foundation) */}
        <rect
          x="-6" y="4.5" width="12" height="4.5" rx="0.5"
          fill={PRIMARY}
        />
        {/* Crossbar of A (the barbershop precision line) */}
        <rect
          x="-4.5" y="0.5" width="9" height="1.6" rx="0.8"
          fill={ACCENT_AMBER}
        />
        {/* Small notification dot (live data) */}
        <circle cx="6" cy="-7" r="1.6" fill={ACCENT_ROSE} />
      </g>

      {/* Subtle glow at center */}
      <circle cx="32" cy="32" r="6" fill="url(#aptCore)" />
    </svg>
  );
}

/**
 * Compact mark — for tight spaces (sidebar, small UI).
 * Three overlapping shapes only — no internal "A".
 */
export function AptixoraMark({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="markAmber" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor={ACCENT_AMBER} />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="markRose" x1="32" y1="0" x2="0" y2="32">
          <stop offset="0" stopColor={ACCENT_ROSE} />
          <stop offset="1" stopColor="#831843" />
        </linearGradient>
        <linearGradient id="markTeal" x1="0" y1="32" x2="32" y2="0">
          <stop offset="0" stopColor={ACCENT_TEAL} />
          <stop offset="1" stopColor="#155e75" />
        </linearGradient>
      </defs>
      {/* Circle — laundry */}
      <circle cx="16" cy="16" r="13" fill="url(#markTeal)" opacity="0.95" />
      {/* Square — barbershop */}
      <rect x="6" y="6" width="20" height="20" rx="2" fill="url(#markAmber)" opacity="0.85" />
      {/* Triangle — salon */}
      <path d="M16 6 L 26 22 L 6 22 Z" fill="url(#markRose)" opacity="0.78" />
      {/* White "A" apex at intersection */}
      <path
        d="M11 22 L 16 11 L 21 22 Z"
        fill="#fdf6e9"
        stroke={PRIMARY}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Wordmark — full logo with text (for landing page, marketing).
 */
export function AptixoraWordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <AptixoraLogo size={36} />
      <div className="flex flex-col leading-none">
        <span className="font-display font-bold text-xl tracking-tight">
          Aptixora
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] opacity-60 font-semibold mt-0.5">
          Operasional UMKM
        </span>
      </div>
    </div>
  );
}
