'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FileUpload } from '@/components/fci/admin/FileUpload'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import { Button } from '@/components/ui/Button'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import {
  addProgramMedia,
  addProgramPlan,
  removeProgramMedia,
  removeProgramPlan,
  setProgramHero,
} from '../actions'

type MediaItem = {
  id: string
  kind: string
  url: string
}

type Plan = { id: string; label: string; fileUrl: string }

export function ProgramMediaManager({
  programId,
  locale,
  media,
  plans,
  heroMediaId,
}: {
  programId: string
  locale: string
  media: MediaItem[]
  plans: Plan[]
  heroMediaId: string | null
}) {
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [newPlanUrl, setNewPlanUrl] = useState('')

  return (
    <section className="mt-10 space-y-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Media & plans</h2>

      {/* Gallery */}
      <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <header className="mb-4 flex items-baseline justify-between">
          <h3 className="font-display text-base font-semibold text-foreground">Gallery</h3>
          <p className="text-xs text-muted">{media.length} items</p>
        </header>

        {media.length > 0 && (
          <ul className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((m) => {
              const isHero = heroMediaId === m.id
              return (
                <li
                  key={m.id}
                  className={`overflow-hidden rounded-xl border bg-surface-muted transition-colors ${
                    isHero
                      ? 'border-[color:var(--brand-red)]/60 ring-2 ring-[color:var(--brand-red)]/20'
                      : 'border-[color:var(--border)]'
                  }`}
                >
                  <div className="relative aspect-video bg-zinc-900">
                    {m.kind === 'image' ? (
                      <Image src={m.url} alt="" fill sizes="320px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs uppercase text-white/70">
                        {m.kind}
                      </div>
                    )}
                    <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      {m.kind}
                    </span>
                    {isHero && (
                      <span className="absolute top-2 right-2 rounded-full bg-[color:var(--brand-red)] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Hero
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 text-xs">
                    <p className="truncate text-muted" title={m.url}>{m.url}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      {!isHero && m.kind === 'image' && (
                        <form action={setProgramHero}>
                          <input type="hidden" name="programId" value={programId} />
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="mediaId" value={m.id} />
                          <button
                            type="submit"
                            className="text-[11px] font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground"
                          >
                            Set hero
                          </button>
                        </form>
                      )}
                      <ConfirmButton
                        action={removeProgramMedia}
                        hiddenFields={{ mediaId: m.id, programId, locale }}
                        title="Remove this media?"
                        description={`${m.kind} will be removed from the program.`}
                        confirmLabel="Remove"
                        variant="danger"
                        size="sm"
                      >
                        Remove
                      </ConfirmButton>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <form action={addProgramMedia} className="grid gap-2 rounded-xl border border-[color:var(--border)] bg-background p-3 sm:grid-cols-[120px_1fr_auto]">
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Kind</span>
            <select
              name="kind"
              defaultValue="image"
              className="w-full rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="tour">Tour</option>
            </select>
          </label>
          <div className="space-y-1.5">
            <label className="block">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">URL</span>
              <input
                name="url"
                type="url"
                required
                placeholder="https://…"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
              />
            </label>
            <FileUpload
              label="Upload"
              onUploaded={(f) => setNewMediaUrl(f.url)}
            />
          </div>
          <Button type="submit" size="sm" className="self-end">
            Add media
          </Button>
        </form>
      </div>

      {/* Plans */}
      <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <header className="mb-4 flex items-baseline justify-between">
          <h3 className="font-display text-base font-semibold text-foreground">Plans & catalog PDFs</h3>
          <p className="text-xs text-muted">{plans.length} plans</p>
        </header>

        {plans.length > 0 && (
          <ul className="mb-4 divide-y divide-[color:var(--border)] rounded-xl border border-[color:var(--border)]">
            {plans.map((p) => {
              const labelObj = safeParseLabel(p.label)
              return (
                <li key={p.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{labelObj.fr || labelObj.en}</p>
                    <a
                      href={p.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted hover:text-foreground break-all"
                    >
                      {p.fileUrl}
                    </a>
                  </div>
                  <ConfirmButton
                    action={removeProgramPlan}
                    hiddenFields={{ planId: p.id, programId, locale }}
                    title="Remove this plan?"
                    confirmLabel="Remove"
                    variant="danger"
                    size="sm"
                  >
                    Remove
                  </ConfirmButton>
                </li>
              )
            })}
          </ul>
        )}

        <form action={addProgramPlan} className="space-y-3 rounded-xl border border-[color:var(--border)] bg-background p-3">
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="locale" value={locale} />
          <LocalizedField name="label" label="Plan label" required />
          <label className="block">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">PDF URL</span>
            <input
              name="fileUrl"
              type="url"
              required
              placeholder="https://…"
              value={newPlanUrl}
              onChange={(e) => setNewPlanUrl(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <FileUpload
            label="Upload PDF"
            accept="application/pdf"
            onUploaded={(f) => {
              if (f.kind === 'pdf') setNewPlanUrl(f.url)
            }}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm">Add plan</Button>
          </div>
        </form>
      </div>
    </section>
  )
}

function safeParseLabel(raw: string): { fr: string; en: string } {
  try {
    const p = JSON.parse(raw)
    if (p && typeof p.fr === 'string' && typeof p.en === 'string') return p
  } catch {
    /* ignore */
  }
  return { fr: raw, en: raw }
}
