import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { ProfileForm, PasswordForm } from './ProfileForms'

export default async function PortalSettings({
  params,
}: PageProps<'/[locale]/portal/settings'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('portal')
  const user = await getSessionUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, phone: true, whatsapp: true, locale: true, role: true },
  })
  if (!dbUser) return null

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{t('portalSettings')}</h1>
        <p className="mt-2 text-sm text-muted">{t('settingsIntro')}</p>
      </header>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Personal details</h2>
          <p className="mt-0.5 text-xs text-muted">
            Your email ({dbUser.email}) and role ({dbUser.role}) are managed by FCI staff.
          </p>
        </div>
        <ProfileForm
          locale={locale}
          defaults={{
            fullName: dbUser.fullName,
            phone: dbUser.phone ?? '',
            whatsapp: dbUser.whatsapp ?? '',
            locale: dbUser.locale === 'en' ? 'en' : 'fr',
          }}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Change password</h2>
          <p className="mt-0.5 text-xs text-muted">
            Minimum 8 characters. You may need to sign in again on other devices.
          </p>
        </div>
        <PasswordForm locale={locale} />
      </section>
    </div>
  )
}
