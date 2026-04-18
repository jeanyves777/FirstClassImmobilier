import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { PageShell } from '@/components/fci/PageShell'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import { formatFCFA, formatSurface } from '@/lib/format'
import type { Locale } from '@/i18n/routing'
import { LotGallery } from './LotGallery'
import { VisitRequestForm } from './VisitRequestForm'
import { reserveLot } from './reserve-actions'

export default async function LotPage({
  params,
}: PageProps<'/[locale]/a-la-une/[slug]/lots/[ref]'>) {
  const { locale, slug, ref } = await params
  setRequestLocale(locale)

  const program = await prisma.program.findUnique({ where: { slug } })
  if (!program) notFound()

  const lot = await prisma.lot.findUnique({
    where: { programId_reference: { programId: program.id, reference: ref } },
    include: { media: { orderBy: { order: 'asc' } } },
  })
  if (!lot) notFound()

  const t = await getTranslations('lot')
  const l = locale as Locale
  const features: string[] = lot.features ? (() => {
    try { return JSON.parse(lot.features!) as string[] } catch { return [] }
  })() : []

  const photos = lot.media
    .filter((m) => m.kind === 'image')
    .map((m) => ({ url: m.url, alt: tr(m.alt, l) || lot.reference }))

  return (
    <PageShell
      eyebrow={`${tr(program.name, l)} · ${lot.reference}`}
      title={tr(lot.title, l) || t('lot')}
      intro={tr(lot.highlights, l) || undefined}
      wide
    >
      <Link
        href={`/a-la-une/${slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        {t('backToProgram')}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <LotGallery photos={photos} />

          {lot.virtualTourUrl && (
            <TourEmbed url={lot.virtualTourUrl} title={t('virtualTour')} />
          )}

          {lot.videoUrl && (
            <VideoEmbed url={lot.videoUrl} title={t('videoTour')} />
          )}

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t('features')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {features.length > 0 ? (
                features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2.5 rounded-xl border border-[color:var(--border)] bg-surface px-4 py-3 text-sm"
                  >
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)]">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </span>
                    <span className="text-foreground">{f}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">—</p>
              )}
            </div>
          </section>

          {lot.description && (
            <section className="prose prose-sm max-w-none text-muted dark:prose-invert">
              <h2 className="font-display text-xl font-semibold text-foreground">{t('lot')}</h2>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed">
                {tr(lot.description, l)}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
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
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t('surface')}</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{formatSurface(lot.surfaceM2, l)}</dd>
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
                <form action={reserveLot} className="mt-6">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="lotId" value={lot.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="ref" value={lot.reference} />
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[color:var(--brand-red)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--brand-red-600)]"
                  >
                    {t('reserveCta')}
                  </button>
                </form>
              )}
            </div>

            <VisitRequestForm lotId={lot.id} programId={program.id} />
          </div>
        </aside>
      </div>
    </PageShell>
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
        : { label: labels.available, className: 'bg-[color:var(--brand-red)] text-white' }
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function TourEmbed({ url, title }: { url: string; title: string }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-black">
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
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      {isEmbed ? (
        <div className="mt-3 aspect-video overflow-hidden rounded-2xl border border-[color:var(--border)] bg-black">
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
          className="mt-3 aspect-video w-full rounded-2xl border border-[color:var(--border)] bg-black"
        >
          <source src={url} />
        </video>
      )}
    </section>
  )
}
