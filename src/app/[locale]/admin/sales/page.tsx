import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { saleProgress, SALE_STAGES } from '@/lib/sales/packet'
import { formatFCFA } from '@/lib/format'

export default async function AdminSalesList({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/sales'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale
  const sp = await searchParams
  const stage = typeof sp.stage === 'string' ? sp.stage : undefined

  const sales = await prisma.sale.findMany({
    where: stage ? { stage } : undefined,
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      buyer: { select: { fullName: true, email: true } },
      program: { select: { name: true, slug: true } },
      lot: { select: { reference: true } },
      assignedAgent: { select: { fullName: true, email: true } },
      requirements: { select: { status: true } },
    },
  })

  return (
    <div>
      <AdminHeader
        eyebrow="Pipeline"
        title="Sales"
        description="Every confirmed sale, from draft to completion."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip href="/admin/sales" active={!stage} label="All" />
        {SALE_STAGES.map((s) => (
          <Chip key={s} href={`/admin/sales?stage=${s}`} active={stage === s} label={s} />
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-surface">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-[color:var(--border)] bg-surface-muted text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Lot</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {sales.map((s) => {
              const docsTotal = s.requirements.length
              const docsApproved = s.requirements.filter((r) => r.status === 'approved').length
              const pct = saleProgress({
                stage: s.stage,
                constructionProgress: s.constructionProgress,
                docsApproved,
                docsTotal,
              })
              return (
                <tr key={s.id} className="hover:bg-surface-muted/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{s.buyer.fullName || s.buyer.email}</p>
                    <p className="text-xs text-muted">{s.buyer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <Link href={`/a-la-une/${s.program.slug}/lots/${s.lot?.reference ?? ''}`} className="hover:underline">
                      {tr(s.program.name, l)} · {s.lot?.reference ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatFCFA(s.totalFCFA, l)}</td>
                  <td className="px-4 py-3"><StagePill stage={s.stage} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-1.5 w-28 rounded-full bg-surface-muted">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-[color:var(--brand-red)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {s.assignedAgent?.fullName ?? s.assignedAgent?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/sales/${s.id}`}
                      className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {sales.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  No sales in this view yet. Convert a Reservation to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-transparent bg-[color:var(--brand-navy)] text-white'
          : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
      }`}
    >
      {label}
    </a>
  )
}

function StagePill({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    draft: 'bg-surface-muted text-muted',
    'contract-sent': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    signed: 'bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)] dark:text-foreground',
    'in-progress': 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
    'acd-pending': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-zinc-900 text-white',
  }
  const cls = map[stage] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {stage}
    </span>
  )
}
