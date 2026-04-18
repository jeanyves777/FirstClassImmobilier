'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[color:var(--brand-navy)] text-white hover:bg-[color:var(--brand-navy-700)] focus-visible:outline-[color:var(--brand-navy)]',
  accent:
    'bg-[color:var(--brand-red)] text-white shadow-[0_10px_30px_-10px_rgba(200,16,46,.55)] hover:bg-[color:var(--brand-red-600)] focus-visible:outline-[color:var(--brand-red)]',
  secondary:
    'border border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted focus-visible:outline-[color:var(--brand-navy)]',
  ghost:
    'text-foreground hover:bg-surface-muted focus-visible:outline-[color:var(--brand-navy)]',
  danger:
    'border border-[color:var(--brand-red)]/60 bg-white text-[color:var(--brand-red)] hover:bg-[color:var(--brand-red)] hover:text-white dark:bg-transparent focus-visible:outline-[color:var(--brand-red)]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading
  return (
    <motion.button
      ref={ref}
      {...props}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      whileHover={isDisabled ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 480, damping: 28, mass: 0.6 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        isDisabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  )
})

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
