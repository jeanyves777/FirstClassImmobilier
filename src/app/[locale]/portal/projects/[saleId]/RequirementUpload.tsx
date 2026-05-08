'use client'

import { useActionState, useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { FileUpload } from '@/components/fci/admin/FileUpload'
import { useToast } from '@/components/ui/Toast'
import { uploadRequirementDocument, type UploadRequirementResult } from './actions'

const initial: UploadRequirementResult = { ok: false }

export function RequirementUpload({
  requirementId,
  locale,
  status,
  documentUrl,
  note,
}: {
  requirementId: string
  locale: string
  status: string
  documentUrl: string | null
  note: string | null
}) {
  const tp = useTranslations('portal')
  const formRef = useRef<HTMLFormElement>(null)
  const urlRef = useRef<HTMLInputElement>(null)
  const kindRef = useRef<HTMLInputElement>(null)
  const [state, action, pending] = useActionState(uploadRequirementDocument, initial)
  const [justUploaded, setJustUploaded] = useState(false)
  const { push } = useToast()

  useEffect(() => {
    if (state.ok && justUploaded) {
      push({ title: tp('docUploadSuccess'), variant: 'success' })
      queueMicrotask(() => setJustUploaded(false))
    } else if (state.error && justUploaded) {
      push({ title: tp('docUploadError'), variant: 'error' })
      queueMicrotask(() => setJustUploaded(false))
    }
  }, [state, justUploaded, push, tp])

  const canUpload = status === 'required' || status === 'rejected'

  return (
    <div className="flex flex-col items-end gap-2">
      {documentUrl && (
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-[11px] font-semibold text-foreground hover:bg-[color:var(--brand-navy)]/10"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M14 3h7v7" />
            <path d="M21 3 10 14" />
            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </svg>
          {tp('viewFile')}
        </a>
      )}

      {note && status === 'rejected' && (
        <p className="max-w-xs rounded-lg bg-[color:var(--brand-red)]/10 px-3 py-1.5 text-right text-[11px] text-[color:var(--brand-red)]">
          {note}
        </p>
      )}

      <DocStatusPill value={status} label={tp(`docStatus.${status}`)} />

      {canUpload && (
        <>
          <FileUpload
            accept="application/pdf,image/jpeg,image/png,image/webp"
            label={status === 'rejected' ? tp('docReupload') : tp('docUpload')}
            onUploaded={({ url, kind }) => {
              if (urlRef.current) urlRef.current.value = url
              if (kindRef.current) kindRef.current.value = kind
              setJustUploaded(true)
              formRef.current?.requestSubmit()
            }}
          />
          <form ref={formRef} action={action} className="hidden">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="requirementId" value={requirementId} />
            <input ref={urlRef} type="hidden" name="url" defaultValue="" />
            <input ref={kindRef} type="hidden" name="kind" defaultValue="file" />
          </form>
          {pending && (
            <p className="text-[11px] text-muted">{tp('docSubmitting')}</p>
          )}
        </>
      )}
    </div>
  )
}

function DocStatusPill({ value, label }: { value: string; label: string }) {
  const map: Record<string, string> = {
    required: 'bg-surface-muted text-muted',
    uploaded: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  )
}
