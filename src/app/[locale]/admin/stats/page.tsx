import { setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { StatsForm } from './StatsForm'

export default async function AdminStatsPage({
  params,
}: PageProps<'/[locale]/admin/stats'>) {
  const { locale } = await params
  setRequestLocale(locale)

  const row = await prisma.siteStats.findUnique({ where: { id: 1 } })
  const defaults = {
    yearsExperience: row?.yearsExperience ?? 8,
    satisfiedClients: row?.satisfiedClients ?? 350,
    projectsCount: row?.projectsCount ?? 7,
    landsSold: row?.landsSold ?? 450,
    housesBuilt: row?.housesBuilt ?? 57,
    acdDelivered: row?.acdDelivered ?? 380,
  }

  return (
    <div>
      <AdminHeader
        eyebrow="Content"
        title="Home counters"
        description="These numbers power the animated counters on Accueil and Nos Réalisations."
      />
      <StatsForm locale={locale} defaults={defaults} />
    </div>
  )
}
