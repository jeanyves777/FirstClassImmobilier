'use client'

import { useActionState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type State = { ok: boolean; error?: string; timestamp?: number }
const initial: State = { ok: false }

export function ChatComposer({
  action,
  threadId,
  locale,
  placeholder,
}: {
  action: (prev: State, fd: FormData) => Promise<State>
  threadId: string
  locale: string
  placeholder?: string
}) {
  const [state, submit, pending] = useActionState(action, initial)
  const formRef = useRef<HTMLFormElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state.ok && state.timestamp) {
      formRef.current?.reset()
      taRef.current?.focus()
    }
  }, [state])

  return (
    <form
      ref={formRef}
      action={submit}
      className="sticky bottom-0 border-t border-[color:var(--border)] bg-surface p-3"
    >
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="locale" value={locale} />
      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          name="body"
          required
          rows={2}
          placeholder={placeholder ?? 'Write a message…'}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
          className={cn(
            'min-h-[44px] flex-1 resize-none rounded-xl border border-[color:var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40',
          )}
        />
        <Button type="submit" loading={pending} size="md">
          Send
        </Button>
      </div>
      {state.error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-[color:var(--brand-red)]"
        >
          {state.error}
        </motion.p>
      )}
      <p className="mt-1 px-1 text-[10px] text-muted">⌘/Ctrl + Enter to send</p>
    </form>
  )
}
