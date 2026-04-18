import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { AdminShell } from '@/components/fci/AdminShell'
import { doSignOut } from './signout/actions'

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<'/[locale]/admin'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await requireStaff(locale, `/${locale}/admin/dashboard`)

  const [chatBadge, t] = await Promise.all([
    prisma.chatMessage.count({
      where: {
        readAt: null,
        senderId: { not: user.id },
        thread: { status: { in: ['open', 'pending'] } },
      },
    }),
    getTranslations('common'),
  ])

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role }}
      onSignOut={doSignOut}
      badges={{ chat: chatBadge }}
      viewSiteLabel={t('viewSite')}
    >
      {children}
    </AdminShell>
  )
}
