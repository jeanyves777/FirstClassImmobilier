'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { submitApplication, submitFeedback } from './actions'
import { cn } from '@/lib/utils'

type State = { ok: boolean; message?: string; errors?: Record<string, string[]> }
const initial: State = { ok: false }

export function ApplicationForm() {
  const t = useTranslations('contact')
  const tc = useTranslations('common')
  const [state, action, pending] = useActionState(submitApplication, initial)

  return (
    <FormCard title={t('applyWindow')} intro={t('applyIntro')} state={state}>
      <form action={action} className="grid gap-4">
        <Field label={t('fields.fullName')} name="fullName" required errors={state.errors?.fullName} />
        <Field label={t('fields.email')} name="email" type="email" required errors={state.errors?.email} />
        <Field label={t('fields.phone')} name="phone" type="tel" required errors={state.errors?.phone} />
        <Field
          label={t('fields.message')}
          name="message"
          as="textarea"
          required
          errors={state.errors?.message}
        />
        <Submit pending={pending} label={tc('submit')} pendingLabel={tc('submitting')} />
      </form>
    </FormCard>
  )
}

export function FeedbackForm() {
  const t = useTranslations('contact')
  const tc = useTranslations('common')
  const [state, action, pending] = useActionState(submitFeedback, initial)

  return (
    <FormCard title={t('feedbackWindow')} intro={t('feedbackIntro')} state={state}>
      <form action={action} className="grid gap-4">
        <Field label={t('fields.fullName')} name="fullName" required errors={state.errors?.fullName} />
        <Field label={t('fields.email')} name="email" type="email" required errors={state.errors?.email} />
        <Field label={t('fields.phone')} name="phone" type="tel" errors={state.errors?.phone} />
        <Field
          label={t('fields.message')}
          name="message"
          as="textarea"
          required
          errors={state.errors?.message}
        />
        <Submit pending={pending} label={tc('submit')} pendingLabel={tc('submitting')} />
      </form>
    </FormCard>
  )
}

function FormCard({
  title,
  intro,
  children,
  state,
}: {
  title: string
  intro: string
  children: React.ReactNode
  state: State
}) {
  const tc = useTranslations('common')
  return (
    <details
      className="group rounded-2xl border border-[color:var(--border)] bg-surface p-6 open:shadow-[0_24px_60px_-28px_rgba(15,23,42,.25)]"
      {...(state.ok ? { open: true } : {})}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted">{intro}</p>
        </div>
        <span className="text-[color:var(--brand-red)] transition-transform group-open:rotate-45">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>

      <div className="mt-5">
        {state.ok ? (
          <p className="rounded-xl bg-[color:var(--brand-navy)]/5 p-4 text-sm text-[color:var(--brand-navy)] dark:bg-white/5 dark:text-foreground">
            {tc('success')}
          </p>
        ) : (
          children
        )}
      </div>
    </details>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  errors,
  as = 'input',
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  errors?: string[]
  as?: 'input' | 'textarea'
}) {
  const baseClass =
    'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
        {label} {required && <span className="text-[color:var(--brand-red)]">*</span>}
      </span>
      {as === 'textarea' ? (
        <textarea name={name} required={required} rows={5} className={cn(baseClass, 'resize-y')} />
      ) : (
        <input name={name} type={type} required={required} className={baseClass} />
      )}
      {errors?.length ? (
        <span className="mt-1 block text-xs text-[color:var(--brand-red)]">{errors[0]}</span>
      ) : null}
    </label>
  )
}

function Submit({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--brand-navy)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)] disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
