'use client'

import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, usePathname } from '@/i18n/navigation'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

type Badges = { chat?: number }

const NAV = [
  { href: '/admin/dashboard', key: 'navDashboard', icon: IconDashboard },
  { href: '/admin/programs', key: 'navPrograms', icon: IconBuilding },
  { href: '/admin/lots', key: 'navLots', icon: IconGrid },
  { href: '/admin/reservations', key: 'navReservations', icon: IconBookmark },
  { href: '/admin/sales', key: 'navSales', icon: IconHandshake },
  { href: '/admin/appointments', key: 'navAppointments', icon: IconCalendar },
  { href: '/admin/chat', key: 'navChat', icon: IconChat, badgeKey: 'chat' as const },
  { href: '/admin/analytics', key: 'navAnalytics', icon: IconTrending },
  { href: '/admin/leads', key: 'navLeads', icon: IconMessage },
  { href: '/admin/applications', key: 'navApplications', icon: IconClipboard },
  { href: '/admin/activities', key: 'navActivities', icon: IconSparkles },
  { href: '/admin/team', key: 'navTeam', icon: IconUsers },
  { href: '/admin/partners', key: 'navPartners', icon: IconLayers },
  { href: '/admin/stats', key: 'navStats', icon: IconTrending },
  { href: '/admin/users', key: 'navUsers', icon: IconKey },
  { href: '/admin/settings', key: 'navSettings', icon: IconGear },
] as const

export function AdminSidebar({
  user,
  open,
  onClose,
  badges,
}: {
  user: { name?: string | null; email?: string | null; role?: string }
  open: boolean
  onClose: () => void
  badges?: Badges
}) {
  const t = useTranslations('admin')
  const tAuth = useTranslations('auth')
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[color:var(--border)] bg-surface transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
          <Link href="/admin/dashboard" className="flex items-center" onClick={onClose}>
            <Logo />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Admin">
          <ul className="space-y-1">
            {NAV.map(({ href, key, icon: Icon, ...rest }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              const badgeKey = (rest as { badgeKey?: 'chat' }).badgeKey
              const badge = badgeKey && badges ? badges[badgeKey] : undefined
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-[color:var(--brand-navy)] text-white'
                        : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{t(key)}</span>
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
            <p className="text-[10px] uppercase tracking-wider text-[color:var(--brand-red)]">{user.role}</p>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            key="admin-scrim"
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

/* ──────────────────────────────────────────────────────────────── icons */
function svgProps(className?: string) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }
}
function IconDashboard(p: { className?: string }) { return <svg {...svgProps(p.className)}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg> }
function IconBuilding(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/><path d="M8 7h.01M8 11h.01M8 15h.01M12 7h.01M12 11h.01M12 15h.01M16 7h.01M16 11h.01M16 15h.01"/><path d="M3 21h18"/></svg> }
function IconGrid(p: { className?: string }) { return <svg {...svgProps(p.className)}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function IconHandshake(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="M11 17 7 21l-3-3 4-4"/><path d="m14 10 5 5 3-3-5-5"/><path d="M9 12 3 6"/><path d="m21 9-5-5"/></svg> }
function IconMessage(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IconClipboard(p: { className?: string }) { return <svg {...svgProps(p.className)}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> }
function IconCalendar(p: { className?: string }) { return <svg {...svgProps(p.className)}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> }
function IconSparkles(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="m12 3-1.9 5.4L5 10l5.1 1.6L12 17l1.9-5.4L19 10l-5.1-1.6z"/></svg> }
function IconUsers(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconLayers(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="m12 2 9 5-9 5-9-5z"/><path d="m3 17 9 5 9-5"/><path d="m3 12 9 5 9-5"/></svg> }
function IconTrending(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg> }
function IconKey(p: { className?: string }) { return <svg {...svgProps(p.className)}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg> }
function IconGear(p: { className?: string }) { return <svg {...svgProps(p.className)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function IconBookmark(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> }
function IconChat(p: { className?: string }) { return <svg {...svgProps(p.className)}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg> }
