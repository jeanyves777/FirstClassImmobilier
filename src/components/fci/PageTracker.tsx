'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { readConsent } from '@/lib/cookie-consent'

/**
 * Fire-and-forget beacon on mount + path change.
 * Gated on explicit `accepted` consent (Loi n°2013-450 / APDP):
 * analytics cookies require prior, informed consent.
 */
export function PageTracker({ locale }: { locale: string }) {
  const pathname = usePathname()
  const start = useRef<number | null>(null)

  useEffect(() => {
    start.current = Date.now()
    if (readConsent() !== 'accepted') return

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
