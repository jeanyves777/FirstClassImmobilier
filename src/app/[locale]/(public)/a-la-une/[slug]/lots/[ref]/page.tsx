import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import { formatFCFA, formatSurface } from '@/lib/format'
import type { Locale } from '@/i18n/routing'
import { LotGallery } from './LotGallery'
import { VisitRequestForm } from './VisitRequestForm'
import { reserveLot } from './reserve-actions'
import { getNextSlots, parseAvailability } from '@/lib/schedule/availability'
import { SaveLotButton } from '@/components/fci/SaveLotButton'
import { PaymentSimulator } from '@/components/fci/PaymentSimulator'
import { ShareLotButton } from '@/components/fci/ShareLotButton'
import { getSessionUser } from '@/lib/auth/rbac'
import { site } from '@/lib/site'
import { buildSeo } from '@/lib/seo'
import { JsonLd, productLd, breadcrumbLd } from '@/lib/seo/structured-data'
import { getSiteConfig } from '@/lib/site'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/a-la-une/[slug]/lots/[ref]'>): Promise<Metadata> {
  const { locale, slug, ref } = await params
  const l = locale as Locale
  const program = await prisma.program.findUnique({
    where: { slug },
    select: { id: true, name: true, zone: true },
  })
  if (!program) {
    return buildSeo({
      locale: l,
      path: `/a-la-une/${slug}/lots/${ref}`,
      title:
        l === 'fr'
          ? 'Lot introuvable — FirstClass Immobilier'
          : 'Lot not found — FirstClass Immobilier',
      description: '',
    })
  }
  const lot = await prisma.lot.findUnique({
    where: { programId_reference: { programId: program.id, reference: ref } },
    include: { media: { orderBy: { order: 'asc' }, take: 1 } },
  })
  if (!lot) {
    return buildSeo({
      locale: l,
      path: `/a-la-une/${slug}/lots/${ref}`,
      title:
        l === 'fr'
          ? 'Lot introuvable — FirstClass Immobilier'
          : 'Lot not found — FirstClass Immobilier',
      description: '',
    })
  }
  const programName = tr(program.name, l)
  const title = tr(lot.title, l)
  const highlights = tr(lot.highlights, l)
  const priceLabel =
    l === 'fr'
      ? formatFCFA(lot.priceFCFA, l)
      : formatFCFA(lot.priceFCFA, l)
  const surfaceLabel = formatSurface(lot.surfaceM2, l)
  const seoTitle = `${title || lot.reference} — ${programName} · ${priceLabel}`
  const description =
    highlights ||
    (l === 'fr'
      ? `Lot ${lot.reference} dans le programme ${programName} (${program.zone}). Surface ${surfaceLabel}, prix ${priceLabel}. ACD inclus.`
      : `Lot ${lot.reference} in the ${programName} program (${program.zone}). Surface ${surfaceLabel}, price ${priceLabel}. ACD included.`)
  return buildSeo({
    locale: l,
    path: `/a-la-une/${slug}/lots/${ref}`,
    title: seoTitle,
    description,
    image: lot.media[0]?.url ?? null,
    type: 'article',
  })
}

export default async function LotPage({
  params,
}: PageProps<'/[locale]/a-la-une/[slug]/lots/[ref]'>) {
  const { locale, slug, ref } = await params
  setRequestLocale(locale)
  const l = locale as Locale

  const program = await prisma.program.findUnique({ where: { slug } })
  if (!program) notFound()

  const lot = await prisma.lot.findUnique({
    where: { programId_reference: { programId: program.id, reference: ref } },
    include: { media: { orderBy: { order: 'asc' } } },
  })
  if (!lot) notFound()

  // Scheduler — up to 6 suggested slots from SiteSettings availability.
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } })
  const availability = parseAvailability(settings?.availability)
  const upcomingBookings = await prisma.appointment.findMany({
    where: {
      status: { in: ['booked', 'confirmed'] },
      scheduledAt: { gte: new Date() },
    },
    select: { scheduledAt: true },
  })
  const suggestedSlots =
    availability.length > 0
      ? getNextSlots({
          availability,
          durationMin: settings?.slotDurationMin ?? 45,
          from: new Date(),
          take: 6,
          bookings: upcomingBookings
            .map((b) => b.scheduledAt)
            .filter((d): d is Date => d !== null),
        }).map((d) => d.toISOString())
      : []

  // Similar lots (other available lots from the same program)
  const similar = await prisma.lot.findMany({
    where: {
      programId: program.id,
      id: { not: lot.id },
      status: 'available',
    },
    include: { media: { orderBy: { order: 'asc' }, take: 1 } },
    take: 3,
    orderBy: [{ reference: 'asc' }],
  })

  // Save-lot state for the current visitor (null if anonymous).
  const sessionUser = await getSessionUser()
  const isSaved = sessionUser
    ? Boolean(
        await prisma.savedLot.findUnique({
          where: { userId_lotId: { userId: sessionUser.id, lotId: lot.id } },
          select: { id: true },
        }),
      )
    : false
  const signInHref = `/${locale}/signin?callbackUrl=${encodeURIComponent(
    `/${locale}/a-la-une/${slug}/lots/${lot.reference}`,
  )}`

  // Share message — server-rendered so it stays consistent with the locale.
  const shareTitle = `${tr(lot.title, l) || lot.reference} — ${tr(program.name, l)} · FirstClass Immobilier`
  const shareUrl = `${site.siteUrl.replace(/\/$/, '')}/${locale}/a-la-une/${slug}/lots/${lot.reference}`
  const shareMessage =
    l === 'fr'
      ? `Regarde ce ${program.type.toLowerCase()} chez FirstClass Immobilier — ${tr(program.name, l)} à ${program.zone}, ${formatFCFA(lot.priceFCFA, l)}.`
      : `Check out this ${program.type.toLowerCase()} from FirstClass Immobilier — ${tr(program.name, l)} in ${program.zone}, ${formatFCFA(lot.priceFCFA, l)}.`

  const t = await getTranslations('lot')
  const tNav = await getTranslations('nav')

  const features: string[] = lot.features
    ? (() => {
        try {
          return JSON.parse(lot.features!) as string[]
        } catch {
          return []
        }
      })()
    : []

  const photos = lot.media
    .filter((m) => m.kind === 'image')
    .map((m) => ({ url: m.url, alt: tr(m.alt, l) || lot.reference }))
  const heroPhoto = photos[0] ?? null

  const programName = tr(program.name, l)
  const lotTitle = tr(lot.title, l) || t('lot')
  const lotHighlights = tr(lot.highlights, l)

  const c = copy(l)

  const siteConfig = await getSiteConfig()
  const base = siteConfig.siteUrl.replace(/\/$/, '')
  const canonicalUrl = `${base}/${locale}/a-la-une/${slug}/lots/${lot.reference}`
  const product = productLd({
    site: siteConfig,
    locale: l,
    name: lotTitle,
    description: lotHighlights || `${programName} — ${lot.reference}`,
    imageUrl: heroPhoto ? `${base}${heroPhoto.url.startsWith('/') ? heroPhoto.url : `/${heroPhoto.url}`}` : null,
    priceFCFA: lot.priceFCFA,
    availability:
      lot.status === 'sold' ? 'sold' : lot.status === 'reserved' ? 'reserved' : 'available',
    url: canonicalUrl,
    programName,
    zone: program.zone,
  })
  const breadcrumbs = breadcrumbLd([
    { name: 'Home', url: `${base}/${locale}` },
    { name: 'Featured', url: `${base}/${locale}/a-la-une` },
    { name: programName, url: `${base}/${locale}/a-la-une/${slug}` },
    { name: lot.reference, url: canonicalUrl },
  ])

  return (
    <>
      <JsonLd data={product} />
      <JsonLd data={breadcrumbs} />
      {/* Hero — cover photo with overlay */}
      <section className="relative overflow-hidden">
        {heroPhoto ? (
          <div className="relative">
            <div className="relative aspect-[16/9] max-h-[560px] w-full overflow-hidden">
              <Image
                src={heroPhoto.url}
                alt={heroPhoto.alt}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent"
              />
            </div>
            <HeroOverlay
              programName={programName}
              lotReference={lot.reference}
              title={lotTitle}
              highlights={lotHighlights}
              status={lot.status}
              t={t}
              c={c}
            />
          </div>
        ) : (
          <div className="relative">
            <div className="aspect-[16/7] w-full bg-gradient-to-br from-[color:var(--brand-navy-700)] via-[color:var(--brand-navy)] to-[color:var(--brand-ink)]" />
            <HeroOverlay
              programName={programName}
              lotReference={lot.reference}
              title={lotTitle}
              highlights={lotHighlights}
              status={lot.status}
              t={t}
              c={c}
            />
          </div>
        )}
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {/* Breadcrumb + share */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-foreground">
              {tNav('home')}
            </Link>
            <span>/</span>
            <Link href="/a-la-une" className="hover:text-foreground">
              {tNav('featured')}
            </Link>
            <span>/</span>
            <Link href={`/a-la-une/${slug}`} className="hover:text-foreground">
              {programName}
            </Link>
            <span>/</span>
            <span className="text-foreground">{lot.reference}</span>
          </nav>
          <ShareLotButton shareTitle={shareTitle} url={shareUrl} message={shareMessage} />
        </div>

        {/* Key stats strip */}
        <section className="mb-10 grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-5 sm:grid-cols-4 sm:p-6">
          <StatMetric label={t('surface')} value={formatSurface(lot.surfaceM2, l)} icon={<IconArea />} />
          {lot.bedrooms !== null ? (
            <StatMetric label={t('bedrooms')} value={String(lot.bedrooms)} icon={<IconBed />} />
          ) : (
            <StatMetric label={c.zone} value={program.zone} icon={<IconPin />} />
          )}
          {lot.bathrooms !== null ? (
            <StatMetric label={t('bathrooms')} value={String(lot.bathrooms)} icon={<IconBath />} />
          ) : (
            <StatMetric label={c.type} value={c.typeLabels[program.type] ?? program.type} icon={<IconLayers />} />
          )}
          <StatMetric label={t('price')} value={formatFCFA(lot.priceFCFA, l)} accent icon={<IconTag />} />
        </section>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            {/* Gallery */}
            {photos.length > 0 && <LotGallery photos={photos} />}

            {/* Virtual tour */}
            {lot.virtualTourUrl && <TourEmbed url={lot.virtualTourUrl} title={t('virtualTour')} />}

            {/* Video */}
            {lot.videoUrl && <VideoEmbed url={lot.videoUrl} title={t('videoTour')} />}

            {/* Description */}
            {lot.description && (
              <section>
                <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">
                  {c.aboutTitle}
                </h2>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-muted">
                  {tr(lot.description, l)}
                </p>
              </section>
            )}

            {/* Features */}
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
                {t('features')}
              </h2>
              {features.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-surface px-4 py-3 text-sm"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </span>
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted p-5 text-center text-sm text-muted">
                  {c.noFeatures}
                </p>
              )}
            </section>

            {/* FAQ */}
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
                {c.faq.title}
              </h2>
              <div className="space-y-3">
                {c.faq.items.map((q) => (
                  <details
                    key={q.q}
                    className="group rounded-xl border border-[color:var(--border)] bg-surface"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-foreground">
                      {q.q}
                      <span
                        aria-hidden
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-muted transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-muted">
                      {q.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Similar lots */}
            {similar.length > 0 && (
              <section>
                <h2 className="mb-5 font-display text-2xl font-semibold text-foreground">
                  {c.similarTitle}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {similar.map((sl) => {
                    const cover = sl.media[0]
                    return (
                      <Link
                        key={sl.id}
                        href={`/a-la-une/${slug}/lots/${sl.reference}`}
                        className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,.35)]"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
                          {cover ? (
                            <Image
                              src={cover.url}
                              alt={tr(cover.alt, l) || sl.reference}
                              fill
                              sizes="(min-width: 1024px) 24vw, 50vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : null}
                        </div>
                        <div className="space-y-1.5 p-4">
                          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                            <span className="font-semibold text-[color:var(--brand-red)]">
                              {sl.reference}
                            </span>
                            <span className="text-muted">{formatSurface(sl.surfaceM2, l)}</span>
                          </div>
                          <h3 className="font-display text-base font-semibold leading-tight text-foreground">
                            {tr(sl.title, l) || t('lot')}
                          </h3>
                          <p className="pt-1 font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                            {formatFCFA(sl.priceFCFA, l)}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar — price card + visit form */}
          <aside className="space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,.25)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-red)]">
                    {lot.reference}
                  </span>
                  <LotStatusChip
                    status={lot.status}
                    labels={{
                      available: t('statusAvailable'),
                      reserved: t('statusReserved'),
                      sold: t('statusSold'),
                    }}
                  />
                </div>
                <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                  {formatFCFA(lot.priceFCFA, l)}
                </p>
                <p className="text-[11px] text-muted">{c.priceNote}</p>

                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">{t('surface')}</dt>
                    <dd className="mt-0.5 font-semibold text-foreground">
                      {formatSurface(lot.surfaceM2, l)}
                    </dd>
                  </div>
                  {lot.bedrooms !== null && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted">{t('bedrooms')}</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{lot.bedrooms}</dd>
                    </div>
                  )}
                  {lot.bathrooms !== null && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted">{t('bathrooms')}</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{lot.bathrooms}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">{t('zone')}</dt>
                    <dd className="mt-0.5 font-semibold text-foreground">{program.zone}</dd>
                  </div>
                </dl>

                {lot.status === 'available' && (
                  <form action={reserveLot} className="mt-6 space-y-3">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="lotId" value={lot.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="ref" value={lot.reference} />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-[color:var(--brand-red)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-red-600)]"
                    >
                      {t('reserveCta')}
                    </button>
                    <p className="text-center text-[11px] text-muted">{c.reserveNote}</p>
                  </form>
                )}

                <div className="mt-3 flex justify-center">
                  <SaveLotButton
                    lotId={lot.id}
                    initialSaved={isSaved}
                    isAuthenticated={Boolean(sessionUser)}
                    signInHref={signInHref}
                  />
                </div>

                {lot.status === 'reserved' && (
                  <div className="mt-5 rounded-xl bg-amber-500/10 p-3 text-center text-xs text-amber-700 dark:text-amber-400">
                    {c.reservedNote}
                  </div>
                )}
                {lot.status === 'sold' && (
                  <div className="mt-5 rounded-xl bg-zinc-900/90 p-3 text-center text-xs text-white">
                    {c.soldNote}
                  </div>
                )}

                {/* Trust row */}
                <ul className="mt-6 space-y-2 border-t border-[color:var(--border)] pt-5 text-xs text-muted">
                  <TrustItem label={c.trust.licensed} />
                  <TrustItem label={c.trust.acd} />
                  <TrustItem label={c.trust.schedule} />
                </ul>
              </div>

              <PaymentSimulator
                priceFCFA={lot.priceFCFA.toString()}
                contactHref={`/${locale}/contacts`}
              />

              <VisitRequestForm
                lotId={lot.id}
                programId={program.id}
                locale={locale}
                suggestedSlots={suggestedSlots}
              />
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
  programName,
  lotReference,
  title,
  highlights,
  status,
  t,
  c,
}: {
  programName: string
  lotReference: string
  title: string
  highlights: string
  status: string
  t: (k: string) => string
  c: ReturnType<typeof copy>
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end">
      <div className="pointer-events-auto mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-14">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{programName}</span>
          <span className="rounded-full bg-[color:var(--brand-red)] px-2.5 py-1 text-white">
            {lotReference}
          </span>
          <StatusPill status={status} t={t} />
        </div>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        {highlights && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {highlights}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#reserve"
            className="inline-flex items-center rounded-full bg-[color:var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(200,16,46,.6)] transition-colors hover:bg-[color:var(--brand-red-600)]"
          >
            {c.heroCtaPrimary}
          </a>
          <a
            href="#visit"
            className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            {c.heroCtaSecondary}
          </a>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status, t }: { status: string; t: (k: string) => string }) {
  const cfg =
    status === 'sold'
      ? { label: t('statusSold'), className: 'bg-zinc-900 text-white' }
      : status === 'reserved'
        ? { label: t('statusReserved'), className: 'bg-amber-500 text-white' }
        : { label: t('statusAvailable'), className: 'bg-emerald-500 text-white' }
  return <span className={`rounded-full px-2.5 py-1 ${cfg.className}`}>{cfg.label}</span>
}

function StatMetric({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
          {icon}
        </span>
      )}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p>
        <p
          className={`mt-0.5 font-display text-lg font-semibold leading-tight ${
            accent ? 'text-[color:var(--brand-red)]' : 'text-foreground'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function LotStatusChip({
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
        : { label: labels.available, className: 'bg-emerald-500 text-white' }
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

function TrustItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </span>
      <span>{label}</span>
    </li>
  )
}

function TourEmbed({ url, title }: { url: string; title: string }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-black">
        <iframe
          src={url}
          title={title}
          allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="block h-[60vh] min-h-[360px] w-full"
        />
      </div>
    </section>
  )
}

function VideoEmbed({ url, title }: { url: string; title: string }) {
  const isEmbed = /youtube|vimeo|player\./i.test(url)
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">{title}</h2>
      {isEmbed ? (
        <div className="aspect-video overflow-hidden rounded-2xl border border-[color:var(--border)] bg-black">
          <iframe
            src={url}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="block h-full w-full"
          />
        </div>
      ) : (
        <video
          controls
          preload="metadata"
          className="aspect-video w-full rounded-2xl border border-[color:var(--border)] bg-black"
        >
          <source src={url} />
        </video>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function IconArea() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </svg>
  )
}
function IconBed() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 4v16M22 4v16M2 14h20M6 10h4" />
    </svg>
  )
}
function IconBath() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 2-2h1M10 6h4" />
    </svg>
  )
}
function IconTag() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  )
}
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m12 2 10 6-10 6L2 8l10-6zM2 18l10 6 10-6M2 13l10 6 10-6" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Bilingual copy
// ─────────────────────────────────────────────────────────────────────────

function copy(l: Locale) {
  const fr = {
    zone: 'Zone',
    type: 'Type',
    priceNote: 'Hors frais notariés et procédure ACD',
    aboutTitle: 'Description du lot',
    noFeatures: 'Détails à venir — notre agent peut vous les préciser.',
    heroCtaPrimary: 'Je réserve ce lot',
    heroCtaSecondary: 'Demander une visite',
    reserveNote: 'Un agent FCI confirme sous 24 h ouvrées.',
    reservedNote: 'Ce lot est en cours de réservation. Laissez-nous vos coordonnées si vous souhaitez être recontacté en cas de désistement.',
    soldNote: 'Lot vendu. Explorez les autres lots disponibles du programme.',
    similarTitle: 'Autres lots disponibles dans ce programme',
    typeLabels: { TERRAIN: 'Terrain', MAISON: 'Maison', LOTISSEMENT: 'Lotissement' } as Record<string, string>,
    trust: {
      licensed: 'Promoteur agréé Ministère de la Construction',
      acd: 'ACD pris en charge par FCI',
      schedule: 'Échéancier adaptable selon votre budget',
    },
    faq: {
      title: 'Questions fréquentes',
      items: [
        {
          q: 'Le prix affiché inclut-il l\u2019ACD et les frais notariés ?',
          a: 'Non, le prix affiché couvre l\u2019acquisition du lot seul. Les frais notariés et la procédure ACD sont détaillés au contrat, selon un barème standard. FCI prend en charge la procédure ACD (jusqu\u2019à 18 mois selon la zone) — c\u2019est inclus dans le parcours.',
        },
        {
          q: 'Comment fonctionne la réservation ?',
          a: 'Vous cliquez "Réserver ce lot", créez votre compte (si nécessaire) et un agent confirme votre demande sous 24 h ouvrées. Il vous envoie ensuite le contrat de réservation et les instructions pour l\u2019acompte. Le lot est alors bloqué à votre nom.',
        },
        {
          q: 'Puis-je échelonner le paiement ?',
          a: 'Oui. Les modalités dépendent du programme : acompte à la réservation (généralement 10 à 30 %), puis solde au comptant ou échelonné sur la durée du chantier pour les maisons. Un agent peut simuler un plan selon votre budget.',
        },
        {
          q: 'Je suis dans la diaspora. Puis-je acheter à distance ?',
          a: 'Oui, c\u2019est une part importante de nos clients. Réservation 100 % en ligne, signature à distance (électronique ou par procuration), paiement par virement international, suivi du chantier depuis votre espace client, et remise de l\u2019ACD à votre représentant à Abidjan ou par DHL.',
        },
        {
          q: 'Quelles sont les étapes jusqu\u2019à la remise des clés ?',
          a: 'Réservation → contrat signé chez le notaire → paiements selon l\u2019échéancier → suivi du chantier depuis l\u2019espace client → procédure ACD → remise des clés + ACD. En moyenne : 12 à 24 mois pour un terrain, 18 à 30 mois pour une maison.',
        },
      ],
    },
  }
  const en = {
    zone: 'Zone',
    type: 'Type',
    priceNote: 'Notary fees and ACD procedure not included',
    aboutTitle: 'About this lot',
    noFeatures: 'Specs coming soon — our agent can walk you through them.',
    heroCtaPrimary: 'Reserve this lot',
    heroCtaSecondary: 'Request a visit',
    reserveNote: 'An FCI agent confirms within 24 working hours.',
    reservedNote: 'This lot is currently being reserved. Leave your details if you\u2019d like to be notified in case of cancellation.',
    soldNote: 'Lot sold. Explore the other available lots in this program.',
    similarTitle: 'Other available lots in this program',
    typeLabels: { TERRAIN: 'Land', MAISON: 'Home', LOTISSEMENT: 'Subdivision' } as Record<string, string>,
    trust: {
      licensed: 'Licensed developer (Ministry of Construction)',
      acd: 'ACD procedure handled by FCI',
      schedule: 'Payment plan tailored to your budget',
    },
    faq: {
      title: 'Frequently asked',
      items: [
        {
          q: 'Does the displayed price include ACD and notary fees?',
          a: 'No — the displayed price covers lot acquisition only. Notary fees and the ACD procedure are detailed in the contract, following a standard schedule. FCI handles the ACD procedure end-to-end (up to 18 months depending on zone) — included in the journey.',
        },
        {
          q: 'How does the reservation work?',
          a: 'You click "Reserve this lot", create your account (if needed), and an agent confirms within 24 working hours. They send the reservation contract and deposit instructions — the lot is then locked under your name.',
        },
        {
          q: 'Can I spread payments?',
          a: 'Yes. Terms depend on the program: a deposit at reservation (typically 10 to 30 %), then balance in lump sum or staged across construction for homes. An agent can simulate a plan against your budget.',
        },
        {
          q: 'I\u2019m in the diaspora. Can I buy remotely?',
          a: 'Yes — that\u2019s a large share of our clients. 100 % online reservation, remote signing (electronic or by proxy), international bank transfer payments, construction tracked from your client portal, and ACD handed to your rep in Abidjan or shipped by DHL.',
        },
        {
          q: 'What are the steps to key handover?',
          a: 'Reservation → contract signed at the notary → payments per schedule → construction tracked from client portal → ACD procedure → handover of keys + ACD. On average: 12–24 months for land, 18–30 months for a home.',
        },
      ],
    },
  }
  return l === 'fr' ? fr : en
}
