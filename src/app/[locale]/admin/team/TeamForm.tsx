'use client'

import { useActionState, useEffect, useState } from 'react'
import Image from 'next/image'
import { createTeamMember, updateTeamMember } from './actions'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import { FileUpload } from '@/components/fci/admin/FileUpload'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import type { LocalizedText } from '@/lib/zod/localized'

type Member = {
  id?: string
  fullName: string
  role: LocalizedText
  photoUrl: string | null
  order: number
}

type State = { ok: boolean; errors?: Record<string, string[]>; id?: string; timestamp?: number }
const initial: State = { ok: false }
const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function TeamForm({
  locale,
  member,
  mode,
  onDone,
}: {
  locale: string
  member?: Member
  mode: 'create' | 'edit'
  onDone?: () => void
}) {
  const action = mode === 'create' ? createTeamMember : updateTeamMember
  const [state, formAction, pending] = useActionState(action, initial)
  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl ?? '')
  const { push } = useToast()

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: 'Team member saved', variant: 'success' })
      onDone?.()
    }
  }, [state, push, onDone])

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-5 md:grid-cols-[120px_1fr]">
      <input type="hidden" name="locale" value={locale} />
      {member?.id && <input type="hidden" name="id" value={member.id} />}

      <div className="space-y-3">
        {photoUrl ? (
          <div className="relative aspect-square overflow-hidden rounded-xl border border-[color:var(--border)] bg-surface-muted">
            <Image src={photoUrl} alt="preview" fill sizes="120px" className="object-cover" />
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted text-xs text-muted">
            No photo
          </div>
        )}
        <FileUpload
          label="Photo"
          onUploaded={(f) => {
            if (f.kind === 'image') setPhotoUrl(f.url)
          }}
        />
        <input type="hidden" name="photoUrl" value={photoUrl} />
      </div>

      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Full name</span>
          <input name="fullName" defaultValue={member?.fullName} required className={baseField} />
        </label>
        <LocalizedField
          name="role"
          label="Role / Title"
          defaultValue={member?.role}
          required
        />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Display order</span>
          <input
            type="number"
            name="order"
            min={0}
            defaultValue={member?.order ?? 0}
            className="w-32 rounded-xl border border-[color:var(--border)] bg-background px-3 py-2 text-sm"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button type="submit" loading={pending} size="sm">
            {mode === 'create' ? 'Add member' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  )
}
