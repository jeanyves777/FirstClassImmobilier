import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'

export default async function AboutPage({ params }: PageProps<'/[locale]/nous-decouvrir'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('about')

  const sections = [
    { key: 'values', title: t('valuesTitle'), body: t('values') },
    { key: 'vision', title: t('visionTitle'), body: t('vision') },
    { key: 'mission', title: t('missionTitle'), body: t('mission') },
    { key: 'products', title: t('productsTitle'), body: t('products') },
  ] as const

  return (
    <PageShell eyebrow="FCI" title={t('title')}>
      <section className="mb-12">
        <h2 className="font-display text-2xl font-semibold text-foreground">{t('bioTitle')}</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">{t('bio')}</p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {sections.map((s) => (
          <article
            key={s.key}
            className="group rounded-2xl border border-[color:var(--border)] bg-surface p-6 transition-shadow hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,.25)]"
          >
            <h3 className="font-display text-xl font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </article>
        ))}
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-foreground">{t('partnersTitle')}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-20 items-center justify-center rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted text-xs text-muted"
            >
              Partenaire
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
