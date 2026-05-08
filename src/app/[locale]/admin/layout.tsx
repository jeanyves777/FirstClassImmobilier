import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { AdminShell } from '@/components/fci/AdminShell'
import { ApplyUserTheme } from '@/components/fci/ApplyUserTheme'
import { doSignOut } from './signout/actions'

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<'/[locale]/admin'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireStaff(locale, `/${locale}/admin/dashboard`)

  const [chatBadge, pref, t] = await Promise.all([
    prisma.chatMessage.count({
      where: {
        readAt: null,
        senderId: { not: user.id },
        thread: { status: { in: ['open', 'pending'] } },
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
      <AdminShell
        user={{ name: user.name, email: user.email, role: user.role }}
        onSignOut={doSignOut}
        badges={{ chat: chatBadge }}
        viewSiteLabel={t('viewSite')}
      >
        {children}
      </AdminShell>
    </>
  )
}
