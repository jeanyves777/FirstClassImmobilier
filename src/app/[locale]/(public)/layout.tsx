import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/fci/Header'
import { FooterGlobal } from '@/components/fci/FooterGlobal'
import { WhatsAppFloating } from '@/components/fci/WhatsAppFloating'
import { PageTracker } from '@/components/fci/PageTracker'

export default async function PublicLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('common')

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <FooterGlobal />
      <WhatsAppFloating label={t('whatsappCta')} />
      <PageTracker locale={locale} />
    </>
  )
}
