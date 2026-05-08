'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createTestimonial } from './actions'
import { FileUpload } from '@/components/fci/admin/FileUpload'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }
const initial: State = { ok: false }

const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function TestimonialForm({
  locale,
  programs,
}: {
  locale: string
  programs: { id: string; label: string }[]
}) {
  const [state, action, pending] = useActionState(createTestimonial, initial)
  const [source, setSource] = useState<'direct' | 'google'>('direct')
  const [uploadedPhoto, setUploadedPhoto] = useState('')
  const [externalPhoto, setExternalPhoto] = useState('')
  const [rating, setRating] = useState(5)
  const formRef = useRef<HTMLFormElement>(null)
  const { push } = useToast()

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: 'Testimonial added', variant: 'success' })
      formRef.current?.reset()
      queueMicrotask(() => {
        setUploadedPhoto('')
        setExternalPhoto('')
        setSource('direct')
        setRating(5)
      })
    }
  }, [state, push])

  const activePhoto = source === 'direct' ? uploadedPhoto : externalPhoto

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-2xl border border-[color:var(--border)] bg-surface p-5"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="uploadedPhotoUrl" value={uploadedPhoto} />
      <input type="hidden" name="externalPhotoUrl" value={externalPhoto} />
      <input type="hidden" name="rating" value={String(rating)} />

      {/* Source selector */}
      <div role="tablist" className="mb-5 inline-flex rounded-full border border-[color:var(--border)] bg-surface-muted p-1 text-xs font-semibold">
        {(['direct', 'google'] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={source === s}
            onClick={() => setSource(s)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              source === s
                ? 'bg-[color:var(--brand-navy)] text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {s === 'direct' ? 'Direct (uploaded)' : 'Google review'}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-[140px_1fr]">
        <div className="space-y-3">
          {activePhoto ? (
            <div className="relative aspect-square overflow-hidden rounded-full border border-[color:var(--border)] bg-white">
              <Image src={activePhoto} alt="preview" fill sizes="140px" className="object-cover" />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-full border border-dashed border-[color:var(--border)] bg-surface-muted text-xs text-muted">
              Photo
            </div>
          )}
          {source === 'direct' ? (
            <FileUpload
              label="Upload photo"
              accept="image/*"
              onUploaded={(f) => {
                if (f.kind === 'image') setUploadedPhoto(f.url)
              }}
            />
          ) : (
            <label className="block space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Avatar URL
              </span>
              <input
                type="url"
                value={externalPhoto}
                onChange={(e) => setExternalPhoto(e.target.value)}
                placeholder="https://lh3.googleusercontent.com/…"
                className={baseField}
              />
              <span className="block text-[10px] text-muted">
                Right-click the reviewer\u2019s avatar on Google → Copy image URL.
              </span>
            </label>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Author name</span>
              <input name="authorName" required className={baseField} />
              {state.errors?.authorName?.length ? (
                <span className="text-xs text-[color:var(--brand-red)]">
                  {state.errors.authorName[0]}
                </span>
              ) : null}
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {source === 'google' ? 'Posted (e.g. "il y a 2 mois")' : 'Role (optional)'}
              </span>
              <input
                name="authorRole"
                placeholder={
                  source === 'google'
                    ? 'Il y a 2 mois — Abidjan'
                    : 'Acquéreur diaspora / Diaspora buyer'
                }
                className={baseField}
              />
            </label>
          </div>

          {source === 'google' && (
            <>
              <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted">Rating</span>
                  <div className="inline-flex h-[42px] items-center gap-1.5 rounded-xl border border-[color:var(--border)] bg-background px-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        className="group"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className={`h-5 w-5 transition-colors ${
                            n <= rating
                              ? 'fill-[#FBBC04] stroke-[#FBBC04]'
                              : 'fill-none stroke-muted group-hover:stroke-[#FBBC04]'
                          }`}
                          strokeWidth="2"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted">
                    Source link (optional)
                  </span>
                  <input
                    name="sourceUrl"
                    type="url"
                    placeholder="https://maps.google.com/…"
                    className={baseField}
                  />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  Posted date (optional)
                </span>
                <input
                  name="reviewDate"
                  type="date"
                  className="w-48 rounded-xl border border-[color:var(--border)] bg-background px-3 py-2 text-sm"
                />
              </label>
            </>
          )}

          <LocalizedField
            name="quote"
            label={source === 'google' ? 'Review text' : 'Quote'}
            required
            rows={5}
            errors={state.errors?.quote as string[] | undefined}
            hint={
              source === 'google'
                ? 'Paste the Google review. If it\u2019s one language only, fill just that tab.'
                : undefined
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Related program (optional)</span>
              <select name="programId" defaultValue="" className={baseField}>
                <option value="">— None —</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Display order</span>
              <input
                type="number"
                name="order"
                min={0}
                defaultValue={0}
                className="w-32 rounded-xl border border-[color:var(--border)] bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="published"
              defaultChecked
              className="h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--brand-navy)]"
            />
            Publish immediately (visible on the public site)
          </label>

          <div className="flex justify-end">
            <Button type="submit" loading={pending} size="sm">
              Add testimonial
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
