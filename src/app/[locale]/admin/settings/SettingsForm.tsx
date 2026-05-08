'use client'

import { useActionState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import { updateSiteSettings } from './actions'
import type { LocalizedText } from '@/lib/zod/localized'
import type { AvailabilityWindow } from '@/lib/schedule/availability'
import { AvailabilityEditor } from './AvailabilityEditor'

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
  slotDurationMin: number
  availability: AvailabilityWindow[]
  legalCompanyName: string
  legalForm: string
  legalCapital: string
  legalRCCM: string
  legalTaxId: string
  legalDirector: string
  legalHostName: string
  legalHostAddress: string
}

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }
const initial: State = { ok: false }

const baseField =
  'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

export function SettingsForm({ locale, defaults }: { locale: string; defaults: Defaults }) {
  const [state, action, pending] = useActionState(updateSiteSettings, initial)
  const { push } = useToast()
  const tf = useTranslations('admin.forms')
  const ts = useTranslations('admin.forms.settings')

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: tf('settingsSaved'), description: tf('settingsSavedDesc'), variant: 'success' })
    }
  }, [state, push, tf])

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />

      <Section title={ts('sectionContact')} hint={ts('sectionContactHint')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ts('phone')} name="phone" defaultValue={defaults.phone} errors={state.errors?.phone} />
          <Field label={ts('mobile')} name="mobile" defaultValue={defaults.mobile} errors={state.errors?.mobile} />
          <Field
            label={ts('whatsapp')}
            name="whatsapp"
            defaultValue={defaults.whatsapp}
            hint={ts('whatsappHint')}
            errors={state.errors?.whatsapp}
          />
          <Field label={ts('email')} name="email" type="email" defaultValue={defaults.email} errors={state.errors?.email} />
          <Field
            label={ts('address')}
            name="address"
            defaultValue={defaults.address}
            className="sm:col-span-2"
            errors={state.errors?.address}
          />
          <Field
            label={ts('hoursFr')}
            name="hoursFr"
            defaultValue={defaults.hoursFr}
            errors={state.errors?.hoursFr}
          />
          <Field
            label={ts('hoursEn')}
            name="hoursEn"
            defaultValue={defaults.hoursEn}
            errors={state.errors?.hoursEn}
          />
        </div>
      </Section>

      <Section title={ts('sectionSocial')} hint={ts('sectionSocialHint')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facebook" name="facebookUrl" type="url" defaultValue={defaults.facebookUrl} errors={state.errors?.facebookUrl} />
          <Field label="Instagram" name="instagramUrl" type="url" defaultValue={defaults.instagramUrl} errors={state.errors?.instagramUrl} />
          <Field label="LinkedIn" name="linkedinUrl" type="url" defaultValue={defaults.linkedinUrl} errors={state.errors?.linkedinUrl} />
          <Field label="YouTube" name="youtubeUrl" type="url" defaultValue={defaults.youtubeUrl} errors={state.errors?.youtubeUrl} />
          <Field label="TikTok" name="tiktokUrl" type="url" defaultValue={defaults.tiktokUrl} errors={state.errors?.tiktokUrl} />
        </div>
      </Section>

      <Section title={ts('sectionFooter')} hint={ts('sectionFooterHint')}>
        <LocalizedField
          name="footerCopy"
          label={ts('footerTagline')}
          defaultValue={defaults.footerCopy ?? undefined}
          rows={2}
        />
      </Section>

      <Section title={ts('sectionScheduler')} hint={ts('sectionSchedulerHint')}>
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">{ts('slotDuration')}</span>
            <input
              type="number"
              name="slotDurationMin"
              min={15}
              max={240}
              step={15}
              defaultValue={defaults.slotDurationMin}
              className="w-32 rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40"
            />
          </label>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{ts('availability')}</p>
            <AvailabilityEditor name="availability" defaultValue={defaults.availability} />
          </div>
        </div>
      </Section>

      <Section title={ts('sectionLegal')} hint={ts('sectionLegalHint')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ts('legalCompanyName')} name="legalCompanyName" defaultValue={defaults.legalCompanyName} />
          <Field label={ts('legalForm')} name="legalForm" defaultValue={defaults.legalForm} hint={ts('legalFormHint')} />
          <Field label={ts('legalCapital')} name="legalCapital" defaultValue={defaults.legalCapital} hint={ts('legalCapitalHint')} />
          <Field label={ts('legalRCCM')} name="legalRCCM" defaultValue={defaults.legalRCCM} />
          <Field label={ts('legalTaxId')} name="legalTaxId" defaultValue={defaults.legalTaxId} />
          <Field label={ts('legalDirector')} name="legalDirector" defaultValue={defaults.legalDirector} hint={ts('legalDirectorHint')} />
          <Field label={ts('legalHostName')} name="legalHostName" defaultValue={defaults.legalHostName} />
          <Field label={ts('legalHostAddress')} name="legalHostAddress" defaultValue={defaults.legalHostAddress} />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>{tf('saveSettings')}</Button>
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
