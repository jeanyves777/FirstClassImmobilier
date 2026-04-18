import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/fci/PageShell'

const KNOWN = new Set(['aerocity-beach', 'labella-residence', 'offres-terrains'])

export default async function ProgramPage({
  params,
}: PageProps<'/[locale]/a-la-une/[slug]'>) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  if (!KNOWN.has(slug)) notFound()

  const t = await getTranslations('featured')

  const title =
    slug === 'aerocity-beach'
      ? t('programs.aerocity')
      : slug === 'labella-residence'
        ? t('programs.labella')
        : t('programs.lands')

  return (
    <PageShell title={title} eyebrow={t('title')}>
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <p className="text-muted">
            {/* Program bio / details come from DB in P2. This is a placeholder surface. */}
            Contenu détaillé à venir — plans, images, biographie du projet, offres de lots.
          </p>
        </div>
        <aside className="space-y-3">
          <button className="w-full rounded-full bg-[color:var(--brand-red)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--brand-red-600)]">
            {t('reserveCta')}
          </button>
          <button className="w-full rounded-full border border-[color:var(--border)] bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-muted">
            {t('catalogCta')}
          </button>
        </aside>
      </div>
    </PageShell>
  )
}
