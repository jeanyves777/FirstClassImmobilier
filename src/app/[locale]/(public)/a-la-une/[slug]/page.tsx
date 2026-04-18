import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { PageShell } from '@/components/fci/PageShell'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import { formatFCFA, formatSurface } from '@/lib/format'
import type { Locale } from '@/i18n/routing'

export default async function ProgramPage({
  params,
}: PageProps<'/[locale]/a-la-une/[slug]'>) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      lots: {
        orderBy: [{ status: 'asc' }, { reference: 'asc' }],
        include: {
          media: { orderBy: { order: 'asc' }, take: 1 },
        },
      },
    },
  })
  if (!program) notFound()

  const t = await getTranslations('featured')
  const tLot = await getTranslations('lot')

  return (
    <PageShell
      eyebrow={t('title')}
      title={tr(program.name, locale as Locale)}
      intro={tr(program.tagline, locale as Locale)}
      wide
    >
      <section className="mb-10 rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-8">
        <p className="max-w-3xl text-base leading-relaxed text-muted">
          {tr(program.description, locale as Locale)}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label={tLot('zone')} value={program.zone} />
          <Stat label={tLot('type')} value={program.type} />
          <Stat label={tLot('status')} value={program.status} />
          <Stat label={tLot('available')} value={String(program.lots.filter((l) => l.status === 'available').length)} />
        </dl>
      </section>

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">{tLot('availableLots')}</h2>
        <span className="text-sm text-muted">
          {program.lots.length} {tLot('lots')}
        </span>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {program.lots.map((lot) => {
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
                    alt={tr(cover.alt, locale as Locale) || lot.reference}
                    fill
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">Photo</div>
                )}
                <LotStatusBadge status={lot.status} labels={{
                  available: tLot('statusAvailable'),
                  reserved: tLot('statusReserved'),
                  sold: tLot('statusSold'),
                }} />
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
                  <span className="text-xs text-muted">{formatSurface(lot.surfaceM2, locale as Locale)}</span>
                </div>
                <h3 className="font-display text-lg font-semibold leading-tight text-foreground">
                  {tr(lot.title, locale as Locale) || tLot('lot')}
                </h3>
                {lot.highlights && (
                  <p className="line-clamp-2 text-sm text-muted">{tr(lot.highlights, locale as Locale)}</p>
                )}
                <div className="flex items-center justify-between pt-2 text-sm">
                  <span className="font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                    {formatFCFA(lot.priceFCFA, locale as Locale)}
                  </span>
                  {lot.bedrooms && (
                    <span className="text-xs text-muted">
                      {lot.bedrooms} · {lot.bathrooms ?? 0}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {program.lots.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-8 text-center text-sm text-muted">
          {tLot('none')}
        </p>
      )}
    </PageShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  )
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
