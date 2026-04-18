'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }

const schema = z.object({
  name: z.string().min(2),
  url: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  logoUrl: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : null)),
  order: z.coerce.number().int().min(0).default(0),
})

async function writeLogo(partnerId: string, logoUrl: string | null) {
  if (!logoUrl) return
  const media = await prisma.media.create({ data: { kind: 'image', url: logoUrl } })
  await prisma.partner.update({ where: { id: partnerId }, data: { logoId: media.id } })
}

export async function createPartner(_prev: State, fd: FormData): Promise<State> {
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = schema.safeParse({
    name: String(fd.get('name') ?? '').trim(),
    url: String(fd.get('url') ?? ''),
    logoUrl: String(fd.get('logoUrl') ?? ''),
    order: fd.get('order'),
  })
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const created = await prisma.partner.create({
    data: {
      name: parsed.data.name,
      url: parsed.data.url ?? null,
      order: parsed.data.order,
    },
  })
  await writeLogo(created.id, parsed.data.logoUrl)

  revalidatePath(`/${locale}/admin/partners`)
  revalidatePath(`/${locale}/nous-decouvrir`)
  return { ok: true, timestamp: Date.now() }
}

export async function deletePartner(fd: FormData): Promise<void> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return
  await prisma.partner.delete({ where: { id } })
  revalidatePath(`/${locale}/admin/partners`)
  revalidatePath(`/${locale}/nous-decouvrir`)
}
