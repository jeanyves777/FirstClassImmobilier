'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, usePathname } from '@/i18n/navigation'
import { Logo } from './Logo'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', key: 'home' },
  { href: '/nous-decouvrir', key: 'about' },
  { href: '/nos-realisations', key: 'realisations' },
  { href: '/a-la-une', key: 'featured' },
  { href: '/nos-activites', key: 'activities' },
  { href: '/nos-equipes', key: 'team' },
  { href: '/contacts', key: 'contact' },
] as const

export function Header() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="FirstClass Immobilier">
          <Logo />
        </Link>

        {/* Full horizontal nav — only when we have real room (xl = 1280px) */}
        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {NAV_ITEMS.map(({ href, key }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-[color:var(--brand-navy)] text-white'
                    : 'text-foreground/80 hover:bg-surface-muted hover:text-foreground',
                )}
              >
                {t(key)}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Portal CTA — icon always, label only at lg+ where there's real room. */}
          <Link
            href="/portal"
            aria-label={t('portalCta')}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[color:var(--border)] bg-surface px-2.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-[color:var(--brand-navy)] hover:text-white sm:px-3"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            <span className="hidden whitespace-nowrap lg:inline">{t('portalCta')}</span>
          </Link>

          <LanguageToggle className="hidden sm:inline-flex" />
          <ThemeToggle />

          {/* Hamburger — visible under xl so the drawer carries the nav */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-surface text-foreground xl:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28, mass: 0.7 }}
            className="overflow-hidden border-t border-[color:var(--border)] bg-background xl:hidden"
          >
            <motion.nav
              initial={{ y: -8 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto flex w-full max-w-7xl flex-col px-3 py-3 sm:px-6 lg:px-8"
              aria-label="Mobile"
            >
              {NAV_ITEMS.map(({ href, key }, i) => {
                const active = pathname === href
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.24 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'block rounded-lg px-3 py-2.5 text-base font-medium',
                        active
                          ? 'bg-[color:var(--brand-navy)] text-white'
                          : 'text-foreground hover:bg-surface-muted',
                      )}
                    >
                      {t(key)}
                    </Link>
                  </motion.div>
                )
              })}
              <div className="mt-3 border-t border-[color:var(--border)] pt-3 sm:hidden">
                <LanguageToggle />
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
