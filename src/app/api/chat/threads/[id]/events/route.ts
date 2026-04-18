import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { subscribe } from '@/lib/chat/bus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const session = await auth()
  const user = session?.user as { id?: string; role?: string } | undefined
  if (!user?.id) return new Response('Unauthorized', { status: 401 })

  const thread = await prisma.chatThread.findUnique({ where: { id } })
  if (!thread) return new Response('Not found', { status: 404 })

  const isStaff = user.role === 'STAFF' || user.role === 'ADMIN'
  if (!isStaff && thread.userId !== user.id) {
    return new Response('Forbidden', { status: 403 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const safeEnqueue = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
        }
      }

      safeEnqueue(`event: hello\ndata: ok\n\n`)

      // Periodic heartbeat so intermediate proxies don't time out.
      const heartbeat = setInterval(() => {
        safeEnqueue(`: ping\n\n`)
      }, 20000)

      const unsub = subscribe(id, () => {
        safeEnqueue(`event: message\ndata: ${Date.now()}\n\n`)
      })

      const abort = () => {
        closed = true
        clearInterval(heartbeat)
        unsub()
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
      request.signal.addEventListener('abort', abort)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
