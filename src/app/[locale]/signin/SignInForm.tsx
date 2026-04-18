'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { doSignIn } from './actions'
import { cn } from '@/lib/utils'

type State = { ok: boolean; error?: string }
const initial: State = { ok: false }

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations('auth')
  const [state, action, pending] = useActionState(doSignIn, initial)

  const baseField =
    'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
          {t('email')}
        </span>
        <input name="email" type="email" autoComplete="email" required className={baseField} />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
          {t('password')}
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className={baseField}
        />
      </label>

      {state.error === 'invalid' && (
        <p className="rounded-xl bg-[color:var(--brand-red)]/10 px-4 py-2.5 text-sm text-[color:var(--brand-red)]">
          {t('invalid')}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          'mt-2 inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--brand-navy)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)]',
          pending && 'opacity-60',
        )}
      >
        {pending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
