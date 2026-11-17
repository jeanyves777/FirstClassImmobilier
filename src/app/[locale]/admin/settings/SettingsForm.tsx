'use client'

import { useActionState, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LocalizedField } from '@/components/fci/admin/LocalizedField'
import { FileUpload } from '@/components/fci/admin/FileUpload'
import { cn } from '@/lib/utils'
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
  whatsappChannelUrl: string
  heroTitle: LocalizedText | null
  heroSubtitle: LocalizedText | null
  heroStatement: LocalizedText | null
  heroImageUrl: string
  homeUspCards: string
  homeServices: string
  aboutContent: string
  realisationsContent: string
  activitesContent: string
  equipesContent: string
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

      <Section
        title="Accueil — Bannière (Hero)"
        hint="Texte et image de fond de la page d’accueil. Laissez un champ vide pour conserver le texte par défaut."
      >
        <div className="space-y-4">
          <LocalizedField name="heroTitle" label="Titre — ligne 1" defaultValue={defaults.heroTitle ?? undefined} />
          <LocalizedField name="heroSubtitle" label="Titre — ligne 2 (en rouge)" defaultValue={defaults.heroSubtitle ?? undefined} />
          <LocalizedField name="heroStatement" label="Phrase d’accroche" defaultValue={defaults.heroStatement ?? undefined} rows={2} />
          <HeroImagePicker defaultUrl={defaults.heroImageUrl} />
        </div>
      </Section>

      <Section
        title="Accueil — Pourquoi nous choisir"
        hint="Les 4 encadrés dépliables. Laissez un champ vide pour garder le texte par défaut."
      >
        <CardsEditor
          name="homeUspCards"
          defaultJson={defaults.homeUspCards}
          labels={['Promoteur agréé', 'Savoir-faire', 'Titres / ACD', 'Diaspora']}
        />
      </Section>

      <Section
        title="Accueil — Ce que nous proposons"
        hint="Les 4 services dépliables. Laissez un champ vide pour garder le texte par défaut."
      >
        <CardsEditor
          name="homeServices"
          defaultJson={defaults.homeServices}
          labels={['Terrains', 'Maisons clé en main', 'Aménagement foncier', 'Transactions']}
        />
      </Section>

      <Section
        title="À propos — Textes des sections"
        hint="Page « Nous découvrir ». Laissez un champ vide pour garder le texte par défaut."
      >
        <TextOverridesEditor name="aboutContent" defaultJson={defaults.aboutContent} fields={ABOUT_FIELDS} />
      </Section>

      <Section title="Réalisations — Textes" hint="Page « Nos réalisations ». Laissez un champ vide pour garder le texte par défaut.">
        <TextOverridesEditor name="realisationsContent" defaultJson={defaults.realisationsContent} fields={REALISATIONS_FIELDS} />
      </Section>

      <Section title="Activités — Textes" hint="Page « Nos activités ». Laissez un champ vide pour garder le texte par défaut.">
        <TextOverridesEditor name="activitesContent" defaultJson={defaults.activitesContent} fields={ACTIVITES_FIELDS} />
      </Section>

      <Section title="Équipes — Textes" hint="Page « Nos équipes ». Laissez un champ vide pour garder le texte par défaut.">
        <TextOverridesEditor name="equipesContent" defaultJson={defaults.equipesContent} fields={EQUIPES_FIELDS} />
      </Section>

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
          <Field label="WhatsApp (chaîne)" name="whatsappChannelUrl" type="url" defaultValue={defaults.whatsappChannelUrl} errors={state.errors?.whatsappChannelUrl} />
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

function HeroImagePicker({ defaultUrl }: { defaultUrl: string }) {
  const [url, setUrl] = useState(defaultUrl)
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-muted">Image de fond (Hero)</label>
      <input type="hidden" name="heroImageUrl" value={url} />
      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-[color:var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => setUrl('')}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white hover:bg-black/80"
          >
            Retirer
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-muted">Aucune image — le diaporama par défaut est utilisé.</p>
      )}
      <FileUpload accept="image/*" label="Téléverser une image" onUploaded={(f) => setUrl(f.url)} />
    </div>
  )
}

type EditCard = { title: { fr: string; en: string }; body: { fr: string; en: string } }
function CardsEditor({ name, defaultJson, labels }: { name: string; defaultJson: string; labels: string[] }) {
  const parse = (): EditCard[] => {
    try {
      const arr = JSON.parse(defaultJson)
      if (Array.isArray(arr)) return arr as EditCard[]
    } catch {
      /* ignore */
    }
    return []
  }
  const [cards, setCards] = useState<EditCard[]>(() =>
    labels.map((_, i) => parse()[i] ?? { title: { fr: '', en: '' }, body: { fr: '', en: '' } }),
  )
  const [tab, setTab] = useState<'fr' | 'en'>('fr')
  const set = (i: number, field: 'title' | 'body', val: string) =>
    setCards((cs) => cs.map((c, j) => (j === i ? { ...c, [field]: { ...c[field], [tab]: val } } : c)))
  const base =
    'w-full rounded-lg border border-[color:var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'
  return (
    <div className="space-y-3">
      <div role="tablist" className="inline-flex rounded-full border border-[color:var(--border)] bg-surface p-0.5 text-[10px] font-semibold uppercase tracking-wider">
        {(['fr', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={cn('rounded-full px-2.5 py-1 transition-colors', tab === l ? 'bg-[color:var(--brand-navy)] text-white' : 'text-muted hover:text-foreground')}
          >
            {l}
          </button>
        ))}
      </div>
      {cards.map((c, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-[color:var(--border)] bg-surface-muted p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{labels[i] ?? `Carte ${i + 1}`}</p>
          <input className={base} placeholder="Titre" value={c.title[tab]} onChange={(e) => set(i, 'title', e.target.value)} />
          <textarea className={cn(base, 'resize-y')} rows={3} placeholder="Texte" value={c.body[tab]} onChange={(e) => set(i, 'body', e.target.value)} />
        </div>
      ))}
      <input type="hidden" name={name} value={JSON.stringify(cards)} />
    </div>
  )
}

const ABOUT_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: 'title', label: 'Titre de la page' },
  { key: 'slogan', label: 'Slogan' },
  { key: 'agrementBadge', label: 'Badge agrément' },
  { key: 'bioTitle', label: 'Biographie — titre' },
  { key: 'bio', label: 'Biographie — texte', multiline: true },
  { key: 'missionTitle', label: 'Mission — titre' },
  { key: 'mission', label: 'Mission — texte', multiline: true },
  { key: 'visionTitle', label: 'Vision — titre' },
  { key: 'vision', label: 'Vision — texte', multiline: true },
  { key: 'valuesTitle', label: 'Valeurs — titre' },
  { key: 'values', label: 'Valeurs — texte', multiline: true },
  { key: 'productsTitle', label: 'Produits — titre' },
  { key: 'products', label: 'Produits — texte', multiline: true },
  { key: 'partnersTitle', label: 'Partenaires — titre' },
]

const REALISATIONS_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: 'title', label: 'Titre de la page' },
  { key: 'intro', label: 'Intro', multiline: true },
  { key: 'categories.terrains', label: 'Catégorie — Terrains' },
  { key: 'categories.maisons', label: 'Catégorie — Maisons' },
  { key: 'categories.lotissements', label: 'Catégorie — Lotissements' },
]

const ACTIVITES_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: 'title', label: 'Titre de la page' },
  { key: 'intro', label: 'Intro', multiline: true },
]

const EQUIPES_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: 'title', label: 'Titre de la page' },
  { key: 'intro', label: 'Intro', multiline: true },
]

function TextOverridesEditor({
  name,
  defaultJson,
  fields,
}: {
  name: string
  defaultJson: string
  fields: { key: string; label: string; multiline?: boolean }[]
}) {
  const initial: Record<string, { fr?: string; en?: string }> = (() => {
    try {
      const o = JSON.parse(defaultJson)
      return o && typeof o === 'object' ? o : {}
    } catch {
      return {}
    }
  })()
  const [map, setMap] = useState<Record<string, { fr: string; en: string }>>(() => {
    const m: Record<string, { fr: string; en: string }> = {}
    for (const f of fields) m[f.key] = { fr: initial[f.key]?.fr ?? '', en: initial[f.key]?.en ?? '' }
    return m
  })
  const [tab, setTab] = useState<'fr' | 'en'>('fr')
  const set = (k: string, v: string) => setMap((m) => ({ ...m, [k]: { ...m[k], [tab]: v } }))
  const base =
    'w-full rounded-lg border border-[color:var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'
  return (
    <div className="space-y-3">
      <div role="tablist" className="inline-flex rounded-full border border-[color:var(--border)] bg-surface p-0.5 text-[10px] font-semibold uppercase tracking-wider">
        {(['fr', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={cn('rounded-full px-2.5 py-1 transition-colors', tab === l ? 'bg-[color:var(--brand-navy)] text-white' : 'text-muted hover:text-foreground')}
          >
            {l}
          </button>
        ))}
      </div>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted">{f.label}</label>
          {f.multiline ? (
            <textarea className={cn(base, 'resize-y')} rows={3} value={map[f.key][tab]} onChange={(e) => set(f.key, e.target.value)} />
          ) : (
            <input className={base} value={map[f.key][tab]} onChange={(e) => set(f.key, e.target.value)} />
          )}
        </div>
      ))}
      <input type="hidden" name={name} value={JSON.stringify(map)} />
    </div>
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
