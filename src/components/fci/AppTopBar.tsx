'use client'

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

type User = { name?: string | null; email?: string | null; role?: string }

/**
 * Persistent top bar used by both /admin and /portal shells.
 * Desktop: spans above the content column; shows view-site link,
 *   language + theme toggles, and a user menu with sign-out.
 * Mobile: also exposes a menu button that relays to the sidebar
 *   via the `onToggleMenu` callback.
 */
export function AppTopBar({
  user,
  onToggleMenu,
  onSignOut,
  variant,
  viewSiteLabel,
}: {
  user: User
  onToggleMenu: () => void
  onSignOut: () => Promise<void>
  variant: 'admin' | 'portal'
  viewSiteLabel: string
}) {
  const tAuth = useTranslations('auth')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initial = (user.name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[color:var(--border)] bg-background/85 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <button
        type="button"
        onClick={onToggleMenu}
        aria-label="Toggle navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-surface text-foreground lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <span className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)] sm:inline">
        {variant === 'admin' ? 'FCI Admin' : 'FCI Portal'}
      </span>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/"
          className="hidden items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-[color:var(--brand-navy)] hover:text-white md:inline-flex"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M14 3h7v7M10 14 21 3M21 14v7h-7M10 10 3 3M3 10v-7h7" />
          </svg>
          {viewSiteLabel}
        </Link>

        <LanguageToggle />
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className={cn(
              'flex h-9 items-center gap-2 rounded-full border border-[color:var(--border)] bg-surface px-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted pr-3',
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-[11px] font-semibold text-white">
              {initial}
            </span>
            <span className="hidden max-w-[120px] truncate sm:inline">{user.name ?? user.email}</span>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-[color:var(--border)] bg-surface shadow-[0_24px_60px_-24px_rgba(10,18,32,.45)]"
              >
                <div className="border-b border-[color:var(--border)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {tAuth('signedInAs')}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {user.name ?? user.email}
                  </p>
                  {user.role && (
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--brand-red)]">
                      {user.role}
                    </p>
                  )}
                </div>
                <div className="p-1">
                  <Link
                    href={variant === 'admin' ? '/admin/settings' : '/portal/settings'}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.1-1.2l-.4-2.4h-4l-.4 2.4a7 7 0 0 0-2.1 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12" />
                    </svg>
                    {variant === 'admin' ? 'Admin settings' : 'Account settings'}
                  </Link>
                  <Link
                    href="/"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-muted md:hidden"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M14 3h7v7M10 14 21 3M21 14v7h-7M10 10 3 3M3 10v-7h7" />
                    </svg>
                    {viewSiteLabel}
                  </Link>
                </div>
                <form action={onSignOut} className="border-t border-[color:var(--border)] p-1">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[color:var(--brand-red)] hover:bg-[color:var(--brand-red)]/10"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    {tAuth('signOut')}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
