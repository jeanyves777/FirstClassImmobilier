'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { SALE_STAGES } from '@/lib/sales/packet'

function revalSale(locale: string, saleId: string) {
  revalidatePath(`/${locale}/admin/sales`)
  revalidatePath(`/${locale}/admin/sales/${saleId}`)
  revalidatePath(`/${locale}/portal/dashboard`)
  revalidatePath(`/${locale}/portal/projects/${saleId}`)
}

export async function updateSaleStage(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const stage = String(formData.get('stage') ?? '')
  const construction = Number(formData.get('constructionProgress') ?? 0)
  if (!(SALE_STAGES as readonly string[]).includes(stage)) return
  await requireStaff(locale)
  if (!id) return
  await prisma.sale.update({
    where: { id },
    data: {
      stage,
      constructionProgress: Math.max(0, Math.min(100, Math.round(construction))),
      ...(stage === 'signed' ? { signedAt: new Date() } : {}),
    },
  })
  revalSale(locale, id)
}

export async function assignSale(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const raw = String(formData.get('assignedAgentId') ?? '')
  const assignedAgentId = raw === '' ? null : raw
  await requireStaff(locale)
  if (!id) return
  await prisma.sale.update({ where: { id }, data: { assignedAgentId } })
  revalSale(locale, id)
}

export async function setDocumentRequirement(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const saleId = String(formData.get('saleId') ?? '')
  const status = String(formData.get('status') ?? '')
  const note = String(formData.get('note') ?? '')
  const url = String(formData.get('url') ?? '').trim()
  const allowed = ['required', 'uploaded', 'approved', 'rejected']
  if (!allowed.includes(status)) return
  await requireStaff(locale)
  if (!id) return

  let documentId: string | null = null
  if (url) {
    const doc = await prisma.document.create({
      data: { kind: 'requirement', url, saleId },
    })
    documentId = doc.id
  }

  await prisma.documentRequirement.update({
    where: { id },
    data: {
      status,
      note: note || null,
      ...(documentId ? { documentId } : {}),
      reviewedAt: status === 'approved' || status === 'rejected' ? new Date() : null,
    },
  })
  revalSale(locale, saleId)
}

export async function markMilestoneReached(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const saleId = String(formData.get('saleId') ?? '')
  const reached = String(formData.get('reached') ?? '')
  await requireStaff(locale)
  if (!id) return
  await prisma.milestone.update({
    where: { id },
    data: { reachedAt: reached === 'on' ? new Date() : null },
  })
  revalSale(locale, saleId)
}

export async function addPayment(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const saleId = String(formData.get('saleId') ?? '')
  const amount = BigInt(Math.max(0, Math.round(Number(formData.get('amount') ?? 0))))
  const dueAtRaw = String(formData.get('dueAt') ?? '').trim()
  const method = String(formData.get('method') ?? '').trim() || null
  await requireStaff(locale)
  if (!saleId || amount === 0n || !dueAtRaw) return
  await prisma.payment.create({
    data: {
      saleId,
      amountFCFA: amount,
      dueAt: new Date(dueAtRaw),
      method,
    },
  })
  revalSale(locale, saleId)
}

export async function togglePaymentPaid(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const saleId = String(formData.get('saleId') ?? '')
  const id = String(formData.get('id') ?? '')
  await requireStaff(locale)
  if (!id) return
  const cur = await prisma.payment.findUnique({ where: { id }, select: { paidAt: true } })
  if (!cur) return
  await prisma.payment.update({
    where: { id },
    data: { paidAt: cur.paidAt ? null : new Date() },
  })
  revalSale(locale, saleId)
}

export async function deletePayment(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const saleId = String(formData.get('saleId') ?? '')
  const id = String(formData.get('id') ?? '')
  await requireStaff(locale)
  if (!id) return
  await prisma.payment.delete({ where: { id } })
  revalSale(locale, saleId)
}

export async function cancelSale(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  await requireStaff(locale)
  if (!id) return
  await prisma.sale.update({ where: { id }, data: { stage: 'cancelled' } })
  revalSale(locale, id)
  redirect(`/${locale}/admin/sales`)
}
