'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { localizedTextSchema } from '@/lib/zod/localized'

type State = { ok: boolean; errors?: Record<string, string[]>; id?: string; timestamp?: number }

const schema = z.object({
  title: z.string().transform((v, ctx) => parseLocalized(v, ctx)),
  body: z.string().transform((v, ctx) => parseLocalized(v, ctx)),
  date: z.string().min(1),
  coverUrl: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  published: z.string().optional().transform((v) => v === 'on' || v === 'true'),
})

function parseLocalized(raw: string, ctx: z.RefinementCtx) {
  try {
    const parsed = localizedTextSchema.parse(JSON.parse(raw))
    if (!parsed.fr.trim() && !parsed.en.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Both languages empty' })
      return JSON.stringify({ fr: '', en: '' })
    }
    return JSON.stringify(parsed)
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Invalid payload' })
    return raw
  }
}

function read(fd: FormData) {
  return {
    title: String(fd.get('title') ?? ''),
    body: String(fd.get('body') ?? ''),
    date: String(fd.get('date') ?? ''),
    coverUrl: String(fd.get('coverUrl') ?? ''),
    published: String(fd.get('published') ?? ''),
  }
}

async function ensureCoverMedia(activityId: string, coverUrl: string | null) {
  if (!coverUrl) {
    const existing = await prisma.activity.findUnique({ where: { id: activityId }, select: { coverId: true } })
    if (existing?.coverId) {
      await prisma.activity.update({ where: { id: activityId }, data: { coverId: null } })
    }
    return
  }
  const media = await prisma.media.create({
    data: { kind: coverUrl.match(/\.(mp4|webm)$/i) ? 'video' : 'image', url: coverUrl, activityId },
  })
  await prisma.activity.update({ where: { id: activityId }, data: { coverId: media.id } })
}

export async function createActivity(_prev: State, fd: FormData): Promise<State> {
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = schema.safeParse(read(fd))
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const created = await prisma.activity.create({
    data: {
      title: parsed.data.title!,
      body: parsed.data.body!,
      date: new Date(parsed.data.date),
      publishedAt: parsed.data.published ? new Date() : null,
    },
  })
  await ensureCoverMedia(created.id, parsed.data.coverUrl)

  revalidatePath(`/${locale}/admin/activities`)
  revalidatePath(`/${locale}/nos-activites`)
  redirect(`/${locale}/admin/activities/${created.id}`)
}

export async function updateActivity(_prev: State, fd: FormData): Promise<State> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return { ok: false, errors: { id: ['Missing id'] } }
  const parsed = schema.safeParse(read(fd))
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  await prisma.activity.update({
    where: { id },
    data: {
      title: parsed.data.title!,
      body: parsed.data.body!,
      date: new Date(parsed.data.date),
      publishedAt: parsed.data.published ? new Date() : null,
    },
  })
  if (parsed.data.coverUrl) {
    await ensureCoverMedia(id, parsed.data.coverUrl)
  }

  revalidatePath(`/${locale}/admin/activities`)
  revalidatePath(`/${locale}/admin/activities/${id}`)
  revalidatePath(`/${locale}/nos-activites`)
  return { ok: true, id, timestamp: Date.now() }
}

export async function deleteActivity(fd: FormData): Promise<void> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return
  await prisma.activity.delete({ where: { id } })
  revalidatePath(`/${locale}/admin/activities`)
  revalidatePath(`/${locale}/nos-activites`)
  redirect(`/${locale}/admin/activities`)
}
