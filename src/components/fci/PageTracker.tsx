'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Fire-and-forget beacon on mount + on path change. */
export function PageTracker({ locale }: { locale: string }) {
  const pathname = usePathname()
  const start = useRef<number>(Date.now())

  useEffect(() => {
    start.current = Date.now()
    const payload = JSON.stringify({
      path: pathname,
      locale,
      referer: document.referrer || undefined,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  }, [pathname, locale])

  return null
}
