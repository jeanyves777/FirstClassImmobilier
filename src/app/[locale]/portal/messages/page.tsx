import { getTranslations, setRequestLocale } from 'next-intl/server'
import { site, whatsappLink } from '@/lib/site'

export default async function PortalMessages({
  params,
}: PageProps<'/[locale]/portal/messages'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('portal')

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{t('portalMessages')}</h1>
      </header>

      <section className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center">
        <p className="text-sm text-muted">
          {t('messagesComingSoon')}
        </p>
        <a
          href={whatsappLink('Bonjour, je souhaite échanger avec FirstClass Immobilier.')}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white hover:brightness-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20.52 3.48A11.84 11.84 0 0 0 12.04 0C5.5 0 .22 5.27.22 11.76a11.6 11.6 0 0 0 1.66 6.02L0 24l6.41-1.67a11.83 11.83 0 0 0 5.63 1.43h.01c6.54 0 11.82-5.28 11.82-11.77a11.68 11.68 0 0 0-3.35-8.51z"/></svg>
          WhatsApp · +{site.whatsapp}
        </a>
      </section>
    </div>
  )
}
