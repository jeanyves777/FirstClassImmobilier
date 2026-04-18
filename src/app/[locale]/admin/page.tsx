import { redirect } from 'next/navigation'

export default async function AdminIndex({ params }: PageProps<'/[locale]/admin'>) {
  const { locale } = await params
  redirect(`/${locale}/admin/dashboard`)
}
