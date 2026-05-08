import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { tr } from '@/lib/zod/localized'
import { formatFCFA } from '@/lib/format'
import { SALE_STAGES } from '@/lib/sales/packet'
import type { Locale } from '@/i18n/routing'

export default async function AdminDashboard({ params }: PageProps<'/[locale]/admin/dashboard'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const user = await getSessionUser()
  const l = locale as Locale

  // 7-day window for the activity chart.
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600_000)

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
    pipelineSales,
    salesByStage,
    recentReservations,
    recentAppointmentsForChart,
    recentLeadsForChart,
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
    // Pipeline value: all non-cancelled sales, we sum totalFCFA in JS to keep SQLite+BigInt simple.
    prisma.sale.findMany({
      where: { stage: { not: 'cancelled' } },
      select: { totalFCFA: true, stage: true },
    }),
    // Count per stage for the funnel.
    prisma.sale.groupBy({
      by: ['stage'],
      _count: { stage: true },
    }),
    // 7-day activity — we aggregate in JS.
    prisma.reservation.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ])

  // Pipeline totals
  const pipelineTotalFCFA = pipelineSales
    .filter((s) => s.stage !== 'completed')
    .reduce((acc, s) => acc + s.totalFCFA, 0n)
  const closedTotalFCFA = pipelineSales
    .filter((s) => s.stage === 'completed')
    .reduce((acc, s) => acc + s.totalFCFA, 0n)

  // Stage funnel counts (ordered by SALE_STAGES)
  const stageMap = new Map(salesByStage.map((s) => [s.stage, s._count.stage]))
  const stageFunnel = SALE_STAGES.filter((s) => s !== 'cancelled').map((stage) => ({
    stage,
    count: stageMap.get(stage) ?? 0,
  }))
  const maxStageCount = Math.max(1, ...stageFunnel.map((s) => s.count))

  // 7-day activity — buckets per day for [reservations, visits, leads]
  const dayBuckets: { date: Date; reservations: number; visits: number; leads: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600_000)
    d.setHours(0, 0, 0, 0)
    dayBuckets.push({ date: d, reservations: 0, visits: 0, leads: 0 })
  }
  const dayIndex = (d: Date) => {
    const start = new Date(dayBuckets[0].date)
    const delta = Math.floor((d.getTime() - start.getTime()) / (24 * 3600_000))
    return delta >= 0 && delta < dayBuckets.length ? delta : -1
  }
  for (const r of recentReservations) {
    const i = dayIndex(r.createdAt)
    if (i >= 0) dayBuckets[i].reservations++
  }
  for (const a of recentAppointmentsForChart) {
    const i = dayIndex(a.createdAt)
    if (i >= 0) dayBuckets[i].visits++
  }
  for (const ld of recentLeadsForChart) {
    const i = dayIndex(ld.createdAt)
    if (i >= 0) dayBuckets[i].leads++
  }
  const maxDayTotal = Math.max(
    1,
    ...dayBuckets.map((b) => b.reservations + b.visits + b.leads),
  )

  const c = copy(l)

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

      {/* Pipeline value + stage funnel */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-red)]">
            {c.pipelineEyebrow}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
            {c.pipelineTitle}
          </h2>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                {c.pipelineActive}
              </p>
              <p className="mt-0.5 font-display text-3xl font-semibold text-[color:var(--brand-red)] sm:text-4xl">
                {formatFCFA(pipelineTotalFCFA, l)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                {c.pipelineClosed}
              </p>
              <p className="mt-0.5 font-display text-2xl font-semibold text-foreground">
                {formatFCFA(closedTotalFCFA, l)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-red)]">
            {c.funnelEyebrow}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
            {c.funnelTitle}
          </h2>
          <ul className="mt-5 space-y-3">
            {stageFunnel.map((s) => {
              const width = Math.round((s.count / maxStageCount) * 100)
              return (
                <li key={s.stage} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-[11px] uppercase tracking-wider text-muted">
                    {c.stageLabel[s.stage] ?? s.stage}
                  </span>
                  <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-[color:var(--brand-navy)]"
                      style={{ width: `${width}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-xs font-semibold text-foreground">
                    {s.count}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* 7-day activity chart */}
      <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-red)]">
              {c.activityEyebrow}
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
              {c.activityTitle}
            </h2>
          </div>
          <ul className="flex flex-wrap gap-4 text-[11px] uppercase tracking-wider text-muted">
            <Legend color="bg-[color:var(--brand-red)]" label={c.legendReservations} />
            <Legend color="bg-[color:var(--brand-navy)]" label={c.legendVisits} />
            <Legend color="bg-emerald-500" label={c.legendLeads} />
          </ul>
        </div>
        <div className="mt-6 flex items-end gap-3">
          {dayBuckets.map((b) => {
            const total = b.reservations + b.visits + b.leads
            const height = total === 0 ? 0 : Math.max(8, (total / maxDayTotal) * 160)
            return (
              <div key={b.date.toISOString()} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="flex w-full max-w-[44px] flex-col-reverse overflow-hidden rounded-md bg-surface-muted"
                  style={{ height: 160 }}
                >
                  {b.reservations > 0 && (
                    <div
                      className="bg-[color:var(--brand-red)]"
                      style={{ height: `${(b.reservations / maxDayTotal) * 160}px` }}
                      title={`${b.reservations} ${c.legendReservations}`}
                    />
                  )}
                  {b.visits > 0 && (
                    <div
                      className="bg-[color:var(--brand-navy)]"
                      style={{ height: `${(b.visits / maxDayTotal) * 160}px` }}
                      title={`${b.visits} ${c.legendVisits}`}
                    />
                  )}
                  {b.leads > 0 && (
                    <div
                      className="bg-emerald-500"
                      style={{ height: `${(b.leads / maxDayTotal) * 160}px` }}
                      title={`${b.leads} ${c.legendLeads}`}
                    />
                  )}
                  {total === 0 && <div style={{ height }} />}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  {b.date.toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US', {
                    weekday: 'short',
                  })}
                </span>
                <span className="text-[11px] font-semibold text-foreground">{total}</span>
              </div>
            )
          })}
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} aria-hidden />
      {label}
    </li>
  )
}

function copy(l: Locale) {
  const fr = {
    pipelineEyebrow: 'Pipeline',
    pipelineTitle: 'Valeur des ventes',
    pipelineActive: 'Ventes en cours (hors annulées, hors livrées)',
    pipelineClosed: 'Ventes livrées',
    funnelEyebrow: 'Progression',
    funnelTitle: 'Répartition par étape',
    activityEyebrow: 'Activité',
    activityTitle: 'Derniers 7 jours',
    legendReservations: 'Réservations',
    legendVisits: 'Visites',
    legendLeads: 'Avis',
    stageLabel: {
      draft: 'Brouillon',
      'contract-sent': 'Contrat envoyé',
      signed: 'Signé',
      'in-progress': 'En chantier',
      'acd-pending': 'ACD en cours',
      completed: 'Livré',
    } as Record<string, string>,
  }
  const en = {
    pipelineEyebrow: 'Pipeline',
    pipelineTitle: 'Sales value',
    pipelineActive: 'Active sales (excl. cancelled, excl. delivered)',
    pipelineClosed: 'Delivered sales',
    funnelEyebrow: 'Progression',
    funnelTitle: 'Breakdown by stage',
    activityEyebrow: 'Activity',
    activityTitle: 'Last 7 days',
    legendReservations: 'Reservations',
    legendVisits: 'Visits',
    legendLeads: 'Feedback',
    stageLabel: {
      draft: 'Draft',
      'contract-sent': 'Contract sent',
      signed: 'Signed',
      'in-progress': 'Building',
      'acd-pending': 'ACD pending',
      completed: 'Delivered',
    } as Record<string, string>,
  }
  return l === 'fr' ? fr : en
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
