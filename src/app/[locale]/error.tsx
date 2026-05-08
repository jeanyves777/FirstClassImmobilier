'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Logo } from '@/components/fci/Logo'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  useEffect(() => {
    // Surface in dev console; wire to Sentry when we add observability.
    console.error('[FCI] unhandled error:', error)
  }, [error])

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[color:var(--border)] bg-surface p-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,.35)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[color:var(--brand-red)]/10 blur-3xl" aria-hidden />

        <div className="relative">
          <Logo className="justify-center" showWordmark={false} />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-red)]">
            {t('error.eyebrow')}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            {t('error.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted">
            {t('error.description')}
          </p>

          {error.digest && (
            <p className="mx-auto mt-3 max-w-sm rounded-full bg-surface-muted px-3 py-1 text-[11px] font-mono text-muted">
              {t('error.reference')}: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-11 items-center rounded-full bg-[color:var(--brand-navy)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)]"
            >
              {t('error.retry')}
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full border border-[color:var(--border)] bg-surface px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              {t('error.home')}
            </Link>
            <Link
              href="/contacts"
              className="inline-flex h-11 items-center rounded-full border border-[color:var(--border)] bg-surface px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              {t('error.contact')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
