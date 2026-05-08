import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { PageShell } from '@/components/fci/PageShell'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { buildSeo } from '@/lib/seo'
import { ACTIVITY_FALLBACK } from '@/lib/stock-images'
import { KeyHandover } from '@/components/fci/illustrations'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/nos-activites'>): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  return buildSeo({
    locale: l,
    path: '/nos-activites',
    title:
      l === 'fr'
        ? 'Nos activités — FirstClass Immobilier'
        : 'Our activities — FirstClass Immobilier',
    description:
      l === 'fr'
        ? 'Événements, cérémonies de remise de clés, signatures de partenariats et vie de l\u2019entreprise FCI.'
        : 'Events, keys handover ceremonies, partnership signings and FCI company life.',
  })
}

export default async function ActivitiesPage({
  params,
}: PageProps<'/[locale]/nos-activites'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('activities')
  const l = locale as Locale

  const activities = await prisma.activity.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { date: 'desc' },
  })

  const coverIds = activities.map((a) => a.coverId).filter((v): v is string => !!v)
  const covers = coverIds.length
    ? await prisma.media.findMany({
        where: { id: { in: coverIds } },
        select: { id: true, url: true },
      })
    : []
  const coverById = new Map(covers.map((c) => [c.id, c.url]))

  const [featured, ...rest] = activities
  const c = copy(l)

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      {/* Intro / categories strip */}
      <section className="mb-14 rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
          {c.intro.eyebrow}
        </p>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {c.intro.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{c.intro.body}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {c.intro.categories.map((cat) => (
              <li
                key={cat.title}
                className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-surface-muted p-4 text-sm"
              >
                <span className="mt-0.5 text-[color:var(--brand-red)]">{cat.icon}</span>
                <div>
                  <p className="font-semibold text-foreground">{cat.title}</p>
                  <p className="text-xs text-muted">{cat.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured + list */}
      {activities.length === 0 ? (
        <EmptyState c={c} />
      ) : (
        <>
          {featured && (
            <section className="mb-14">
              <FeaturedActivity
                locale={l}
                activity={featured}
                coverUrl={featured.coverId ? coverById.get(featured.coverId) : undefined}
                c={c}
              />
            </section>
          )}

          {rest.length > 0 && (
            <section className="mb-16">
              <SectionHeader eyebrow={c.list.eyebrow} title={c.list.title} intro={c.list.intro} />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => {
                  const coverUrl = a.coverId ? coverById.get(a.coverId) : undefined
                  return (
                    <article
                      key={a.id}
                      className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
                    >
                      <div
                        className="aspect-[4/3] w-full bg-cover bg-center bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]"
                        style={{ backgroundImage: `url(${coverUrl ?? ACTIVITY_FALLBACK.src})` }}
                      />
                      <div className="p-5">
                        <time className="text-xs uppercase tracking-wider text-[color:var(--brand-red)]">
                          {formatDate(a.date, l)}
                        </time>
                        <h3 className="mt-1.5 font-display text-lg font-semibold text-foreground">
                          {tr(a.title, l)}
                        </h3>
                        {a.body && (
                          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                            {stripHtml(tr(a.body, l))}
                          </p>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Subscribe / follow-up CTA */}
      <section className="rounded-2xl bg-[color:var(--brand-navy)] p-8 text-white sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {c.subscribe.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              {c.subscribe.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{c.subscribe.body}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-red-600)]"
            >
              {c.subscribe.primary}
            </Link>
            <Link
              href="/a-la-une"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
            >
              {c.subscribe.secondary}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string
  title: string
  intro?: string
}) {
  return (
    <header className="max-w-2xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{intro}</p>}
    </header>
  )
}

function FeaturedActivity({
  locale,
  activity,
  coverUrl,
  c,
}: {
  locale: Locale
  activity: {
    id: string
    title: string
    body: string
    date: Date
  }
  coverUrl?: string
  c: ReturnType<typeof copy>
}) {
  const title = tr(activity.title, locale)
  return (
    <article className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <div
          className="aspect-[16/10] w-full bg-cover bg-center bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)] lg:aspect-auto"
          style={{ backgroundImage: `url(${coverUrl ?? ACTIVITY_FALLBACK.src})` }}
        />
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
            {c.featured.eyebrow}
          </p>
          <time className="mt-2 text-xs uppercase tracking-wider text-muted">
            {formatDate(activity.date, locale)}
          </time>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          {activity.body && (
            <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-muted sm:text-base">
              {stripHtml(tr(activity.body, locale))}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function EmptyState({ c }: { c: ReturnType<typeof copy> }) {
  return (
    <section className="relative mb-16 overflow-hidden rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center">
      <KeyHandover
        aria-hidden
        className="pointer-events-none mx-auto mb-5 h-24 w-48 opacity-60"
      />
      <p className="font-display text-xl font-semibold text-foreground">{c.empty.title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{c.empty.body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/a-la-une"
          className="inline-flex items-center rounded-full bg-[color:var(--brand-navy)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
        >
          {c.empty.primary}
        </Link>
        <Link
          href="/contacts"
          className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
        >
          {c.empty.secondary}
        </Link>
      </div>
    </section>
  )
}

function formatDate(d: Date, l: Locale) {
  return new Date(d).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─────────────────────────────────────────────────────────────────────────

function copy(l: Locale) {
  const IconEvent = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
  const IconSignature = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17c3 0 3-4 6-4s3 4 6 4 3-4 6-4" />
      <path d="M3 22h18" />
    </svg>
  )
  const IconHandshake = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m11 17 2 2a1 1 0 0 0 1.5-.1l6-7A2 2 0 0 0 20 9h-3" />
      <path d="m21 3-4 4-2-2-4 4 4 4 4-4 2 2" />
    </svg>
  )
  const IconCompass = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
    </svg>
  )

  const fr = {
    intro: {
      eyebrow: 'Vie de l\u2019entreprise',
      title: 'Événements, livraisons, signatures — la vie FCI',
      body: 'Salons immobiliers, cérémonies de remise de clés, signatures de partenariats, visites chantier — vous suivez ici l\u2019actualité concrète de FirstClass Immobilier, sans filtre.',
      categories: [
        { icon: IconEvent, title: 'Événements & salons', body: 'Nos participations aux salons immobiliers à Abidjan et à l\u2019international.' },
        { icon: IconHandshake, title: 'Remises de clés', body: 'Photos de cérémonies avec nos nouveaux propriétaires.' },
        { icon: IconSignature, title: 'Signatures & partenariats', body: 'Notaires, banques, institutionnels : nos annonces officielles.' },
        { icon: IconCompass, title: 'Visites & inaugurations', body: 'Découverte des programmes en avant-première.' },
      ],
    },
    featured: {
      eyebrow: 'À la une',
    },
    list: {
      eyebrow: 'Toutes nos actualités',
      title: 'Chronologie complète',
      intro: 'Tri du plus récent au plus ancien — reprenez la lecture où vous l\u2019aviez laissée.',
    },
    empty: {
      title: 'Publications à venir',
      body: 'Nos prochaines actualités — remises de clés, événements, partenariats — seront publiées ici. En attendant, explorez nos programmes ou contactez un agent.',
      primary: 'Voir les programmes',
      secondary: 'Contacter un agent',
    },
    subscribe: {
      eyebrow: 'Rester au courant',
      title: 'Soyez prévenu des prochaines actualités',
      body: 'Inscrivez-vous auprès d\u2019un agent pour recevoir en avant-première les annonces de nouveaux programmes, événements et remises de clés.',
      primary: 'Me faire recontacter',
      secondary: 'Parcourir les programmes',
    },
  }

  const en = {
    intro: {
      eyebrow: 'Company life',
      title: 'Events, handovers, partnerships — FCI life',
      body: 'Real-estate fairs, keys handover ceremonies, partnership signings, site visits — follow the concrete life of FirstClass Immobilier here, unfiltered.',
      categories: [
        { icon: IconEvent, title: 'Events & fairs', body: 'Our presence at real-estate fairs in Abidjan and abroad.' },
        { icon: IconHandshake, title: 'Keys handovers', body: 'Photos from ceremonies with our new owners.' },
        { icon: IconSignature, title: 'Signings & partnerships', body: 'Notaries, banks, institutions — our official announcements.' },
        { icon: IconCompass, title: 'Visits & openings', body: 'First-look discoveries of our programs.' },
      ],
    },
    featured: {
      eyebrow: 'Featured',
    },
    list: {
      eyebrow: 'All updates',
      title: 'Full timeline',
      intro: 'Sorted newest to oldest — pick up where you left off.',
    },
    empty: {
      title: 'Updates coming soon',
      body: 'Our next stories — keys handovers, events, partnerships — will land here. In the meantime, explore our programs or reach an agent.',
      primary: 'View programs',
      secondary: 'Talk to an agent',
    },
    subscribe: {
      eyebrow: 'Stay in the loop',
      title: 'Be the first to know',
      body: 'Register with an agent to get early notice on new program launches, events, and keys handovers.',
      primary: 'Get a call back',
      secondary: 'Browse programs',
    },
  }

  return l === 'fr' ? fr : en
}
