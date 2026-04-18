import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'

export default async function AdminDashboard({ params }: PageProps<'/[locale]/admin/dashboard'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const user = await getSessionUser()
  const l = locale as Locale

  const [
    programs,
    lots,
    lotsAvailable,
    lotsReserved,
    lotsSold,
    leadsOpen,
    applications,
    appointmentsPending,
    salesOngoing,
    recentAppointments,
    recentLeads,
    recentApplications,
  ] = await Promise.all([
    prisma.program.count(),
    prisma.lot.count(),
    prisma.lot.count({ where: { status: 'available' } }),
    prisma.lot.count({ where: { status: 'reserved' } }),
    prisma.lot.count({ where: { status: 'sold' } }),
    prisma.lead.count({ where: { status: 'new' } }),
    prisma.application.count(),
    prisma.appointment.count({ where: { status: 'requested' } }),
    prisma.sale.count({ where: { stage: { notIn: ['completed', 'cancelled'] } } }),
    prisma.appointment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { lot: { select: { reference: true } } },
    }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.application.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const kpis: { key: keyof (typeof t)['raw'] extends never ? string : string; value: number; accent?: 'red' | 'amber' }[] = [
    { key: 'programs', value: programs },
    { key: 'lots', value: lots },
    { key: 'available', value: lotsAvailable, accent: 'red' },
    { key: 'reserved', value: lotsReserved, accent: 'amber' },
    { key: 'sold', value: lotsSold },
    { key: 'leads', value: leadsOpen, accent: 'red' },
    { key: 'applications', value: applications },
    { key: 'appointments', value: appointmentsPending, accent: 'amber' },
    { key: 'sales', value: salesOngoing },
  ]

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
          {t('welcome', { name: user?.name || user?.email || 'FCI' })}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {t('dashboardTitle')}
        </h1>
        <p className="text-sm text-muted sm:text-base">{t('dashboardIntro')}</p>
      </header>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <KpiCard
              key={k.key}
              label={t(`kpi.${k.key}` as Parameters<typeof t>[0])}
              value={k.value}
              accent={k.accent}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <InboxBlock title={t('latest.appointments')}>
          {recentAppointments.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {recentAppointments.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {a.guestName ?? 'User'}{' '}
                      {a.lot?.reference && (
                        <span className="text-xs text-muted">· {a.lot.reference}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{a.guestEmail ?? ''}</p>
                  </div>
                  <StatusPill value={a.status} />
                </li>
              ))}
            </ul>
          )}
        </InboxBlock>

        <InboxBlock title={t('latest.leads')}>
          {recentLeads.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {recentLeads.map((ld) => {
                let name = 'User'
                try {
                  const p = JSON.parse(ld.payload) as { fullName?: string }
                  if (p.fullName) name = p.fullName
                } catch {}
                return (
                  <li key={ld.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted">{new Date(ld.createdAt).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US')}</p>
                    </div>
                    <StatusPill value={ld.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </InboxBlock>

        <InboxBlock title={t('latest.applications')} className="lg:col-span-2">
          {recentApplications.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {recentApplications.map((app) => (
                <li key={app.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-foreground">{app.fullName}</p>
                    <p className="text-xs text-muted">{app.email}</p>
                  </div>
                  <StatusPill value={app.status} />
                </li>
              ))}
            </ul>
          )}
        </InboxBlock>
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'red' | 'amber'
}) {
  const dot =
    accent === 'red'
      ? 'bg-[color:var(--brand-red)]'
      : accent === 'amber'
        ? 'bg-amber-500'
        : 'bg-[color:var(--brand-navy)]'
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-5">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function InboxBlock({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-[color:var(--border)] bg-surface p-5 ${className ?? ''}`}>
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Empty() {
  return <p className="py-6 text-center text-sm text-muted">—</p>
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    new: 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
    requested: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    received: 'bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)] dark:text-foreground',
    confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
