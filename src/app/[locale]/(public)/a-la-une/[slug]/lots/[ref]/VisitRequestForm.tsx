'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { requestVisit } from './actions'
import { cn } from '@/lib/utils'

type State = { ok: boolean; errors?: Record<string, string[]> }
const initial: State = { ok: false }

export function VisitRequestForm({
  lotId,
  programId,
  locale,
  suggestedSlots = [],
}: {
  lotId: string
  programId: string
  locale?: string
  suggestedSlots?: string[] // ISO strings from the server
}) {
  const t = useTranslations('lot')
  const tc = useTranslations('contact')
  const tCommon = useTranslations('common')
  const [state, action, pending] = useActionState(requestVisit, initial)
  const [preferred, setPreferred] = useState<string>('')

  const lang = locale === 'en' ? 'en-US' : 'fr-FR'
  const fmt = new Intl.DateTimeFormat(lang, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--brand-navy)]/5 p-6 text-sm text-[color:var(--brand-navy)] dark:bg-white/5 dark:text-foreground">
        {tCommon('success')}
      </div>
    )
  }

  return (
    <form action={action} className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
      <input type="hidden" name="lotId" value={lotId} />
      <input type="hidden" name="programId" value={programId} />
      <h3 className="font-display text-lg font-semibold text-foreground">{t('visitTitle')}</h3>
      <p className="mt-1 text-sm text-muted">{t('visitIntro')}</p>

      {suggestedSlots.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {locale === 'en' ? 'Suggested slots' : 'Créneaux suggérés'}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedSlots.map((iso) => {
              const d = new Date(iso)
              const active = preferred === toLocalInput(d)
              return (
                <motion.button
                  key={iso}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPreferred(toLocalInput(d))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'border-transparent bg-[color:var(--brand-navy)] text-white'
                      : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted',
                  )}
                >
                  {fmt.format(d)}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field name="guestName" label={tc('fields.fullName')} required errors={state.errors?.guestName} />
        <Field name="guestEmail" type="email" label={tc('fields.email')} required errors={state.errors?.guestEmail} />
        <Field name="guestPhone" type="tel" label={tc('fields.phone')} required errors={state.errors?.guestPhone} />
        <Field
          name="preferredAt"
          type="datetime-local"
          label={locale === 'en' ? 'Preferred time' : 'Créneau souhaité'}
          value={preferred}
          onChange={setPreferred}
          errors={state.errors?.preferredAt}
        />
      </div>
      <div className="mt-4">
        <Field name="note" label={tc('fields.message')} as="textarea" errors={state.errors?.note} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-11 items-center rounded-full bg-[color:var(--brand-navy)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)] disabled:opacity-60"
      >
        {pending ? tCommon('submitting') : tCommon('submit')}
      </button>
    </form>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required,
  errors,
  as = 'input',
  value,
  onChange,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  errors?: string[]
  as?: 'input' | 'textarea'
  value?: string
  onChange?: (value: string) => void
}) {
  const baseClass =
    'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'
  const controlled = value !== undefined && onChange !== undefined
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
        {label} {required && <span className="text-[color:var(--brand-red)]">*</span>}
      </span>
      {as === 'textarea' ? (
        <textarea name={name} rows={4} className={cn(baseClass, 'resize-y')} />
      ) : controlled ? (
        <input
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange!(e.target.value)}
          className={baseClass}
        />
      ) : (
        <input name={name} type={type} required={required} className={baseClass} />
      )}
      {errors?.length ? (
        <span className="mt-1 block text-xs text-[color:var(--brand-red)]">{errors[0]}</span>
      ) : null}
    </label>
  )
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  )
}
