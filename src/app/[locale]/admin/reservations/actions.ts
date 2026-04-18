'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { seedSaleArtifacts } from '@/lib/sales/packet'

export async function setReservationStatus(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  const allowed = ['pending', 'confirmed', 'cancelled']
  if (!allowed.includes(status)) return
  await requireStaff(locale)
  if (!id) return
  const res = await prisma.reservation.findUnique({ where: { id }, select: { lotId: true, status: true } })
  if (!res) return

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({ where: { id }, data: { status } })
    if (res.lotId && status === 'cancelled' && res.status !== 'cancelled') {
      // Return lot to available if no other active reservation
      const others = await tx.reservation.count({
        where: { lotId: res.lotId, status: { in: ['pending', 'confirmed'] }, NOT: { id } },
      })
      if (others === 0) {
        await tx.lot.update({ where: { id: res.lotId }, data: { status: 'available' } })
      }
    }
  })

  revalidatePath(`/${locale}/admin/reservations`)
  revalidatePath(`/${locale}/a-la-une`)
}

export async function assignReservation(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const raw = String(formData.get('assignedAgentId') ?? '')
  const assignedAgentId = raw === '' ? null : raw
  await requireStaff(locale)
  if (!id) return
  await prisma.reservation.update({ where: { id }, data: { assignedAgentId } })
  revalidatePath(`/${locale}/admin/reservations`)
}

/** Promotes a confirmed Reservation into a Sale and seeds its artifacts. */
export async function convertReservationToSale(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  await requireStaff(locale)
  if (!id) return

  const res = await prisma.reservation.findUnique({
    where: { id },
    include: {
      lot: { select: { priceFCFA: true } },
    },
  })
  if (!res) return

  // Upgrade prospect → buyer
  await prisma.user.update({
    where: { id: res.userId },
    data: { role: 'BUYER' },
  })

  const sale = await prisma.sale.create({
    data: {
      buyerId: res.userId,
      programId: res.programId,
      lotId: res.lotId,
      assignedAgentId: res.assignedAgentId,
      totalFCFA: res.lot?.priceFCFA ?? 0n,
      stage: 'draft',
    },
  })
  await seedSaleArtifacts(sale.id)

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id },
      data: { status: 'confirmed' },
    }),
    ...(res.lotId
      ? [prisma.lot.update({ where: { id: res.lotId }, data: { status: 'sold' } })]
      : []),
  ])

  revalidatePath(`/${locale}/admin/reservations`)
  revalidatePath(`/${locale}/admin/sales`)
  revalidatePath(`/${locale}/portal/dashboard`)
  redirect(`/${locale}/admin/sales/${sale.id}`)
}
