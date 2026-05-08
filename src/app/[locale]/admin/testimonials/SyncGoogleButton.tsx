'use client'

import { useActionState, useEffect } from 'react'
import { syncGoogleReviews, type SyncState } from './actions'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { GoogleG } from '@/components/fci/GoogleG'

const initial: SyncState = { ok: false }

export function SyncGoogleButton({
  locale,
  hasApiKey,
}: {
  locale: string
  hasApiKey: boolean
}) {
  const [state, action, pending] = useActionState(syncGoogleReviews, initial)
  const { push } = useToast()

  useEffect(() => {
    if (!state.timestamp) return
    if (state.ok) {
      push({
        title: 'Synced from Google',
        description: `${state.inserted} review${state.inserted === 1 ? '' : 's'} imported${
          state.placeName ? ` from ${state.placeName}` : ''
        }.`,
        variant: 'success',
      })
    } else if (state.error) {
      push({ title: 'Sync failed', description: state.error, variant: 'error' })
    }
  }, [state, push])

  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="locale" value={locale} />
      <Button
        type="submit"
        loading={pending}
        size="sm"
        variant="secondary"
        disabled={!hasApiKey}
        title={
          hasApiKey
            ? 'Fetches up to 5 reviews from Google Places and replaces the current Google rows.'
            : 'Set GOOGLE_PLACES_API_KEY in .env to enable this.'
        }
      >
        <GoogleG className="h-4 w-4" />
        <span className="ml-1.5">
          {pending ? 'Syncing…' : 'Sync from Google'}
        </span>
      </Button>
    </form>
  )
}
