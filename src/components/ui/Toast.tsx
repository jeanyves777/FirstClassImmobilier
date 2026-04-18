'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'success' | 'error' | 'info'

type Toast = {
  id: string
  title: string
  description?: string
  variant: Variant
  ttl: number
}

type ToastInput = { title: string; description?: string; variant?: Variant; ttl?: number }

type Ctx = {
  push: (t: ToastInput) => string
  dismiss: (id: string) => void
}

const ToastCtx = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const push = useCallback<Ctx['push']>((input) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const toast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? 'success',
      ttl: input.ttl ?? 3600,
    }
    setToasts((cur) => [...cur, toast])
    return id
  }, [])

  const ctx = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end sm:p-0"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

const VARIANTS: Record<Variant, { bar: string; icon: React.ReactNode }> = {
  success: {
    bar: 'bg-emerald-500',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m5 12 5 5L20 7" />
      </svg>
    ),
  },
  error: {
    bar: 'bg-[color:var(--brand-red)]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[color:var(--brand-red)]" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6M9 9l6 6" />
      </svg>
    ),
  },
  info: {
    bar: 'bg-[color:var(--brand-navy)]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[color:var(--brand-navy)] dark:text-foreground" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const h = setTimeout(() => onDismiss(toast.id), toast.ttl)
    return () => clearTimeout(h)
  }, [toast.id, toast.ttl, onDismiss])

  const v = VARIANTS[toast.variant]

  return (
    <motion.div
      role="status"
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-xl border border-[color:var(--border)] bg-surface shadow-[0_18px_50px_-24px_rgba(10,18,32,.45)]',
      )}
    >
      <div className={cn('w-1 shrink-0', v.bar)} />
      <div className="flex flex-1 items-start gap-3 px-4 py-3">
        <span className="mt-0.5 shrink-0" aria-hidden>
          {v.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-xs text-muted">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => onDismiss(toast.id)}
          className="ml-2 shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
