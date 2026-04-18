import { setRequestLocale } from 'next-intl/server'
import { requireUser } from '@/lib/auth/rbac'
import { PortalSidebar } from '@/components/fci/PortalSidebar'
import { doPortalSignOut } from './signout/actions'

export default async function PortalLayout({
  children,
  params,
}: LayoutProps<'/[locale]/portal'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireUser(locale, `/${locale}/portal/dashboard`)

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <PortalSidebar
        user={{ name: user.name, email: user.email, role: user.role }}
        onSignOut={doPortalSignOut}
      />
      <div className="flex-1 min-w-0">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">{children}</main>
      </div>
    </div>
  )
}
