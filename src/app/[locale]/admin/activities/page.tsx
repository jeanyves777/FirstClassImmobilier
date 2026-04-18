import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader, LinkButton } from '@/components/fci/admin/AdminHeader'

export default async function AdminActivitiesList({
  params,
}: PageProps<'/[locale]/admin/activities'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale

  const activities = await prisma.activity.findMany({
    orderBy: { date: 'desc' },
    include: { gallery: { orderBy: { order: 'asc' }, take: 1 } },
  })

  // Helper to read a Media cover when coverId present
  const coverIds = activities.map((a) => a.coverId).filter((v): v is string => !!v)
  const covers = coverIds.length
    ? await prisma.media.findMany({ where: { id: { in: coverIds } }, select: { id: true, url: true } })
    : []
  const coverById = new Map(covers.map((c) => [c.id, c.url]))

  return (
    <div>
      <AdminHeader
        eyebrow="Content"
        title="Activities"
        description="Events, openings and company life. Published entries appear on the public « Nos Activités » tab."
        action={<LinkButton href="/admin/activities/new">+ New activity</LinkButton>}
      />

      {activities.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
          No activities yet. Create your first event to tell the FCI story.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => {
            const coverUrl = a.coverId ? coverById.get(a.coverId) : undefined
            const published = !!a.publishedAt
            return (
              <li key={a.id}>
                <Link
                  href={`/admin/activities/${a.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
                >
                  <div
                    className="aspect-[4/3] w-full bg-cover bg-center bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]"
                    style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
                  />
                  <div className="flex flex-1 flex-col p-4">
                    <time className="text-xs uppercase tracking-wider text-[color:var(--brand-red)]">
                      {new Date(a.date).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                    <h3 className="mt-1 font-display text-base font-semibold leading-tight text-foreground">
                      {tr(a.title, l)}
                    </h3>
                    <div className="mt-auto flex items-center gap-2 pt-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          published
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-surface-muted text-muted'
                        }`}
                      >
                        {published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
