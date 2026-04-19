import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { parse as parseLocalized } from '@/lib/zod/localized'
import { parseAvailability } from '@/lib/schedule/availability'
import { SettingsForm } from './SettingsForm'

export default async function AdminSettingsPage({
  params,
}: PageProps<'/[locale]/admin/settings'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')

  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } })

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.site')}
        title={t('navSettings')}
        description={t('descriptions.settings')}
      />
      <SettingsForm
        locale={locale}
        defaults={{
          phone: row?.phone ?? '',
          mobile: row?.mobile ?? '',
          whatsapp: row?.whatsapp ?? '',
          email: row?.email ?? '',
          address: row?.address ?? '',
          hoursFr: row?.hoursFr ?? '',
          hoursEn: row?.hoursEn ?? '',
          facebookUrl: row?.facebookUrl ?? '',
          instagramUrl: row?.instagramUrl ?? '',
          linkedinUrl: row?.linkedinUrl ?? '',
          youtubeUrl: row?.youtubeUrl ?? '',
          tiktokUrl: row?.tiktokUrl ?? '',
          footerCopy: row?.footerCopy ? parseLocalized(row.footerCopy) : null,
          slotDurationMin: row?.slotDurationMin ?? 45,
          availability: parseAvailability(row?.availability),
        }}
      />
    </div>
  )
}
