import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import {
  addPayment,
  assignSale,
  cancelSale,
  deletePayment,
  markMilestoneReached,
  setDocumentRequirement,
  togglePaymentPaid,
  updateSaleStage,
} from '../actions'
import { formatFCFA } from '@/lib/format'
import { SALE_STAGES, saleProgress } from '@/lib/sales/packet'
import { ConfirmButton } from '@/components/ui/ConfirmButton'

const DOC_STATUSES = ['required', 'uploaded', 'approved', 'rejected'] as const

export default async function SaleDetailPage({
  params,
}: PageProps<'/[locale]/admin/sales/[id]'>) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const l = locale as Locale

  const [sale, staff] = await Promise.all([
    prisma.sale.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, fullName: true, email: true, phone: true } },
        program: { select: { id: true, name: true, slug: true } },
        lot: { select: { reference: true, priceFCFA: true } },
        assignedAgent: { select: { id: true, fullName: true } },
        payments: { orderBy: { dueAt: 'asc' } },
        requirements: { orderBy: { createdAt: 'asc' } },
        milestones: { orderBy: { id: 'asc' } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['STAFF', 'ADMIN'] } },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    }),
  ])
  if (!sale) notFound()

  const docsApproved = sale.requirements.filter((r) => r.status === 'approved').length
  const docsTotal = sale.requirements.length
  const pct = saleProgress({
    stage: sale.stage,
    constructionProgress: sale.constructionProgress,
    docsApproved,
    docsTotal,
  })

  const totalPaid = sale.payments
    .filter((p) => p.paidAt)
    .reduce((acc, p) => acc + p.amountFCFA, 0n)
  const balance = sale.totalFCFA - totalPaid

  return (
    <div>
      <AdminHeader
        backHref="/admin/sales"
        backLabel="Sales"
        eyebrow={`${tr(sale.program.name, l)} · ${sale.lot?.reference ?? '—'}`}
        title={sale.buyer.fullName || sale.buyer.email}
        description={`${sale.buyer.email}${sale.buyer.phone ? ' · ' + sale.buyer.phone : ''}`}
      />

      {/* Progress banner ────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Stage</p>
            <p className="mt-1 font-display text-2xl font-semibold capitalize text-foreground">{sale.stage}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Overall completion</p>
            <p className="mt-1 font-display text-2xl font-semibold text-[color:var(--brand-red)]">{pct}%</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-[color:var(--brand-red)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-4 text-sm">
          <Stat label="Total" value={formatFCFA(sale.totalFCFA, l)} />
          <Stat label="Paid" value={formatFCFA(totalPaid, l)} />
          <Stat label="Balance" value={formatFCFA(balance < 0n ? 0n : balance, l)} highlight />
          <Stat label="Docs approved" value={`${docsApproved} / ${docsTotal}`} />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stage editor ────────────────────────────── */}
        <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Stage & construction</h2>
          <form action={updateSaleStage} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={sale.id} />
            <input type="hidden" name="locale" value={locale} />
            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">Stage</span>
              <select
                name="stage"
                defaultValue={sale.stage}
                className="w-full rounded-lg border border-[color:var(--border)] bg-background px-3 py-2 text-sm"
              >
                {SALE_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Construction progress — {sale.constructionProgress}%
              </span>
              <input
                type="range"
                name="constructionProgress"
                min={0}
                max={100}
                step={5}
                defaultValue={sale.constructionProgress}
                className="w-full"
              />
            </label>
            <button
              type="submit"
              className="mt-2 inline-flex h-10 items-center rounded-full bg-[color:var(--brand-navy)] px-5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[color:var(--brand-navy-700)]"
            >
              Save stage
            </button>
          </form>
        </section>

        {/* Agent assignment ────────────────────────── */}
        <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Assigned agent</h2>
          <form action={assignSale} className="mt-4 flex gap-2">
            <input type="hidden" name="id" value={sale.id} />
            <input type="hidden" name="locale" value={locale} />
            <select
              name="assignedAgentId"
              defaultValue={sale.assignedAgentId ?? ''}
              className="flex-1 rounded-lg border border-[color:var(--border)] bg-background px-3 py-2 text-sm"
            >
              <option value="">— Unassigned —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName || s.email}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-[color:var(--brand-navy)] px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[color:var(--brand-navy-700)]"
            >
              Save
            </button>
          </form>
        </section>
      </div>

      {/* Payments ─────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Payment schedule</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[color:var(--border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Due</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Method</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {sale.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-muted">{new Date(p.dueAt).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US')}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{formatFCFA(p.amountFCFA, l)}</td>
                  <td className="px-3 py-2 text-muted">{p.method ?? '—'}</td>
                  <td className="px-3 py-2">
                    {p.paidAt ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Paid {new Date(p.paidAt).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        Due
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={togglePaymentPaid} className="inline-flex">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="saleId" value={sale.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <button type="submit" className="text-[11px] font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground">
                        {p.paidAt ? 'Mark unpaid' : 'Mark paid'}
                      </button>
                    </form>
                    <span className="mx-2 text-muted">·</span>
                    <form action={deletePayment} className="inline-flex">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="saleId" value={sale.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <button type="submit" className="text-[11px] text-[color:var(--brand-red)] hover:underline">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {sale.payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-xs text-muted">No payment scheduled yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={addPayment} className="mt-4 grid gap-2 rounded-xl border border-[color:var(--border)] bg-background p-3 sm:grid-cols-[auto_auto_auto_auto]">
          <input type="hidden" name="saleId" value={sale.id} />
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Due date</span>
            <input type="date" name="dueAt" required className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Amount (FCFA)</span>
            <input type="number" min={0} name="amount" required className="w-32 rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Method</span>
            <input type="text" name="method" placeholder="Wire / Cash / OM…" className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm" />
          </label>
          <button
            type="submit"
            className="self-end inline-flex h-9 items-center rounded-full bg-[color:var(--brand-navy)] px-4 text-xs font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
          >
            Schedule payment
          </button>
        </form>
      </section>

      {/* Document packet ─────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Document packet</h2>
        <p className="mt-1 text-xs text-muted">
          Update each item as the buyer uploads and you review. The buyer portal shows the same list.
        </p>
        <ul className="mt-4 divide-y divide-[color:var(--border)] rounded-xl border border-[color:var(--border)]">
          {sale.requirements.map((r) => (
            <li key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{tr(r.label, l)}</p>
                  {r.documentId && (
                    <p className="text-xs text-muted">Attached: doc-{r.documentId.slice(0, 8)}…</p>
                  )}
                  {r.reviewedAt && (
                    <p className="text-[11px] text-muted">
                      Reviewed {new Date(r.reviewedAt).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US')}
                    </p>
                  )}
                </div>
                <DocStatusPill value={r.status} />
              </div>
              <form action={setDocumentRequirement} className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="saleId" value={sale.id} />
                <input type="hidden" name="locale" value={locale} />
                <select
                  name="status"
                  defaultValue={r.status}
                  className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
                >
                  {DOC_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="url"
                  name="url"
                  placeholder="Attach document URL (optional)"
                  className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
                />
                <input
                  type="text"
                  name="note"
                  defaultValue={r.note ?? ''}
                  placeholder="Review note"
                  className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex h-8 items-center rounded-full bg-[color:var(--brand-navy)] px-3 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-[color:var(--brand-navy-700)]"
                >
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {/* Milestones ───────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Construction milestones</h2>
        <ol className="mt-4 space-y-3">
          {sale.milestones.map((m, i) => (
            <li key={m.id} className="flex items-center gap-4 rounded-xl border border-[color:var(--border)] bg-surface-muted/40 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-xs font-semibold text-white">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{tr(m.label, l)}</p>
                {m.reachedAt && (
                  <p className="text-xs text-muted">
                    Reached {new Date(m.reachedAt).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US')}
                  </p>
                )}
              </div>
              <form action={markMilestoneReached} className="shrink-0">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="saleId" value={sale.id} />
                <input type="hidden" name="locale" value={locale} />
                <label className="inline-flex items-center gap-2 text-xs text-muted">
                  <input type="checkbox" name="reached" defaultChecked={!!m.reachedAt} className="h-4 w-4 accent-[color:var(--brand-navy)]" />
                  Reached
                </label>
                <button type="submit" className="ml-3 text-[11px] font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground">
                  Save
                </button>
              </form>
            </li>
          ))}
        </ol>
      </section>

      {/* Cancel ────────────────────────────────────── */}
      {sale.stage !== 'cancelled' && (
        <section className="mt-10 rounded-2xl border border-[color:var(--brand-red)]/30 bg-[color:var(--brand-red)]/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">Cancel this sale</h3>
              <p className="text-xs text-muted">Marks the sale as cancelled. The lot is not automatically re-listed — handle that manually.</p>
            </div>
            <ConfirmButton
              action={cancelSale}
              hiddenFields={{ id: sale.id, locale }}
              title="Cancel this sale?"
              description="The buyer portal will flip to cancelled, payments and documents remain for audit. You can still reactivate the lot manually."
              confirmLabel="Yes, cancel sale"
              variant="danger"
            >
              Cancel sale
            </ConfirmButton>
          </div>
        </section>
      )}

      <Link
        href={`/portal/projects/${sale.id}`}
        className="mt-6 inline-flex text-xs text-muted hover:text-foreground"
      >
        ↗ View what the buyer sees
      </Link>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${highlight ? 'text-[color:var(--brand-red)]' : 'text-foreground'}`}>{value}</dd>
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
