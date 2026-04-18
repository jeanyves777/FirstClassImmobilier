'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth/rbac'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { locales } from '@/i18n/routing'

type ProfileState = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }
type PasswordState = { ok: boolean; error?: string; timestamp?: number }

const profileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional().default('').transform((v) => (v.trim() ? v.trim() : null)),
  whatsapp: z.string().optional().default('').transform((v) => (v.trim() ? v.trim() : null)),
  locale: z.enum(locales as unknown as [string, ...string[]]),
})

export async function updateProfile(
  _prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  const locale = String(fd.get('locale') ?? 'fr')
  const user = await requireUser(locale, `/${locale}/portal/settings`)
  const parsed = profileSchema.safeParse({
    fullName: fd.get('fullName'),
    phone: fd.get('phone') ?? '',
    whatsapp: fd.get('whatsapp') ?? '',
    locale: fd.get('userLocale') ?? 'fr',
  })
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  })
  revalidatePath(`/${locale}/portal/settings`)
  return { ok: true, timestamp: Date.now() }
}

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Required'),
    next: z.string().min(8, 'At least 8 characters'),
    confirm: z.string().min(8),
  })
  .refine((v) => v.next === v.confirm, { message: 'Passwords do not match', path: ['confirm'] })

export async function changePassword(
  _prev: PasswordState,
  fd: FormData,
): Promise<PasswordState> {
  const locale = String(fd.get('locale') ?? 'fr')
  const user = await requireUser(locale, `/${locale}/portal/settings`)
  const parsed = passwordSchema.safeParse({
    current: fd.get('current'),
    next: fd.get('next'),
    confirm: fd.get('confirm'),
  })
  if (!parsed.success) {
    const first = Object.values(z.flattenError(parsed.error).fieldErrors)[0]?.[0] ?? 'Invalid'
    return { ok: false, error: first }
  }

  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
  if (!row?.passwordHash) return { ok: false, error: 'No password on file' }

  const ok = await verifyPassword(parsed.data.current, row.passwordHash)
  if (!ok) return { ok: false, error: 'Current password is incorrect' }

  const passwordHash = await hashPassword(parsed.data.next)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  return { ok: true, timestamp: Date.now() }
}
