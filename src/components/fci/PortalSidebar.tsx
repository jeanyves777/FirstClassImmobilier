'use client'

import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

type Role = 'BUYER' | 'PROSPECT' | 'APPLICANT' | 'VISITOR' | 'STAFF' | 'ADMIN'

const BASE_NAV: { href: string; key: string; roles?: Role[]; badgeKey?: 'messages' }[] = [
  { href: '/portal/dashboard', key: 'portalDashboard' },
  { href: '/portal/reservations', key: 'portalReservations', roles: ['PROSPECT', 'BUYER'] },
  { href: '/portal/projects', key: 'portalProjects', roles: ['BUYER'] },
  { href: '/portal/application', key: 'portalApplication', roles: ['APPLICANT'] },
  { href: '/portal/appointments', key: 'portalAppointments' },
  { href: '/portal/messages', key: 'portalMessages', badgeKey: 'messages' },
  { href: '/portal/settings', key: 'portalSettings' },
]

export function PortalSidebar({
  user,
  open,
  onClose,
  badges,
}: {
  user: { name?: string | null; email?: string | null; role: Role }
  open: boolean
  onClose: () => void
  badges?: { messages?: number }
}) {
  const t = useTranslations('portal')
  const tAuth = useTranslations('auth')
  const pathname = usePathname()

  const items = BASE_NAV.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[color:var(--border)] bg-surface transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[color:var(--border)] px-5">
          <Link href="/portal/dashboard" className="inline-flex items-center gap-2" onClick={onClose} aria-label="FirstClass Immobilier">
            <svg viewBox="0 0 64 48" fill="none" className="h-6 w-auto text-[color:var(--brand-navy)] dark:text-foreground" aria-hidden>
              <path d="M6 34 L32 6 L58 34" stroke="currentColor" strokeWidth="5" strokeLinejoin="miter" />
              <path d="M44 18 H50 V30 H44 Z" fill="currentColor" />
              <path d="M4 38 H60" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="font-display leading-none">
              <span className="text-base font-semibold tracking-tight text-[color:var(--brand-red)]">First</span>
              <span className="text-base font-semibold tracking-tight text-[color:var(--brand-navy)] dark:text-foreground">Class</span>
            </span>
          </Link>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-red)]">
            {t('role.' + user.role.toLowerCase())}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Portal">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              const badge = item.badgeKey && badges ? badges[item.badgeKey] : undefined
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-[color:var(--brand-navy)] text-white'
                        : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground',
                    )}
                  >
                    <span className="flex-1">{t(item.key)}</span>
                    {badge !== undefined && badge > 0 && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-[color:var(--brand-red)] text-white',
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-[color:var(--border)] p-4">
          <div className="rounded-xl border border-[color:var(--border)] bg-surface-muted p-3 text-xs">
            <p className="uppercase tracking-wider text-muted">{tAuth('signedInAs')}</p>
            <p className="mt-0.5 truncate font-semibold text-foreground">{user.name || user.email}</p>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            key="portal-scrim"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-30 bg-[color:var(--brand-ink)]/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
    </>
  )
}
