'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { localizedTextSchema } from '@/lib/zod/localized'
import { availabilitySchema } from '@/lib/schedule/availability'

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }

const urlOrEmpty = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : null))
  .refine((v) => v === null || /^https?:\/\//.test(v), { message: 'Must start with http(s)://' })

const schema = z.object({
  phone: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  mobile: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  whatsapp: z.string().optional().transform((v) => (v && v.trim() ? v.trim().replace(/\D/g, '') : null)),
  email: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  address: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  hoursFr: z.string().optional().transform((v) => (v && v.trim() ? v : null)),
  hoursEn: z.string().optional().transform((v) => (v && v.trim() ? v : null)),
  facebookUrl: urlOrEmpty,
  instagramUrl: urlOrEmpty,
  linkedinUrl: urlOrEmpty,
  youtubeUrl: urlOrEmpty,
  tiktokUrl: urlOrEmpty,
  footerCopy: z
    .string()
    .optional()
    .transform((v, ctx) => {
      const raw = (v ?? '').trim()
      if (!raw) return null
      try {
        const parsed = localizedTextSchema.parse(JSON.parse(raw))
        if (!parsed.fr.trim() && !parsed.en.trim()) return null
        return JSON.stringify(parsed)
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Invalid payload' })
        return raw
      }
    }),
  slotDurationMin: z.coerce.number().int().min(15).max(240).default(45),
  availability: z
    .string()
    .optional()
    .transform((v, ctx) => {
      const raw = (v ?? '').trim()
      if (!raw) return null
      try {
        const parsed = availabilitySchema.parse(JSON.parse(raw))
        return JSON.stringify(parsed)
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Invalid availability windows' })
        return raw
      }
    }),
})

export async function updateSiteSettings(_prev: State, fd: FormData): Promise<State> {
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = schema.safeParse({
    phone: fd.get('phone') ?? '',
    mobile: fd.get('mobile') ?? '',
    whatsapp: fd.get('whatsapp') ?? '',
    email: fd.get('email') ?? '',
    address: fd.get('address') ?? '',
    hoursFr: fd.get('hoursFr') ?? '',
    hoursEn: fd.get('hoursEn') ?? '',
    facebookUrl: fd.get('facebookUrl') ?? '',
    instagramUrl: fd.get('instagramUrl') ?? '',
    linkedinUrl: fd.get('linkedinUrl') ?? '',
    youtubeUrl: fd.get('youtubeUrl') ?? '',
    tiktokUrl: fd.get('tiktokUrl') ?? '',
    footerCopy: fd.get('footerCopy') ?? '',
    slotDurationMin: fd.get('slotDurationMin') ?? 45,
    availability: fd.get('availability') ?? '',
  })
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  })

  revalidatePath('/', 'layout')
  return { ok: true, timestamp: Date.now() }
}
