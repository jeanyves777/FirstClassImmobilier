'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { useTransition } from 'react'
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
        'inline-flex items-center rounded-full border border-[color:var(--border)] bg-surface p-1 text-xs font-medium',
        isPending && 'opacity-70',
        className,
      )}
    >
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          aria-pressed={current === loc}
          className={cn(
            'rounded-full px-3 py-1 uppercase tracking-wider transition-colors',
            current === loc
              ? 'bg-[color:var(--brand-navy)] text-white shadow-sm'
              : 'text-muted hover:text-foreground',
          )}
        >
          {loc}
        </button>
      ))}
    </div>
  )
}
