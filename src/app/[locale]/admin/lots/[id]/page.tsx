import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { parse as parseLocalized, tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader, LinkButton } from '@/components/fci/admin/AdminHeader'
import { LotForm } from '../LotForm'
import { deleteLot, removeLotMedia } from '../actions'
import { LotMediaAdd } from './LotMediaAdd'
import { ConfirmButton } from '@/components/ui/ConfirmButton'

export default async function EditLotPage({
  params,
}: PageProps<'/[locale]/admin/lots/[id]'>) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const l = locale as Locale

  const [lot, programs] = await Promise.all([
    prisma.lot.findUnique({
      where: { id },
      include: {
        media: { orderBy: { order: 'asc' } },
        program: { select: { id: true, slug: true, name: true } },
      },
    }),
    prisma.program.findMany({ orderBy: { updatedAt: 'desc' } }),
  ])
  if (!lot) notFound()

  const features: string[] = lot.features
    ? (() => {
        try { return JSON.parse(lot.features) as string[] } catch { return [] }
      })()
    : []

  return (
    <div>
      <AdminHeader
        backHref="/admin/lots"
        backLabel="Lots"
        eyebrow={`${tr(lot.program.name, l) || lot.program.slug} · ${lot.reference}`}
        title={tr(lot.title, l) || lot.reference}
        description={`${lot.media.length} media · ${lot.status}`}
        action={
          <LinkButton
            href={`/a-la-une/${lot.program.slug}/lots/${lot.reference}`}
            variant="secondary"
          >
            View on site →
          </LinkButton>
        }
      />

      <LotForm
        locale={locale}
        mode="edit"
        programs={programs.map((p) => ({ id: p.id, slug: p.slug, label: tr(p.name, l) || p.slug }))}
        lot={{
          id: lot.id,
          programId: lot.programId,
          reference: lot.reference,
          surfaceM2: lot.surfaceM2,
          priceFCFA: lot.priceFCFA.toString(),
          status: lot.status,
          bedrooms: lot.bedrooms,
          bathrooms: lot.bathrooms,
          title: lot.title ? parseLocalized(lot.title) : null,
          description: lot.description ? parseLocalized(lot.description) : null,
          highlights: lot.highlights ? parseLocalized(lot.highlights) : null,
          features,
          videoUrl: lot.videoUrl,
          virtualTourUrl: lot.virtualTourUrl,
        }}
      />

      {/* Media management ────────────────────────────────────────── */}
      <section className="mt-10 rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <header className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Gallery & videos</h2>
          <p className="text-xs text-muted">{lot.media.length} items</p>
        </header>

        {lot.media.length > 0 ? (
          <ul className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lot.media.map((m) => (
              <li key={m.id} className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-surface-muted">
                <div className="relative aspect-video bg-zinc-900">
                  {m.kind === 'image' ? (
                    <Image src={m.url} alt={tr(m.alt, l) || m.url} fill sizes="300px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs uppercase tracking-wider text-white/70">
                      {m.kind}
                    </div>
                  )}
                  <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    {m.kind}
                  </span>
                </div>
                <div className="p-3 text-xs">
                  <p className="truncate text-muted" title={m.url}>{m.url}</p>
                  <div className="mt-2 flex justify-end">
                    <ConfirmButton
                      action={removeLotMedia}
                      hiddenFields={{ mediaId: m.id, lotId: lot.id, locale }}
                      title="Remove this media?"
                      description="It will disappear from the public gallery and the buyer portal."
                      confirmLabel="Remove"
                      variant="danger"
                      size="sm"
                    >
                      Remove
                    </ConfirmButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-6 rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted p-6 text-center text-sm text-muted">
            No media yet. Add the first image below.
          </p>
        )}

        <LotMediaAdd lotId={lot.id} locale={locale} />
      </section>

      {/* Danger zone ─────────────────────────────────────────────── */}
      <section className="mt-10 rounded-2xl border border-[color:var(--brand-red)]/30 bg-[color:var(--brand-red)]/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Delete this lot</h3>
            <p className="text-xs text-muted">Removes all media and any related reservations. Irreversible.</p>
          </div>
          <ConfirmButton
            action={deleteLot}
            hiddenFields={{ id: lot.id, locale }}
            title="Delete this lot?"
            description={`Lot ${lot.reference} and its ${lot.media.length} media items will be permanently removed.`}
            confirmLabel="Yes, delete lot"
            variant="danger"
          >
            Delete lot
          </ConfirmButton>
        </div>
      </section>

      <Link
        href={`/a-la-une/${lot.program.slug}/lots/${lot.reference}`}
        className="mt-6 inline-flex text-xs text-muted hover:text-foreground"
      >
        ↗ View public lot page
      </Link>
    </div>
  )
}
