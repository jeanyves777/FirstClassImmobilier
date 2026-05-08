import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { sendMail } from '@/lib/mail/transport'
import { renderEmail } from '@/lib/mail/render'
import { AssistantLead } from '@/lib/mail/templates/AssistantLead'
import { getSiteConfig } from '@/lib/site'

export const runtime = 'nodejs'

const schema = z.object({
  locale: z.enum(['fr', 'en']),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal('')),
  context: z.string().max(2000).optional().or(z.literal('')),
})

export async function POST(request: Request) {
  let parsed
  try {
    parsed = schema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  await prisma.lead.create({
    data: {
      source: 'assistant',
      payload: JSON.stringify({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        context: parsed.context || null,
        locale: parsed.locale,
      }),
    },
  })

  try {
    const site = await getSiteConfig()
    const { html, text } = await renderEmail(
      AssistantLead({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        context: parsed.context || null,
        locale: parsed.locale,
      }),
    )
    await sendMail({
      to: site.email,
      subject: `[Assistant] Nouveau contact : ${parsed.name}`,
      html,
      text,
      replyTo: parsed.email,
    })
  } catch (err) {
    // Don't fail the request if SMTP is down in dev.
    console.error('[assistant/lead] mail send failed', err)
  }

  return NextResponse.json({ ok: true })
}
