'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendMail } from '@/lib/mail/transport'
import { renderEmail } from '@/lib/mail/render'
import { ApplicationReceived } from '@/lib/mail/templates/ApplicationReceived'
import { LeadNotification } from '@/lib/mail/templates/LeadNotification'
import { site } from '@/lib/site'

type FormState = { ok: boolean; message?: string; errors?: Record<string, string[]> }

const applicationSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  email: z.email('Invalid email'),
  phone: z.string().min(6, 'Required'),
  message: z.string().min(10, 'Please describe your profile'),
})

const feedbackSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  email: z.email('Invalid email'),
  phone: z.string().optional().default(''),
  message: z.string().min(10, 'Please share some details'),
})

function destinationInbox() {
  return process.env.SMTP_TO_CONTACT || site.email
}

export async function submitApplication(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = applicationSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }
  }

  const data = parsed.data
  await prisma.application.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      message: data.message,
    },
  })

  try {
    const { html, text } = await renderEmail(
      ApplicationReceived({
        locale: 'fr',
        applicantName: data.fullName,
        applicantEmail: data.email,
        applicantPhone: data.phone,
        message: data.message,
        audience: 'admin',
      }),
    )
    await sendMail({
      to: destinationInbox(),
      replyTo: data.email,
      subject: `[Postuler] ${data.fullName}`,
      text,
      html,
    })
  } catch (err) {
    console.error('[mail][postuler]', err)
  }

  return { ok: true }
}

export async function submitFeedback(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = feedbackSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }
  }

  const data = parsed.data
  await prisma.lead.create({
    data: {
      source: 'vos-avis',
      status: 'new',
      payload: JSON.stringify(data),
    },
  })

  try {
    const { html, text } = await renderEmail(
      LeadNotification({
        channel: 'Vos Avis',
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
      }),
    )
    await sendMail({
      to: destinationInbox(),
      replyTo: data.email,
      subject: `[Vos Avis] ${data.fullName}`,
      text,
      html,
    })
  } catch (err) {
    console.error('[mail][vos-avis]', err)
  }

  return { ok: true }
}
