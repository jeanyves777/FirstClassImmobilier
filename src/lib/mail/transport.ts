import 'server-only'
import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'

let cached: nodemailer.Transporter | null = null

export function getTransporter() {
  if (cached) return cached
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host) {
    console.warn('[mail] SMTP_HOST not set — using JSON transport (dev only).')
    cached = nodemailer.createTransport({ jsonTransport: true })
    return cached
  }

  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  })
  return cached
}

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: Mail.Attachment[]
}) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM ?? 'FirstClass Immobilier <info@firstclassimmo.com>'
  return transporter.sendMail({ from, ...opts })
}
