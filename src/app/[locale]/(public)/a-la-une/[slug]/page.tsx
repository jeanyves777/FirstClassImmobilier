import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import { formatFCFA, formatSurface } from '@/lib/format'
import type { Locale } from '@/i18n/routing'
import { buildSeo } from '@/lib/seo'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/a-la-une/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const l = locale as Locale
  const program = await prisma.program.findUnique({
    where: { slug },
    select: { name: true, tagline: true, heroMediaId: true, zone: true, type: true },
  })
  if (!program) {
    return buildSeo({
      locale: l,
      path: `/a-la-une/${slug}`,
      title:
        l === 'fr'
          ? 'Programme introuvable — FirstClass Immobilier'
          : 'Program not found — FirstClass Immobilier',
      description:
        l === 'fr'
          ? 'Ce programme n\u2019est plus disponible ou l\u2019URL est incorrecte.'
          : 'This program is no longer available, or the URL is incorrect.',
    })
  }
  const hero = program.heroMediaId
    ? await prisma.media.findUnique({
        where: { id: program.heroMediaId },
        select: { url: true },
      })
    : null
  const name = tr(program.name, l)
  const tagline = tr(program.tagline, l)
  return buildSeo({
    locale: l,
    path: `/a-la-une/${slug}`,
    title: `${name} — ${program.zone} · FirstClass Immobilier`,
    description:
      tagline ||
      (l === 'fr'
        ? `Programme ${program.type.toLowerCase()} à ${program.zone} par FirstClass Immobilier — ACD inclus.`
        : `${program.type.toLowerCase()} program in ${program.zone} by FirstClass Immobilier — ACD included.`),
    image: hero?.url ?? null,
    type: 'article',
  })
}

type LotFilter = 'all' | 'available' | 'reserved' | 'sold'

export default async function ProgramPage({
  params,
  searchParams,
}: PageProps<'/[locale]/a-la-une/[slug]'>) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const l = locale as Locale

  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      lots: {
        orderBy: [{ status: 'asc' }, { reference: 'asc' }],
        include: {
          media: { orderBy: { order: 'asc' }, take: 1 },
        },
      },
      plans: { orderBy: { id: 'asc' } },
      media: { orderBy: { order: 'asc' } },
    },
  })
  if (!program) notFound()

  const sp = await searchParams
  const rawFilter = typeof sp.lots === 'string' ? sp.lots : undefined
  const lotFilter: LotFilter =
    rawFilter === 'available' || rawFilter === 'reserved' || rawFilter === 'sold'
      ? rawFilter
      : 'all'

  const hero = program.heroMediaId
    ? program.media.find((m) => m.id === program.heroMediaId) ?? null
    : program.media[0] ?? null
  const gallery = program.media.filter((m) => m.id !== hero?.id && m.kind === 'image').slice(0, 4)

  const tLot = await getTranslations('lot')
  const tNav = await getTranslations('nav')

  const availableLots = program.lots.filter((lt) => lt.status === 'available')
  const reservedLots = program.lots.filter((lt) => lt.status === 'reserved')
  const soldLots = program.lots.filter((lt) => lt.status === 'sold')
  const prices = availableLots
    .map((lt) => lt.priceFCFA)
    .filter((v): v is bigint => typeof v === 'bigint')
  const minPrice = prices.length ? prices.reduce((a, b) => (a < b ? a : b)) : null
  const maxPrice = prices.length ? prices.reduce((a, b) => (a > b ? a : b)) : null

  const filteredLots =
    lotFilter === 'all' ? program.lots : program.lots.filter((lt) => lt.status === lotFilter)

  const c = copy(l)
  const programName = tr(program.name, l)
  const programTagline = tr(program.tagline, l)
  const statusChip = statusLabel(program.status, c)

  const buildLotsHref = (f: LotFilter) =>
    f === 'all' ? `/a-la-une/${slug}` : `/a-la-une/${slug}?lots=${f}`

  return (
    <>
      {/* Hero — full-width image with overlay content */}
      <section className="relative overflow-hidden">
        {hero && hero.kind === 'image' ? (
          <div className="relative">
            <div className="relative aspect-[16/9] w-full max-h-[620px] overflow-hidden">
              <Image
                src={hero.url}
                alt={programName}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
              />
            </div>
            <HeroOverlay
              name={programName}
              tagline={programTagline}
              zone={program.zone}
              type={program.type}
              status={statusChip}
              featured={program.featured}
              c={c}
            />
          </div>
        ) : (
          <div className="relative">
            <div className="aspect-[16/7] w-full bg-gradient-to-br from-[color:var(--brand-navy-700)] via-[color:var(--brand-navy)] to-[color:var(--brand-ink)]" />
            <HeroOverlay
              name={programName}
              tagline={programTagline}
              zone={program.zone}
              type={program.type}
              status={statusChip}
              featured={program.featured}
              c={c}
            />
          </div>
        )}
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 pt-8 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            {tNav('home')}
          </Link>
          <span>/</span>
          <Link href="/a-la-une" className="hover:text-foreground">
            {tNav('featured')}
          </Link>
          <span>/</span>
          <span className="text-foreground">{programName}</span>
        </nav>

        {/* Summary strip — big numbers with context */}
        <section className="mb-10 grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-5 sm:grid-cols-4 sm:p-6">
          <Metric label={c.metricZone} value={program.zone} />
          <Metric label={c.metricType} value={typeLabel(program.type, c)} />
          <Metric
            label={c.metricAvailable}
            value={`${availableLots.length}/${program.lots.length}`}
            accent
          />
          <Metric
            label={c.metricPriceFrom}
            value={
              minPrice
                ? maxPrice && minPrice !== maxPrice
                  ? `${formatFCFA(minPrice, l)} — ${formatFCFA(maxPrice, l)}`
                  : formatFCFA(minPrice, l)
                : c.priceOnRequest
            }
          />
        </section>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {/* Description */}
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
                {c.aboutTitle}
              </h2>
              <div
                className="rich-text max-w-3xl text-base leading-relaxed text-muted"
                dangerouslySetInnerHTML={{ __html: tr(program.description, l) }}
              />
            </section>

            {/* Highlights (always-on sales pointers) */}
            <section>
              <h2 className="mb-5 font-display text-2xl font-semibold text-foreground">
                {c.whyTitle}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <HighlightCard icon={<IconShield />} title={c.highlights.licensed.title} body={c.highlights.licensed.body} />
                <HighlightCard icon={<IconACD />} title={c.highlights.acd.title} body={c.highlights.acd.body} />
                <HighlightCard icon={<IconPin />} title={c.highlights.location.title(program.zone)} body={c.highlights.location.body} />
                <HighlightCard icon={<IconAgent />} title={c.highlights.agent.title} body={c.highlights.agent.body} />
              </div>
            </section>

            {/* Gallery */}
            {gallery.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
                  {c.galleryTitle}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {gallery.map((m) => (
                    <div
                      key={m.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[color:var(--border)] bg-surface-muted"
                    >
                      <Image
                        src={m.url}
                        alt={tr(m.alt, l) || programName}
                        fill
                        sizes="(min-width: 640px) 24vw, 48vw"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Plans */}
            {program.plans.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
                  {c.plansTitle}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {program.plans.map((p) => {
                    const label = tr(p.label, l)
                    return (
                      <li key={p.id}>
                        <a
                          href={p.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-[color:var(--brand-navy)] hover:bg-[color:var(--brand-navy)] hover:text-white"
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6M8 13h8M8 17h5" />
                          </svg>
                          <span className="flex-1 truncate">{label}</span>
                          <span className="text-xs uppercase tracking-wider">PDF</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {/* Lots */}
            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {tLot('availableLots')}
                </h2>
                <span className="text-sm text-muted">
                  {program.lots.length} {tLot('lots')}
                </span>
              </div>

              {/* Lot status filters */}
              <div className="mb-5 flex flex-wrap gap-2">
                {([
                  ['all', c.lotFilters.all, program.lots.length],
                  ['available', c.lotFilters.available, availableLots.length],
                  ['reserved', c.lotFilters.reserved, reservedLots.length],
                  ['sold', c.lotFilters.sold, soldLots.length],
                ] as const).map(([key, label, count]) => {
                  const active = lotFilter === key
                  return (
                    <Link
                      key={key}
                      href={buildLotsHref(key)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-transparent bg-[color:var(--brand-navy)] text-white'
                          : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
                      }`}
                    >
                      {label}
                      <span
                        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                          active ? 'bg-white/20 text-white' : 'bg-surface-muted text-muted'
                        }`}
                      >
                        {count}
                      </span>
                    </Link>
                  )
                })}
              </div>

              {filteredLots.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-8 text-center text-sm text-muted">
                  {tLot('none')}
                </p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredLots.map((lot) => {
                    const cover = lot.media[0]
                    return (
                      <Link
                        key={lot.id}
                        href={`/a-la-une/${slug}/lots/${lot.reference}`}
                        className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
                          {cover ? (
                            <Image
                              src={cover.url}
                              alt={tr(cover.alt, l) || lot.reference}
                              fill
                              sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted">
                              Photo
                            </div>
                          )}
                          <LotStatusBadge
                            status={lot.status}
                            labels={{
                              available: tLot('statusAvailable'),
                              reserved: tLot('statusReserved'),
                              sold: tLot('statusSold'),
                            }}
                          />
                          {lot.virtualTourUrl && (
                            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[color:var(--brand-navy)] shadow">
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
                              </svg>
                              360°
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 p-5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-red)]">
                              {lot.reference}
                            </span>
                            <span className="text-xs text-muted">
                              {formatSurface(lot.surfaceM2, l)}
                            </span>
                          </div>
                          <h3 className="font-display text-lg font-semibold leading-tight text-foreground">
                            {tr(lot.title, l) || tLot('lot')}
                          </h3>
                          {lot.highlights && (
                            <p className="line-clamp-2 text-sm text-muted">
                              {tr(lot.highlights, l)}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 text-sm">
                            <span className="font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                              {formatFCFA(lot.priceFCFA, l)}
                            </span>
                            {lot.bedrooms && (
                              <span className="text-xs text-muted">
                                {lot.bedrooms} ch · {lot.bathrooms ?? 0} sdb
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar — sticky contact / reserve card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-surface p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,.25)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-red)]">
                {c.sidebarEyebrow}
              </p>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {c.sidebarTitle}
              </h3>
              {minPrice ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    {c.metricPriceFrom}
                  </p>
                  <p className="font-display text-2xl font-semibold text-[color:var(--brand-red)]">
                    {formatFCFA(minPrice, l)}
                  </p>
                </div>
              ) : null}
              <p className="text-sm leading-relaxed text-muted">{c.sidebarBody}</p>
              <div className="flex flex-col gap-2 pt-1">
                {availableLots[0] ? (
                  <Link
                    href={`/a-la-une/${slug}/lots/${availableLots[0].reference}`}
                    className="inline-flex items-center justify-center rounded-full bg-[color:var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-red-600)]"
                  >
                    {c.sidebarReserveCta}
                  </Link>
                ) : null}
                <Link
                  href={`/contacts`}
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
                >
                  {c.sidebarVisitCta}
                </Link>
              </div>
              <div className="border-t border-[color:var(--border)] pt-4 text-xs text-muted">
                <p className="font-semibold text-foreground">{c.sidebarTrustLine1}</p>
                <p className="mt-1">{c.sidebarTrustLine2}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────

function HeroOverlay({
  name,
  tagline,
  zone,
  type,
  status,
  featured,
  c,
}: {
  name: string
  tagline: string
  zone: string
  type: string
  status: { label: string; tone: 'emerald' | 'amber' | 'zinc' | 'navy' }
  featured: boolean
  c: ReturnType<typeof copy>
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end">
      <div className="pointer-events-auto mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-16">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
          {featured && (
            <span className="rounded-full bg-[color:var(--brand-red)] px-2.5 py-1 text-white">
              {c.featuredBadge}
            </span>
          )}
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
            {typeLabel(type, c)}
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{zone}</span>
          <StatusPill tone={status.tone} label={status.label} />
        </div>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          {name}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
          {tagline}
        </p>
      </div>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p
        className={`mt-1.5 font-display text-xl font-semibold leading-tight sm:text-2xl ${
          accent ? 'text-[color:var(--brand-red)]' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function HighlightCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  )
}

function StatusPill({ tone, label }: { tone: 'emerald' | 'amber' | 'zinc' | 'navy'; label: string }) {
  const map = {
    emerald: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-white',
    zinc: 'bg-zinc-900 text-white',
    navy: 'bg-[color:var(--brand-navy)] text-white',
  } as const
  return <span className={`rounded-full px-2.5 py-1 ${map[tone]}`}>{label}</span>
}

function LotStatusBadge({
  status,
  labels,
}: {
  status: string
  labels: { available: string; reserved: string; sold: string }
}) {
  const cfg =
    status === 'sold'
      ? { label: labels.sold, className: 'bg-zinc-900 text-white' }
      : status === 'reserved'
        ? { label: labels.reserved, className: 'bg-amber-500 text-white' }
        : { label: labels.available, className: 'bg-[color:var(--brand-red)] text-white' }
  return (
    <span
      className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider shadow ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function typeLabel(
  type: string,
  c: ReturnType<typeof copy>,
): string {
  const map = c.typeLabels as Record<string, string>
  return map[type] ?? type
}

function statusLabel(
  status: string,
  c: ReturnType<typeof copy>,
): { label: string; tone: 'emerald' | 'amber' | 'zinc' | 'navy' } {
  const map = c.statusLabels as Record<string, { label: string; tone: 'emerald' | 'amber' | 'zinc' | 'navy' }>
  return map[status] ?? { label: status, tone: 'navy' }
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
function IconACD() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  )
}
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function IconAgent() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function copy(l: Locale) {
  const fr = {
    featuredBadge: 'À la une',
    aboutTitle: 'Le programme',
    whyTitle: 'Pourquoi ce programme',
    galleryTitle: 'Galerie',
    plansTitle: 'Plans & catalogues',
    metricZone: 'Zone',
    metricType: 'Type',
    metricAvailable: 'Lots disponibles',
    metricPriceFrom: 'À partir de',
    priceOnRequest: 'Sur demande',
    lotFilters: {
      all: 'Tous',
      available: 'Disponibles',
      reserved: 'Réservés',
      sold: 'Vendus',
    },
    typeLabels: {
      TERRAIN: 'Terrain',
      MAISON: 'Maison',
      LOTISSEMENT: 'Lotissement',
    } as const,
    statusLabels: {
      ON_SALE: { label: 'En commercialisation', tone: 'emerald' as const },
      DRAFT: { label: 'Bientôt', tone: 'navy' as const },
      SOLD_OUT: { label: 'Complet', tone: 'zinc' as const },
      DELIVERED: { label: 'Livré', tone: 'navy' as const },
    } as const,
    highlights: {
      licensed: {
        title: 'Promoteur agréé',
        body: 'Opéré par FirstClass Immobilier, promoteur agréé par le Ministère de la Construction.',
      },
      acd: {
        title: 'ACD inclus',
        body: 'Procédure ACD prise en charge : vous devenez propriétaire opposable, sans démarche personnelle.',
      },
      location: {
        title: (zone: string) => `Emplacement — ${zone}`,
        body: 'Zone choisie pour son potentiel résidentiel, son accès et ses infrastructures à proximité.',
      },
      agent: {
        title: 'Agent dédié',
        body: 'Un commercial unique de la visite jusqu\u2019à la remise des clés, pour un suivi cohérent.',
      },
    },
    sidebarEyebrow: 'Intéressé ?',
    sidebarTitle: 'Lancez votre projet',
    sidebarBody:
      'Réservez un lot en ligne ou planifiez une visite — un agent vous recontacte sous 24 h ouvrées.',
    sidebarReserveCta: 'Réserver un lot disponible',
    sidebarVisitCta: 'Demander une visite',
    sidebarTrustLine1: 'Paiement sécurisé · ACD inclus',
    sidebarTrustLine2: 'Échéancier adaptable · Espace client à vie',
  }
  const en = {
    featuredBadge: 'Featured',
    aboutTitle: 'About this program',
    whyTitle: 'Why this program',
    galleryTitle: 'Gallery',
    plansTitle: 'Plans & catalogs',
    metricZone: 'Zone',
    metricType: 'Type',
    metricAvailable: 'Available lots',
    metricPriceFrom: 'From',
    priceOnRequest: 'On request',
    lotFilters: {
      all: 'All',
      available: 'Available',
      reserved: 'Reserved',
      sold: 'Sold',
    },
    typeLabels: {
      TERRAIN: 'Land',
      MAISON: 'Home',
      LOTISSEMENT: 'Subdivision',
    } as const,
    statusLabels: {
      ON_SALE: { label: 'On sale', tone: 'emerald' as const },
      DRAFT: { label: 'Coming soon', tone: 'navy' as const },
      SOLD_OUT: { label: 'Sold out', tone: 'zinc' as const },
      DELIVERED: { label: 'Delivered', tone: 'navy' as const },
    } as const,
    highlights: {
      licensed: {
        title: 'Licensed developer',
        body: 'Operated by FirstClass Immobilier, a licensed developer recognized by the Ministry of Construction.',
      },
      acd: {
        title: 'ACD included',
        body: 'ACD procedure handled end-to-end: you become the enforceable owner with no paperwork on your side.',
      },
      location: {
        title: (zone: string) => `Location — ${zone}`,
        body: 'Zone selected for residential potential, access, and nearby infrastructure.',
      },
      agent: {
        title: 'Dedicated agent',
        body: 'A single advisor from the first visit to the keys handover — consistent support throughout.',
      },
    },
    sidebarEyebrow: 'Interested?',
    sidebarTitle: 'Start your project',
    sidebarBody: 'Reserve a lot online or book a site visit — an agent gets back to you within 24 working hours.',
    sidebarReserveCta: 'Reserve an available lot',
    sidebarVisitCta: 'Request a visit',
    sidebarTrustLine1: 'Secure payments · ACD included',
    sidebarTrustLine2: 'Flexible schedule · Lifetime client portal',
  }
  return l === 'fr' ? fr : en
}
