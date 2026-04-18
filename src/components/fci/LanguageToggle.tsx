'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { useTransition } from 'react'
import { motion } from 'framer-motion'
import { locales, type Locale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

export function LanguageToggle({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [isPending, startTransition] = useTransition()

  const current = (params.locale as Locale) ?? 'fr'

  const switchTo = (next: Locale) => {
    if (next === current) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'relative inline-flex items-center rounded-full border border-[color:var(--border)] bg-surface p-0.5 text-[11px] font-semibold',
        isPending && 'opacity-70',
        className,
      )}
    >
      {locales.map((loc) => {
        const active = current === loc
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-pressed={active}
            className={cn(
              'relative z-10 rounded-full px-2 py-1 uppercase tracking-wider transition-colors',
              active ? 'text-white' : 'text-muted hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="language-indicator"
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className="absolute inset-0 -z-10 rounded-full bg-[color:var(--brand-navy)] shadow-sm"
                aria-hidden
              />
            )}
            {loc}
          </button>
        )
      })}
    </div>
  )
}
