import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { formatFCFA } from '@/lib/format'

export default async function PortalReservations({
  params,
  searchParams,
}: PageProps<'/[locale]/portal/reservations'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale
  const t = await getTranslations('portal')
  const tc = await getTranslations('common')
  const user = await getSessionUser()
  if (!user) return null

  const sp = await searchParams
  const ok = sp.ok === '1'

  const reservations = await prisma.reservation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      program: { select: { name: true, slug: true } },
      lot: { select: { reference: true, priceFCFA: true } },
    },
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{t('portalReservations')}</h1>
      </header>

      {ok && (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          {tc('success')}
        </p>
      )}

      {reservations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
          {t('noReservations')}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reservations.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-[color:var(--border)] bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-red)]">
                    {r.lot?.reference}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-foreground">
                    {tr(r.program.name, l)}
                  </h2>
                </div>
                <StatusPill value={r.status} />
              </div>
              {r.lot?.priceFCFA && (
                <p className="mt-3 text-sm font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                  {formatFCFA(r.lot.priceFCFA, l)}
                </p>
              )}
              {r.note && <p className="mt-2 text-sm text-muted">{r.note}</p>}
              <Link
                href={`/a-la-une/${r.program.slug}/lots/${r.lot?.reference ?? ''}`}
                className="mt-4 inline-block text-xs font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground"
              >
                View lot →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-zinc-900 text-white',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
