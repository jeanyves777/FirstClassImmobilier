'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function DeleteSavedSearchButton({
  id,
  label,
  locale,
}: {
  id: string
  label: string
  locale: string
}) {
  const router = useRouter()
  const { push } = useToast()
  const [pending, startTransition] = useTransition()
  const [removed, setRemoved] = useState(false)

  const remove = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/saved-searches', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        if (!res.ok) throw new Error('delete_failed')
        setRemoved(true)
        push({
          title: locale === 'fr' ? 'Recherche supprimée' : 'Search removed',
          description: label,
          variant: 'success',
        })
        router.refresh()
      } catch {
        push({
          title: locale === 'fr' ? 'Suppression impossible' : 'Delete failed',
          variant: 'error',
        })
      }
    })
  }

  if (removed) return null

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-surface px-3 py-1.5 text-[11px] font-medium text-muted hover:text-foreground disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
      </svg>
      {locale === 'fr' ? 'Supprimer' : 'Remove'}
    </button>
  )
}
