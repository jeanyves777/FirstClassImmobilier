/**
 * Inline SVG illustrations — all transparent background, brand-tinted via
 * currentColor + the FCI brand tokens (--brand-red, --brand-navy).
 *
 * Each export is a React component accepting a className prop so callers can
 * size it with Tailwind utilities (e.g. `className="h-48 w-48"`).
 *
 * Illustrations are deliberately simple and flat — they scale crisply, work
 * in dark mode, and avoid the cartoonish look of third-party illustration kits.
 */
import type { SVGProps } from 'react'

type IllustrationProps = SVGProps<SVGSVGElement> & { className?: string }

function base(props: IllustrationProps) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    'aria-hidden': true,
    ...props,
  }
}

/** City skyline with two front villas — for Accueil / Nous Découvrir. */
export function VillaSkyline(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 260" {...base(props)}>
      <defs>
        <linearGradient id="villa-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-red)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand-red)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Sun glow */}
      <circle cx="300" cy="80" r="90" fill="url(#villa-sun)" />
      <circle cx="300" cy="80" r="20" fill="var(--brand-red)" opacity="0.6" />

      {/* Back skyline */}
      <g stroke="var(--brand-navy)" strokeWidth="2" fill="none" opacity="0.55">
        <rect x="40" y="120" width="22" height="80" />
        <rect x="70" y="100" width="18" height="100" />
        <rect x="96" y="130" width="26" height="70" />
        <rect x="130" y="90" width="24" height="110" />
        <rect x="160" y="110" width="28" height="90" />
        <rect x="196" y="80" width="20" height="120" />
        <rect x="224" y="110" width="26" height="90" />
        <rect x="258" y="130" width="22" height="70" />
        <rect x="286" y="100" width="28" height="100" />
        <rect x="322" y="115" width="20" height="85" />
        <rect x="350" y="95" width="22" height="105" />
      </g>

      {/* Front villa */}
      <g stroke="var(--brand-navy)" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M90 210 L90 160 L150 120 L210 160 L210 210 Z" fill="white" />
        <path d="M90 160 L150 120 L210 160" fill="var(--brand-red)" opacity="0.12" />
        <rect x="130" y="180" width="18" height="30" fill="var(--brand-red)" opacity="0.8" />
        <rect x="158" y="170" width="18" height="18" fill="white" />
      </g>

      {/* Second house */}
      <g stroke="var(--brand-navy)" strokeWidth="2" strokeLinejoin="round">
        <path d="M220 210 L220 175 L260 150 L300 175 L300 210 Z" fill="white" />
        <path d="M220 175 L260 150 L300 175" fill="var(--brand-navy)" opacity="0.1" />
        <rect x="245" y="188" width="14" height="22" fill="var(--brand-navy)" opacity="0.8" />
        <rect x="270" y="182" width="14" height="12" fill="white" />
      </g>

      {/* Ground line */}
      <line x1="20" y1="220" x2="380" y2="220" stroke="var(--brand-navy)" strokeWidth="2" opacity="0.4" />
      {/* Trees */}
      <g fill="var(--brand-navy)" opacity="0.3">
        <circle cx="50" cy="205" r="10" />
        <circle cx="340" cy="208" r="8" />
        <rect x="48" y="215" width="4" height="10" />
        <rect x="339" y="216" width="3" height="9" />
      </g>
    </svg>
  )
}

/** Diaspora globe connecting continents — for diaspora/remote story. */
export function DiasporaGlobe(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 300 300" {...base(props)}>
      <circle cx="150" cy="150" r="110" stroke="var(--brand-navy)" strokeWidth="2" opacity="0.35" />
      <ellipse cx="150" cy="150" rx="110" ry="50" stroke="var(--brand-navy)" strokeWidth="1.5" opacity="0.25" />
      <ellipse cx="150" cy="150" rx="50" ry="110" stroke="var(--brand-navy)" strokeWidth="1.5" opacity="0.25" />
      {/* Continents — abstract blobs */}
      <g fill="var(--brand-navy)" opacity="0.45">
        <path d="M90 130 q15 -12 30 -5 q18 -2 20 15 q6 10 -8 18 q-14 8 -28 0 q-18 -4 -14 -18 Z" />
        <path d="M170 105 q20 -5 30 10 q15 -2 10 18 q-4 10 -18 10 q-16 -2 -24 -15 q-6 -10 2 -23 Z" />
        <path d="M130 190 q18 -8 36 3 q10 8 -2 18 q-18 10 -36 2 q-8 -12 2 -23 Z" />
      </g>
      {/* Connection arcs */}
      <g stroke="var(--brand-red)" strokeWidth="2" fill="none" strokeDasharray="4 6">
        <path d="M110 140 q40 -80 90 -10" />
        <path d="M115 195 q60 -30 75 -55" />
      </g>
      {/* Pins */}
      <circle cx="110" cy="140" r="5" fill="var(--brand-red)" />
      <circle cx="200" cy="130" r="5" fill="var(--brand-red)" />
      <circle cx="190" cy="140" r="5" fill="var(--brand-red)" />
      <circle cx="115" cy="195" r="5" fill="var(--brand-red)" />
    </svg>
  )
}

/** Document + seal stamp — for ACD / trust blocks. */
export function AcdDocument(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 260 300" {...base(props)}>
      {/* Paper */}
      <g stroke="var(--brand-navy)" strokeWidth="2" strokeLinejoin="round">
        <path d="M40 30 L170 30 L210 70 L210 260 L40 260 Z" fill="white" />
        <path d="M170 30 L170 70 L210 70" fill="var(--brand-navy)" opacity="0.08" />
      </g>
      {/* Text lines */}
      <g stroke="var(--brand-navy)" strokeWidth="2" strokeLinecap="round" opacity="0.4">
        <line x1="60" y1="95" x2="180" y2="95" />
        <line x1="60" y1="115" x2="190" y2="115" />
        <line x1="60" y1="135" x2="160" y2="135" />
        <line x1="60" y1="170" x2="190" y2="170" />
        <line x1="60" y1="190" x2="175" y2="190" />
      </g>
      {/* Seal stamp */}
      <g transform="translate(160 210)">
        <circle r="36" fill="var(--brand-red)" opacity="0.12" />
        <circle r="30" stroke="var(--brand-red)" strokeWidth="2.5" fill="none" />
        <path d="M-12 2 L-3 12 L14 -8" stroke="var(--brand-red)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Corner ribbon */}
      <path d="M170 30 L210 70" stroke="var(--brand-red)" strokeWidth="3" />
    </svg>
  )
}

/** Keys + tag — for handover / reservation moments. */
export function KeyHandover(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 320 220" {...base(props)}>
      {/* Ring */}
      <circle cx="80" cy="110" r="38" stroke="var(--brand-navy)" strokeWidth="6" fill="none" />
      <circle cx="80" cy="110" r="22" stroke="var(--brand-navy)" strokeWidth="2" fill="white" opacity="0.95" />
      {/* Key shaft */}
      <rect x="115" y="103" width="170" height="14" rx="3" fill="var(--brand-navy)" />
      {/* Key teeth */}
      <rect x="230" y="117" width="10" height="16" fill="var(--brand-navy)" />
      <rect x="250" y="117" width="8" height="22" fill="var(--brand-navy)" />
      <rect x="268" y="117" width="10" height="16" fill="var(--brand-navy)" />
      {/* Tag */}
      <g transform="translate(50 165)">
        <path
          d="M0 0 L80 0 L95 12 L80 24 L0 24 Z"
          fill="var(--brand-red)"
          opacity="0.9"
        />
        <circle cx="12" cy="12" r="3.5" fill="white" />
        <line x1="24" y1="8" x2="72" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="24" y1="16" x2="58" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      </g>
      {/* Sparkle */}
      <g stroke="var(--brand-red)" strokeWidth="2" strokeLinecap="round">
        <line x1="150" y1="40" x2="150" y2="60" />
        <line x1="140" y1="50" x2="160" y2="50" />
      </g>
    </svg>
  )
}

/** Abstract blueprint grid — subtle decorative backdrop. */
export function BlueprintGrid(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 400 300" {...base(props)} preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="bp-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--brand-navy)" strokeWidth="0.5" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#bp-grid)" />
      {/* Floor plan suggestion */}
      <g stroke="var(--brand-navy)" strokeWidth="1.5" fill="none" opacity="0.35">
        <rect x="80" y="70" width="240" height="160" />
        <line x1="200" y1="70" x2="200" y2="230" />
        <line x1="80" y1="150" x2="200" y2="150" />
        <line x1="200" y1="170" x2="320" y2="170" />
        <rect x="85" y="75" width="20" height="10" fill="var(--brand-red)" opacity="0.6" />
      </g>
    </svg>
  )
}

/** Growth arrow + bar chart — for counters / trust strip. */
export function GrowthChart(props: IllustrationProps) {
  return (
    <svg viewBox="0 0 260 200" {...base(props)}>
      {/* Bars */}
      <g>
        <rect x="30" y="130" width="30" height="50" fill="var(--brand-navy)" opacity="0.3" rx="2" />
        <rect x="80" y="100" width="30" height="80" fill="var(--brand-navy)" opacity="0.5" rx="2" />
        <rect x="130" y="70" width="30" height="110" fill="var(--brand-navy)" opacity="0.7" rx="2" />
        <rect x="180" y="40" width="30" height="140" fill="var(--brand-red)" opacity="0.85" rx="2" />
      </g>
      {/* Trend line */}
      <path d="M30 125 L95 100 L145 75 L195 40" stroke="var(--brand-red)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Arrow tip */}
      <path d="M195 40 L185 48 M195 40 L187 30" stroke="var(--brand-red)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Baseline */}
      <line x1="20" y1="180" x2="230" y2="180" stroke="var(--brand-navy)" strokeWidth="1.5" opacity="0.4" />
    </svg>
  )
}
