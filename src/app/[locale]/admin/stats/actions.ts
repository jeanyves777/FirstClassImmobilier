'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }

const schema = z.object({
  yearsExperience: z.coerce.number().int().min(0).max(999),
  satisfiedClients: z.coerce.number().int().min(0).max(999999),
  projectsCount: z.coerce.number().int().min(0).max(999),
  landsSold: z.coerce.number().int().min(0).max(999999),
  housesBuilt: z.coerce.number().int().min(0).max(999999),
  acdDelivered: z.coerce.number().int().min(0).max(999999),
})

export async function updateSiteStats(_prev: State, formData: FormData): Promise<State> {
  const locale = String(formData.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = schema.safeParse({
    yearsExperience: formData.get('yearsExperience'),
    satisfiedClients: formData.get('satisfiedClients'),
    projectsCount: formData.get('projectsCount'),
    landsSold: formData.get('landsSold'),
    housesBuilt: formData.get('housesBuilt'),
    acdDelivered: formData.get('acdDelivered'),
  })
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  await prisma.siteStats.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  })

  revalidatePath(`/${locale}`)
  revalidatePath(`/${locale}/nos-realisations`)
  revalidatePath(`/${locale}/admin/stats`)
  revalidatePath(`/${locale}/admin/dashboard`)
  return { ok: true, timestamp: Date.now() }
}
