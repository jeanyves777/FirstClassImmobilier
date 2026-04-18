'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { Logo } from './Logo'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

type Role = 'BUYER' | 'PROSPECT' | 'APPLICANT' | 'VISITOR' | 'STAFF' | 'ADMIN'

const BASE_NAV: { href: string; key: string; roles?: Role[] }[] = [
  { href: '/portal/dashboard', key: 'portalDashboard' },
  { href: '/portal/reservations', key: 'portalReservations', roles: ['PROSPECT', 'BUYER'] },
  { href: '/portal/projects', key: 'portalProjects', roles: ['BUYER'] },
  { href: '/portal/application', key: 'portalApplication', roles: ['APPLICANT'] },
  { href: '/portal/appointments', key: 'portalAppointments' },
  { href: '/portal/messages', key: 'portalMessages' },
  { href: '/portal/settings', key: 'portalSettings' },
]

export function PortalSidebar({
  user,
  onSignOut,
}: {
  user: { name?: string | null; email?: string | null; role: Role }
  onSignOut: () => Promise<void>
}) {
  const t = useTranslations('portal')
  const tAuth = useTranslations('auth')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const items = BASE_NAV.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[color:var(--border)] bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/portal/dashboard" className="flex items-center">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-surface"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[color:var(--border)] bg-surface transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <Link href="/portal/dashboard" className="inline-flex">
            <Logo />
          </Link>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-red)]">
            {t('role.' + user.role.toLowerCase())}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Portal">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-[color:var(--brand-navy)] text-white'
                        : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground',
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-[color:var(--border)] space-y-3 p-4">
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-surface-muted p-3 text-xs">
            <p className="uppercase tracking-wider text-muted">{tAuth('signedInAs')}</p>
            <p className="mt-0.5 font-semibold text-foreground">{user.name || user.email}</p>
          </div>
          <form action={onSignOut}>
            <button
              type="submit"
              className="w-full rounded-xl bg-surface-muted px-3 py-2 text-xs font-semibold text-foreground hover:bg-[color:var(--brand-navy)] hover:text-white transition-colors"
            >
              {tAuth('signOut')}
            </button>
          </form>
        </div>
      </aside>

      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
