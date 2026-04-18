import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'

export default async function ActivitiesPage({
  params,
}: PageProps<'/[locale]/nos-activites'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('activities')

  // Placeholder — real activities come from DB once admin CMS lands (P2).
  const items = [
    { title: 'Cérémonie de livraison LABELLA', date: '2025-11-14' },
    { title: 'Inauguration du showroom', date: '2025-09-05' },
    { title: 'Salon Immobilier Abidjan', date: '2025-06-21' },
  ]

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]" />
            <div className="p-5">
              <time className="text-xs uppercase tracking-wider text-[color:var(--brand-red)]">
                {new Date(item.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{item.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  )
}
