'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FileUpload } from '@/components/fci/admin/FileUpload'
import { addLotMedia } from '../actions'

export function LotMediaAdd({ lotId, locale }: { lotId: string; locale: string }) {
  const [kind, setKind] = useState<'image' | 'video' | 'pdf' | 'tour'>('image')
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [preview, setPreview] = useState<{ url: string; kind: string } | null>(null)

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
        <FileUpload
          label="Upload image / video / PDF"
          onUploaded={(f) => {
            setUrl(f.url)
            setPreview({ url: f.url, kind: f.kind })
            if (f.kind === 'image' || f.kind === 'video' || f.kind === 'pdf') {
              setKind(f.kind as 'image' | 'video' | 'pdf')
            }
          }}
        />
        <p className="text-[11px] text-muted">
          Or paste an external URL below (Matterport / YouTube / your CDN). Max upload 20 MB.
        </p>
      </div>

      {preview && preview.kind === 'image' && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[color:var(--border)]">
          <div className="relative aspect-video bg-surface-muted">
            <Image src={preview.url} alt="preview" fill sizes="400px" className="object-cover" />
          </div>
        </div>
      )}

      <form action={addLotMedia} className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_1fr_auto]">
        <input type="hidden" name="lotId" value={lotId} />
        <input type="hidden" name="locale" value={locale} />
        <label className="block space-y-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Kind</span>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as 'image' | 'video' | 'pdf' | 'tour')}
            className="w-full rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="tour">Tour (360°)</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">URL</span>
          <input
            name="url"
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Alt text (optional)</span>
          <input
            name="alt"
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          className="self-end inline-flex h-9 items-center rounded-full bg-[color:var(--brand-navy)] px-4 text-xs font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
        >
          Add media
        </button>
      </form>
    </div>
  )
}
