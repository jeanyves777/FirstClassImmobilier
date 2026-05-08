import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

const createSchema = z.object({
  label: z.string().min(1).max(120),
  query: z.string().min(1).max(400),
})
const deleteSchema = z.object({
  id: z.string().min(1),
})

/** Save a filter combination under the current user. */
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let parsed
  try {
    parsed = createSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const row = await prisma.savedSearch.upsert({
    where: { userId_query: { userId: user.id, query: parsed.query } },
    create: { userId: user.id, label: parsed.label, query: parsed.query },
    update: { label: parsed.label },
    select: { id: true },
  })
  return NextResponse.json({ id: row.id, saved: true })
}

/** Remove a saved search. */
export async function DELETE(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let parsed
  try {
    parsed = deleteSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  await prisma.savedSearch.deleteMany({
    where: { id: parsed.id, userId: user.id },
  })
  return NextResponse.json({ deleted: true })
}
