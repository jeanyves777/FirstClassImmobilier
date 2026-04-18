import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { ChatThreadView } from '@/components/fci/ChatThreadView'
import { ChatComposer } from '@/components/fci/ChatComposer'
import { ChatLive } from '@/components/fci/ChatLive'
import { assignThread, sendStaffMessage, setThreadStatus } from '../actions'

export default async function AdminChatThreadPage({
  params,
}: PageProps<'/[locale]/admin/chat/[id]'>) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const me = await getSessionUser()
  if (!me) return null

  const thread = await prisma.chatThread.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, role: true } },
    },
  })
  if (!thread) notFound()

  const [messages, staffOptions, assignedStaff] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: { in: ['STAFF', 'ADMIN'] } },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    }),
    thread.assignedStaffId
      ? prisma.user.findUnique({
          where: { id: thread.assignedStaffId },
          select: { id: true, fullName: true, email: true },
        })
      : Promise.resolve(null),
  ])
  // keep reference to avoid lint warning
  void assignedStaff

  // Mark user's messages as read
  await prisma.chatMessage.updateMany({
    where: { threadId: thread.id, senderId: thread.userId, readAt: null },
    data: { readAt: new Date() },
  })

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-background">
      <header className="space-y-3 border-b border-[color:var(--border)] bg-surface px-5 py-4">
        <Link
          href="/admin/chat"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          All threads
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground">
              {thread.user.fullName || thread.user.email}
            </h1>
            <p className="text-xs text-muted">
              <a href={`mailto:${thread.user.email}`} className="hover:text-foreground">{thread.user.email}</a>
              {thread.user.phone && (
                <> · <a href={`tel:${thread.user.phone}`} className="hover:text-foreground">{thread.user.phone}</a></>
              )}
              <> · {thread.user.role}</>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form action={assignThread} className="flex items-center gap-1.5">
              <input type="hidden" name="threadId" value={thread.id} />
              <input type="hidden" name="locale" value={locale} />
              <select
                name="assignedStaffId"
                defaultValue={thread.assignedStaffId ?? ''}
                className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
              >
                <option value="">— Unassigned —</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName || s.email}</option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg border border-[color:var(--border)] bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted"
              >
                Assign
              </button>
            </form>
            <form action={setThreadStatus} className="flex items-center gap-1.5">
              <input type="hidden" name="threadId" value={thread.id} />
              <input type="hidden" name="locale" value={locale} />
              <select
                name="status"
                defaultValue={thread.status}
                className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
              >
                <option value="open">open</option>
                <option value="pending">pending</option>
                <option value="closed">closed</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-[color:var(--brand-navy)] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </header>

      <ChatThreadView messages={messages} currentUserId={me.id} locale={locale} />
      <ChatLive threadId={thread.id} />
      <ChatComposer
        action={sendStaffMessage}
        threadId={thread.id}
        locale={locale}
        placeholder="Reply as FCI…"
      />
    </div>
  )
}
