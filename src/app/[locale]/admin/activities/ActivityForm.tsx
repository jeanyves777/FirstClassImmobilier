'use client'

import { useActionState, useEffect, useState } from 'react'
import Image from 'next/image'
import { createActivity, updateActivity } from './actions'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import { FileUpload } from '@/components/fci/admin/FileUpload'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import type { LocalizedText } from '@/lib/zod/localized'

type Activity = {
  id?: string
  title: LocalizedText | null
  body: LocalizedText | null
  date: string // yyyy-mm-dd
  coverUrl: string | null
  published: boolean
}

type State = { ok: boolean; errors?: Record<string, string[]>; id?: string; timestamp?: number }
const initial: State = { ok: false }

const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function ActivityForm({
  locale,
  activity,
  mode,
}: {
  locale: string
  activity?: Activity
  mode: 'create' | 'edit'
}) {
  const action = mode === 'create' ? createActivity : updateActivity
  const [state, formAction, pending] = useActionState(action, initial)
  const [coverUrl, setCoverUrl] = useState(activity?.coverUrl ?? '')
  const { push } = useToast()

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: 'Activity saved', variant: 'success' })
    }
  }, [state, push])

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {activity?.id && <input type="hidden" name="id" value={activity.id} />}

      <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 space-y-5">
        <LocalizedField name="title" label="Title" defaultValue={activity?.title ?? undefined} required />
        <LocalizedField name="body" label="Recit / Description" defaultValue={activity?.body ?? undefined} rows={6} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Event date</span>
            <input
              type="date"
              name="date"
              defaultValue={activity?.date ?? new Date().toISOString().slice(0, 10)}
              required
              className={baseField}
            />
          </label>
          <label className="inline-flex items-center gap-2 pt-6 text-sm text-foreground">
            <input
              type="checkbox"
              name="published"
              defaultChecked={activity?.published ?? true}
              className="h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--brand-navy)]"
            />
            Published on « Nos Activités »
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <h2 className="font-display text-base font-semibold text-foreground">Cover image</h2>
        <p className="mt-1 text-xs text-muted">Used as the hero image on the public activity card.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          {coverUrl && (
            <div className="relative aspect-[4/3] w-40 overflow-hidden rounded-xl border border-[color:var(--border)] bg-surface-muted">
              <Image src={coverUrl} alt="cover preview" fill sizes="160px" className="object-cover" />
            </div>
          )}
          <div className="space-y-3">
            <FileUpload
              label="Upload cover image"
              onUploaded={(f) => {
                if (f.kind === 'image' || f.kind === 'video') setCoverUrl(f.url)
              }}
            />
            <label className="block">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
                …or paste an external URL
              </span>
              <input
                type="url"
                name="coverUrl"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
                className={baseField}
              />
            </label>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-end gap-3 border-t border-[color:var(--border)] pt-6">
        <Button type="submit" loading={pending}>
          {mode === 'create' ? 'Create activity' : 'Save changes'}
        </Button>
      </footer>
    </form>
  )
}
