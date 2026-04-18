'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { createProgram, updateProgram } from './actions'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import type { LocalizedText } from '@/lib/zod/localized'
import { cn } from '@/lib/utils'

type Program = {
  id?: string
  slug: string
  name: LocalizedText
  tagline: LocalizedText
  description: LocalizedText
  type: string
  status: string
  zone: string
  featured: boolean
}

type State = { ok: boolean; errors?: Record<string, string[]>; id?: string }
const initial: State = { ok: false }

const TYPES = ['TERRAIN', 'MAISON', 'LOTISSEMENT'] as const
const STATUSES = ['DRAFT', 'ON_SALE', 'SOLD_OUT', 'DELIVERED'] as const
const ZONES = ['Abidjan', 'Grand Abidjan', 'Intérieur', 'Extérieur']

const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function ProgramForm({
  locale,
  program,
  mode,
}: {
  locale: string
  program?: Program
  mode: 'create' | 'edit'
}) {
  const tc = useTranslations('common')
  const action = mode === 'create' ? createProgram : updateProgram
  const [state, formAction, pending] = useActionState(action, initial)

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {program?.id && <input type="hidden" name="id" value={program.id} />}

      <Section title="Identity">
        <Field label="Slug" name="slug" defaultValue={program?.slug} required errors={state.errors?.slug}
          hint="Used in URLs, e.g. aerocity-beach. Lowercase letters, digits, dashes only." />
        <LocalizedField name="name" label="Name" defaultValue={program?.name} required errors={state.errors?.name as string[] | undefined} />
        <LocalizedField name="tagline" label="Tagline" defaultValue={program?.tagline} required rows={2} errors={state.errors?.tagline as string[] | undefined} />
        <LocalizedField name="description" label="Description" defaultValue={program?.description} required rows={6} errors={state.errors?.description as string[] | undefined} />
      </Section>

      <Section title="Classification">
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Type" name="type" defaultValue={program?.type ?? 'LOTISSEMENT'} options={TYPES.map((t) => ({ value: t, label: t }))} />
          <SelectField label="Status" name="status" defaultValue={program?.status ?? 'ON_SALE'} options={STATUSES.map((s) => ({ value: s, label: s }))} />
          <SelectField label="Zone" name="zone" defaultValue={program?.zone ?? 'Abidjan'} options={ZONES.map((z) => ({ value: z, label: z }))} errors={state.errors?.zone} />
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={program?.featured ?? false}
            className="h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--brand-navy)]"
          />
          Feature on “À la Une” homepage section
        </label>
      </Section>

      <footer className="flex items-center justify-between gap-4 border-t border-[color:var(--border)] pt-6">
        {state.ok && mode === 'edit' && (
          <p className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Saved ✓
          </p>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className={cn(
              'inline-flex h-11 items-center rounded-full bg-[color:var(--brand-navy)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)]',
              pending && 'opacity-60',
            )}
          >
            {pending ? tc('submitting') : mode === 'create' ? 'Create program' : 'Save changes'}
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
}: {
  label: string
  name: string
  defaultValue?: string
  required?: boolean
  hint?: string
  errors?: string[]
  type?: string
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {label} {required && <span className="text-[color:var(--brand-red)]">*</span>}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={baseField}
      />
      {hint && <span className="block text-[11px] text-muted">{hint}</span>}
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
