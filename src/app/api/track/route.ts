import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies, headers } from 'next/headers'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

type TrackBody = {
  path: string
  locale?: string
  referer?: string
  durationMs?: number
}

const ANON_COOKIE = 'fci_anon'

export async function POST(request: Request) {
  let body: TrackBody
  try {
    body = (await request.json()) as TrackBody
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const c = await cookies()
  const h = await headers()

  let anonymousId = c.get(ANON_COOKIE)?.value
  if (!anonymousId) {
    anonymousId = randomBytes(16).toString('hex')
  }

  const ua = h.get('user-agent') ?? ''
  const xff = h.get('x-forwarded-for') ?? ''
  const ip = xff.split(',')[0]?.trim() || undefined

  // Reuse a session for 30 minutes of activity from the same anonymousId.
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
  let session = await prisma.visitorSession.findFirst({
    where: { anonymousId, startedAt: { gt: thirtyMinAgo } },
    orderBy: { startedAt: 'desc' },
  })
  if (!session) {
    session = await prisma.visitorSession.create({
      data: {
        anonymousId,
        ip,
        userAgent: ua,
        referer: body.referer ?? null,
      },
    })
  }

  await prisma.pageView.create({
    data: {
      sessionId: session.id,
      path: body.path,
      locale: body.locale ?? 'fr',
      durationMs: body.durationMs,
    },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ANON_COOKIE, anonymousId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return res
}
