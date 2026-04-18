import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { ChatThreadView } from '@/components/fci/ChatThreadView'
import { ChatComposer } from '@/components/fci/ChatComposer'
import { ChatLive } from '@/components/fci/ChatLive'
import { sendPortalMessage } from './actions'

export default async function PortalMessages({
  params,
}: PageProps<'/[locale]/portal/messages'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('portal')
  const user = await getSessionUser()
  if (!user) return null

  // Ensure there's always at least one open thread between this user and FCI.
  let thread = await prisma.chatThread.findFirst({
    where: { userId: user.id, status: { in: ['open', 'pending'] } },
    orderBy: { updatedAt: 'desc' },
  })
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: { userId: user.id, status: 'open', subject: 'Conversation with FCI' },
    })
  }

  const messages = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'asc' },
  })

  // Mark incoming messages as read on view
  await prisma.chatMessage.updateMany({
    where: { threadId: thread.id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  })

  const assignedStaff = thread.assignedStaffId
    ? await prisma.user.findUnique({
        where: { id: thread.assignedStaffId },
        select: { fullName: true, email: true },
      })
    : null

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] bg-surface px-5 py-4">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">{t('portalMessages')}</h1>
          <p className="text-xs text-muted">
            {assignedStaff
              ? `Your agent: ${assignedStaff.fullName ?? assignedStaff.email}`
              : 'FCI staff will reply here soon.'}
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          Live
        </span>
      </header>

      <ChatThreadView messages={messages} currentUserId={user.id} locale={locale} />
      <ChatLive threadId={thread.id} />
      <ChatComposer
        action={sendPortalMessage}
        threadId={thread.id}
        locale={locale}
        placeholder="Message FCI…"
      />
    </div>
  )
}
