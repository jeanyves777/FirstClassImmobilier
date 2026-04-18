'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Subscribes to /api/chat/threads/[id]/events via SSE and calls
 * router.refresh() whenever a new message event arrives, so the
 * server-rendered message list re-fetches.
 */
export function ChatLive({ threadId }: { threadId: string }) {
  const router = useRouter()

  useEffect(() => {
    let es: EventSource | null = null
    let cancelled = false

    const connect = () => {
      if (cancelled) return
      es = new EventSource(`/api/chat/threads/${threadId}/events`)
      es.addEventListener('message', () => {
        router.refresh()
      })
      es.addEventListener('hello', () => {
        /* connection confirmed */
      })
      es.onerror = () => {
        es?.close()
        es = null
        // Reconnect with small backoff
        setTimeout(connect, 1500)
      }
    }

    connect()
    return () => {
      cancelled = true
      es?.close()
    }
  }, [threadId, router])

  return null
}
