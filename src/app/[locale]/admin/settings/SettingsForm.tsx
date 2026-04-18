'use client'

import { useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import { updateSiteSettings } from './actions'
import type { LocalizedText } from '@/lib/zod/localized'

type Defaults = {
  phone: string
  mobile: string
  whatsapp: string
  email: string
  address: string
  hoursFr: string
  hoursEn: string
  facebookUrl: string
  instagramUrl: string
  linkedinUrl: string
  youtubeUrl: string
  tiktokUrl: string
  footerCopy: LocalizedText | null
}

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }
const initial: State = { ok: false }

const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function SettingsForm({ locale, defaults }: { locale: string; defaults: Defaults }) {
  const [state, action, pending] = useActionState(updateSiteSettings, initial)
  const { push } = useToast()

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: 'Settings saved', description: 'Public site refreshed.', variant: 'success' })
    }
  }, [state, push])

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />

      <Section title="Contact info" hint="Shown in the footer and on the Contacts page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" name="phone" defaultValue={defaults.phone} errors={state.errors?.phone} />
          <Field label="Mobile" name="mobile" defaultValue={defaults.mobile} errors={state.errors?.mobile} />
          <Field
            label="WhatsApp (digits only)"
            name="whatsapp"
            defaultValue={defaults.whatsapp}
            hint="E.g. 2250584212929"
            errors={state.errors?.whatsapp}
          />
          <Field label="Email" name="email" type="email" defaultValue={defaults.email} errors={state.errors?.email} />
          <Field
            label="Address"
            name="address"
            defaultValue={defaults.address}
            className="sm:col-span-2"
            errors={state.errors?.address}
          />
          <Field
            label="Opening hours — FR"
            name="hoursFr"
            defaultValue={defaults.hoursFr}
            errors={state.errors?.hoursFr}
          />
          <Field
            label="Opening hours — EN"
            name="hoursEn"
            defaultValue={defaults.hoursEn}
            errors={state.errors?.hoursEn}
          />
        </div>
      </Section>

      <Section title="Social URLs" hint="Shown as icon links in the footer. Leave blank to hide.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facebook" name="facebookUrl" type="url" defaultValue={defaults.facebookUrl} errors={state.errors?.facebookUrl} />
          <Field label="Instagram" name="instagramUrl" type="url" defaultValue={defaults.instagramUrl} errors={state.errors?.instagramUrl} />
          <Field label="LinkedIn" name="linkedinUrl" type="url" defaultValue={defaults.linkedinUrl} errors={state.errors?.linkedinUrl} />
          <Field label="YouTube" name="youtubeUrl" type="url" defaultValue={defaults.youtubeUrl} errors={state.errors?.youtubeUrl} />
          <Field label="TikTok" name="tiktokUrl" type="url" defaultValue={defaults.tiktokUrl} errors={state.errors?.tiktokUrl} />
        </div>
      </Section>

      <Section title="Footer tagline" hint="Overrides the default slogan shown under the logo in the footer.">
        <LocalizedField
          name="footerCopy"
          label="Tagline"
          defaultValue={defaults.footerCopy ?? undefined}
          rows={2}
        />
      </Section>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>Save settings</Button>
      </div>
    </form>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
      <header className="mb-5">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  hint,
  errors,
  className,
}: {
  label: string
  name: string
  defaultValue?: string
  type?: string
  hint?: string
  errors?: string[]
  className?: string
}) {
  return (
    <label className={`block space-y-1.5 ${className ?? ''}`}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      <input type={type} name={name} defaultValue={defaultValue} className={baseField} />
      {hint && <span className="block text-[11px] text-muted">{hint}</span>}
      {errors?.length ? <span className="block text-xs text-[color:var(--brand-red)]">{errors[0]}</span> : null}
    </label>
  )
}
