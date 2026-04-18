'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendMail } from '@/lib/mail/transport'
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
    await sendMail({
      to: destinationInbox(),
      replyTo: data.email,
      subject: `[Postuler] ${data.fullName}`,
      text: `${data.fullName}\n${data.email}\n${data.phone}\n\n${data.message}`,
      html: `<h2>Nouvelle candidature</h2>
<p><b>${data.fullName}</b><br/>${data.email}<br/>${data.phone}</p>
<pre style="font:14px/1.5 system-ui;white-space:pre-wrap">${escape(data.message)}</pre>`,
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
    await sendMail({
      to: destinationInbox(),
      replyTo: data.email,
      subject: `[Vos Avis] ${data.fullName}`,
      text: `${data.fullName}\n${data.email}\n${data.phone}\n\n${data.message}`,
      html: `<h2>Nouveau message (Vos Avis)</h2>
<p><b>${data.fullName}</b><br/>${data.email}<br/>${data.phone}</p>
<pre style="font:14px/1.5 system-ui;white-space:pre-wrap">${escape(data.message)}</pre>`,
    })
  } catch (err) {
    console.error('[mail][vos-avis]', err)
  }

  return { ok: true }
}

function escape(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
