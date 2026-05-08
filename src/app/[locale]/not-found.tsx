import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Logo } from '@/components/fci/Logo'

export default async function LocaleNotFound() {
  const t = await getTranslations('errors')

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[color:var(--border)] bg-surface p-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,.35)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[color:var(--brand-red)]/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[color:var(--brand-navy)]/10 blur-3xl" aria-hidden />

        <div className="relative">
          <Logo className="justify-center" showWordmark={false} />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-red)]">
            {t('notFound.eyebrow')}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">
            404
          </h1>
          <h2 className="mt-3 font-display text-2xl font-semibold text-foreground">
            {t('notFound.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted">
            {t('notFound.description')}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full bg-[color:var(--brand-navy)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)]"
            >
              {t('notFound.ctaHome')}
            </Link>
            <Link
              href="/a-la-une"
              className="inline-flex h-11 items-center rounded-full border border-[color:var(--border)] bg-surface px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              {t('notFound.ctaFeatured')}
            </Link>
            <Link
              href="/contacts"
              className="inline-flex h-11 items-center rounded-full border border-[color:var(--border)] bg-surface px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              {t('notFound.ctaContact')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
