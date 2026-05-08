'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'

export type UploadRequirementResult = { ok: boolean; error?: string }

export async function uploadRequirementDocument(
  _prev: UploadRequirementResult,
  formData: FormData,
): Promise<UploadRequirementResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const locale = String(formData.get('locale') ?? 'fr')
  const requirementId = String(formData.get('requirementId') ?? '')
  const url = String(formData.get('url') ?? '').trim()
  const kind = String(formData.get('kind') ?? 'file').trim() || 'file'

  if (!requirementId || !url) return { ok: false, error: 'missing-fields' }

  const requirement = await prisma.documentRequirement.findUnique({
    where: { id: requirementId },
    select: { id: true, saleId: true, status: true, sale: { select: { buyerId: true } } },
  })
  if (!requirement || requirement.sale.buyerId !== user.id) {
    return { ok: false, error: 'not-found' }
  }

  const doc = await prisma.document.create({
    data: { kind, url, saleId: requirement.saleId, ownerUserId: user.id },
  })

  await prisma.documentRequirement.update({
    where: { id: requirementId },
    data: { documentId: doc.id, status: 'uploaded', note: null },
  })

  revalidatePath(`/${locale}/portal/projects/${requirement.saleId}`)
  revalidatePath(`/${locale}/admin/sales/${requirement.saleId}`)
  return { ok: true }
}
