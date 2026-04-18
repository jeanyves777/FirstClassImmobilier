import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'

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
    ? await prisma.media.findMany({ where: { id: { in: coverIds } }, select: { id: true, url: true } })
    : []
  const coverById = new Map(covers.map((c) => [c.id, c.url]))

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      {activities.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
          Publications à venir.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => {
            const coverUrl = a.coverId ? coverById.get(a.coverId) : undefined
            return (
              <article
                key={a.id}
                className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
              >
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]"
                  style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
                />
                <div className="p-5">
                  <time className="text-xs uppercase tracking-wider text-[color:var(--brand-red)]">
                    {new Date(a.date).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                  <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{tr(a.title, l)}</h3>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
