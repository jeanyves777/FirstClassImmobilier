'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'

export async function setAppointmentStatus(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  const allowed = ['requested', 'booked', 'confirmed', 'cancelled', 'completed']
  if (!allowed.includes(status)) return
  await requireStaff(locale)
  if (!id) return
  await prisma.appointment.update({ where: { id }, data: { status } })
  revalidatePath(`/${locale}/admin/appointments`)
}

export async function assignAppointment(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const staffIdRaw = String(formData.get('staffId') ?? '')
  const staffId = staffIdRaw === '' ? null : staffIdRaw
  await requireStaff(locale)
  if (!id) return
  await prisma.appointment.update({ where: { id }, data: { staffId } })
  revalidatePath(`/${locale}/admin/appointments`)
}

export async function setLeadStatus(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  const allowed = ['new', 'contacted', 'qualified', 'lost', 'converted']
  if (!allowed.includes(status)) return
  await requireStaff(locale)
  if (!id) return
  await prisma.lead.update({ where: { id }, data: { status } })
  revalidatePath(`/${locale}/admin/leads`)
}

export async function setApplicationStatus(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  const allowed = ['received', 'reviewing', 'interview', 'rejected', 'hired']
  if (!allowed.includes(status)) return
  await requireStaff(locale)
  if (!id) return
  await prisma.application.update({ where: { id }, data: { status } })
  revalidatePath(`/${locale}/admin/applications`)
}
