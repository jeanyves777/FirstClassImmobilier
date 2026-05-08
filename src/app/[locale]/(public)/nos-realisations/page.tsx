import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { PageShell } from '@/components/fci/PageShell'
import { StatCounter } from '@/components/fci/StatCounter'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { buildSeo } from '@/lib/seo'
import { PORTFOLIO_IMAGES } from '@/lib/stock-images'
import { KeyHandover, GrowthChart } from '@/components/fci/illustrations'
import {
  CategoryExplorer,
  type CategoryExplorerItem,
  type CategoryProgram,
  type CategoryZoneGroup,
} from '@/components/fci/CategoryExplorer'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/nos-realisations'>): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  return buildSeo({
    locale: l,
    path: '/nos-realisations',
    title:
      l === 'fr'
        ? 'Nos réalisations — FirstClass Immobilier'
        : 'Our deliveries — FirstClass Immobilier',
    description:
      l === 'fr'
        ? 'Programmes livrés, lotissements, maisons et terrains. Plus de 380 ACD délivrés, 450+ lots vendus, 57+ maisons construites à travers Abidjan.'
        : 'Delivered programs, subdivisions, homes and plots. 380+ ACD issued, 450+ lots sold, 57+ homes built across Abidjan.',
  })
}

export default async function RealisationsPage({
  params,
}: PageProps<'/[locale]/nos-realisations'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('realisations')
  const l = locale as Locale

  const [stats, delivered, onSale, allPrograms, testimonials] = await Promise.all([
    prisma.siteStats.findUnique({ where: { id: 1 } }),
    prisma.program.findMany({
      where: { status: 'DELIVERED' },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.program.findMany({
      where: { status: 'ON_SALE' },
      select: { type: true, zone: true, lots: { select: { status: true } } },
    }),
    // Every published program (any status) — used by the click-to-expand
    // category explorer that groups programs per zone.
    prisma.program.findMany({
      orderBy: [{ zone: 'asc' }, { updatedAt: 'desc' }],
      select: {
        slug: true,
        name: true,
        type: true,
        zone: true,
        status: true,
        lots: { select: { status: true } },
      },
    }),
    prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: 3,
    }),
  ])

  // Hero images for delivered programs
  const heroIds = delivered.map((p) => p.heroMediaId).filter((v): v is string => !!v)
  const media = heroIds.length
    ? await prisma.media.findMany({
        where: { id: { in: heroIds } },
        select: { id: true, url: true },
      })
    : []
  const urlById = new Map(media.map((m) => [m.id, m.url]))

  // Aggregate live footprint by type
  const byType = aggregateByType(onSale, delivered)
  const zones = Array.from(
    new Set([...onSale, ...delivered].map((p) => p.zone)),
  ).filter(Boolean)

  const c = copy(l)

  // Group programs by type → zone for the click-to-expand explorer.
  const zonesByType = groupZonesByType(allPrograms, l)

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      {/* Intro metrics + portfolio visual */}
      <section className="mb-14 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <StatCounter value={stats?.satisfiedClients ?? 350} label={t('counters.clients')} />
            <StatCounter value={stats?.landsSold ?? 450} label={t('counters.landsSold')} />
            <StatCounter value={stats?.housesBuilt ?? 57} label={t('counters.housesBuilt')} />
            <StatCounter value={stats?.acdDelivered ?? 380} label={t('counters.acd')} />
            <StatCounter value={stats?.projectsCount ?? 7} label={t('counters.projects')} />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)]">
          <Image
            src={PORTFOLIO_IMAGES.delivered.src}
            alt={PORTFOLIO_IMAGES.delivered.alt[l]}
            fill
            sizes="(min-width: 1024px) 38vw, 100vw"
            className="object-cover"
          />
          <div className="relative h-[260px] w-full lg:h-full" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand-red)]">
              <KeyHandover aria-hidden className="h-5 w-8 [filter:brightness(0)_invert(1)]" />
            </span>
            <p className="text-sm font-semibold">
              {l === 'fr' ? 'Plus de 380 ACD livrés' : '380+ ACD delivered'}
            </p>
          </div>
        </div>
      </section>

      {/* Categories — interactive 3-window explorer per client brief */}
      <section className="mb-16">
        <SectionHeader eyebrow={c.categories.eyebrow} title={c.categories.title} intro={c.categories.intro} />
        <div className="mt-8">
          <CategoryExplorer
            items={[
              {
                slug: 'TERRAIN',
                label: t('categories.terrains'),
                body: c.categories.terrainsBody,
                bullets: c.categories.terrainsBullets,
                count: byType.TERRAIN.total,
                countLabel: c.categories.countLabel,
                availableLots: byType.TERRAIN.available,
                availableLabel: c.categories.availableLabel,
                zones: zonesByType.TERRAIN,
                emptyZonesLabel: c.categories.emptyZonesLabel,
                icon: <IconArea />,
              },
              {
                slug: 'MAISON',
                label: t('categories.maisons'),
                body: c.categories.maisonsBody,
                bullets: c.categories.maisonsBullets,
                count: byType.MAISON.total,
                countLabel: c.categories.countLabel,
                availableLots: byType.MAISON.available,
                availableLabel: c.categories.availableLabel,
                zones: zonesByType.MAISON,
                emptyZonesLabel: c.categories.emptyZonesLabel,
                icon: <IconHome />,
              },
              {
                slug: 'LOTISSEMENT',
                label: t('categories.lotissements'),
                body: c.categories.lotissementsBody,
                bullets: c.categories.lotissementsBullets,
                count: byType.LOTISSEMENT.total,
                countLabel: c.categories.countLabel,
                availableLots: byType.LOTISSEMENT.available,
                availableLabel: c.categories.availableLabel,
                zones: zonesByType.LOTISSEMENT,
                emptyZonesLabel: c.categories.emptyZonesLabel,
                icon: <IconGrid />,
              },
            ] satisfies CategoryExplorerItem[]}
            expandLabel={c.categories.expandLabel}
            collapseLabel={c.categories.collapseLabel}
            zonesLabel={c.categories.zonesLabel}
            statusLabels={c.statusLabels}
          />
        </div>
      </section>

      {/* Delivered programs — case study strip */}
      {delivered.length > 0 && (
        <section className="mb-16">
          <SectionHeader eyebrow={c.delivered.eyebrow} title={c.delivered.title} intro={c.delivered.intro} />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {delivered.map((p) => {
              const heroUrl = p.heroMediaId ? urlById.get(p.heroMediaId) : undefined
              return (
                <Link
                  key={p.id}
                  href={`/a-la-une/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
                >
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]">
                    {heroUrl && (
                      <Image
                        src={heroUrl}
                        alt={tr(p.name, l)}
                        fill
                        sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                      {c.delivered.badge}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] uppercase tracking-wider text-muted">
                      {typeLabel(p.type, c)} · {p.zone}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold leading-tight text-foreground">
                      {tr(p.name, l)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{tr(p.tagline, l)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Geographic footprint */}
      <section className="mb-16 rounded-2xl bg-[color:var(--brand-navy)] p-8 text-white sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {c.footprint.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
              {c.footprint.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{c.footprint.intro}</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {(zones.length ? zones : c.footprint.fallbackZones).map((z) => (
              <li
                key={z}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur"
              >
                {z}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <section className="mb-16">
          <SectionHeader
            eyebrow={c.testimonialsBlock.eyebrow}
            title={c.testimonialsBlock.title}
            intro={c.testimonialsBlock.intro}
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((ti) => (
              <article
                key={ti.id}
                className="flex h-full flex-col rounded-2xl border border-[color:var(--border)] bg-surface p-6"
              >
                <svg viewBox="0 0 24 24" className="mb-3 h-6 w-6 text-[color:var(--brand-red)]" fill="currentColor" aria-hidden>
                  <path d="M7 11a4 4 0 1 1 0 8 8 8 0 0 1 8-8V6a12 12 0 0 0-12 12 6 6 0 0 0 12 0 6 6 0 0 0-8-5.66V11zM24 11a4 4 0 1 1 0 8 8 8 0 0 1 8-8V6a12 12 0 0 0-12 12 6 6 0 0 0 12 0 6 6 0 0 0-8-5.66V11z" />
                </svg>
                <p className="flex-1 text-sm leading-relaxed text-foreground">
                  « {tr(ti.quote, l)} »
                </p>
                <div className="mt-5 border-t border-[color:var(--border)] pt-4">
                  <p className="font-semibold text-foreground">{ti.authorName}</p>
                  {ti.authorRole && (
                    <p className="text-[11px] uppercase tracking-wider text-muted">
                      {ti.authorRole}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-16">
          <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-8 sm:p-10">
            <svg viewBox="0 0 24 24" className="mb-4 h-8 w-8 text-[color:var(--brand-red)]" fill="currentColor" aria-hidden>
              <path d="M7 11a4 4 0 1 1 0 8 8 8 0 0 1 8-8V6a12 12 0 0 0-12 12 6 6 0 0 0 12 0 6 6 0 0 0-8-5.66V11zM24 11a4 4 0 1 1 0 8 8 8 0 0 1 8-8V6a12 12 0 0 0-12 12 6 6 0 0 0 12 0 6 6 0 0 0-8-5.66V11z" />
            </svg>
            <p className="max-w-3xl font-display text-xl leading-relaxed text-foreground sm:text-2xl">
              {c.testimonial.quote}
            </p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted">
              {c.testimonial.author}
            </p>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-8 sm:p-10">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              {c.finalCta.title}
            </h2>
            <p className="mt-2 text-sm text-muted sm:text-base">{c.finalCta.body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/a-la-une"
              className="inline-flex items-center rounded-full bg-[color:var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-red-600)]"
            >
              {c.finalCta.primary}
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              {c.finalCta.secondary}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────

type TypeAgg = { total: number; available: number }
type ZoneSlice = { type: string; zone: string; lots: { status: string }[] }

/**
 * Group every program by category type → zone, and turn each entry into the
 * lightweight shape the <CategoryExplorer> client component consumes.
 */
function groupZonesByType(
  programs: {
    slug: string
    name: string
    type: string
    zone: string
    status: string
    lots: { status: string }[]
  }[],
  l: Locale,
): Record<'TERRAIN' | 'MAISON' | 'LOTISSEMENT', CategoryZoneGroup[]> {
  const buckets: Record<'TERRAIN' | 'MAISON' | 'LOTISSEMENT', Map<string, CategoryProgram[]>> = {
    TERRAIN: new Map(),
    MAISON: new Map(),
    LOTISSEMENT: new Map(),
  }
  for (const p of programs) {
    const k = (p.type as keyof typeof buckets) ?? null
    if (!k || !(k in buckets)) continue
    const list = buckets[k].get(p.zone) ?? []
    list.push({
      slug: p.slug,
      name: tr(p.name, l) || p.slug,
      status: (p.status as CategoryProgram['status']) ?? 'ON_SALE',
      availableLots: p.lots.filter((lot) => lot.status === 'available').length,
      totalLots: p.lots.length,
    })
    buckets[k].set(p.zone, list)
  }
  const toGroups = (m: Map<string, CategoryProgram[]>): CategoryZoneGroup[] =>
    Array.from(m.entries()).map(([zone, programsInZone]) => ({ zone, programs: programsInZone }))
  return {
    TERRAIN: toGroups(buckets.TERRAIN),
    MAISON: toGroups(buckets.MAISON),
    LOTISSEMENT: toGroups(buckets.LOTISSEMENT),
  }
}

function aggregateByType(onSale: ZoneSlice[], delivered: { type: string; zone: string }[]) {
  const base: Record<'TERRAIN' | 'MAISON' | 'LOTISSEMENT', TypeAgg> = {
    TERRAIN: { total: 0, available: 0 },
    MAISON: { total: 0, available: 0 },
    LOTISSEMENT: { total: 0, available: 0 },
  }
  for (const p of onSale) {
    const k = (p.type as keyof typeof base) ?? 'LOTISSEMENT'
    if (!(k in base)) continue
    base[k].total += 1
    base[k].available += p.lots.filter((l) => l.status === 'available').length
  }
  for (const p of delivered) {
    const k = (p.type as keyof typeof base) ?? 'LOTISSEMENT'
    if (!(k in base)) continue
    base[k].total += 1
  }
  return base
}

function typeLabel(t: string, c: ReturnType<typeof copy>) {
  return c.typeLabels[t as keyof typeof c.typeLabels] ?? t
}

// ─────────────────────────────────────────────────────────────────────────
// Components
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

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function IconArea() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
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
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function copy(l: Locale) {
  const fr = {
    typeLabels: { TERRAIN: 'Terrain', MAISON: 'Maison', LOTISSEMENT: 'Lotissement' } as const,
    statusLabels: {
      ON_SALE: 'En vente',
      SOLD_OUT: 'Complet',
      DELIVERED: 'Livré',
      COMING_SOON: 'À venir',
      PAUSED: 'En pause',
    } as const,
    categories: {
      eyebrow: 'Notre catalogue',
      title: 'Trois familles de produits',
      intro:
        'Chaque famille a son propre cycle — délais, démarches, échéanciers. Nous maîtrisons les trois.',
      countLabel: 'programmes',
      availableLabel: 'lots disponibles',
      expandLabel: 'Voir par zone',
      collapseLabel: 'Refermer',
      zonesLabel: 'Programmes par zone',
      emptyZonesLabel: 'Aucun programme publié pour cette catégorie pour le moment.',
      terrainsBody:
        'Parcelles bornées, viabilisées, livrées avec ACD en procédure — de 250 m² pour l\u2019investissement à 600+ m² pour la résidence familiale.',
      terrainsBullets: ['Bornage officiel', 'Eau + électricité à proximité', 'ACD inclus au parcours'],
      maisonsBody:
        'Villas et duplex conçus par nos architectes, livrés finis : structure, second œuvre, menuiseries extérieures, raccordements.',
      maisonsBullets: ['Plans standards ou personnalisés', 'Garantie décennale constructeur', 'Remise des clés + ACD au même moment'],
      lotissementsBody:
        'Quartiers complets : voirie, réseaux, sécurité 24/7, espaces communs. Format idéal pour familles recherchant un cadre cohérent.',
      lotissementsBullets: ['Voirie bitumée', 'Éclairage public + gardiennage', 'Espaces verts + aires de jeux'],
    },
    delivered: {
      eyebrow: 'Nos livraisons',
      title: 'Des programmes déjà entre les mains de leurs propriétaires',
      intro:
        'Ces projets ne sont plus des plans — ils sont habités. Parcourez les fiches pour voir les rendus finaux.',
      badge: 'Livré',
    },
    footprint: {
      eyebrow: 'Empreinte',
      title: 'Là où nous opérons',
      intro:
        'Nous nous concentrons sur les zones à forte valeur résidentielle : Cocody, Angré, Bingerville, Riviera, Grand-Bassam, et sélectivement à l\u2019intérieur.',
      fallbackZones: ['Cocody', 'Angré', 'Bingerville', 'Riviera', 'Grand-Bassam', 'Intérieur'],
    },
    testimonialsBlock: {
      eyebrow: 'Ils nous ont fait confiance',
      title: 'Paroles de propriétaires',
      intro:
        'Extraits des retours les plus récents — diaspora et familles locales qui sont passées par le parcours FCI.',
    },
    testimonial: {
      quote:
        '« Nous avons acheté depuis Montréal sans mettre les pieds à Abidjan pendant 14 mois. Visites vidéo hebdomadaires, paiements par virement, et l\u2019ACD arrivé par DHL six mois après la remise des clés. Aucune mauvaise surprise. »',
      author: '— Client diaspora, programme Cocody',
    },
    finalCta: {
      title: 'Vous voulez voir les réalisations en vrai ?',
      body: 'Réservez une visite sur site ou demandez le dossier photo d\u2019un programme livré.',
      primary: 'Programmes en cours',
      secondary: 'Demander un dossier',
    },
  }
  const en = {
    typeLabels: { TERRAIN: 'Land', MAISON: 'Home', LOTISSEMENT: 'Subdivision' } as const,
    statusLabels: {
      ON_SALE: 'On sale',
      SOLD_OUT: 'Sold out',
      DELIVERED: 'Delivered',
      COMING_SOON: 'Coming soon',
      PAUSED: 'Paused',
    } as const,
    categories: {
      eyebrow: 'Our catalog',
      title: 'Three product families',
      intro:
        'Each family has its own cycle — timelines, paperwork, payment schedules. We master all three.',
      countLabel: 'programs',
      availableLabel: 'lots available',
      expandLabel: 'See by zone',
      collapseLabel: 'Collapse',
      zonesLabel: 'Programs by zone',
      emptyZonesLabel: 'No published program in this category yet.',
      terrainsBody:
        'Surveyed, serviced plots delivered with ACD in progress — from 250 m² for investment to 600+ m² for family residence.',
      terrainsBullets: ['Official survey', 'Water + power nearby', 'ACD included'],
      maisonsBody:
        'Villas and duplexes designed by our architects, delivered finished: structure, finishing, exterior carpentry, utilities.',
      maisonsBullets: ['Standard or custom plans', '10-year builder warranty', 'Keys + ACD delivered together'],
      lotissementsBody:
        'Full neighborhoods: roads, utilities, 24/7 security, common areas. Ideal format for families seeking a coherent setting.',
      lotissementsBullets: ['Paved roads', 'Street lighting + on-site security', 'Green spaces + play areas'],
    },
    delivered: {
      eyebrow: 'Our deliveries',
      title: 'Programs already in their owners\u2019 hands',
      intro: 'These projects aren\u2019t renders — they\u2019re lived in. Browse the spec sheets to see final results.',
      badge: 'Delivered',
    },
    footprint: {
      eyebrow: 'Footprint',
      title: 'Where we operate',
      intro:
        'We focus on high-residential-value zones: Cocody, Angré, Bingerville, Riviera, Grand-Bassam, and selectively inland.',
      fallbackZones: ['Cocody', 'Angré', 'Bingerville', 'Riviera', 'Grand-Bassam', 'Inland'],
    },
    testimonialsBlock: {
      eyebrow: 'They trusted us',
      title: 'In their own words',
      intro:
        'Latest real-voice feedback — diaspora and local families who went through the FCI journey.',
    },
    testimonial: {
      quote:
        '"We bought from Montreal without setting foot in Abidjan for 14 months. Weekly video tours, wire-transfer payments, and the ACD arrived by DHL six months after handover. Zero bad surprises."',
      author: '— Diaspora client, Cocody program',
    },
    finalCta: {
      title: 'Want to see deliveries in person?',
      body: 'Book a site visit or request the photo pack of a delivered program.',
      primary: 'Current programs',
      secondary: 'Request a pack',
    },
  }
  return l === 'fr' ? fr : en
}
