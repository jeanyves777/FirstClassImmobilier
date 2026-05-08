'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/Toast'

/**
 * "Save this search" action rendered on the À la Une filter bar.
 *
 * Reads the current `searchParams` via Next's hook and POSTs `{ label, query }`
 * to `/api/saved-searches`. Label is pre-derived on the server (passed in)
 * so it can be fully bilingual without the client duplicating the copy logic.
 *
 * When the visitor is anonymous, redirects to sign-in with a callback back here.
 */
export function SaveSearchButton({
  label,
  isAuthenticated,
  signInHref,
}: {
  /** Human-readable label for the filter combination, computed server-side. */
  label: string
  isAuthenticated: boolean
  signInHref: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const t = useTranslations('featured.saveSearch')
  const { push } = useToast()
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const query = params.toString() ? `?${params.toString()}` : ''

  const save = () => {
    if (!isAuthenticated) {
      router.push(signInHref)
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/saved-searches', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ label, query }),
        })
        if (!res.ok) throw new Error('save_failed')
        setSaved(true)
        push({ title: label, description: t('toastDescription'), variant: 'success' })
      } catch {
        push({ title: t('toastError'), variant: 'error' })
      }
    })
  }

  // Hide the button entirely when there's nothing to save (no filters).
  if (!query) return null

  return (
    <button
      type="button"
      onClick={save}
      disabled={pending || saved}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        saved
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
      } disabled:opacity-60`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <span>{saved ? t('saved') : t('save')}</span>
    </button>
  )
}
