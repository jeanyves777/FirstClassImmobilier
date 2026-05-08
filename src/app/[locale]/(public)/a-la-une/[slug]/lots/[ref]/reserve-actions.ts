'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { sendMail } from '@/lib/mail/transport'
import { renderEmail } from '@/lib/mail/render'
import { ReservationReceived } from '@/lib/mail/templates/ReservationReceived'
import { formatFCFA } from '@/lib/format'
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
    // priceFCFA is already on Lot — no change needed
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
    const l = (locale === 'en' ? 'en' : 'fr') as 'fr' | 'en'
    const price = formatFCFA(lot.priceFCFA, l)
    const buyerName = user.name ?? user.email ?? 'Acquéreur'

    const adminMail = await renderEmail(
      ReservationReceived({
        locale: l,
        buyerName,
        programName,
        lotReference: lot.reference,
        price,
        audience: 'admin',
      }),
    )
    await sendMail({
      to: process.env.SMTP_TO_CONTACT || site.email,
      replyTo: user.email ?? undefined,
      subject: `[Réservation] ${lot.reference} — ${programName}`,
      html: adminMail.html,
      text: adminMail.text,
    })

    // Acknowledgement to the buyer (best-effort — shouldn't block reservation).
    if (user.email) {
      const buyerEmail = await renderEmail(
        ReservationReceived({
          locale: l,
          buyerName,
          programName,
          lotReference: lot.reference,
          price,
          audience: 'buyer',
        }),
      )
      await sendMail({
        to: user.email,
        subject:
          l === 'fr'
            ? `Votre demande de réservation — ${lot.reference}`
            : `Your reservation request — ${lot.reference}`,
        html: buyerEmail.html,
        text: buyerEmail.text,
      })
    }
  } catch (err) {
    console.error('[mail][reservation]', err)
  }

  revalidatePath(`/${locale}/a-la-une/${slug}`)
  revalidatePath(`/${locale}/a-la-une/${slug}/lots/${ref}`)
  revalidatePath(`/${locale}/portal/reservations`)
  redirect(`/${locale}/portal/reservations?ok=1`)
}

