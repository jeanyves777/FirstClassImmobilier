import { cn } from '@/lib/utils'

type Message = {
  id: string
  body: string
  createdAt: Date
  senderId: string
}

export function ChatThreadView({
  messages,
  currentUserId,
  locale,
}: {
  messages: Message[]
  currentUserId: string
  locale: string
}) {
  const fmt = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  })

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
      {messages.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-8 text-center text-sm text-muted">
          No messages yet. Say hello to get the conversation started.
        </p>
      )}
      {messages.map((m) => {
        const mine = m.senderId === currentUserId
        return (
          <div
            key={m.id}
            className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                mine
                  ? 'rounded-br-sm bg-[color:var(--brand-navy)] text-white'
                  : 'rounded-bl-sm bg-surface text-foreground border border-[color:var(--border)]',
              )}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={cn('mt-1 text-[10px]', mine ? 'text-white/60' : 'text-muted')}>
                {fmt.format(m.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
