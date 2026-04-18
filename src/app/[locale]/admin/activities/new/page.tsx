import { setRequestLocale } from 'next-intl/server'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { ActivityForm } from '../ActivityForm'

export default async function NewActivityPage({
  params,
}: PageProps<'/[locale]/admin/activities/new'>) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div>
      <AdminHeader
        backHref="/admin/activities"
        backLabel="Activities"
        eyebrow="New"
        title="Publish an activity"
        description="A company event, signing ceremony, opening or similar moment you want to share."
      />
      <ActivityForm locale={locale} mode="create" />
    </div>
  )
}
