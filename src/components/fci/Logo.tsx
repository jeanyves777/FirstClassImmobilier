import { cn } from '@/lib/utils'

/**
 * SVG recreation of the FirstClass Immobilier wordmark.
 * Scales crisply at any size; respects `currentColor` for the "Class"
 * portion so the logo adapts to dark mode naturally.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)} aria-label="FirstClass Immobilier">
      <svg
        viewBox="0 0 64 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 w-auto shrink-0"
        aria-hidden="true"
      >
        <path
          d="M6 34 L32 6 L58 34"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinejoin="miter"
        />
        <path d="M44 18 H50 V30 H44 Z" fill="currentColor" />
        <path d="M4 38 H60" stroke="currentColor" strokeWidth="2" />
      </svg>
      {showWordmark && (
        <span className="font-display leading-none">
          <span className="text-[color:var(--brand-red)] text-2xl font-semibold tracking-tight">First</span>
          <span className="text-[color:var(--brand-navy)] dark:text-foreground text-2xl font-semibold tracking-tight">
            Class
          </span>
          <span className="block text-[10px] uppercase tracking-[0.24em] text-muted">Immobilier</span>
        </span>
      )}
    </span>
  )
}
