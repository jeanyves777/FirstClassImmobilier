import { redirect } from 'next/navigation'

export default async function PortalIndex({ params }: PageProps<'/[locale]/portal'>) {
  const { locale } = await params
  redirect(`/${locale}/portal/dashboard`)
}
