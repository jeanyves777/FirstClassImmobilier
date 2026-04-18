import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import { StatCounter } from '@/components/fci/StatCounter'
import { prisma } from '@/lib/db'

export default async function RealisationsPage({
  params,
}: PageProps<'/[locale]/nos-realisations'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('realisations')

  const stats = await prisma.siteStats.findUnique({ where: { id: 1 } })

  const categories = [
    { key: 'terrains', title: t('categories.terrains') },
    { key: 'maisons', title: t('categories.maisons') },
    { key: 'lotissements', title: t('categories.lotissements') },
  ] as const

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((cat) => (
          <details
            key={cat.key}
            className="group rounded-2xl border border-[color:var(--border)] bg-surface p-6 open:shadow-[0_24px_60px_-28px_rgba(15,23,42,.25)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-foreground">{cat.title}</h3>
              <span className="text-[color:var(--brand-red)] transition-transform group-open:rotate-45">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {['Abidjan', 'Grand Abidjan', 'Intérieur', 'Extérieur'].map((zone) => (
                <div
                  key={zone}
                  className="rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted px-3 py-2 text-center text-xs text-muted"
                >
                  {zone}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      <section className="mt-14 rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-10">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
          <StatCounter value={stats?.satisfiedClients ?? 350} label={t('counters.clients')} />
          <StatCounter value={stats?.landsSold ?? 450} label={t('counters.landsSold')} />
          <StatCounter value={stats?.housesBuilt ?? 57} label={t('counters.housesBuilt')} />
          <StatCounter value={stats?.acdDelivered ?? 380} label={t('counters.acd')} />
          <StatCounter value={stats?.projectsCount ?? 7} label={t('counters.projects')} />
        </div>
      </section>
    </PageShell>
  )
}
