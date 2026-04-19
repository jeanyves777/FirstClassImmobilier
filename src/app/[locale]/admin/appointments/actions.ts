'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { sendMail } from '@/lib/mail/transport'
import { buildIcs } from '@/lib/schedule/ics'
import { getSiteConfig } from '@/lib/site'

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

export async function confirmAppointment(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const id = String(formData.get('id') ?? '')
  const scheduledAtRaw = String(formData.get('scheduledAt') ?? '').trim()
  const durationRaw = Number(formData.get('durationMin') ?? 45)
  const staff = await requireStaff(locale)
  if (!id) return

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true, email: true } },
      lot: { select: { reference: true, programId: true } },
    },
  })
  if (!appt) return

  const start = scheduledAtRaw
    ? new Date(scheduledAtRaw)
    : appt.scheduledAt ?? appt.preferredAt
  if (!start || Number.isNaN(start.getTime())) return

  const durationMin = Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : appt.durationMin

  const program = appt.programId
    ? await prisma.program.findUnique({ where: { id: appt.programId }, select: { name: true, slug: true } })
    : null

  await prisma.appointment.update({
    where: { id },
    data: {
      status: 'confirmed',
      scheduledAt: start,
      durationMin,
      staffId: appt.staffId ?? staff.id,
    },
  })

  // Send email with ICS attachment.
  const toEmail = appt.user?.email ?? appt.guestEmail
  if (toEmail) {
    try {
      const cfg = await getSiteConfig()
      const programName = program ? safeFr(program.name) : 'FirstClass Immobilier'
      const lotLabel = appt.lot?.reference ? ` · Lot ${appt.lot.reference}` : ''
      const summary = `FirstClass Immobilier — ${programName}${lotLabel}`
      const location = cfg.address

      const ics = buildIcs({
        uid: `fci-${appt.id}@firstclassimmo.com`,
        start,
        durationMin,
        summary,
        description:
          `Visite confirmée par FirstClass Immobilier. Contact: ${cfg.phone}.\n` +
          `Address: ${cfg.address}.`,
        location,
        organizerEmail: cfg.email,
        organizerName: 'FirstClass Immobilier',
        attendeeEmail: toEmail,
        attendeeName: appt.user?.fullName ?? appt.guestName ?? undefined,
      })

      const whenLabel = start.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })

      await sendMail({
        to: toEmail,
        subject: `${locale === 'fr' ? 'Confirmation de visite' : 'Visit confirmation'} — ${programName}`,
        text:
          `${locale === 'fr' ? 'Votre visite est confirmée' : 'Your visit is confirmed'}: ${whenLabel}\n\n` +
          `${summary}\n${cfg.address}\n\n${locale === 'fr' ? 'Contact' : 'Contact'}: ${cfg.phone} · ${cfg.email}`,
        html: `<h2>${locale === 'fr' ? 'Votre visite est confirmée' : 'Your visit is confirmed'}</h2>
<p><b>${whenLabel}</b></p>
<p>${summary}<br/>${cfg.address}</p>
<p>${locale === 'fr' ? 'Contact' : 'Contact'}: ${cfg.phone} · <a href="mailto:${cfg.email}">${cfg.email}</a></p>
<p style="color:#6b7280;font-size:12px">${locale === 'fr' ? 'La pièce jointe est un rendez-vous ajoutable à votre calendrier.' : 'The attachment is a calendar invite you can add to any calendar app.'}</p>`,
        attachments: [
          {
            filename: 'visite-fci.ics',
            content: ics,
            contentType: 'text/calendar; method=REQUEST; charset=utf-8',
          },
        ],
      })
    } catch (err) {
      console.error('[mail][confirm-appointment]', err)
    }
  }

  revalidatePath(`/${locale}/admin/appointments`)
  revalidatePath(`/${locale}/portal/appointments`)
}

function safeFr(raw: string): string {
  try {
    const v = JSON.parse(raw) as { fr?: string; en?: string }
    return v.fr || v.en || ''
  } catch {
    return raw
  }
}
