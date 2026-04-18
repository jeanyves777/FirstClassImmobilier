'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { localizedTextSchema } from '@/lib/zod/localized'

type FormState = { ok: boolean; errors?: Record<string, string[]>; id?: string }

const lotSchema = z.object({
  programId: z.string().min(1),
  reference: z.string().min(1).toUpperCase(),
  surfaceM2: z.coerce.number().int().positive(),
  priceFCFA: z.coerce.number().int().nonnegative(),
  status: z.enum(['available', 'reserved', 'sold']),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  title: z.string().transform((v, ctx) => parseLocalized(v, ctx)).optional(),
  description: z.string().transform((v, ctx) => parseLocalized(v, ctx)).optional(),
  highlights: z.string().transform((v, ctx) => parseLocalized(v, ctx)).optional(),
  features: z.string().transform((v, ctx) => {
    const t = v.trim()
    if (!t) return ''
    try {
      const arr = JSON.parse(t)
      if (!Array.isArray(arr) || !arr.every((x) => typeof x === 'string')) throw new Error()
      return JSON.stringify(arr)
    } catch {
      const lines = t.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean)
      if (!lines.length) {
        ctx.addIssue({ code: 'custom', message: 'Provide comma-separated or JSON array' })
        return t
      }
      return JSON.stringify(lines)
    }
  }).optional(),
  videoUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  virtualTourUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
})

function parseLocalized(raw: string, ctx: z.RefinementCtx) {
  if (!raw || raw === 'null') return ''
  try {
    const parsed = localizedTextSchema.parse(JSON.parse(raw))
    return JSON.stringify(parsed)
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Invalid payload' })
    return raw
  }
}

function readForm(fd: FormData) {
  return {
    programId: String(fd.get('programId') ?? ''),
    reference: String(fd.get('reference') ?? '').trim(),
    surfaceM2: fd.get('surfaceM2'),
    priceFCFA: fd.get('priceFCFA'),
    status: String(fd.get('status') ?? 'available'),
    bedrooms: fd.get('bedrooms') || null,
    bathrooms: fd.get('bathrooms') || null,
    title: String(fd.get('title') ?? ''),
    description: String(fd.get('description') ?? ''),
    highlights: String(fd.get('highlights') ?? ''),
    features: String(fd.get('features') ?? ''),
    videoUrl: String(fd.get('videoUrl') ?? ''),
    virtualTourUrl: String(fd.get('virtualTourUrl') ?? ''),
  }
}

function toData(parsed: z.output<typeof lotSchema>) {
  return {
    programId: parsed.programId,
    reference: parsed.reference,
    surfaceM2: parsed.surfaceM2,
    priceFCFA: BigInt(parsed.priceFCFA),
    status: parsed.status,
    bedrooms: parsed.bedrooms ?? null,
    bathrooms: parsed.bathrooms ?? null,
    title: parsed.title || null,
    description: parsed.description || null,
    highlights: parsed.highlights || null,
    features: parsed.features || null,
    videoUrl: parsed.videoUrl ?? null,
    virtualTourUrl: parsed.virtualTourUrl ?? null,
  }
}

export async function createLot(_prev: FormState, fd: FormData): Promise<FormState> {
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = lotSchema.safeParse(readForm(fd))
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const exists = await prisma.lot.findUnique({
    where: { programId_reference: { programId: parsed.data.programId, reference: parsed.data.reference } },
  })
  if (exists) return { ok: false, errors: { reference: ['Already used in this program'] } }

  const created = await prisma.lot.create({ data: toData(parsed.data) })
  revalidatePath(`/${locale}/admin/lots`)
  revalidatePath(`/${locale}/admin/programs/${parsed.data.programId}`)
  revalidatePath(`/${locale}/a-la-une`)
  redirect(`/${locale}/admin/lots/${created.id}`)
}

export async function updateLot(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = lotSchema.safeParse(readForm(fd))
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const existing = await prisma.lot.findFirst({
    where: {
      programId: parsed.data.programId,
      reference: parsed.data.reference,
      NOT: { id },
    },
  })
  if (existing) return { ok: false, errors: { reference: ['Already used in this program'] } }

  await prisma.lot.update({ where: { id }, data: toData(parsed.data) })
  revalidatePath(`/${locale}/admin/lots`)
  revalidatePath(`/${locale}/admin/lots/${id}`)
  revalidatePath(`/${locale}/a-la-une`)
  return { ok: true, id }
}

export async function deleteLot(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  const locale = String(formData.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return
  await prisma.lot.delete({ where: { id } })
  revalidatePath(`/${locale}/admin/lots`)
  revalidatePath(`/${locale}/a-la-une`)
  redirect(`/${locale}/admin/lots`)
}

const mediaSchema = z.object({
  lotId: z.string().min(1),
  kind: z.enum(['image', 'video', 'pdf', 'tour']),
  url: z.url(),
  alt: z.string().optional().transform((v) => {
    const t = (v ?? '').trim()
    if (!t) return null
    try {
      return JSON.stringify(localizedTextSchema.parse(JSON.parse(t)))
    } catch {
      return JSON.stringify({ fr: t, en: t })
    }
  }),
})

export async function addLotMedia(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = mediaSchema.safeParse({
    lotId: formData.get('lotId'),
    kind: formData.get('kind'),
    url: formData.get('url'),
    alt: formData.get('alt'),
  })
  if (!parsed.success) return
  const count = await prisma.media.count({ where: { lotId: parsed.data.lotId } })
  await prisma.media.create({
    data: {
      lotId: parsed.data.lotId,
      kind: parsed.data.kind,
      url: parsed.data.url,
      alt: parsed.data.alt ?? null,
      order: count,
    },
  })
  revalidatePath(`/${locale}/admin/lots/${parsed.data.lotId}`)
  revalidatePath(`/${locale}/a-la-une`)
}

export async function removeLotMedia(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const mediaId = String(formData.get('mediaId') ?? '')
  const lotId = String(formData.get('lotId') ?? '')
  await requireStaff(locale)
  if (!mediaId) return
  await prisma.media.delete({ where: { id: mediaId } })
  if (lotId) revalidatePath(`/${locale}/admin/lots/${lotId}`)
  revalidatePath(`/${locale}/a-la-une`)
}
