import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'

export default async function TeamPage({ params }: PageProps<'/[locale]/nos-equipes'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('team')

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')}>
      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface">
        {/* Illustration placeholder — FCI will supply the team photo. */}
        <div className="aspect-[16/9] w-full bg-gradient-to-br from-[color:var(--brand-navy-700)] via-[color:var(--brand-navy)] to-[color:var(--brand-navy-500)]" />
      </div>
    </PageShell>
  )
}
