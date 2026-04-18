'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { publish } from '@/lib/chat/bus'

type State = { ok: boolean; error?: string; timestamp?: number }

const sendSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
})

export async function sendStaffMessage(_prev: State, fd: FormData): Promise<State> {
  const locale = String(fd.get('locale') ?? 'fr')
  const staff = await requireStaff(locale)
  const parsed = sendSchema.safeParse({ threadId: fd.get('threadId'), body: fd.get('body') })
  if (!parsed.success) return { ok: false, error: 'Message can\u2019t be empty' }

  const thread = await prisma.chatThread.findUnique({ where: { id: parsed.data.threadId } })
  if (!thread) return { ok: false, error: 'Thread not found' }

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { threadId: thread.id, senderId: staff.id, body: parsed.data.body },
    }),
    prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        status: 'open',
        assignedStaffId: thread.assignedStaffId ?? staff.id,
      },
    }),
  ])

  publish(thread.id)
  revalidatePath(`/${locale}/admin/chat`)
  revalidatePath(`/${locale}/admin/chat/${thread.id}`)
  revalidatePath(`/${locale}/portal/messages`)
  return { ok: true, timestamp: Date.now() }
}

export async function assignThread(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const staff = await requireStaff(locale)
  const id = String(formData.get('threadId') ?? '')
  const raw = String(formData.get('assignedStaffId') ?? '')
  const assignedStaffId = raw === 'me' ? staff.id : raw === '' ? null : raw
  if (!id) return
  await prisma.chatThread.update({ where: { id }, data: { assignedStaffId } })
  revalidatePath(`/${locale}/admin/chat`)
  revalidatePath(`/${locale}/admin/chat/${id}`)
}

export async function setThreadStatus(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  await requireStaff(locale)
  const id = String(formData.get('threadId') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!['open', 'pending', 'closed'].includes(status)) return
  if (!id) return
  await prisma.chatThread.update({ where: { id }, data: { status } })
  revalidatePath(`/${locale}/admin/chat`)
  revalidatePath(`/${locale}/admin/chat/${id}`)
}
