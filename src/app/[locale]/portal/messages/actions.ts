'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth/rbac'
import { publish } from '@/lib/chat/bus'

type State = { ok: boolean; error?: string; timestamp?: number }

const sendSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
})

export async function sendPortalMessage(_prev: State, fd: FormData): Promise<State> {
  const locale = String(fd.get('locale') ?? 'fr')
  const user = await requireUser(locale, `/${locale}/portal/messages`)
  const parsed = sendSchema.safeParse({
    threadId: fd.get('threadId'),
    body: fd.get('body'),
  })
  if (!parsed.success) return { ok: false, error: 'Message can\u2019t be empty' }

  const thread = await prisma.chatThread.findUnique({ where: { id: parsed.data.threadId } })
  if (!thread || thread.userId !== user.id) return { ok: false, error: 'Thread not found' }

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        senderId: user.id,
        body: parsed.data.body,
      },
    }),
    prisma.chatThread.update({
      where: { id: thread.id },
      data: { status: thread.status === 'closed' ? 'open' : thread.status },
    }),
  ])

  publish(thread.id)
  revalidatePath(`/${locale}/portal/messages`)
  revalidatePath(`/${locale}/admin/chat/${thread.id}`)
  revalidatePath(`/${locale}/admin/chat`)
  return { ok: true, timestamp: Date.now() }
}
