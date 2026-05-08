'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  CONSENT_EVENT,
  readConsent,
  writeConsent,
  type ConsentState,
} from '@/lib/cookie-consent'

export function CookieBanner() {
  const t = useTranslations('cookies.banner')
  const [consent, setConsent] = useState<ConsentState | 'loading'>('loading')

  useEffect(() => {
    queueMicrotask(() => setConsent(readConsent()))
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<ConsentState>).detail
      setConsent(next)
    }
    window.addEventListener(CONSENT_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_EVENT, onChange)
  }, [])

  const show = consent === null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label={t('title')}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-50 pointer-events-none px-4 pb-4 sm:px-6"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-4xl rounded-2xl border border-[color:var(--border)] bg-surface shadow-[0_30px_80px_-40px_rgba(15,23,42,.4)]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
              <div className="flex-1 text-sm text-muted">
                <p className="mb-1 font-display text-base font-semibold text-foreground">
                  {t('title')}
                </p>
                <p className="leading-relaxed">
                  {t('description')}{' '}
                  <Link
                    href="/legal/cookies"
                    className="font-semibold text-[color:var(--brand-navy)] underline underline-offset-2 hover:text-foreground dark:text-foreground"
                  >
                    {t('learnMore')}
                  </Link>
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => writeConsent('rejected')}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
                >
                  {t('reject')}
                </button>
                <button
                  type="button"
                  onClick={() => writeConsent('accepted')}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--brand-navy)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)]"
                >
                  {t('accept')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
