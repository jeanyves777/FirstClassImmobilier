import { setRequestLocale } from 'next-intl/server'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { ProgramForm } from '../ProgramForm'

export default async function NewProgramPage({
  params,
}: PageProps<'/[locale]/admin/programs/new'>) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div>
      <AdminHeader
        backHref="/admin/programs"
        backLabel="Programs"
        eyebrow="New"
        title="Create a program"
        description="A program is a flagship real-estate development (e.g. AEROCITY BEACH)."
      />
      <ProgramForm locale={locale} mode="create" />
    </div>
  )
}
