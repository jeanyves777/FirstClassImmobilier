'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/Toast'

/**
 * Share-this-lot menu — WhatsApp / Email / Copy link.
 *
 * Designed for diaspora buyers who often forward listings to family. The
 * pre-filled message includes the program name, price, surface, and the
 * canonical lot URL so the recipient lands directly on the spec page.
 */
export function ShareLotButton({
  shareTitle,
  url,
  message,
}: {
  /** Display title (used in tweets / clipboard). */
  shareTitle: string
  /** Full canonical URL of the lot page (already absolute). */
  url: string
  /** Pre-formatted body for WhatsApp / Email — locale-aware, server-built. */
  message: string
}) {
  const t = useTranslations('lot.share')
  const { push } = useToast()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDoc)
    return () => window.removeEventListener('mousedown', onDoc)
  }, [open])

  const fullText = `${message}\n\n${url}`
  const wa = `https://wa.me/?text=${encodeURIComponent(fullText)}`
  const mailto = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(fullText)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      push({ title: t('copied'), variant: 'success' })
      setOpen(false)
    } catch {
      push({ title: t('copyFailed'), variant: 'error' })
    }
  }

  // Native Web Share API on supporting browsers (mobile)
  const shareNatively = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: shareTitle, text: message, url })
        return true
      } catch {
        // user cancelled or share failed → fall through to menu
      }
    }
    return false
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={async () => {
          if (!open && (await shareNatively())) return
          setOpen((v) => !v)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-surface px-4 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
        {t('button')}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-[110%] z-30 mt-1 w-56 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface shadow-[0_24px_60px_-28px_rgba(15,23,42,.35)]"
          >
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-muted"
              onClick={() => setOpen(false)}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d="M20.52 3.48A11.84 11.84 0 0 0 12.04 0C5.5 0 .22 5.27.22 11.76a11.6 11.6 0 0 0 1.66 6.02L0 24l6.41-1.67a11.83 11.83 0 0 0 5.63 1.43h.01c6.54 0 11.82-5.28 11.82-11.77a11.68 11.68 0 0 0-3.35-8.51z" />
                </svg>
              </span>
              <span className="font-medium">WhatsApp</span>
            </a>
            <a
              href={mailto}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-muted"
              onClick={() => setOpen(false)}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-white">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </span>
              <span className="font-medium">{t('email')}</span>
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={copy}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-muted"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-foreground">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </span>
              <span className="font-medium">{t('copyLink')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
