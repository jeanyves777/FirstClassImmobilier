'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { localizedTextSchema } from '@/lib/zod/localized'

type State = { ok: boolean; errors?: Record<string, string[]>; id?: string; timestamp?: number }

const schema = z.object({
  fullName: z.string().min(2),
  role: z.string().transform((v, ctx) => {
    try {
      return JSON.stringify(localizedTextSchema.parse(JSON.parse(v)))
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid payload' })
      return v
    }
  }),
  photoUrl: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  order: z.coerce.number().int().min(0).default(0),
})

function read(fd: FormData) {
  return {
    fullName: String(fd.get('fullName') ?? '').trim(),
    role: String(fd.get('role') ?? ''),
    photoUrl: String(fd.get('photoUrl') ?? ''),
    order: fd.get('order'),
  }
}

async function writePhoto(memberId: string, photoUrl: string | null) {
  if (!photoUrl) {
    const existing = await prisma.teamMember.findUnique({ where: { id: memberId }, select: { photoId: true } })
    if (existing?.photoId) {
      await prisma.teamMember.update({ where: { id: memberId }, data: { photoId: null } })
    }
    return
  }
  const media = await prisma.media.create({ data: { kind: 'image', url: photoUrl } })
  await prisma.teamMember.update({ where: { id: memberId }, data: { photoId: media.id } })
}

export async function createTeamMember(_prev: State, fd: FormData): Promise<State> {
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = schema.safeParse(read(fd))
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const created = await prisma.teamMember.create({
    data: {
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      order: parsed.data.order,
    },
  })
  await writePhoto(created.id, parsed.data.photoUrl)

  revalidatePath(`/${locale}/admin/team`)
  revalidatePath(`/${locale}/nos-equipes`)
  redirect(`/${locale}/admin/team`)
}

export async function updateTeamMember(_prev: State, fd: FormData): Promise<State> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return { ok: false, errors: { id: ['Missing id'] } }
  const parsed = schema.safeParse(read(fd))
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  await prisma.teamMember.update({
    where: { id },
    data: {
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      order: parsed.data.order,
    },
  })
  if (parsed.data.photoUrl) await writePhoto(id, parsed.data.photoUrl)

  revalidatePath(`/${locale}/admin/team`)
  revalidatePath(`/${locale}/nos-equipes`)
  return { ok: true, id, timestamp: Date.now() }
}

export async function deleteTeamMember(fd: FormData): Promise<void> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return
  await prisma.teamMember.delete({ where: { id } })
  revalidatePath(`/${locale}/admin/team`)
  revalidatePath(`/${locale}/nos-equipes`)
}
