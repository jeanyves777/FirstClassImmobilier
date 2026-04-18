'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/rbac'

const ALLOWED_ROLES = ['VISITOR', 'BUYER', 'PROSPECT', 'APPLICANT', 'STAFF', 'ADMIN'] as const

export async function updateUserRole(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const admin = await requireAdmin(locale)
  const userId = String(formData.get('userId') ?? '')
  const role = String(formData.get('role') ?? '')
  if (!(ALLOWED_ROLES as readonly string[]).includes(role)) return
  if (!userId) return
  if (userId === admin.id && role !== 'ADMIN') {
    // Prevent the active admin from demoting themselves.
    return
  }
  await prisma.user.update({ where: { id: userId }, data: { role } })
  revalidatePath(`/${locale}/admin/users`)
}
