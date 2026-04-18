'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendMail } from '@/lib/mail/transport'
import { site } from '@/lib/site'

type FormState = { ok: boolean; errors?: Record<string, string[]> }

const schema = z.object({
  lotId: z.string().min(1),
  programId: z.string().min(1),
  guestName: z.string().min(2),
  guestEmail: z.email(),
  guestPhone: z.string().min(6),
  preferredAt: z.string().optional(),
  note: z.string().optional(),
})

export async function requestVisit(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    lotId: formData.get('lotId'),
    programId: formData.get('programId'),
    guestName: formData.get('guestName'),
    guestEmail: formData.get('guestEmail'),
    guestPhone: formData.get('guestPhone'),
    preferredAt: formData.get('preferredAt') || undefined,
    note: formData.get('note') || undefined,
  })
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }
  }

  const d = parsed.data
  const lot = await prisma.lot.findUnique({
    where: { id: d.lotId },
    include: { program: { select: { name: true, slug: true } } },
  })
  if (!lot) return { ok: false, errors: { lotId: ['Lot not found'] } }

  const preferred = d.preferredAt ? new Date(d.preferredAt) : null

  await prisma.appointment.create({
    data: {
      purpose: 'lot-visit',
      source: 'public-form',
      status: 'requested',
      programId: d.programId,
      lotId: d.lotId,
      guestName: d.guestName,
      guestEmail: d.guestEmail,
      guestPhone: d.guestPhone,
      preferredAt: preferred,
      note: d.note ?? null,
    },
  })

  try {
    const programName = JSON.parse(lot.program.name).fr ?? lot.program.slug
    await sendMail({
      to: process.env.SMTP_TO_CONTACT || site.email,
      replyTo: d.guestEmail,
      subject: `[Visite] ${lot.reference} — ${programName}`,
      text: `Demande de visite\n\nLot: ${lot.reference}\nProgramme: ${programName}\n\n${d.guestName}\n${d.guestEmail}\n${d.guestPhone}\n\nCréneau souhaité: ${d.preferredAt ?? '—'}\n\n${d.note ?? ''}`,
      html: `<h2>Demande de visite</h2>
<p><b>Lot ${lot.reference}</b> — ${programName}</p>
<p>${d.guestName}<br/>${d.guestEmail}<br/>${d.guestPhone}</p>
<p><b>Créneau souhaité:</b> ${d.preferredAt ?? '—'}</p>
${d.note ? `<p>${escapeHtml(d.note)}</p>` : ''}`,
    })
  } catch (err) {
    console.error('[mail][visit-request]', err)
  }

  return { ok: true }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
