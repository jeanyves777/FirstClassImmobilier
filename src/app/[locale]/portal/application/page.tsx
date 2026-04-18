import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { Link } from '@/i18n/navigation'

const STAGES = ['received', 'reviewing', 'interview', 'hired', 'rejected']

export default async function PortalApplication({
  params,
}: PageProps<'/[locale]/portal/application'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('portal')
  const user = await getSessionUser()
  if (!user) return null

  const application = await prisma.application.findUnique({ where: { userId: user.id } })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{t('portalApplication')}</h1>
      </header>

      {!application ? (
        <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
          {t('noApplication')}{' '}
          <Link href="/contacts" className="font-semibold text-[color:var(--brand-red)] hover:underline">
            Contacts →
          </Link>
        </p>
      ) : (
        <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <p className="text-xs uppercase tracking-wider text-muted">{t('currentStatus')}</p>
          <p className="mt-1 font-display text-2xl font-semibold capitalize text-foreground">{application.status}</p>

          <ol className="mt-6 grid gap-3 sm:grid-cols-5">
            {STAGES.map((s, i) => {
              const reachedIdx = STAGES.indexOf(application.status)
              const reached = i <= reachedIdx && application.status !== 'rejected'
              const isReject = s === 'rejected' && application.status === 'rejected'
              return (
                <li
                  key={s}
                  className={`rounded-xl border p-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    isReject
                      ? 'border-[color:var(--brand-red)]/30 bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]'
                      : reached
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-[color:var(--border)] bg-surface-muted text-muted'
                  }`}
                >
                  {s}
                </li>
              )
            })}
          </ol>

          {application.message && (
            <p className="mt-6 whitespace-pre-wrap rounded-xl bg-surface-muted p-4 text-sm text-foreground">
              {application.message}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
