'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/Toast'

/**
 * Heart-toggle that adds/removes a lot from the authenticated user's
 * "saved lots" list. Unauthenticated clicks redirect to sign-in.
 */
export function SaveLotButton({
  lotId,
  initialSaved,
  isAuthenticated,
  signInHref,
  size = 'md',
}: {
  lotId: string
  initialSaved: boolean
  isAuthenticated: boolean
  signInHref: string
  size?: 'sm' | 'md'
}) {
  const router = useRouter()
  const t = useTranslations('lot.save')
  const { push } = useToast()
  const [saved, setSaved] = useState(initialSaved)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    if (!isAuthenticated) {
      router.push(signInHref)
      return
    }
    const next = !saved
    // Optimistic update
    setSaved(next)
    startTransition(async () => {
      try {
        const res = await fetch('/api/saved-lots', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ lotId, saved: next }),
        })
        if (!res.ok) throw new Error('save_failed')
        push({
          title: next ? t('added') : t('removed'),
          variant: 'success',
        })
      } catch {
        // Rollback on failure
        setSaved(!next)
        push({ title: t('failed'), variant: 'error' })
      }
    })
  }

  const sizeCls =
    size === 'sm'
      ? 'h-9 w-9'
      : 'h-11 px-4 sm:w-auto sm:min-w-[140px]'

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t('remove') : t('add')}
      onClick={toggle}
      disabled={pending}
      className={`inline-flex ${sizeCls} items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-colors ${
        saved
          ? 'border-[color:var(--brand-red)] bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]'
          : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
      } disabled:opacity-60`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 transition-transform"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {size !== 'sm' && <span>{saved ? t('saved') : t('save')}</span>}
    </button>
  )
}
