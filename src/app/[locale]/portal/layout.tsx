import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth/rbac'
import { PortalShell } from '@/components/fci/PortalShell'
import { ApplyUserTheme } from '@/components/fci/ApplyUserTheme'
import { doPortalSignOut } from './signout/actions'

export default async function PortalLayout({
  children,
  params,
}: LayoutProps<'/[locale]/portal'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireUser(locale, `/${locale}/portal/dashboard`)

  const [unreadMessages, pref, t] = await Promise.all([
    prisma.chatMessage.count({
      where: {
        readAt: null,
        senderId: { not: user.id },
        thread: { userId: user.id },
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { themePreference: true },
    }),
    getTranslations('common'),
  ])

  return (
    <>
      <ApplyUserTheme value={pref?.themePreference ?? 'system'} />
      <PortalShell
        user={{ name: user.name, email: user.email, role: user.role }}
        onSignOut={doPortalSignOut}
        badges={{ messages: unreadMessages }}
        viewSiteLabel={t('viewSite')}
      >
        {children}
      </PortalShell>
    </>
  )
}
