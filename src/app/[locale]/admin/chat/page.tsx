import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import type { Locale } from '@/i18n/routing'

const STATUS_ORDER = ['open', 'pending', 'closed']

export default async function AdminChatInbox({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/chat'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale
  const sp = await searchParams
  const status = typeof sp.status === 'string' ? sp.status : undefined

  const threadsRaw = await prisma.chatThread.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { fullName: true, email: true, role: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: { readAt: null },
          },
        },
      },
    },
  })

  const staffIds = Array.from(
    new Set(threadsRaw.map((t) => t.assignedStaffId).filter((v): v is string => !!v)),
  )
  const staffUsers = staffIds.length
    ? await prisma.user.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, fullName: true, email: true },
      })
    : []
  const staffById = new Map(staffUsers.map((u) => [u.id, u]))
  const threads = threadsRaw.map((t) => ({
    ...t,
    assignedStaff: t.assignedStaffId ? staffById.get(t.assignedStaffId) ?? null : null,
  }))

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.support')}
        title={t('navChat')}
        description={t('descriptions.chat')}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip href="/admin/chat" active={!status} label="All" />
        {STATUS_ORDER.map((s) => (
          <Chip key={s} href={`/admin/chat?status=${s}`} active={status === s} label={s} />
        ))}
      </div>

      <ul className="space-y-2">
        {threads.map((t) => {
          const last = t.messages[0]
          const unread = t._count.messages
          return (
            <li key={t.id}>
              <Link
                href={`/admin/chat/${t.id}`}
                className="flex items-start gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,.25)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-sm font-semibold text-white">
                  {(t.user.fullName?.[0] ?? t.user.email[0] ?? '?').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="truncate font-medium text-foreground">
                      {t.user.fullName || t.user.email}
                    </p>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {t.user.role}
                    </span>
                    <Status value={t.status} />
                  </div>
                  {last ? (
                    <p className="mt-1 line-clamp-1 text-xs text-muted">{last.body}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted italic">No messages yet</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-muted">
                  <span>{new Date(t.updatedAt).toLocaleString(l === 'fr' ? 'fr-FR' : 'en-US')}</span>
                  {unread > 0 && (
                    <span className="rounded-full bg-[color:var(--brand-red)] px-2 py-0.5 text-[10px] font-semibold text-white">
                      {unread} new
                    </span>
                  )}
                  {t.assignedStaff && (
                    <span className="truncate max-w-[120px]">
                      → {t.assignedStaff.fullName ?? t.assignedStaff.email}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
        {threads.length === 0 && (
          <li className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
            No threads match this filter.
          </li>
        )}
      </ul>
    </div>
  )
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-transparent bg-[color:var(--brand-navy)] text-white'
          : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
      }`}
    >
      {label}
    </a>
  )
}

function Status({ value }: { value: string }) {
  const map: Record<string, string> = {
    open: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    closed: 'bg-surface-muted text-muted',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
