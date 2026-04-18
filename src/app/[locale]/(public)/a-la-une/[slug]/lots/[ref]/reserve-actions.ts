'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { sendMail } from '@/lib/mail/transport'
import { site } from '@/lib/site'

export async function reserveLot(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr')
  const lotId = String(formData.get('lotId') ?? '')
  const slug = String(formData.get('slug') ?? '')
  const ref = String(formData.get('ref') ?? '')
  const note = String(formData.get('note') ?? '')

  const user = await getSessionUser()
  if (!user) {
    const back = `/${locale}/a-la-une/${slug}/lots/${ref}`
    redirect(`/${locale}/signup?callbackUrl=${encodeURIComponent(back)}`)
  }

  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: { program: { select: { name: true } } },
  })
  if (!lot) redirect(`/${locale}/a-la-une/${slug}`)
  if (lot.status !== 'available') {
    redirect(`/${locale}/portal/reservations?err=not-available`)
  }

  const existing = await prisma.reservation.findFirst({
    where: { userId: user.id, lotId, status: { in: ['pending', 'confirmed'] } },
  })
  if (existing) {
    redirect(`/${locale}/portal/reservations`)
  }

  await prisma.$transaction([
    prisma.reservation.create({
      data: {
        userId: user.id,
        programId: lot.programId,
        lotId: lot.id,
        status: 'pending',
        note: note || null,
      },
    }),
    prisma.lot.update({ where: { id: lot.id }, data: { status: 'reserved' } }),
  ])

  try {
    const programName = JSON.parse(lot.program.name).fr ?? 'FCI'
    await sendMail({
      to: process.env.SMTP_TO_CONTACT || site.email,
      replyTo: user.email ?? undefined,
      subject: `[Réservation] ${lot.reference} — ${programName}`,
      text: `Nouvelle réservation\n\nLot: ${lot.reference}\nProgramme: ${programName}\n\nClient: ${user.name ?? ''} <${user.email ?? ''}>\n\n${note}`,
      html: `<h2>Nouvelle réservation</h2>
<p><b>Lot ${lot.reference}</b> — ${programName}</p>
<p>Client: ${user.name ?? ''} &lt;${user.email ?? ''}&gt;</p>
${note ? `<p>${escapeHtml(note)}</p>` : ''}`,
    })
  } catch (err) {
    console.error('[mail][reservation]', err)
  }

  revalidatePath(`/${locale}/a-la-une/${slug}`)
  revalidatePath(`/${locale}/a-la-une/${slug}/lots/${ref}`)
  revalidatePath(`/${locale}/portal/reservations`)
  redirect(`/${locale}/portal/reservations?ok=1`)
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
