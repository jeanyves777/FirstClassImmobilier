import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import type { Locale } from '@/i18n/routing'

export default async function AdminAnalyticsPage({
  params,
}: PageProps<'/[locale]/admin/analytics'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    sessions30d,
    pageViews30d,
    sessions7d,
    pageViews7d,
    sessions24h,
    pageViews24h,
    topPaths,
    recent,
    dailyViews,
    conversionCounts,
  ] = await Promise.all([
    prisma.visitorSession.count({ where: { startedAt: { gte: thirtyDaysAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.visitorSession.count({ where: { startedAt: { gte: sevenDaysAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.visitorSession.count({ where: { startedAt: { gte: twentyFourHoursAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
    prisma.pageView.groupBy({
      by: ['path'],
      _count: { _all: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
    prisma.visitorSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        _count: { select: { pageViews: true } },
      },
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    Promise.all([
      prisma.visitorSession.count({ where: { startedAt: { gte: thirtyDaysAgo } } }),
      prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.appointment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.reservation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.sale.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]),
  ])

  // Bucket pageviews by day for a small SVG chart
  const bucket: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    bucket[key] = 0
  }
  for (const pv of dailyViews) {
    const key = pv.createdAt.toISOString().slice(0, 10)
    if (key in bucket) bucket[key]++
  }
  const days = Object.entries(bucket).map(([date, count]) => ({ date, count }))

  const [funnelVisits, funnelLeads, funnelAppts, funnelResv, funnelSales] = conversionCounts

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.insight')}
        title={t('navAnalytics')}
        description={t('descriptions.analytics')}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Sessions · last 24h" value={sessions24h} sub={`${pageViews24h} views`} accent="red" />
        <KpiCard label="Sessions · last 7 days" value={sessions7d} sub={`${pageViews7d} views`} />
        <KpiCard label="Sessions · last 30 days" value={sessions30d} sub={`${pageViews30d} views`} />
      </section>

      {/* Daily chart */}
      <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Page views per day</h2>
          <p className="text-xs text-muted">30-day rolling window</p>
        </header>
        <DailyBarChart data={days} locale={l} />
      </section>

      {/* Funnel */}
      <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <header className="mb-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Conversion funnel</h2>
          <p className="text-xs text-muted">From visitor to signed sale · last 30 days</p>
        </header>
        <Funnel
          steps={[
            { label: 'Visits', value: funnelVisits, color: 'var(--brand-navy)' },
            { label: 'Leads (Vos Avis)', value: funnelLeads, color: 'var(--brand-navy-500)' },
            { label: 'Visit requests', value: funnelAppts, color: '#f59e0b' },
            { label: 'Reservations', value: funnelResv, color: 'var(--brand-red)' },
            { label: 'Sales', value: funnelSales, color: '#059669' },
          ]}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Top pages · 30 days</h2>
          {topPaths.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted p-6 text-center text-sm text-muted">
              No traffic yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {topPaths.map((row, i) => {
                const max = topPaths[0]._count._all || 1
                const pct = Math.round((row._count._all / max) * 100)
                return (
                  <li key={row.path} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-muted">
                          {i + 1}
                        </span>
                        <span className="truncate font-medium text-foreground">{row.path}</span>
                      </span>
                      <span className="font-semibold text-muted">{row._count._all}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-[color:var(--brand-navy)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Recent sessions</h2>
          {recent.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted p-6 text-center text-sm text-muted">
              Waiting for first visitor…
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {recent.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-muted">
                      {s.referer ?? 'Direct'}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(s.startedAt).toLocaleString(l === 'fr' ? 'fr-FR' : 'en-US')}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                    {s._count.pageViews} view{s._count.pageViews === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: number
  sub?: string
  accent?: 'red'
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${accent === 'red' ? 'bg-[color:var(--brand-red)]' : 'bg-[color:var(--brand-navy)]'}`}
        />
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-foreground">{value.toLocaleString()}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

function DailyBarChart({ data, locale }: { data: { date: string; count: number }[]; locale: Locale }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const width = 600
  const height = 160
  const padX = 20
  const padBottom = 22
  const innerW = width - padX * 2
  const innerH = height - padBottom
  const barW = innerW / data.length - 2
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Daily page views, 30 days"
        className="h-40 w-full min-w-[560px]"
      >
        {data.map((d, i) => {
          const h = (d.count / max) * innerH
          const x = padX + i * (innerW / data.length)
          const y = innerH - h
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="2"
                className="fill-[color:var(--brand-navy)]/60 hover:fill-[color:var(--brand-red)]"
              />
              {(i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) && (
                <text
                  x={x + barW / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-[color:var(--muted)] text-[10px]"
                >
                  {new Date(d.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Funnel({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const top = Math.max(1, steps[0].value)
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const pct = Math.round((s.value / top) * 100)
        const conversion =
          i > 0 && steps[i - 1].value > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : null
        return (
          <div key={s.label} className="grid grid-cols-[minmax(140px,_1fr)_2fr_auto] items-center gap-3">
            <span className="text-sm font-medium text-foreground">{s.label}</span>
            <div className="relative h-8 overflow-hidden rounded-lg bg-surface-muted">
              <div
                className="h-full rounded-lg"
                style={{ width: `${Math.max(pct, s.value > 0 ? 4 : 0)}%`, background: s.color }}
              />
              <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-white mix-blend-plus-lighter">
                {s.value}
              </span>
            </div>
            <span className="w-16 text-right text-xs text-muted">
              {conversion !== null ? `${conversion}%` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
