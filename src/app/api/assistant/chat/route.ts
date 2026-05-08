import { NextResponse } from 'next/server'
import { z } from 'zod'
import { loadFacts } from '@/lib/assistant/facts'
import { respondToMessage } from '@/lib/assistant/intents'
import type { Locale } from '@/i18n/routing'

export const runtime = 'nodejs'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
})

const bodySchema = z.object({
  locale: z.enum(['fr', 'en']),
  messages: z.array(messageSchema).min(1).max(30),
})

export async function POST(request: Request) {
  let parsed
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const last = parsed.messages[parsed.messages.length - 1]
  if (last.role !== 'user') {
    return NextResponse.json({ error: 'last_message_must_be_user' }, { status: 400 })
  }

  const facts = await loadFacts(parsed.locale as Locale)
  const history = parsed.messages.slice(0, -1)
  const reply = respondToMessage(facts, history, last.content)

  return NextResponse.json(reply)
}
