import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

const body = z.object({
  lotId: z.string().min(1),
  saved: z.boolean(),
})

/**
 * Toggle a lot in the current user's saved list.
 *
 * 401 if not signed in — the client component redirects to sign-in on that.
 * 200 `{ saved: boolean }` on success so the UI can confirm the new state.
 */
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let parsed
  try {
    parsed = body.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  if (parsed.saved) {
    await prisma.savedLot.upsert({
      where: { userId_lotId: { userId: user.id, lotId: parsed.lotId } },
      create: { userId: user.id, lotId: parsed.lotId },
      update: {},
    })
  } else {
    await prisma.savedLot.deleteMany({
      where: { userId: user.id, lotId: parsed.lotId },
    })
  }
  return NextResponse.json({ saved: parsed.saved })
}
