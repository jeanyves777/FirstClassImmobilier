import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { StatCounter } from '@/components/fci/StatCounter'
import { prisma } from '@/lib/db'
import { site } from '@/lib/site'

async function getStats() {
  const row = await prisma.siteStats.findUnique({ where: { id: 1 } })
  return row ?? {
    yearsExperience: 8,
    satisfiedClients: 350,
    projectsCount: 7,
    landsSold: 450,
    housesBuilt: 57,
    acdDelivered: 380,
  }
}

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  const tNav = await getTranslations('nav')
  const stats = await getStats()

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[color:var(--brand-navy)]/95 via-[color:var(--brand-navy-700)] to-[color:var(--brand-ink)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(200,16,46,.35),transparent_55%),radial-gradient(circle_at_90%_80%,rgba(255,255,255,.08),transparent_60%)]"
        />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-4 pb-20 pt-24 text-white sm:px-6 sm:pt-28 lg:px-8 lg:pb-28 lg:pt-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--brand-red)]" />
            FirstClass Immobilier
          </span>

          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {t('tagline')}
            <span className="block text-[color:var(--brand-red)]">{t('subTagline')}</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
            {t('statement')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/a-la-une"
              className="inline-flex items-center rounded-full bg-[color:var(--brand-red)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(200,16,46,.6)] transition-colors hover:bg-[color:var(--brand-red-600)]"
            >
              {t('discoverCta')}
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              {tNav('contact')}
            </Link>
          </div>
        </div>
      </section>

      {/* Counters */}
      <section className="relative -mt-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 rounded-2xl border border-[color:var(--border)] bg-surface p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,.25)] sm:grid-cols-4 sm:p-10">
          <StatCounter value={stats.yearsExperience} label={t('counters.years')} />
          <StatCounter value={stats.satisfiedClients} label={t('counters.clients')} />
          <StatCounter value={stats.projectsCount} label={t('counters.projects')} />
          <CountryCounter label={t('counters.countries')} countries={[...site.countries]} />
        </div>
      </section>
    </div>
  )
}

function CountryCounter({ label, countries }: { label: string; countries: string[] }) {
  return (
    <details className="group flex flex-col items-center text-center">
      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <span className="font-display text-4xl font-semibold tracking-tight text-[color:var(--brand-navy)] dark:text-foreground sm:text-5xl">
          {countries.length}
          <span className="text-[color:var(--brand-red)]">+</span>
        </span>
        <span className="mt-2 block text-sm uppercase tracking-[0.18em] text-muted">{label}</span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-[color:var(--brand-navy)] underline underline-offset-4 dark:text-foreground/80 group-open:hidden">
          ▾
        </span>
      </summary>
      <ul className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-medium">
        {countries.map((c) => (
          <li
            key={c}
            className="rounded-full border border-[color:var(--border)] bg-surface-muted px-2.5 py-1"
          >
            {c}
          </li>
        ))}
      </ul>
    </details>
  )
}
