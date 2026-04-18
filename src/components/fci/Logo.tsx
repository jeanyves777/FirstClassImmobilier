import { cn } from '@/lib/utils'

type LogoVariant = 'auto' | 'mono-white' | 'mono-navy'

const WORDMARK_COLORS: Record<LogoVariant, { first: string; class: string; sub: string }> = {
  auto: {
    first: 'text-[color:var(--brand-red)]',
    class: 'text-[color:var(--brand-navy)] dark:text-foreground',
    sub: 'text-muted',
  },
  'mono-white': {
    first: 'text-white',
    class: 'text-white',
    sub: 'text-white/60',
  },
  'mono-navy': {
    first: 'text-[color:var(--brand-navy)]',
    class: 'text-[color:var(--brand-navy)]',
    sub: 'text-[color:var(--brand-navy)]/60',
  },
}

/**
 * SVG recreation of the FirstClass Immobilier wordmark.
 * `variant="auto"` uses brand colors; `"mono-white"` renders the whole
 * mark in white for use on dark hero surfaces.
 */
export function Logo({
  className,
  showWordmark = true,
  variant = 'auto',
}: {
  className?: string
  showWordmark?: boolean
  variant?: LogoVariant
}) {
  const colors = WORDMARK_COLORS[variant]
  return (
    <span className={cn('inline-flex items-center gap-3', className)} aria-label="FirstClass Immobilier">
      <svg
        viewBox="0 0 64 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 w-auto shrink-0"
        aria-hidden="true"
      >
        <path d="M6 34 L32 6 L58 34" stroke="currentColor" strokeWidth="5" strokeLinejoin="miter" />
        <path d="M44 18 H50 V30 H44 Z" fill="currentColor" />
        <path d="M4 38 H60" stroke="currentColor" strokeWidth="2" />
      </svg>
      {showWordmark && (
        <span className="font-display leading-none">
          <span className={cn('text-xl font-semibold tracking-tight sm:text-2xl', colors.first)}>
            First
          </span>
          <span className={cn('text-xl font-semibold tracking-tight sm:text-2xl', colors.class)}>
            Class
          </span>
          <span className={cn('mt-0.5 hidden text-[10px] uppercase tracking-[0.24em] sm:block', colors.sub)}>
            Immobilier
          </span>
        </span>
      )}
    </span>
  )
}
