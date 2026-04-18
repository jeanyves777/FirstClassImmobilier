import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { formatFCFA } from '@/lib/format'
import { saleProgress } from '@/lib/sales/packet'

export default async function BuyerProjectPage({
  params,
}: PageProps<'/[locale]/portal/projects/[saleId]'>) {
  const { locale, saleId } = await params
  setRequestLocale(locale)
  const l = locale as Locale
  const user = await getSessionUser()
  if (!user) return null
  const t = await getTranslations('portal')

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, buyerId: user.id },
    include: {
      program: { select: { name: true, slug: true } },
      lot: { select: { reference: true } },
      assignedAgent: { select: { fullName: true, email: true, phone: true } },
      payments: { orderBy: { dueAt: 'asc' } },
      requirements: { orderBy: { createdAt: 'asc' } },
      milestones: { orderBy: { id: 'asc' } },
    },
  })
  if (!sale) notFound()

  const docsApproved = sale.requirements.filter((r) => r.status === 'approved').length
  const pct = saleProgress({
    stage: sale.stage,
    constructionProgress: sale.constructionProgress,
    docsApproved,
    docsTotal: sale.requirements.length,
  })
  const totalPaid = sale.payments.filter((p) => p.paidAt).reduce((a, p) => a + p.amountFCFA, 0n)

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <Link href="/portal/dashboard" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted hover:text-foreground">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t('backDashboard')}
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-red)]">
          {sale.lot?.reference} · {tr(sale.program.name, l)}
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          {t('yourProject')}
        </h1>
        <p className="text-sm text-muted sm:text-base capitalize">{sale.stage}</p>
      </header>

      <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('overallCompletion')}</p>
            <p className="mt-1 font-display text-4xl font-semibold text-[color:var(--brand-red)]">{pct}%</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-xs uppercase tracking-wider text-muted">{t('total')}</p>
            <p className="font-semibold text-foreground">{formatFCFA(sale.totalFCFA, l)}</p>
            <p className="mt-1 text-xs text-muted">{t('paidSoFar')}: {formatFCFA(totalPaid, l)}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-[color:var(--brand-red)]" style={{ width: `${pct}%` }} />
        </div>

        {sale.assignedAgent && (
          <div className="mt-5 rounded-xl bg-surface-muted p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('yourAgent')}</p>
            <p className="mt-1 font-semibold text-foreground">{sale.assignedAgent.fullName}</p>
            <p className="text-xs text-muted">
              <a href={`mailto:${sale.assignedAgent.email}`} className="hover:text-foreground">{sale.assignedAgent.email}</a>
              {sale.assignedAgent.phone && <> · <a href={`tel:${sale.assignedAgent.phone}`} className="hover:text-foreground">{sale.assignedAgent.phone}</a></>}
            </p>
          </div>
        )}
      </section>

      {/* Milestones */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{t('milestones')}</h2>
        <ol className="space-y-3">
          {sale.milestones.map((m, i) => {
            const done = !!m.reachedAt
            return (
              <li
                key={m.id}
                className={`flex items-start gap-4 rounded-xl border p-4 ${
                  done
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-[color:var(--border)] bg-surface'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-muted text-muted'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{tr(m.label, l)}</p>
                  {done && (
                    <p className="text-xs text-muted">
                      {new Date(m.reachedAt!).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Documents */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{t('documents')}</h2>
        <ul className="divide-y divide-[color:var(--border)] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface">
          {sale.requirements.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-foreground">{tr(r.label, l)}</p>
                {r.note && <p className="mt-1 text-xs text-muted">{r.note}</p>}
              </div>
              <DocStatusPill value={r.status} />
            </li>
          ))}
        </ul>
      </section>

      {/* Payments */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{t('payments')}</h2>
        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t('due')}</th>
                <th className="px-4 py-3 font-medium">{t('amount')}</th>
                <th className="px-4 py-3 font-medium">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {sale.payments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted">{t('noPayments')}</td>
                </tr>
              )}
              {sale.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-muted">
                    {new Date(p.dueAt).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US')}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatFCFA(p.amountFCFA, l)}</td>
                  <td className="px-4 py-3">
                    {p.paidAt ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {t('paid')}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        {t('dueLabel')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function DocStatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    required: 'bg-surface-muted text-muted',
    uploaded: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
