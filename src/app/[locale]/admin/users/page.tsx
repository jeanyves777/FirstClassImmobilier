import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { getSessionUser } from '@/lib/auth/rbac'
import { updateUserRole } from './actions'
import type { Locale } from '@/i18n/routing'

const ROLES = ['VISITOR', 'PROSPECT', 'APPLICANT', 'BUYER', 'STAFF', 'ADMIN'] as const

export default async function AdminUsersPage({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/users'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const role = typeof sp.role === 'string' ? sp.role : undefined
  const me = await getSessionUser()

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { fullName: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: {
      _count: {
        select: {
          sales: true,
          reservations: true,
          appointments: true,
        },
      },
    },
  })

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.access')}
        title={t('navUsers')}
        description={t('descriptions.users')}
      />

      <form className="mb-6 flex flex-wrap items-center gap-3" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="min-w-[220px] flex-1 rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40"
        />
        <select
          name="role"
          defaultValue={role ?? ''}
          className="rounded-xl border border-[color:var(--border)] bg-background px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-full bg-[color:var(--brand-navy)] px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[color:var(--brand-navy-700)]"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-[color:var(--border)] bg-surface-muted text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{u.fullName || '—'}</p>
                  {u.phone && <p className="text-xs text-muted">{u.phone}</p>}
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(u.createdAt).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US')}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  <span className="inline-flex gap-2">
                    <Chip label="Sales" value={u._count.sales} />
                    <Chip label="Resv" value={u._count.reservations} />
                    <Chip label="Appts" value={u._count.appointments} />
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      disabled={me?.id === u.id}
                      className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={me?.id === u.id}
                      className="rounded-lg bg-[color:var(--brand-navy)] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[color:var(--brand-navy-700)] disabled:opacity-50"
                    >
                      Save
                    </button>
                  </form>
                  {me?.id === u.id && (
                    <p className="mt-1 text-[10px] text-muted">You can't demote yourself.</p>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                  No users match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </span>
  )
}
