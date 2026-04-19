import { setRequestLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { parse as parseLocalized, tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { TeamForm } from './TeamForm'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { deleteTeamMember } from './actions'

export default async function AdminTeamList({
  params,
}: PageProps<'/[locale]/admin/team'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
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
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.content')}
        title={t('navTeam')}
        description={t('descriptions.team')}
      />

      {members.length > 0 && (
        <ul className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const url = m.photoId ? photoById.get(m.photoId) : undefined
            return (
              <li
                key={m.id}
                className="flex items-start gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-4"
              >
                {url ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[color:var(--border)]">
                    <Image src={url} alt={m.fullName} fill sizes="64px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs text-muted">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{m.fullName}</p>
                  <p className="text-xs text-muted">{tr(m.role, l)}</p>
                  <p className="mt-1 text-[11px] text-muted">Order {m.order}</p>
                </div>
                <ConfirmButton
                  action={deleteTeamMember}
                  hiddenFields={{ id: m.id, locale }}
                  title="Remove team member?"
                  description={`${m.fullName} will no longer appear on the public team page.`}
                  confirmLabel="Remove"
                  variant="danger"
                  size="sm"
                >
                  Remove
                </ConfirmButton>
              </li>
            )
          })}
        </ul>
      )}

      <h2 className="mb-3 font-display text-xl font-semibold text-foreground">
        {members.length > 0 ? 'Add another member' : 'Add the first member'}
      </h2>
      <TeamForm locale={locale} mode="create" />

      {members.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 font-display text-xl font-semibold text-foreground">Edit existing members</h2>
          <div className="space-y-4">
            {members.map((m) => {
              const url = m.photoId ? photoById.get(m.photoId) : undefined
              return (
                <TeamForm
                  key={m.id}
                  locale={locale}
                  mode="edit"
                  member={{
                    id: m.id,
                    fullName: m.fullName,
                    role: parseLocalized(m.role),
                    photoUrl: url ?? null,
                    order: m.order,
                  }}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
