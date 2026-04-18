import { setRequestLocale } from 'next-intl/server'
import { requireStaff } from '@/lib/auth/rbac'
import { AdminSidebar } from '@/components/fci/AdminSidebar'
import { doSignOut } from './signout/actions'

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<'/[locale]/admin'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireStaff(locale, `/${locale}/admin/dashboard`)

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <AdminSidebar
        user={{ name: user.name, email: user.email, role: user.role }}
        onSignOut={doSignOut}
      />
      <div className="flex-1 min-w-0">
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">{children}</main>
      </div>
    </div>
  )
}
