'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Uploaded = { url: string; kind: string; size: number }

export function FileUpload({
  accept = 'image/*,video/mp4,video/webm,application/pdf',
  onUploaded,
  label = 'Upload a file',
}: {
  accept?: string
  onUploaded: (file: Uploaded) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFile = async (file: File) => {
    setPending(true)
    setError(null)
    setProgress(5)

    try {
      const fd = new FormData()
      fd.append('file', file)
      // Track progress via XHR (fetch doesn't expose upload progress natively)
      const result = await new Promise<Uploaded>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90) + 5)
        }
        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText) as Uploaded & { error?: string }
            if (xhr.status >= 200 && xhr.status < 300) resolve(body)
            else reject(new Error(body.error || `HTTP ${xhr.status}`))
          } catch {
            reject(new Error(`HTTP ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(fd)
      })
      setProgress(100)
      onUploaded(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setPending(false)
      if (inputRef.current) inputRef.current.value = ''
      setTimeout(() => setProgress(0), 800)
    }
  }

  return (
    <div>
      <label
        className={cn(
          'group flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted px-3 py-2 text-xs transition-colors hover:border-[color:var(--brand-navy)]',
          pending && 'pointer-events-none opacity-60',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M17 8l-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
        <span className="font-semibold uppercase tracking-wider text-foreground">{label}</span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
      </label>
      {progress > 0 && progress < 100 && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-[color:var(--brand-navy)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <p className="mt-2 rounded-lg bg-[color:var(--brand-red)]/10 px-3 py-1.5 text-xs text-[color:var(--brand-red)]">
          {error}
        </p>
      )}
    </div>
  )
}
