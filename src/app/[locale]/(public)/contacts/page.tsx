import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import { site, whatsappLink } from '@/lib/site'
import { ApplicationForm, FeedbackForm } from './ContactForms'

export default async function ContactsPage({ params }: PageProps<'/[locale]/contacts'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('contact')

  const mapQuery = encodeURIComponent(site.address)
  const hours = locale === 'fr' ? site.hours.fr : site.hours.en

  return (
    <PageShell eyebrow="FCI" title={t('title')} wide>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-foreground">{t('infoWindow')}</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--border)]">
            <iframe
              title="FirstClass Immobilier — Map"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-60 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label={t('address')} value={site.address} />
            <Row label={t('hours')} value={hours} />
            <Row label={t('phone')} href={`tel:${site.phone.replace(/\s/g, '')}`} value={site.phone} />
            <Row label={t('mobile')} href={`tel:${site.mobile.replace(/\s/g, '')}`} value={site.mobile} />
            <Row label={t('whatsapp')} href={whatsappLink()} external value={`+${site.whatsapp}`} />
            <Row label={t('email')} href={`mailto:${site.email}`} value={site.email} />
            <Row label={t('site')} href={site.siteUrl} external value={site.siteUrl.replace(/^https?:\/\//, '')} />
          </dl>
        </section>

        <div className="flex flex-col gap-6">
          <ApplicationForm />
          <FeedbackForm />
        </div>
      </div>
    </PageShell>
  )
}

function Row({
  label,
  value,
  href,
  external,
}: {
  label: string
  value: string
  href?: string
  external?: boolean
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-sm text-foreground">
        {href ? (
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="underline-offset-4 hover:text-[color:var(--brand-red)] hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
