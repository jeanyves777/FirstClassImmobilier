import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { StatCounter } from '@/components/fci/StatCounter'
import { prisma } from '@/lib/db'
import { FOUNDING_YEAR, getSiteConfig, whatsappLink, type CountryOffice } from '@/lib/site'
import { tr } from '@/lib/zod/localized'
import { formatFCFA } from '@/lib/format'
import type { Locale } from '@/i18n/routing'
import { buildSeo } from '@/lib/seo'
import { JsonLd, realEstateAgentLd } from '@/lib/seo/structured-data'
import { HeroSlideshow } from '@/components/fci/HeroSlideshow'
import { HERO_SLIDES } from '@/lib/stock-images'
import {
  VillaSkyline,
  DiasporaGlobe,
  AcdDocument,
  KeyHandover,
  GrowthChart,
} from '@/components/fci/illustrations'
import { ReviewsSection } from '@/components/fci/ReviewsSection'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  return buildSeo({
    locale: l,
    path: '/',
    title:
      l === 'fr'
        ? 'FirstClass Immobilier — Promoteur immobilier agréé à Abidjan'
        : 'FirstClass Immobilier — Licensed real-estate developer in Abidjan',
    description:
      l === 'fr'
        ? 'Terrains viabilisés, maisons clé en main et lotissements premium à Abidjan et dans le Grand Abidjan. Promoteur agréé, ACD inclus, accompagnement diaspora à distance.'
        : 'Serviced land, turn-key homes and premium subdivisions across Abidjan and Greater Abidjan. Licensed developer, ACD included, full diaspora support from abroad.',
    keywords: [
      'FirstClass Immobilier',
      'promoteur immobilier Abidjan',
      'terrain Abidjan',
      'ACD',
      'Côte d\u2019Ivoire',
      'immobilier diaspora',
    ],
  })
}

async function getStats() {
  const row = await prisma.siteStats.findUnique({ where: { id: 1 } })
  const base = row ?? {
    yearsExperience: 8,
    satisfiedClients: 350,
    projectsCount: 7,
    landsSold: 450,
    housesBuilt: 57,
    acdDelivered: 380,
  }
  // Per the client brief, the years counter must auto-increment each calendar year
  // from the founding year. The admin-edited value acts as a floor so marketing
  // can bump it past the natural increment if they want.
  const computedYears = Math.max(0, new Date().getFullYear() - FOUNDING_YEAR)
  return { ...base, yearsExperience: Math.max(computedYears, base.yearsExperience ?? 0) }
}

async function getFeaturedPrograms() {
  const programs = await prisma.program.findMany({
    where: { featured: true, status: 'ON_SALE' },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: {
      lots: { select: { status: true, priceFCFA: true } },
    },
  })
  const heroIds = programs.map((p) => p.heroMediaId).filter((v): v is string => !!v)
  const media = heroIds.length
    ? await prisma.media.findMany({ where: { id: { in: heroIds } }, select: { id: true, url: true } })
    : []
  const urlById = new Map(media.map((m) => [m.id, m.url]))
  return programs.map((p) => {
    const available = p.lots.filter((l) => l.status === 'available')
    const prices = available.map((l) => l.priceFCFA).filter((v): v is bigint => typeof v === 'bigint')
    const minPrice = prices.length ? prices.reduce((a, b) => (a < b ? a : b)) : null
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      zone: p.zone,
      type: p.type,
      availableLots: available.length,
      totalLots: p.lots.length,
      minPrice,
      heroUrl: p.heroMediaId ? urlById.get(p.heroMediaId) ?? null : null,
    }
  })
}

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  const tNav = await getTranslations('nav')
  const tLot = await getTranslations('lot')
  const [stats, featured, site] = await Promise.all([
    getStats(),
    getFeaturedPrograms(),
    getSiteConfig(),
  ])
  const l = locale as Locale

  return (
    <div className="flex flex-col">
      <JsonLd data={realEstateAgentLd(site, l)} />
      {/* Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[480px] overflow-hidden sm:min-h-[560px] lg:min-h-[620px]">
        <div className="absolute inset-0">
          <HeroSlideshow
            slides={HERO_SLIDES.map((s) => ({ src: s.src, alt: s.alt[l] }))}
            className="h-full w-full"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[color:var(--brand-navy)]/75 via-[color:var(--brand-navy-700)]/55 to-[color:var(--brand-ink)]/70"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(200,16,46,.3),transparent_55%),radial-gradient(circle_at_90%_80%,rgba(255,255,255,.08),transparent_60%)]"
        />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 pb-16 pt-20 text-white sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pb-24 lg:pt-28">
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

      {/* Counters ────────────────────────────────────────── */}
      <section className="relative -mt-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 rounded-2xl border border-[color:var(--border)] bg-surface p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,.25)] sm:grid-cols-4 sm:p-10">
          <StatCounter value={stats.yearsExperience} label={t('counters.years')} />
          <StatCounter value={stats.satisfiedClients} label={t('counters.clients')} />
          <StatCounter value={stats.projectsCount} label={t('counters.projects')} />
          <CountryCounter
            label={t('counters.countries')}
            offices={[...site.countries]}
            locale={l}
            tbdLabel={l === 'fr' ? '— à compléter —' : '— coming soon —'}
          />
        </div>
      </section>

      {/* USP strip ───────────────────────────────────────── */}
      <section className="mx-auto mt-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
            {t('usp.eyebrow')}
          </p>
        </header>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <UspCard icon={<IconShieldCheck />} title={t('usp.licensed.title')} body={t('usp.licensed.body')} />
          <UspCard icon={<IconHome />} title={t('usp.experience.title')} body={t('usp.experience.body')} />
          <UspCard icon={<IconDocument />} title={t('usp.acd.title')} body={t('usp.acd.body')} />
          <UspCard icon={<IconGlobe />} title={t('usp.diaspora.title')} body={t('usp.diaspora.body')} />
        </div>
      </section>

      {/* Featured programs ──────────────────────────────── */}
      <section className="mx-auto mt-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {t('featured.eyebrow')}
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {t('featured.title')}
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">{t('featured.subtitle')}</p>
          </div>
          <Link
            href="/a-la-une"
            className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted"
          >
            {t('featured.viewAll')}
            <span aria-hidden>→</span>
          </Link>
        </header>

        {featured.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
            {t('featured.empty')}
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
              >
                <div
                  className="aspect-[16/10] w-full bg-cover bg-center bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]"
                  style={p.heroUrl ? { backgroundImage: `url(${p.heroUrl})` } : undefined}
                />
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">{p.type}</span>
                    <span>·</span>
                    <span>{p.zone}</span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold text-foreground">
                    <Link href={`/a-la-une/${p.slug}`} className="hover:underline">
                      {tr(p.name, l)}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{tr(p.tagline, l)}</p>
                  <div className="mt-4 flex items-end justify-between gap-3 text-xs">
                    <div className="text-muted">
                      <span className="font-semibold text-foreground">{p.availableLots}</span>/{p.totalLots}{' '}
                      {tLot('lots')}
                    </div>
                    {p.minPrice && (
                      <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-muted">
                          {l === 'fr' ? 'À partir de' : 'From'}
                        </span>
                        <span className="font-display text-base font-semibold text-[color:var(--brand-red)]">
                          {formatFCFA(p.minPrice, l)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials / Google reviews ─────────────────────── */}
      <ReviewsSection
        locale={l}
        className="mt-24"
        limit={6}
        eyebrow={l === 'fr' ? 'Ils nous ont fait confiance' : 'They trusted us'}
        title={l === 'fr' ? 'Avis de nos clients' : 'What clients say'}
        subtitle={
          l === 'fr'
            ? 'Témoignages et avis Google vérifiés — diaspora et familles locales qui expliquent ce qui fait la différence FCI.'
            : 'Testimonials and verified Google reviews — diaspora and local families sharing what makes FCI different.'
        }
      />

      {/* Products / What we offer ───────────────────────── */}
      <section className="mx-auto mt-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
            {t('products.eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {t('products.title')}
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">{t('products.subtitle')}</p>
        </header>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <ProductCard index="01" title={t('products.items.land.title')} body={t('products.items.land.body')} />
          <ProductCard index="02" title={t('products.items.house.title')} body={t('products.items.house.body')} />
          <ProductCard index="03" title={t('products.items.lotissement.title')} body={t('products.items.lotissement.body')} />
          <ProductCard index="04" title={t('products.items.support.title')} body={t('products.items.support.body')} />
        </div>
      </section>

      {/* Final CTA ──────────────────────────────────────── */}
      <section className="mt-24 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl bg-[color:var(--brand-navy)] p-10 text-white sm:p-16">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(200,16,46,.35),transparent_55%),radial-gradient(circle_at_10%_100%,rgba(255,255,255,.08),transparent_60%)]"
          />
          <DiasporaGlobe
            aria-hidden
            className="pointer-events-none absolute -right-12 top-1/2 hidden h-[360px] w-[360px] -translate-y-1/2 opacity-[0.18] sm:block"
          />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
                {t('cta.eyebrow')}
              </p>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {t('cta.title')}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                {t('cta.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contacts"
                className="inline-flex items-center rounded-full bg-[color:var(--brand-red)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(200,16,46,.6)] transition-colors hover:bg-[color:var(--brand-red-600)]"
              >
                {t('cta.primary')}
              </Link>
              <a
                href={whatsappLink(
                  l === 'fr'
                    ? `Bonjour FirstClass Immobilier, j'aimerais échanger au sujet d'un projet.`
                    : `Hello FirstClass Immobilier, I'd like to discuss a real-estate project.`,
                  site.whatsapp,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                <IconWhatsApp />
                {t('cta.secondary')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom padding */}
      <div className="h-24" />
    </div>
  )
}

function UspCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-[color:var(--border)] bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_24px_60px_-30px_rgba(15,23,42,.3)]">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  )
}

function ProductCard({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_24px_60px_-30px_rgba(15,23,42,.3)]">
      <span className="absolute right-4 top-4 font-display text-4xl font-semibold text-[color:var(--brand-red)]/10">
        {index}
      </span>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  )
}

function CountryCounter({
  label,
  offices,
  locale,
  tbdLabel,
}: {
  label: string
  offices: CountryOffice[]
  locale: Locale
  tbdLabel: string
}) {
  return (
    <details className="group flex flex-col items-center text-center">
      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <span className="font-display text-4xl font-semibold tracking-tight text-[color:var(--brand-navy)] dark:text-foreground sm:text-5xl">
          {offices.length}
          <span className="text-[color:var(--brand-red)]">+</span>
        </span>
        <span className="mt-2 block text-sm uppercase tracking-[0.18em] text-muted">{label}</span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs text-[color:var(--brand-navy)] underline underline-offset-4 dark:text-foreground/80 group-open:hidden">
          ▾
        </span>
      </summary>
      <ul className="mt-4 grid w-full gap-3 text-left sm:grid-cols-2">
        {offices.map((c) => (
          <li
            key={c.code}
            className="rounded-xl border border-[color:var(--border)] bg-surface-muted p-3"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-2xl leading-none">
                {c.flag}
              </span>
              <span className="font-display text-sm font-semibold text-foreground">
                {locale === 'fr' ? c.nameFr : c.nameEn}
              </span>
            </div>
            <dl className="mt-2 space-y-1 text-[11px] leading-snug text-muted">
              <div>
                <dt className="sr-only">{locale === 'fr' ? 'Adresse' : 'Address'}</dt>
                <dd>{c.address ?? tbdLabel}</dd>
              </div>
              {c.phone && (
                <div>
                  <dt className="sr-only">{locale === 'fr' ? 'Téléphone' : 'Phone'}</dt>
                  <dd>
                    <a className="hover:text-foreground" href={`tel:${c.phone.replace(/\s/g, '')}`}>
                      {c.phone}
                    </a>
                  </dd>
                </div>
              )}
              {c.whatsapp && (
                <div>
                  <dt className="sr-only">WhatsApp</dt>
                  <dd>
                    <a
                      className="hover:text-foreground"
                      href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </dd>
                </div>
              )}
              {c.email && (
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd>
                    <a className="hover:text-foreground" href={`mailto:${c.email}`}>
                      {c.email}
                    </a>
                  </dd>
                </div>
              )}
              {!c.phone && !c.whatsapp && !c.email && <div>{tbdLabel}</div>}
            </dl>
          </li>
        ))}
      </ul>
    </details>
  )
}

// Inline icon set
function IconShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}
function IconDocument() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  )
}
function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 3 20.1L2 23l2.9-1a11 11 0 0 0 16.6-14.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-2.7.7.7-2.7-.2-.3A9 9 0 1 1 12 21Zm4.9-6.6c-.3-.2-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.2l-.9 1.1c-.2.2-.3.2-.6.1a7 7 0 0 1-2-1.3 7.5 7.5 0 0 1-1.4-1.8c-.2-.3 0-.5.1-.6l.4-.5c.1-.1.2-.3.3-.4 0-.2 0-.4 0-.5 0-.1-.6-1.4-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4 0-.6.3a2.6 2.6 0 0 0-.8 1.9c0 1.1.8 2.2.9 2.3.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.6.2 1.1.1 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  )
}
