'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { createLot, updateLot } from './actions'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import type { LocalizedText } from '@/lib/zod/localized'
import { cn } from '@/lib/utils'

type Lot = {
  id?: string
  programId: string
  reference: string
  surfaceM2: number
  priceFCFA: string // stringified BigInt for the form
  status: string
  bedrooms: number | null
  bathrooms: number | null
  title: LocalizedText | null
  description: LocalizedText | null
  highlights: LocalizedText | null
  features: string[] | null
  videoUrl: string | null
  virtualTourUrl: string | null
}

type State = { ok: boolean; errors?: Record<string, string[]>; id?: string }
const initial: State = { ok: false }

const STATUSES = ['available', 'reserved', 'sold'] as const

const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function LotForm({
  locale,
  lot,
  mode,
  programs,
}: {
  locale: string
  lot?: Lot
  mode: 'create' | 'edit'
  programs: { id: string; slug: string; label: string }[]
}) {
  const tc = useTranslations('common')
  const action = mode === 'create' ? createLot : updateLot
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {lot?.id && <input type="hidden" name="id" value={lot.id} />}

      <Section title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Program"
            name="programId"
            defaultValue={lot?.programId ?? programs[0]?.id}
            options={programs.map((p) => ({ value: p.id, label: `${p.label} · ${p.slug}` }))}
            errors={state.errors?.programId}
          />
          <Field
            label="Reference"
            name="reference"
            defaultValue={lot?.reference}
            required
            hint="Unique within the program. Example: AERO-A01"
            errors={state.errors?.reference}
          />
        </div>

        <LocalizedField name="title" label="Title" defaultValue={lot?.title ?? undefined} rows={1} errors={state.errors?.title as string[] | undefined} />
        <LocalizedField name="highlights" label="Highlights" defaultValue={lot?.highlights ?? undefined} rows={2} hint="Short bullet-style summary shown on cards." errors={state.errors?.highlights as string[] | undefined} />
        <LocalizedField name="description" label="Description" defaultValue={lot?.description ?? undefined} rows={6} errors={state.errors?.description as string[] | undefined} />
      </Section>

      <Section title="Specs & pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Surface (m²)" name="surfaceM2" type="number" min={1} defaultValue={lot?.surfaceM2?.toString()} required errors={state.errors?.surfaceM2} />
          <Field label="Price (FCFA)" name="priceFCFA" type="number" min={0} defaultValue={lot?.priceFCFA} required errors={state.errors?.priceFCFA} />
          <SelectField label="Status" name="status" defaultValue={lot?.status ?? 'available'} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bedrooms" name="bedrooms" type="number" min={0} defaultValue={lot?.bedrooms?.toString()} errors={state.errors?.bedrooms} />
          <Field label="Bathrooms" name="bathrooms" type="number" min={0} defaultValue={lot?.bathrooms?.toString()} errors={state.errors?.bathrooms} />
        </div>
        <Field
          label="Features"
          name="features"
          as="textarea"
          rows={3}
          defaultValue={lot?.features?.join('\n')}
          hint='One feature per line. Stored as a JSON array — e.g. "Pool\nSmart home\nPrivate garden"'
          errors={state.errors?.features}
        />
      </Section>

      <Section title="Virtual visit">
        <Field label="Virtual tour URL (Matterport / Kuula)" name="virtualTourUrl" type="url" defaultValue={lot?.virtualTourUrl ?? ''} hint="Embedded as an iframe on the lot detail page." errors={state.errors?.virtualTourUrl} />
        <Field label="Video URL (direct mp4 or YouTube/Vimeo embed)" name="videoUrl" type="url" defaultValue={lot?.videoUrl ?? ''} errors={state.errors?.videoUrl} />
      </Section>

      <footer className="flex items-center justify-between gap-4 border-t border-[color:var(--border)] pt-6">
        {state.ok && mode === 'edit' && (
          <p className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Saved ✓
          </p>
        )}
        <div className="ml-auto">
          <button
            type="submit"
            disabled={pending}
            className={cn(
              'inline-flex h-11 items-center rounded-full bg-[color:var(--brand-navy)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)]',
              pending && 'opacity-60',
            )}
          >
            {pending ? tc('submitting') : mode === 'create' ? 'Create lot' : 'Save changes'}
          </button>
        </div>
      </footer>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
      <h2 className="mb-5 font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  name,
  defaultValue,
  required,
  hint,
  errors,
  type = 'text',
  as = 'input',
  rows,
  min,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  required?: boolean
  hint?: string
  errors?: string[]
  type?: string
  as?: 'input' | 'textarea'
  rows?: number
  min?: number
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {label} {required && <span className="text-[color:var(--brand-red)]">*</span>}
      </span>
      {as === 'textarea' ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ''}
          required={required}
          rows={rows ?? 4}
          className={cn(baseField, 'resize-y')}
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue ?? ''}
          required={required}
          min={min}
          className={baseField}
        />
      )}
      {hint && <span className="block whitespace-pre-wrap text-[11px] text-muted">{hint}</span>}
      {errors?.length ? <span className="block text-xs text-[color:var(--brand-red)]">{errors[0]}</span> : null}
    </label>
  )
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  errors,
}: {
  label: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
  errors?: string[]
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      <select name={name} defaultValue={defaultValue} className={baseField}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {errors?.length ? <span className="block text-xs text-[color:var(--brand-red)]">{errors[0]}</span> : null}
    </label>
  )
}
