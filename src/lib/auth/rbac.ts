import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export type SessionRole = 'VISITOR' | 'BUYER' | 'PROSPECT' | 'APPLICANT' | 'STAFF' | 'ADMIN'

export async function getSession() {
  return auth()
}

export async function getSessionUser() {
  const s = await auth()
  return s?.user ? (s.user as typeof s.user & { id: string; role: SessionRole; locale: string }) : null
}

function signInUrl(locale: string, callbackPath?: string) {
  const base = `/${locale}/signin`
  if (!callbackPath) return base
  const params = new URLSearchParams({ callbackUrl: callbackPath })
  return `${base}?${params.toString()}`
}

export async function requireUser(locale: string, callbackPath?: string) {
  const user = await getSessionUser()
  if (!user) redirect(signInUrl(locale, callbackPath))
  return user!
}

export async function requireStaff(locale: string, callbackPath?: string) {
  const user = await requireUser(locale, callbackPath)
  if (user.role !== 'STAFF' && user.role !== 'ADMIN') redirect(`/${locale}`)
  return user
}

export async function requireAdmin(locale: string, callbackPath?: string) {
  const user = await requireUser(locale, callbackPath)
  if (user.role !== 'ADMIN') redirect(`/${locale}`)
  return user
}
