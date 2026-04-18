import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { PageShell } from '@/components/fci/PageShell'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'

export default async function TeamPage({ params }: PageProps<'/[locale]/nos-equipes'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('team')
  const l = locale as Locale

  const members = await prisma.teamMember.findMany({
    orderBy: [{ order: 'asc' }, { fullName: 'asc' }],
  })

  const photoIds = members.map((m) => m.photoId).filter((v): v is string => !!v)
  const photos = photoIds.length
    ? await prisma.media.findMany({ where: { id: { in: photoIds } }, select: { id: true, url: true } })
    : []
  const photoById = new Map(photos.map((p) => [p.id, p.url]))

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      {members.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface">
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-[color:var(--brand-navy-700)] via-[color:var(--brand-navy)] to-[color:var(--brand-navy-500)]" />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const url = m.photoId ? photoById.get(m.photoId) : undefined
            return (
              <li
                key={m.id}
                className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
              >
                <div className="relative aspect-[4/5] bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]">
                  {url && (
                    <Image
                      src={url}
                      alt={m.fullName}
                      fill
                      sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-5">
                  <p className="font-display text-lg font-semibold text-foreground">{m.fullName}</p>
                  <p className="mt-1 text-sm text-muted">{tr(m.role, l)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </PageShell>
  )
}
