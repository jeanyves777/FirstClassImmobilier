import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import type { Locale } from '@/i18n/routing'

export default async function PortalAppointments({
  params,
}: PageProps<'/[locale]/portal/appointments'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale
  const t = await getTranslations('portal')
  const user = await getSessionUser()
  if (!user) return null

  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { userId: user.id },
        ...(user.email ? [{ guestEmail: user.email }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: { lot: { select: { reference: true } } },
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          {t('portalAppointments')}
        </h1>
      </header>

      {appointments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
          {t('noAppointments')}
        </p>
      ) : (
        <ul className="divide-y divide-[color:var(--border)] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface">
          {appointments.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium text-foreground capitalize">{a.purpose}</p>
                <p className="text-xs text-muted">
                  {a.lot?.reference && <>Lot {a.lot.reference} · </>}
                  {a.preferredAt
                    ? new Date(a.preferredAt).toLocaleString(l === 'fr' ? 'fr-FR' : 'en-US')
                    : t('pendingSlot')}
                </p>
                {a.note && <p className="mt-2 text-sm text-muted">{a.note}</p>}
              </div>
              <span className="rounded-full bg-[color:var(--brand-navy)]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--brand-navy)] dark:text-foreground">
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
