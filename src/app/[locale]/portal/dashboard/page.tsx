import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { formatFCFA } from '@/lib/format'
import { saleProgress } from '@/lib/sales/packet'

export default async function PortalDashboard({
  params,
}: PageProps<'/[locale]/portal/dashboard'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const user = await getSessionUser()
  if (!user) return null
  const l = locale as Locale
  const t = await getTranslations('portal')

  const [sales, reservations, application, upcomingAppts] = await Promise.all([
    prisma.sale.findMany({
      where: { buyerId: user.id, stage: { not: 'cancelled' } },
      include: {
        program: { select: { name: true, slug: true } },
        lot: { select: { reference: true } },
        requirements: { select: { status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.reservation.findMany({
      where: { userId: user.id, status: { in: ['pending', 'confirmed'] } },
      include: {
        program: { select: { name: true, slug: true } },
        lot: { select: { reference: true, priceFCFA: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.application.findUnique({ where: { userId: user.id } }),
    prisma.appointment.findMany({
      where: { userId: user.id, status: { in: ['requested', 'booked', 'confirmed'] } },
      include: { lot: { select: { reference: true } } },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
  ])

  const greeting = t('welcome', { name: user.name?.split(' ')[0] || 'FCI' })

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
          {t('role.' + user.role.toLowerCase())}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {greeting}
        </h1>
        <p className="text-sm text-muted sm:text-base">{t('dashboardIntro.' + user.role.toLowerCase())}</p>
      </header>

      {/* BUYER → active sales */}
      {sales.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{t('yourProjects')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {sales.map((s) => {
              const docsApproved = s.requirements.filter((r) => r.status === 'approved').length
              const pct = saleProgress({
                stage: s.stage,
                constructionProgress: s.constructionProgress,
                docsApproved,
                docsTotal: s.requirements.length,
              })
              return (
                <Link
                  key={s.id}
                  href={`/portal/projects/${s.id}`}
                  className="group rounded-2xl border border-[color:var(--border)] bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-red)]">{s.lot?.reference}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{tr(s.program.name, l)}</h3>
                  <p className="mt-1 text-sm text-muted capitalize">{s.stage}</p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-[color:var(--brand-red)]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{pct}% {t('complete')}</p>
                  <p className="mt-3 text-sm font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                    {formatFCFA(s.totalFCFA, l)}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* PROSPECT → reservations */}
      {reservations.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{t('yourReservations')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {reservations.map((r) => (
              <article key={r.id} className="rounded-2xl border border-[color:var(--border)] bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-red)]">{r.lot?.reference}</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{tr(r.program.name, l)}</h3>
                <p className="mt-1 text-sm text-muted capitalize">{r.status}</p>
                {r.lot?.priceFCFA && (
                  <p className="mt-3 text-sm font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                    {formatFCFA(r.lot.priceFCFA, l)}
                  </p>
                )}
                <Link
                  href={`/a-la-une/${r.program.slug}/lots/${r.lot?.reference ?? ''}`}
                  className="mt-4 inline-block text-xs font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground"
                >
                  View lot →
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* APPLICANT → application status */}
      {application && user.role === 'APPLICANT' && (
        <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-foreground">{t('yourApplication')}</h2>
          <p className="mt-2 text-sm text-muted">
            {t('applicationStatus.' + application.status)}
          </p>
        </section>
      )}

      {/* Upcoming appointments */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{t('upcomingVisits')}</h2>
        {upcomingAppts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-6 text-center text-sm text-muted">
            {t('noAppointments')}
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--border)] rounded-2xl border border-[color:var(--border)] bg-surface">
            {upcomingAppts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{a.purpose}</p>
                  <p className="text-xs text-muted">
                    {a.lot?.reference && <>Lot {a.lot.reference} · </>}
                    {a.preferredAt
                      ? new Date(a.preferredAt).toLocaleString(l === 'fr' ? 'fr-FR' : 'en-US')
                      : t('pendingSlot')}
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sales.length === 0 && reservations.length === 0 && !application && (
        <section className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-8 text-center">
          <p className="text-sm text-muted">{t('emptyCta')}</p>
          <Link
            href="/a-la-une"
            className="mt-4 inline-flex rounded-full bg-[color:var(--brand-red)] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[color:var(--brand-red-600)]"
          >
            {t('browsePrograms')}
          </Link>
        </section>
      )}
    </div>
  )
}
