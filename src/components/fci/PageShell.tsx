import { cn } from '@/lib/utils'

export function PageShell({
  eyebrow,
  title,
  intro,
  children,
  wide,
}: {
  eyebrow?: string
  title: string
  intro?: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className={cn('mx-auto w-full', wide ? 'max-w-7xl' : 'max-w-5xl')}>
        <header className="mb-10 max-w-3xl">
          {eyebrow && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{intro}</p>
          )}
        </header>
        {children}
      </div>
    </div>
  )
}
