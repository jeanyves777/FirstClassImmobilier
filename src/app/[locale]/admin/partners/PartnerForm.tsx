'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createPartner } from './actions'
import { FileUpload } from '@/components/fci/admin/FileUpload'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }
const initial: State = { ok: false }

const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function PartnerForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState(createPartner, initial)
  const [logoUrl, setLogoUrl] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const { push } = useToast()

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: 'Partner added', variant: 'success' })
      formRef.current?.reset()
      setLogoUrl('')
    }
  }, [state, push])

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-2xl border border-[color:var(--border)] bg-surface p-5"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="logoUrl" value={logoUrl} />

      <div className="grid gap-4 md:grid-cols-[120px_1fr]">
        <div className="space-y-3">
          {logoUrl ? (
            <div className="relative aspect-square overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
              <Image src={logoUrl} alt="logo preview" fill sizes="120px" className="object-contain p-2" />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted text-xs text-muted">
              Logo
            </div>
          )}
          <FileUpload
            label="Upload logo"
            accept="image/*"
            onUploaded={(f) => {
              if (f.kind === 'image') setLogoUrl(f.url)
            }}
          />
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Partner name</span>
            <input name="name" required className={baseField} />
            {state.errors?.name?.length ? (
              <span className="text-xs text-[color:var(--brand-red)]">{state.errors.name[0]}</span>
            ) : null}
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Website URL (optional)</span>
            <input type="url" name="url" placeholder="https://…" className={baseField} />
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
          <div className="flex justify-end">
            <Button type="submit" loading={pending} size="sm">
              Add partner
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
