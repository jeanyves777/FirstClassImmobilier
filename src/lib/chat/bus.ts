/**
 * In-process pub/sub for chat thread events.
 *
 * Good enough for a single Next.js instance (dev + small prod). For a
 * multi-instance deploy, swap this for Redis pub/sub keeping the same
 * `subscribe(threadId, handler)` / `publish(threadId)` surface.
 */

type Handler = () => void

const channels: Map<string, Set<Handler>> = (globalThis as unknown as { __fciChatBus?: Map<string, Set<Handler>> }).__fciChatBus ??
  (((globalThis as unknown as { __fciChatBus?: Map<string, Set<Handler>> }).__fciChatBus = new Map<string, Set<Handler>>()))

export function subscribe(threadId: string, handler: Handler): () => void {
  let set = channels.get(threadId)
  if (!set) {
    set = new Set()
    channels.set(threadId, set)
  }
  set.add(handler)
  return () => {
    set!.delete(handler)
    if (set!.size === 0) channels.delete(threadId)
  }
}

export function publish(threadId: string): void {
  const set = channels.get(threadId)
  if (!set) return
  for (const h of Array.from(set)) {
    try {
      h()
    } catch {
      /* isolate subscriber failures */
    }
  }
}
