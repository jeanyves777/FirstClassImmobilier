import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export function AdminHeader({
  eyebrow,
  title,
  description,
  action,
  backHref,
  backLabel,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  backHref?: string
  backLabel?: string
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {backLabel ?? 'Back'}
          </Link>
        )}
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && <p className="text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}

export function LinkButton({
  href,
  variant = 'primary',
  children,
  className,
}: {
  href: string
  variant?: 'primary' | 'secondary' | 'ghost'
  children: React.ReactNode
  className?: string
}) {
  const styles =
    variant === 'primary'
      ? 'bg-[color:var(--brand-navy)] text-white hover:bg-[color:var(--brand-navy-700)]'
      : variant === 'secondary'
        ? 'border border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
        : 'text-foreground hover:bg-surface-muted'
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors',
        styles,
        className,
      )}
    >
      {children}
    </Link>
  )
}
