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

const localizedJsonOrNull = z
  .string()
  .optional()
  .transform((v) => {
    const raw = (v ?? '').trim()
    if (!raw) return null
    try {
      const o = JSON.parse(raw) as { fr?: unknown; en?: unknown }
      const fr = String(o.fr ?? '').trim()
      const en = String(o.en ?? '').trim()
      if (!fr && !en) return null
      return JSON.stringify({ fr, en })
    } catch {
      return null
    }
  })

const cardsJsonOrNull = z
  .string()
  .optional()
  .transform((v) => {
    const raw = (v ?? '').trim()
    if (!raw) return null
    try {
      const arr = JSON.parse(raw)
      if (!Array.isArray(arr)) return null
      const cleaned = arr.map((c) => ({
        title: { fr: String(c?.title?.fr ?? '').trim(), en: String(c?.title?.en ?? '').trim() },
        body: { fr: String(c?.body?.fr ?? '').trim(), en: String(c?.body?.en ?? '').trim() },
      }))
      const has = cleaned.some((c) => c.title.fr || c.title.en || c.body.fr || c.body.en)
      return has ? JSON.stringify(cleaned) : null
    } catch {
      return null
    }
  })

const overridesJsonOrNull = z
  .string()
  .optional()
  .transform((v) => {
    const raw = (v ?? '').trim()
    if (!raw) return null
    try {
      const o = JSON.parse(raw) as Record<string, { fr?: unknown; en?: unknown }>
      if (!o || typeof o !== 'object') return null
      const out: Record<string, { fr: string; en: string }> = {}
      for (const [k, val] of Object.entries(o)) {
        const fr = String(val?.fr ?? '').trim()
        const en = String(val?.en ?? '').trim()
        if (fr || en) out[k] = { fr, en }
      }
      return Object.keys(out).length ? JSON.stringify(out) : null
    } catch {
      return null
    }
  })

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
  whatsappChannelUrl: urlOrEmpty,
  heroTitle: localizedJsonOrNull,
  heroSubtitle: localizedJsonOrNull,
  heroStatement: localizedJsonOrNull,
  heroImageUrl: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  homeUspCards: cardsJsonOrNull,
  homeServices: cardsJsonOrNull,
  aboutContent: z
    .string()
    .optional()
    .transform((v) => {
      const raw = (v ?? '').trim()
      if (!raw) return null
      try {
        const o = JSON.parse(raw) as Record<string, { fr?: unknown; en?: unknown }>
        if (!o || typeof o !== 'object') return null
        const out: Record<string, { fr: string; en: string }> = {}
        for (const [k, val] of Object.entries(o)) {
          const fr = String(val?.fr ?? '').trim()
          const en = String(val?.en ?? '').trim()
          if (fr || en) out[k] = { fr, en }
        }
        return Object.keys(out).length ? JSON.stringify(out) : null
      } catch {
        return null
      }
    }),
  realisationsContent: overridesJsonOrNull,
  activitesContent: overridesJsonOrNull,
  equipesContent: overridesJsonOrNull,
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
  legalCompanyName: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  legalForm: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  legalCapital: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  legalRCCM: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  legalTaxId: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  legalDirector: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  legalHostName: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  legalHostAddress: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
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
    whatsappChannelUrl: fd.get('whatsappChannelUrl') ?? '',
    heroTitle: fd.get('heroTitle') ?? '',
    heroSubtitle: fd.get('heroSubtitle') ?? '',
    heroStatement: fd.get('heroStatement') ?? '',
    heroImageUrl: fd.get('heroImageUrl') ?? '',
    homeUspCards: fd.get('homeUspCards') ?? '',
    homeServices: fd.get('homeServices') ?? '',
    aboutContent: fd.get('aboutContent') ?? '',
    realisationsContent: fd.get('realisationsContent') ?? '',
    activitesContent: fd.get('activitesContent') ?? '',
    equipesContent: fd.get('equipesContent') ?? '',
    footerCopy: fd.get('footerCopy') ?? '',
    slotDurationMin: fd.get('slotDurationMin') ?? 45,
    availability: fd.get('availability') ?? '',
    legalCompanyName: fd.get('legalCompanyName') ?? '',
    legalForm: fd.get('legalForm') ?? '',
    legalCapital: fd.get('legalCapital') ?? '',
    legalRCCM: fd.get('legalRCCM') ?? '',
    legalTaxId: fd.get('legalTaxId') ?? '',
    legalDirector: fd.get('legalDirector') ?? '',
    legalHostName: fd.get('legalHostName') ?? '',
    legalHostAddress: fd.get('legalHostAddress') ?? '',
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
