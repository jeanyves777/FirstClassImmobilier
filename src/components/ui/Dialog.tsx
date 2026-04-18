'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export function Dialog({
  open,
  onOpenChange,
  children,
  labelledBy,
  size = 'md',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  labelledBy?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)

    // Focus the first focusable child after mount animation
    const t = setTimeout(() => {
      const first = contentRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      first?.focus()
    }, 40)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open, onOpenChange])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
          <motion.div
            role="presentation"
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-[color:var(--brand-ink)]/60 backdrop-blur-sm"
          />
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.7 }}
            className={cn(
              'relative w-full rounded-2xl border border-[color:var(--border)] bg-surface p-6 shadow-[0_30px_80px_-20px_rgba(10,18,32,.6)]',
              size === 'sm' && 'max-w-sm',
              size === 'md' && 'max-w-md',
              size === 'lg' && 'max-w-lg',
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function DialogHeader({
  title,
  description,
  id,
}: {
  title: string
  description?: string
  id?: string
}) {
  return (
    <header className="space-y-1.5">
      <h2 id={id} className="font-display text-xl font-semibold text-foreground">
        {title}
      </h2>
      {description && <p className="text-sm text-muted">{description}</p>}
    </header>
  )
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <footer className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</footer>
}

export function useDialogId() {
  return useId()
}
