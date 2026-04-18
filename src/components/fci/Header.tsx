'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map(({ href, key }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
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

        <div className="flex items-center gap-2">
          <LanguageToggle className="hidden sm:inline-flex" />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-surface text-foreground lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-[color:var(--border)] bg-background lg:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col px-4 py-3 sm:px-6" aria-label="Mobile">
            {NAV_ITEMS.map(({ href, key }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-base font-medium',
                    active
                      ? 'bg-[color:var(--brand-navy)] text-white'
                      : 'text-foreground hover:bg-surface-muted',
                  )}
                >
                  {t(key)}
                </Link>
              )
            })}
            <div className="mt-3 border-t border-[color:var(--border)] pt-3 sm:hidden">
              <LanguageToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
