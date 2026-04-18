import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'

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
    select: { fullName: true, email: true, phone: true, whatsapp: true, locale: true },
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{t('portalSettings')}</h1>
        <p className="mt-2 text-sm text-muted">{t('settingsIntro')}</p>
      </header>

      <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Row label="Name" value={dbUser?.fullName ?? '—'} />
          <Row label="Email" value={dbUser?.email ?? '—'} />
          <Row label="Phone" value={dbUser?.phone ?? '—'} />
          <Row label="WhatsApp" value={dbUser?.whatsapp ?? '—'} />
          <Row label="Preferred language" value={dbUser?.locale ?? 'fr'} />
          <Row label="Role" value={user.role} />
        </dl>
        <p className="mt-6 text-xs text-muted">
          Profile editing comes in a later iteration. Contact your agent to change contact details for now.
        </p>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  )
}
