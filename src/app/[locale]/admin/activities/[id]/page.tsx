import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { parse as parseLocalized } from '@/lib/zod/localized'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { ActivityForm } from '../ActivityForm'
import { deleteActivity } from '../actions'
import { ConfirmButton } from '@/components/ui/ConfirmButton'

export default async function EditActivityPage({
  params,
}: PageProps<'/[locale]/admin/activities/[id]'>) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const activity = await prisma.activity.findUnique({ where: { id } })
  if (!activity) notFound()

  const cover = activity.coverId
    ? await prisma.media.findUnique({ where: { id: activity.coverId }, select: { url: true } })
    : null

  return (
    <div>
      <AdminHeader
        backHref="/admin/activities"
        backLabel="Activities"
        eyebrow={activity.publishedAt ? 'Published' : 'Draft'}
        title={parseLocalized(activity.title).fr || 'Untitled activity'}
      />

      <ActivityForm
        locale={locale}
        mode="edit"
        activity={{
          id: activity.id,
          title: parseLocalized(activity.title),
          body: parseLocalized(activity.body),
          date: activity.date.toISOString().slice(0, 10),
          coverUrl: cover?.url ?? null,
          published: !!activity.publishedAt,
        }}
      />

      <section className="mt-10 rounded-2xl border border-[color:var(--brand-red)]/30 bg-[color:var(--brand-red)]/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Delete this activity</h3>
            <p className="text-xs text-muted">Removes it from « Nos Activités » immediately.</p>
          </div>
          <ConfirmButton
            action={deleteActivity}
            hiddenFields={{ id: activity.id, locale }}
            title="Delete this activity?"
            description="The entry will disappear from the public gallery."
            confirmLabel="Yes, delete"
            variant="danger"
          >
            Delete activity
          </ConfirmButton>
        </div>
      </section>
    </div>
  )
}
