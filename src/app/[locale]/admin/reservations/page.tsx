import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import {
  assignReservation,
  convertReservationToSale,
  setReservationStatus,
} from './actions'
import { formatFCFA } from '@/lib/format'

const STATUS_ORDER = ['pending', 'confirmed', 'cancelled']

export default async function ReservationsInbox({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/reservations'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale
  const sp = await searchParams
  const status = typeof sp.status === 'string' ? sp.status : undefined

  const [reservations, staff] = await Promise.all([
    prisma.reservation.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        program: { select: { name: true, slug: true } },
        lot: { select: { reference: true, priceFCFA: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['STAFF', 'ADMIN'] } },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    }),
  ])

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.pipeline')}
        title={t('navReservations')}
        description={t('descriptions.reservations')}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip href="/admin/reservations" active={!status} label={t('labels.all')} />
        {STATUS_ORDER.map((s) => (
          <Chip key={s} href={`/admin/reservations?status=${s}`} active={status === s} label={t(`statusFilter.${s}`)} />
        ))}
      </div>

      <div className="space-y-4">
        {reservations.map((r) => (
          <article
            key={r.id}
            className="grid gap-5 rounded-2xl border border-[color:var(--border)] bg-surface p-5 lg:grid-cols-[1fr_320px]"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-semibold text-foreground">
                  {r.user.fullName || r.user.email}
                </h3>
                <Pill value={r.status} />
              </div>
              <p className="text-xs text-muted">
                <a href={`mailto:${r.user.email}`} className="hover:text-foreground">{r.user.email}</a>
                {r.user.phone && <> · <a href={`tel:${r.user.phone}`} className="hover:text-foreground">{r.user.phone}</a></>}
              </p>
              <p className="text-xs text-muted">
                <Link
                  href={`/a-la-une/${r.program.slug}/lots/${r.lot?.reference ?? ''}`}
                  className="font-semibold text-foreground hover:underline"
                >
                  {tr(r.program.name, l)} · Lot {r.lot?.reference ?? '—'}
                </Link>
                {r.lot?.priceFCFA && <> · {formatFCFA(r.lot.priceFCFA, l)}</>}
              </p>
              {r.note && (
                <p className="mt-1 whitespace-pre-wrap rounded-xl bg-surface-muted p-3 text-sm text-foreground">{r.note}</p>
              )}
              <p className="text-[11px] text-muted">{new Date(r.createdAt).toLocaleString(l === 'fr' ? 'fr-FR' : 'en-US')}</p>
            </div>

            <div className="space-y-2">
              <form action={setReservationStatus} className="flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="locale" value={locale} />
                <select
                  name="status"
                  defaultValue={r.status}
                  className="flex-1 rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-[color:var(--brand-navy)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
                >
                  Save
                </button>
              </form>

              <form action={assignReservation} className="flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="locale" value={locale} />
                <select
                  name="assignedAgentId"
                  defaultValue={r.assignedAgentId ?? ''}
                  className="flex-1 rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
                >
                  <option value="">— Unassigned —</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName || s.email}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg border border-[color:var(--border)] bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted"
                >
                  Assign
                </button>
              </form>

              {r.status !== 'cancelled' && (
                <form action={convertReservationToSale}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[color:var(--brand-red)] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[color:var(--brand-red-600)]"
                  >
                    Convert to sale →
                  </button>
                </form>
              )}
            </div>
          </article>
        ))}
        {reservations.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
            No reservations yet. As soon as a prospect clicks Reserve on a lot, it appears here.
          </p>
        )}
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

function Pill({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
