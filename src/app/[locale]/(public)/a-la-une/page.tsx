import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import { formatFCFA } from '@/lib/format'
import type { Locale } from '@/i18n/routing'
import { buildSeo } from '@/lib/seo'
import { SaveSearchButton } from '@/components/fci/SaveSearchButton'
import { getSessionUser } from '@/lib/auth/rbac'
import Image from 'next/image'
import { FeatureWindows, type FeatureWindow } from '@/components/fci/FeatureWindows'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/a-la-une'>): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  return buildSeo({
    locale: l,
    path: '/a-la-une',
    title:
      l === 'fr'
        ? 'Programmes à la une — FirstClass Immobilier'
        : 'Featured programs — FirstClass Immobilier',
    description:
      l === 'fr'
        ? 'Découvrez nos programmes phares en commercialisation à Abidjan et dans le Grand Abidjan : terrains, maisons et lotissements premium, avec ACD inclus.'
        : 'Discover our featured programs on sale across Abidjan and Greater Abidjan: premium land, homes and subdivisions, ACD included.',
  })
}

type PriceBand = 'lt10' | '10to20' | '20to50' | 'gte50'

type Filter = {
  type?: string
  zone?: string
  avail?: 'available' | 'sold-out'
  price?: PriceBand
}

const TYPES = ['TERRAIN', 'MAISON', 'LOTISSEMENT'] as const
const PRICE_BANDS: PriceBand[] = ['lt10', '10to20', '20to50', 'gte50']

/** Lower/upper FCFA bounds (inclusive low, exclusive high) for each band. */
const PRICE_BOUNDS: Record<PriceBand, { min: bigint; max: bigint | null }> = {
  lt10: { min: 0n, max: 10_000_000n },
  '10to20': { min: 10_000_000n, max: 20_000_000n },
  '20to50': { min: 20_000_000n, max: 50_000_000n },
  gte50: { min: 50_000_000n, max: null },
}

export default async function FeaturedPage({
  params,
  searchParams,
}: PageProps<'/[locale]/a-la-une'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('featured')
  const tLot = await getTranslations('lot')
  const tHome = await getTranslations('home')
  const l = locale as Locale

  const sp = await searchParams
  const rawPrice = pickString(sp.price)
  const filter: Filter = {
    type: pickString(sp.type),
    zone: pickString(sp.zone),
    avail:
      pickString(sp.avail) === 'available'
        ? 'available'
        : pickString(sp.avail) === 'sold-out'
          ? 'sold-out'
          : undefined,
    price: PRICE_BANDS.includes(rawPrice as PriceBand) ? (rawPrice as PriceBand) : undefined,
  }

  const programs = await prisma.program.findMany({
    where: {
      status: { in: ['ON_SALE', 'DELIVERED'] },
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.zone ? { zone: filter.zone } : {}),
    },
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    include: { lots: { select: { status: true, priceFCFA: true } } },
  })

  // Media for hero images
  const heroIds = programs.map((p) => p.heroMediaId).filter((v): v is string => !!v)
  const media = heroIds.length
    ? await prisma.media.findMany({
        where: { id: { in: heroIds } },
        select: { id: true, url: true },
      })
    : []
  const urlById = new Map(media.map((m) => [m.id, m.url]))

  // Compute the rich facets on all programs (unfiltered) for chip options
  const allPrograms = await prisma.program.findMany({
    where: { status: { in: ['ON_SALE', 'DELIVERED'] } },
    select: { zone: true, type: true, lots: { select: { status: true } } },
  })
  const zones = Array.from(new Set(allPrograms.map((p) => p.zone))).filter(Boolean).sort()

  // Enrich + apply "avail" filter client-side (SQLite friendly)
  const enriched = programs
    .map((p) => {
      const available = p.lots.filter((l) => l.status === 'available')
      const prices = available
        .map((l) => l.priceFCFA)
        .filter((v): v is bigint => typeof v === 'bigint')
      const min = prices.length ? prices.reduce((a, b) => (a < b ? a : b)) : null
      const max = prices.length ? prices.reduce((a, b) => (a > b ? a : b)) : null
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        type: p.type,
        status: p.status,
        zone: p.zone,
        featured: p.featured,
        heroUrl: p.heroMediaId ? (urlById.get(p.heroMediaId) ?? null) : null,
        availableLots: available.length,
        totalLots: p.lots.length,
        minPrice: min,
        maxPrice: max,
      }
    })
    .filter((p) =>
      filter.avail === 'available'
        ? p.availableLots > 0
        : filter.avail === 'sold-out'
          ? p.availableLots === 0
          : true,
    )
    .filter((p) => {
      if (!filter.price) return true
      const band = PRICE_BOUNDS[filter.price]
      if (!p.minPrice) return false // no priced available lot → excluded when a band is active
      // "any available lot in band" — min/max of the program overlap with [band.min, band.max)
      const progMin = p.minPrice
      const progMax = p.maxPrice ?? progMin
      if (progMax < band.min) return false
      if (band.max !== null && progMin >= band.max) return false
      return true
    })

  // Headline counters for the hero strip
  const totalPrograms = allPrograms.length
  const totalAvailableLots = allPrograms.reduce(
    (acc, p) => acc + p.lots.filter((l) => l.status === 'available').length,
    0,
  )
  const zonesCovered = zones.length

  const strings = copy(l, tLot)

  // Build the 3 "fenêtres" cards per the client brief — Aerocity Beach,
  // Labella Residence, and a generic terrains-by-zone tile. The flagship
  // programs are pulled directly by slug (independent of the active filter)
  // so the tiles stay visible when the visitor narrows the catalog. We map
  // the same heroMediaId → URL via the urlById map already built for the
  // result grid, falling back to the static cover under /public if needed.
  const flagshipSlugs = ['aerocity-beach', 'labella-residence'] as const
  const flagshipPrograms = await prisma.program.findMany({
    where: { slug: { in: [...flagshipSlugs] } },
    include: { lots: { select: { status: true } } },
  })
  const flagshipHeroIds = flagshipPrograms
    .map((p) => p.heroMediaId)
    .filter((v): v is string => !!v)
  const flagshipMedia = flagshipHeroIds.length
    ? await prisma.media.findMany({
        where: { id: { in: flagshipHeroIds } },
        select: { id: true, url: true },
      })
    : []
  const flagshipUrlById = new Map(flagshipMedia.map((m) => [m.id, m.url]))
  const flagshipMap = new Map(
    flagshipPrograms.map((p) => {
      const available = p.lots.filter((lot) => lot.status === 'available').length
      return [
        p.slug,
        {
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          zone: p.zone,
          availableLots: available,
          totalLots: p.lots.length,
          heroUrl: p.heroMediaId ? (flagshipUrlById.get(p.heroMediaId) ?? null) : null,
        },
      ]
    }),
  )
  const aerocity = flagshipMap.get('aerocity-beach')
  const labella = flagshipMap.get('labella-residence')
  const terrainCount = allPrograms.filter((p) => p.type === 'TERRAIN').length
  const terrainAvailable = allPrograms
    .filter((p) => p.type === 'TERRAIN')
    .reduce((acc, p) => acc + p.lots.filter((l) => l.status === 'available').length, 0)

  // Tile data is sourced from the DB program rows (name, tagline, zone,
  // hero cover, lots count). The static catalogue PDF lives in /public so the
  // secondary CTA points at it directly. If a program isn't seeded yet, we
  // skip its tile rather than show stale hardcoded copy.
  const featureWindows: FeatureWindow[] = []

  if (aerocity) {
    featureWindows.push({
      slug: aerocity.slug,
      eyebrow: l === 'fr' ? 'Programme phare' : 'Flagship',
      image: {
        src: aerocity.heroUrl ?? '/brand/aerocity/cover.jpg',
        alt: tr(aerocity.name, l),
      },
      title: tr(aerocity.name, l),
      body: tr(aerocity.tagline, l),
      chips: [
        aerocity.zone,
        `${aerocity.availableLots}/${aerocity.totalLots} ${tLot('lots')}`,
      ],
      primaryCta: {
        label: l === 'fr' ? 'Voir le programme' : 'See program',
        href: `/a-la-une/${aerocity.slug}`,
      },
      secondaryCta: {
        label: l === 'fr' ? 'Catalogue' : 'Catalogue',
        href: '/brand/aerocity/catalogue.pdf',
        external: true,
      },
    })
  }

  if (labella) {
    featureWindows.push({
      slug: labella.slug,
      eyebrow: l === 'fr' ? 'Programme phare' : 'Flagship',
      image: {
        src: labella.heroUrl ?? '/brand/labella/cover.jpg',
        alt: tr(labella.name, l),
      },
      title: tr(labella.name, l),
      body: tr(labella.tagline, l),
      chips: [
        labella.zone,
        `${labella.availableLots}/${labella.totalLots} ${tLot('lots')}`,
      ],
      primaryCta: {
        label: l === 'fr' ? 'Voir le programme' : 'See program',
        href: `/a-la-une/${labella.slug}`,
      },
      secondaryCta: {
        label: l === 'fr' ? 'Catalogue' : 'Catalogue',
        href: '/brand/labella/catalogue.pdf',
        external: true,
      },
    })
  }

  featureWindows.push(
    {
      slug: 'terrains',
      eyebrow: l === 'fr' ? 'Foncier' : 'Land',
      image: {
        src: '/brand/realisations.jpg',
        alt:
          l === 'fr'
            ? 'Offres de terrains FirstClass Immobilier dans toutes les zones'
            : 'FirstClass Immobilier land offers across every zone',
      },
      title: l === 'fr' ? 'Offre de Terrains' : 'Land offers',
      body:
        l === 'fr'
          ? 'Mises à jour régulièrement avec nos dernières offres — à Abidjan, dans le Grand Abidjan, à l’intérieur et à l’extérieur du pays.'
          : 'Updated regularly with our latest offers — across Abidjan, Greater Abidjan, inland and abroad.',
      chips: [
        l === 'fr' ? `${terrainCount} programmes` : `${terrainCount} programs`,
        l === 'fr' ? `${terrainAvailable} lots dispo` : `${terrainAvailable} lots available`,
      ],
      subLinksLabel: l === 'fr' ? 'Parcourir par zone' : 'Browse by zone',
      subLinks: [
        {
          label: 'Abidjan',
          href: '/a-la-une?type=TERRAIN&zone=Abidjan',
        },
        {
          label: 'Grand-Abidjan',
          href: '/a-la-une?type=TERRAIN&zone=Grand%20Abidjan',
        },
        {
          label: l === 'fr' ? 'Intérieur' : 'Inland',
          href: '/a-la-une?type=TERRAIN&zone=Int%C3%A9rieur',
        },
        {
          label: l === 'fr' ? 'Extérieur' : 'Abroad',
          href: '/a-la-une?type=TERRAIN&zone=Ext%C3%A9rieur',
        },
      ],
      primaryCta: {
        label: l === 'fr' ? 'Tous les terrains' : 'All land',
        href: '/a-la-une?type=TERRAIN',
      },
    },
  )

  // Saved-search button — only renders when a filter is active.
  const anyFilter = Boolean(filter.type || filter.zone || filter.avail || filter.price)
  const sessionUser = await getSessionUser()
  const signInHref = `/${locale}/signin?callbackUrl=${encodeURIComponent(
    `/${locale}/a-la-une`,
  )}`
  const labelParts: string[] = []
  if (filter.type) {
    const typeMap = strings.typeLabel as Record<string, string>
    labelParts.push(typeMap[filter.type] ?? filter.type)
  }
  if (filter.zone) labelParts.push(filter.zone)
  if (filter.price) labelParts.push(strings.priceBandLabel[filter.price])
  if (filter.avail === 'available') labelParts.push(strings.onlyAvailable)
  if (filter.avail === 'sold-out') labelParts.push(strings.onlySoldOut)
  const searchLabel = labelParts.length
    ? labelParts.join(' · ')
    : l === 'fr'
      ? 'Recherche personnalisée'
      : 'Custom search'

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      {/* Hero photo band — same illustration as the home page per client brief */}
      <section className="relative mb-10 overflow-hidden rounded-2xl border border-[color:var(--border)]">
        <Image
          src="/brand/hero-family.jpg"
          alt={
            l === 'fr'
              ? 'Famille recevant les clés de leur villa avec FirstClass Immobilier'
              : 'Family receiving the keys to their villa from FirstClass Immobilier'
          }
          width={1600}
          height={900}
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[380px]"
          priority
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[color:var(--brand-navy)]/70 via-[color:var(--brand-navy)]/30 to-transparent"
        />
        <div className="absolute inset-0 flex items-end px-6 pb-6 text-white sm:px-10 sm:pb-10">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/85">
              {l === 'fr' ? 'À la Une' : 'Featured'}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              {l === 'fr'
                ? 'Trois portes d’entrée vers nos programmes phares.'
                : 'Three entry points into our flagship programs.'}
            </h2>
          </div>
        </div>
      </section>

      {/* 3 "fenêtres" — Aerocity Beach · Labella Residence · Offre de Terrains */}
      <FeatureWindows
        windows={featureWindows}
        sectionEyebrow={l === 'fr' ? 'Nos programmes en commercialisation' : 'On-sale programs'}
        sectionTitle={l === 'fr' ? 'Trois fenêtres, trois opportunités' : 'Three windows, three opportunities'}
      />

      {/* Hero metrics strip */}
      <div className="mb-10 grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-5 sm:grid-cols-3 sm:p-6">
        <Metric value={String(totalPrograms)} label={strings.metricPrograms} />
        <Metric value={String(totalAvailableLots)} label={strings.metricAvailable} />
        <Metric value={String(zonesCovered)} label={strings.metricZones} />
      </div>

      {/* Filters */}
      <section className="mb-8 space-y-4">
        <FilterRow
          label={strings.filterType}
          activeAll={!filter.type}
          allHref={buildHref({ ...filter, type: undefined })}
          options={TYPES.map((ty) => ({
            label: strings.typeLabel[ty],
            href: buildHref({ ...filter, type: ty }),
            active: filter.type === ty,
          }))}
        />
        {zones.length > 0 && (
          <FilterRow
            label={strings.filterZone}
            activeAll={!filter.zone}
            allHref={buildHref({ ...filter, zone: undefined })}
            options={zones.map((z) => ({
              label: z,
              href: buildHref({ ...filter, zone: z }),
              active: filter.zone === z,
            }))}
          />
        )}
        <FilterRow
          label={strings.filterAvail}
          activeAll={!filter.avail}
          allHref={buildHref({ ...filter, avail: undefined })}
          options={[
            {
              label: strings.onlyAvailable,
              href: buildHref({ ...filter, avail: 'available' }),
              active: filter.avail === 'available',
            },
            {
              label: strings.onlySoldOut,
              href: buildHref({ ...filter, avail: 'sold-out' }),
              active: filter.avail === 'sold-out',
            },
          ]}
        />
        <FilterRow
          label={strings.filterPrice}
          activeAll={!filter.price}
          allHref={buildHref({ ...filter, price: undefined })}
          options={PRICE_BANDS.map((b) => ({
            label: strings.priceBandLabel[b],
            href: buildHref({ ...filter, price: b }),
            active: filter.price === b,
          }))}
        />
      </section>

      {/* Result count + save this search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {enriched.length === 0
            ? strings.noResults
            : strings.resultCount(enriched.length)}
        </p>
        {anyFilter && (
          <SaveSearchButton
            label={searchLabel}
            isAuthenticated={Boolean(sessionUser)}
            signInHref={signInHref}
          />
        )}
      </div>

      {/* Grid */}
      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center">
          <p className="text-sm text-muted">{tHome('featured.empty')}</p>
          <Link
            href="/a-la-une"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted"
          >
            {strings.clearFilters}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enriched.map((p) => (
            <article
              key={p.id}
              className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
            >
              {/* Featured ribbon */}
              {p.featured && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-[color:var(--brand-red)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                  {strings.featuredBadge}
                </span>
              )}
              {/* Availability badge */}
              <span
                className={`absolute right-4 top-4 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  p.availableLots === 0
                    ? 'bg-zinc-900 text-white'
                    : p.availableLots <= 3
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {p.availableLots === 0
                  ? strings.soldOut
                  : p.availableLots <= 3
                    ? strings.fewLeft(p.availableLots)
                    : strings.available(p.availableLots, p.totalLots)}
              </span>

              <Link href={`/a-la-une/${p.slug}`} className="block">
                <div
                  className="aspect-[16/10] w-full bg-cover bg-center bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]"
                  style={p.heroUrl ? { backgroundImage: `url(${p.heroUrl})` } : undefined}
                />
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold">
                      {strings.typeLabel[p.type as keyof typeof strings.typeLabel] ?? p.type}
                    </span>
                    <span>·</span>
                    <span>{p.zone}</span>
                    {p.status === 'DELIVERED' && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {strings.delivered}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
                    {tr(p.name, l)}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted">{tr(p.tagline, l)}</p>

                  <dl className="grid grid-cols-2 gap-4 border-t border-[color:var(--border)] pt-4 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-muted">
                        {strings.metricPrograms === 'Programs' ? 'Lots' : strings.lotsLabel}
                      </dt>
                      <dd className="mt-0.5 font-semibold text-foreground">
                        {p.availableLots}/{p.totalLots}
                      </dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-[10px] uppercase tracking-wider text-muted">
                        {strings.priceFrom}
                      </dt>
                      <dd className="mt-0.5 font-display text-base font-semibold text-[color:var(--brand-red)]">
                        {p.minPrice ? formatFCFA(p.minPrice, l) : strings.priceOnRequest}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Link>

              {/* Hover CTA */}
              <div className="border-t border-[color:var(--border)] bg-surface-muted/40 px-5 py-3">
                <Link
                  href={`/a-la-une/${p.slug}`}
                  className="inline-flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-navy)] dark:text-foreground"
                >
                  {strings.explore}
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function pickString(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return undefined
}

function buildHref(f: Filter): string {
  const params = new URLSearchParams()
  if (f.type) params.set('type', f.type)
  if (f.zone) params.set('zone', f.zone)
  if (f.avail) params.set('avail', f.avail)
  if (f.price) params.set('price', f.price)
  const q = params.toString()
  return q ? `/a-la-une?${q}` : '/a-la-une'
}

function copy(l: Locale, tLot: (k: string) => string) {
  const fr = {
    metricPrograms: 'Programmes actifs',
    metricAvailable: 'Lots disponibles',
    metricZones: 'Zones couvertes',
    filterType: 'Type',
    filterZone: 'Zone',
    filterAvail: 'Disponibilité',
    filterPrice: 'Budget',
    priceBandLabel: {
      lt10: '< 10 M FCFA',
      '10to20': '10 – 20 M',
      '20to50': '20 – 50 M',
      gte50: '50 M +',
    } as const,
    allLabel: 'Tous',
    onlyAvailable: 'Disponibles uniquement',
    onlySoldOut: 'Complets',
    typeLabel: { TERRAIN: 'Terrains', MAISON: 'Maisons', LOTISSEMENT: 'Lotissements' } as const,
    resultCount: (n: number) => `${n} programme${n > 1 ? 's' : ''} correspond${n > 1 ? 'ent' : ''} à votre recherche`,
    noResults: 'Aucun programme ne correspond à ces filtres',
    clearFilters: 'Réinitialiser les filtres',
    featuredBadge: 'À la une',
    soldOut: 'Complet',
    fewLeft: (n: number) => `Plus que ${n} lot${n > 1 ? 's' : ''} !`,
    available: (avail: number, total: number) => `${avail}/${total} dispo`,
    delivered: 'Livré',
    lotsLabel: tLot('lots'),
    priceFrom: 'À partir de',
    priceOnRequest: 'Sur demande',
    explore: 'Explorer',
  }
  const en = {
    metricPrograms: 'Active programs',
    metricAvailable: 'Available lots',
    metricZones: 'Zones covered',
    filterType: 'Type',
    filterZone: 'Zone',
    filterAvail: 'Availability',
    filterPrice: 'Budget',
    priceBandLabel: {
      lt10: '< 10 M FCFA',
      '10to20': '10 – 20 M',
      '20to50': '20 – 50 M',
      gte50: '50 M +',
    } as const,
    allLabel: 'All',
    onlyAvailable: 'Available only',
    onlySoldOut: 'Sold out',
    typeLabel: { TERRAIN: 'Land', MAISON: 'Homes', LOTISSEMENT: 'Subdivisions' } as const,
    resultCount: (n: number) => `${n} program${n > 1 ? 's' : ''} match${n > 1 ? '' : 'es'} your filters`,
    noResults: 'No program matches these filters',
    clearFilters: 'Reset filters',
    featuredBadge: 'Featured',
    soldOut: 'Sold out',
    fewLeft: (n: number) => `Only ${n} lot${n > 1 ? 's' : ''} left!`,
    available: (avail: number, total: number) => `${avail}/${total} available`,
    delivered: 'Delivered',
    lotsLabel: tLot('lots'),
    priceFrom: 'From',
    priceOnRequest: 'On request',
    explore: 'Explore',
  }
  return l === 'fr' ? fr : en
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-display text-3xl font-semibold text-[color:var(--brand-navy)] dark:text-foreground sm:text-4xl">
        {value}
      </span>
      <span className="text-xs uppercase tracking-[0.2em] text-muted">{label}</span>
    </div>
  )
}

function FilterRow({
  label,
  activeAll,
  allHref,
  options,
}: {
  label: string
  activeAll: boolean
  allHref: string
  options: { label: string; href: string; active: boolean }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      <Chip label="✓" href={allHref} active={activeAll} />
      {options.map((o) => (
        <Chip key={o.label} label={o.label} href={o.href} active={o.active} />
      ))}
    </div>
  )
}

function Chip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-transparent bg-[color:var(--brand-navy)] text-white'
          : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
      }`}
    >
      {label}
    </Link>
  )
}
