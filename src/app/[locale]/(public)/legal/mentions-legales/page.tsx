import { setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import { getSiteConfig } from '@/lib/site'
import type { Locale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

export default async function MentionsLegalesPage({
  params,
}: PageProps<'/[locale]/legal/mentions-legales'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const site = await getSiteConfig()
  const l = locale as Locale
  const legal = site.legal
  const todo = l === 'fr' ? '— à compléter —' : '— to be filled —'

  const t = l === 'fr'
    ? {
        eyebrow: 'Informations légales',
        title: 'Mentions légales',
        intro: 'Informations obligatoires relatives à l\u2019éditeur de ce site, conformément à la législation ivoirienne en vigueur.',
        sections: {
          editor: 'Éditeur du site',
          publisher: 'Directeur de publication',
          host: 'Hébergement',
          contact: 'Contact',
          ip: 'Propriété intellectuelle',
          ipBody:
            'L\u2019ensemble des contenus présents sur ce site (textes, photographies, illustrations, logos, vidéos, plans) est la propriété exclusive de FirstClass Immobilier ou de ses partenaires. Toute reproduction, représentation, modification ou adaptation, totale ou partielle, est interdite sans autorisation écrite préalable.',
          jurisdiction: 'Loi applicable',
          jurisdictionBody:
            'Le présent site et son contenu sont soumis au droit ivoirien. Tout litige relatif à leur utilisation relève de la compétence exclusive des tribunaux d\u2019Abidjan.',
        },
        labels: {
          company: 'Raison sociale',
          form: 'Forme juridique',
          capital: 'Capital social',
          rccm: 'RCCM',
          taxId: 'N° CC / IDU',
          siege: 'Siège social',
          email: 'E-mail',
          phone: 'Téléphone',
        },
      }
    : {
        eyebrow: 'Legal information',
        title: 'Legal notice',
        intro: 'Mandatory disclosure about the site publisher in accordance with Ivorian law.',
        sections: {
          editor: 'Site publisher',
          publisher: 'Publication director',
          host: 'Hosting',
          contact: 'Contact',
          ip: 'Intellectual property',
          ipBody:
            'All content on this site (text, photographs, illustrations, logos, video, plans) is the exclusive property of FirstClass Immobilier or its partners. Any reproduction, representation, modification or adaptation, in whole or in part, is prohibited without prior written authorization.',
          jurisdiction: 'Applicable law',
          jurisdictionBody:
            'This site and its content are governed by Ivorian law. Any dispute relating to their use falls within the exclusive jurisdiction of the courts of Abidjan.',
        },
        labels: {
          company: 'Company',
          form: 'Legal form',
          capital: 'Share capital',
          rccm: 'RCCM',
          taxId: 'Tax ID (CC / IDU)',
          siege: 'Registered office',
          email: 'Email',
          phone: 'Phone',
        },
      }

  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <div className="space-y-10">
        <LegalSection title={t.sections.editor}>
          <Row label={t.labels.company} value={legal.companyName} />
          <Row label={t.labels.form} value={legal.form || todo} />
          <Row label={t.labels.capital} value={legal.capital || todo} />
          <Row label={t.labels.rccm} value={legal.rccm || todo} />
          <Row label={t.labels.taxId} value={legal.taxId || todo} />
          <Row label={t.labels.siege} value={site.address} />
          <Row label={t.labels.email} value={site.email} href={`mailto:${site.email}`} />
          <Row label={t.labels.phone} value={site.phone} href={`tel:${site.phone.replace(/\s+/g, '')}`} />
        </LegalSection>

        <LegalSection title={t.sections.publisher}>
          <p className="text-sm text-muted">{legal.director || todo}</p>
        </LegalSection>

        <LegalSection title={t.sections.host}>
          <Row label={t.labels.company} value={legal.hostName || todo} />
          <Row label={t.labels.siege} value={legal.hostAddress || todo} />
        </LegalSection>

        <LegalSection title={t.sections.ip}>
          <p className="text-sm leading-relaxed text-muted">{t.sections.ipBody}</p>
        </LegalSection>

        <LegalSection title={t.sections.jurisdiction}>
          <p className="text-sm leading-relaxed text-muted">{t.sections.jurisdictionBody}</p>
        </LegalSection>
      </div>
    </PageShell>
  )
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-8">
      <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[color:var(--border)] py-2 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-4 sm:py-1.5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-sm text-foreground">
        {href ? (
          <a href={href} className="hover:text-[color:var(--brand-navy)] hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
