import { cn } from '@/lib/utils'

type LogoVariant = 'auto' | 'mono-white' | 'mono-navy'

/**
 * FirstClass Immobilier logo — the single shared source of truth.
 *
 * Always renders the official brand image (public/logo-firstclass.png, a
 * transparent PNG) so the logo is identical everywhere. On dark surfaces
 * (`variant="mono-white"` or `onDark`) it sits on a light plate so the
 * colored mark stays legible; it also adapts in dark theme.
 *
 * `size="lg"` renders it large (e.g. auth screens); `variant` / `showWordmark`
 * are accepted for backward compatibility.
 */
export function Logo({
  className,
  onDark = false,
  variant = 'auto',
  size = 'sm',
}: {
  className?: string
  onDark?: boolean
  variant?: LogoVariant
  showWordmark?: boolean
  size?: 'sm' | 'lg'
}) {
  const dark = onDark || variant === 'mono-white'
  const sizeCls = size === 'lg' ? 'h-20 w-auto sm:h-28' : 'h-10 w-auto sm:h-11'
  const plate = size === 'lg' ? 'rounded-xl bg-white p-3' : 'rounded-md bg-white p-1.5'
  return (
    <span className={cn('inline-flex items-center', className)} aria-label="FirstClass Immobilier">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-firstclass.png"
        alt="FirstClass Immobilier"
        width={1181}
        height={691}
        className={cn(
          sizeCls,
          dark ? plate : 'dark:rounded-md dark:bg-white dark:px-2 dark:py-1',
        )}
      />
    </span>
  )
}
