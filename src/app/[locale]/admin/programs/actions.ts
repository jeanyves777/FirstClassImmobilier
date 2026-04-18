'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { localizedTextSchema } from '@/lib/zod/localized'

type FormState = { ok: boolean; errors?: Record<string, string[]>; id?: string }

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const programSchema = z.object({
  slug: z.string().min(2).regex(slugRe, 'Use lowercase kebab-case (a-z, 0-9, dashes)'),
  name: z.string().transform((v, ctx) => parseLocalized(v, ctx)),
  tagline: z.string().transform((v, ctx) => parseLocalized(v, ctx)),
  description: z.string().transform((v, ctx) => parseLocalized(v, ctx)),
  type: z.enum(['TERRAIN', 'MAISON', 'LOTISSEMENT']),
  status: z.enum(['DRAFT', 'ON_SALE', 'SOLD_OUT', 'DELIVERED']),
  zone: z.string().min(2),
  featured: z.string().optional().transform((v) => v === 'on' || v === 'true'),
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

function readForm(fd: FormData) {
  return {
    slug: String(fd.get('slug') ?? '').trim().toLowerCase(),
    name: String(fd.get('name') ?? ''),
    tagline: String(fd.get('tagline') ?? ''),
    description: String(fd.get('description') ?? ''),
    type: String(fd.get('type') ?? 'LOTISSEMENT'),
    status: String(fd.get('status') ?? 'ON_SALE'),
    zone: String(fd.get('zone') ?? '').trim(),
    featured: String(fd.get('featured') ?? ''),
  }
}

export async function createProgram(_prev: FormState, fd: FormData): Promise<FormState> {
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = programSchema.safeParse(readForm(fd))
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const existing = await prisma.program.findUnique({ where: { slug: parsed.data.slug } })
  if (existing) return { ok: false, errors: { slug: ['Already used'] } }

  const created = await prisma.program.create({ data: { ...parsed.data } })
  revalidatePath(`/${locale}/admin/programs`)
  revalidatePath(`/${locale}/a-la-une`)
  redirect(`/${locale}/admin/programs/${created.id}`)
}

export async function updateProgram(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return { ok: false, errors: { id: ['Missing id'] } }
  const parsed = programSchema.safeParse(readForm(fd))
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const existing = await prisma.program.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  })
  if (existing) return { ok: false, errors: { slug: ['Already used'] } }

  await prisma.program.update({ where: { id }, data: { ...parsed.data } })
  revalidatePath(`/${locale}/admin/programs`)
  revalidatePath(`/${locale}/admin/programs/${id}`)
  revalidatePath(`/${locale}/a-la-une`)
  revalidatePath(`/${locale}/a-la-une/${parsed.data.slug}`)
  return { ok: true, id }
}

export async function deleteProgram(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const locale = String(formData.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return
  await prisma.program.delete({ where: { id } })
  revalidatePath(`/${locale}/admin/programs`)
  revalidatePath(`/${locale}/a-la-une`)
  redirect(`/${locale}/admin/programs`)
}

// ── Program media (hero + gallery) ─────────────────────────────────────

const mediaSchema = z.object({
  programId: z.string().min(1),
  kind: z.enum(['image', 'video', 'tour']),
  url: z.url(),
})

export async function addProgramMedia(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = mediaSchema.safeParse({
    programId: formData.get('programId'),
    kind: formData.get('kind'),
    url: formData.get('url'),
  })
  if (!parsed.success) return
  const count = await prisma.media.count({ where: { programId: parsed.data.programId } })
  await prisma.media.create({
    data: {
      programId: parsed.data.programId,
      kind: parsed.data.kind,
      url: parsed.data.url,
      order: count,
    },
  })
  revalidatePath(`/${locale}/admin/programs/${parsed.data.programId}`)
  revalidatePath(`/${locale}/a-la-une`)
}

export async function removeProgramMedia(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const programId = String(formData.get('programId') ?? '')
  const mediaId = String(formData.get('mediaId') ?? '')
  await requireStaff(locale)
  if (!mediaId) return
  await prisma.media.delete({ where: { id: mediaId } })
  if (programId) revalidatePath(`/${locale}/admin/programs/${programId}`)
  revalidatePath(`/${locale}/a-la-une`)
}

export async function setProgramHero(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const programId = String(formData.get('programId') ?? '')
  const rawMediaId = String(formData.get('mediaId') ?? '')
  const heroMediaId = rawMediaId === '' ? null : rawMediaId
  await requireStaff(locale)
  if (!programId) return
  await prisma.program.update({ where: { id: programId }, data: { heroMediaId } })
  revalidatePath(`/${locale}/admin/programs/${programId}`)
  revalidatePath(`/${locale}/a-la-une`)
  revalidatePath(`/${locale}/a-la-une/${programId}`)
}

// ── Program plans (PDFs) ───────────────────────────────────────────────

const planSchema = z.object({
  programId: z.string().min(1),
  label: z.string().transform((v, ctx) => {
    try {
      const parsed = localizedTextSchema.parse(JSON.parse(v))
      return JSON.stringify(parsed)
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid payload' })
      return v
    }
  }),
  fileUrl: z.url(),
})

export async function addProgramPlan(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = planSchema.safeParse({
    programId: formData.get('programId'),
    label: formData.get('label'),
    fileUrl: formData.get('fileUrl'),
  })
  if (!parsed.success) return
  await prisma.plan.create({ data: { ...parsed.data } })
  revalidatePath(`/${locale}/admin/programs/${parsed.data.programId}`)
  revalidatePath(`/${locale}/a-la-une/${parsed.data.programId}`)
}

export async function removeProgramPlan(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const programId = String(formData.get('programId') ?? '')
  const planId = String(formData.get('planId') ?? '')
  await requireStaff(locale)
  if (!planId) return
  await prisma.plan.delete({ where: { id: planId } })
  if (programId) revalidatePath(`/${locale}/admin/programs/${programId}`)
}
