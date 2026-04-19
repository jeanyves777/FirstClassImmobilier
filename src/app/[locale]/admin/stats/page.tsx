import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { StatsForm } from './StatsForm'

export default async function AdminStatsPage({
  params,
}: PageProps<'/[locale]/admin/stats'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')

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
        eyebrow={t('eyebrow.content')}
        title={t('navStats')}
        description={t('descriptions.stats')}
      />
      <StatsForm locale={locale} defaults={defaults} />
    </div>
  )
}
