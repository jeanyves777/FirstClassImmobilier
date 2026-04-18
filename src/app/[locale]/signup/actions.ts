'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

type State = { ok: boolean; errors?: Record<string, string[]>; error?: string }

const schema = z
  .object({
    fullName: z.string().min(2),
    email: z.email().transform((v) => v.toLowerCase().trim()),
    phone: z.string().optional().default(''),
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string().min(8),
    locale: z.enum(['fr', 'en']).default('fr'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

export async function doSignUp(_prev: State, fd: FormData): Promise<State> {
  const parsed = schema.safeParse({
    fullName: fd.get('fullName'),
    email: fd.get('email'),
    phone: fd.get('phone') ?? '',
    password: fd.get('password'),
    confirm: fd.get('confirm'),
    locale: fd.get('locale') ?? 'fr',
  })
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const data = parsed.data
  const callbackUrl = String(fd.get('callbackUrl') ?? `/${data.locale}/portal/dashboard`)

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) return { ok: false, errors: { email: ['Already registered'] } }

  const passwordHash = await hashPassword(data.password)
  await prisma.user.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      phone: data.phone || null,
      passwordHash,
      role: 'PROSPECT',
      locale: data.locale,
    },
  })

  try {
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: true,
      redirectTo: callbackUrl,
    })
    return { ok: true }
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: 'auth' }
    throw err
  }
}
