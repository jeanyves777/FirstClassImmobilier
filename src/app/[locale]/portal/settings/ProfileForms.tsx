'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { changePassword, updateProfile } from './actions'

type Profile = { fullName: string; phone: string; whatsapp: string; locale: 'fr' | 'en' }

const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function ProfileForm({ locale, defaults }: { locale: string; defaults: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, { ok: false } as {
    ok: boolean
    errors?: Record<string, string[]>
    timestamp?: number
  })
  const { push } = useToast()

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: 'Profile updated', variant: 'success' })
    }
  }, [state, push])

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />

      <label className="block space-y-1.5 sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Full name</span>
        <input name="fullName" defaultValue={defaults.fullName} required className={baseField} />
        {state.errors?.fullName?.length ? (
          <span className="text-xs text-[color:var(--brand-red)]">{state.errors.fullName[0]}</span>
        ) : null}
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Phone</span>
        <input name="phone" type="tel" defaultValue={defaults.phone} className={baseField} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">WhatsApp</span>
        <input name="whatsapp" type="tel" defaultValue={defaults.whatsapp} className={baseField} />
      </label>

      <label className="block space-y-1.5 sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Preferred language</span>
        <select name="userLocale" defaultValue={defaults.locale} className={baseField}>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </label>

      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" loading={pending}>
          Save profile
        </Button>
      </div>
    </form>
  )
}

export function PasswordForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState(changePassword, { ok: false } as {
    ok: boolean
    error?: string
    timestamp?: number
  })
  const { push } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: 'Password updated', variant: 'success' })
      formRef.current?.reset()
    } else if (state.error) {
      push({ title: state.error, variant: 'error' })
    }
  }, [state, push])

  return (
    <form
      ref={formRef}
      action={action}
      className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:grid-cols-2"
    >
      <input type="hidden" name="locale" value={locale} />

      <label className="block space-y-1.5 sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Current password</span>
        <input name="current" type="password" required autoComplete="current-password" className={baseField} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">New password</span>
        <input name="next" type="password" required minLength={8} autoComplete="new-password" className={baseField} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Confirm new password</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={baseField} />
      </label>

      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" loading={pending}>
          Change password
        </Button>
      </div>
    </form>
  )
}
