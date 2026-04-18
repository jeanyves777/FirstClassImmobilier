'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { doSignUp } from './actions'
import { cn } from '@/lib/utils'

type State = { ok: boolean; errors?: Record<string, string[]>; error?: string }
const initial: State = { ok: false }

export function SignUpForm({ callbackUrl, locale }: { callbackUrl: string; locale: string }) {
  const t = useTranslations('auth')
  const tc = useTranslations('contact')
  const [state, action, pending] = useActionState(doSignUp, initial)

  const field =
    'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <input type="hidden" name="locale" value={locale} />

      <Field label={tc('fields.fullName')} name="fullName" autoComplete="name" required errors={state.errors?.fullName} field={field} />
      <Field label={t('email')} name="email" type="email" autoComplete="email" required errors={state.errors?.email} field={field} />
      <Field label={tc('fields.phone')} name="phone" type="tel" autoComplete="tel" errors={state.errors?.phone} field={field} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('password')} name="password" type="password" autoComplete="new-password" required minLength={8} errors={state.errors?.password} field={field} />
        <Field label="Confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} errors={state.errors?.confirm} field={field} />
      </div>

      {state.error === 'auth' && (
        <p className="rounded-xl bg-[color:var(--brand-red)]/10 px-4 py-2.5 text-sm text-[color:var(--brand-red)]">{t('invalid')}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          'mt-2 inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--brand-navy)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)]',
          pending && 'opacity-60',
        )}
      >
        {pending ? t('submitting') : 'Create my account'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  minLength,
  autoComplete,
  errors,
  field,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
  errors?: string[]
  field: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
        {label} {required && <span className="text-[color:var(--brand-red)]">*</span>}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className={field}
      />
      {errors?.length ? <span className="mt-1 block text-xs text-[color:var(--brand-red)]">{errors[0]}</span> : null}
    </label>
  )
}
