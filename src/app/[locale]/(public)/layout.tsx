import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/fci/Header'
import { FooterGlobal } from '@/components/fci/FooterGlobal'
import { FciAssistant } from '@/components/fci/FciAssistant'
import { PageTracker } from '@/components/fci/PageTracker'
import { CookieBanner } from '@/components/fci/CookieBanner'
import { getSiteConfig } from '@/lib/site'

export default async function PublicLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const site = await getSiteConfig()

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <FooterGlobal />
      <FciAssistant locale={locale} whatsapp={site.whatsapp} />
      <PageTracker locale={locale} />
      <CookieBanner />
    </>
  )
}
