import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { assignAppointment, confirmAppointment, setAppointmentStatus } from './actions'

const STATUS_ORDER = ['requested', 'booked', 'confirmed', 'completed', 'cancelled']
const STATUS_OPTIONS = ['requested', 'booked', 'confirmed', 'cancelled', 'completed'] as const

export default async function AppointmentsInbox({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/appointments'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale
  const sp = await searchParams
  const status = typeof sp.status === 'string' ? sp.status : undefined

  const [appointments, staff, programsById] = await Promise.all([
    prisma.appointment.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        lot: { select: { reference: true, programId: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['STAFF', 'ADMIN'] } },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    }),
    prisma.program.findMany({ select: { id: true, name: true, slug: true } }).then(
      (rows) => new Map(rows.map((p) => [p.id, p])),
    ),
  ])

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.pipeline')}
        title={t('navAppointments')}
        description={t('descriptions.appointments')}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip href="/admin/appointments" active={!status} label="All" />
        {STATUS_ORDER.map((s) => (
          <FilterChip
            key={s}
            href={`/admin/appointments?status=${s}`}
            active={status === s}
            label={s}
          />
        ))}
      </div>

      <div className="space-y-4">
        {appointments.map((a) => {
          const name = a.user?.fullName ?? a.guestName ?? 'Anonymous'
          const email = a.user?.email ?? a.guestEmail ?? ''
          const phone = a.user?.phone ?? a.guestPhone ?? ''
          const program = a.programId ? programsById.get(a.programId) : null
          return (
            <article
              key={a.id}
              className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-5 md:grid-cols-[1fr_auto]"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-foreground">{name}</h3>
                  <StatusPill value={a.status} />
                  <span className="text-xs uppercase tracking-wider text-muted">{a.purpose}</span>
                </div>
                <p className="text-xs text-muted">
                  <a href={`mailto:${email}`} className="hover:text-foreground">{email}</a>{' '}
                  · <a href={`tel:${phone}`} className="hover:text-foreground">{phone}</a>
                </p>
                {program && (
                  <p className="text-xs text-muted">
                    <span className="font-medium text-foreground">{tr(program.name, l)}</span>
                    {a.lot?.reference && <> · Lot {a.lot.reference}</>}
                  </p>
                )}
                {a.preferredAt && (
                  <p className="text-xs text-muted">
                    Preferred: {new Date(a.preferredAt).toLocaleString(l === 'fr' ? 'fr-FR' : 'en-US')}
                  </p>
                )}
                {a.note && <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{a.note}</p>}
              </div>

              <div className="flex flex-col gap-2 md:w-60">
                <form action={setAppointmentStatus} className="flex gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <select
                    name="status"
                    defaultValue={a.status}
                    className="flex-1 rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
                  >
                    {STATUS_OPTIONS.map((s) => (
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

                <form action={assignAppointment} className="flex gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <select
                    name="staffId"
                    defaultValue={a.staffId ?? ''}
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

                {a.status !== 'confirmed' && a.status !== 'cancelled' && a.status !== 'completed' && (
                  <form action={confirmAppointment} className="flex flex-col gap-1.5 rounded-lg border border-[color:var(--border)] bg-surface-muted/50 p-2">
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <label className="block">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Confirm slot
                      </span>
                      <input
                        type="datetime-local"
                        name="scheduledAt"
                        defaultValue={toLocalInput(a.scheduledAt ?? a.preferredAt)}
                        className="mt-0.5 w-full rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
                      />
                    </label>
                    <input type="hidden" name="durationMin" value={a.durationMin} />
                    <button
                      type="submit"
                      className="rounded-lg bg-[color:var(--brand-red)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[color:var(--brand-red-600)]"
                    >
                      Confirm &amp; send invite
                    </button>
                  </form>
                )}
              </div>
            </article>
          )
        })}
        {appointments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
            No appointments in this view.
          </p>
        )}
      </div>
    </div>
  )
}

function toLocalInput(d: Date | null | undefined): string {
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  )
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
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

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    requested: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    booked: 'bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)] dark:text-foreground',
    confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    completed: 'bg-zinc-900 text-white',
    cancelled: 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
