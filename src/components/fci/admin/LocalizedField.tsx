'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type LocalizedValue = { fr: string; en: string }

export function LocalizedField({
  name,
  label,
  defaultValue,
  required,
  rows,
  errors,
  hint,
}: {
  name: string
  label: string
  defaultValue?: LocalizedValue | null
  required?: boolean
  rows?: number
  errors?: string[]
  hint?: string
}) {
  const [tab, setTab] = useState<'fr' | 'en'>('fr')
  const [fr, setFr] = useState(defaultValue?.fr ?? '')
  const [en, setEn] = useState(defaultValue?.en ?? '')
  const json = JSON.stringify({ fr, en })

  const baseField =
    'w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium uppercase tracking-wider text-muted">
          {label} {required && <span className="text-[color:var(--brand-red)]">*</span>}
        </label>
        <div role="tablist" className="inline-flex rounded-full border border-[color:var(--border)] bg-surface p-0.5 text-[10px] font-semibold uppercase tracking-wider">
          {(['fr', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={tab === l}
              onClick={() => setTab(l)}
              className={cn(
                'rounded-full px-2.5 py-1 transition-colors',
                tab === l ? 'bg-[color:var(--brand-navy)] text-white' : 'text-muted hover:text-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {rows ? (
        <textarea
          key={tab}
          value={tab === 'fr' ? fr : en}
          onChange={(e) => (tab === 'fr' ? setFr(e.target.value) : setEn(e.target.value))}
          rows={rows}
          required={required}
          className={cn(baseField, 'resize-y')}
        />
      ) : (
        <input
          key={tab}
          type="text"
          value={tab === 'fr' ? fr : en}
          onChange={(e) => (tab === 'fr' ? setFr(e.target.value) : setEn(e.target.value))}
          required={required}
          className={baseField}
        />
      )}

      <input type="hidden" name={name} value={json} />
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
      {errors?.length ? (
        <p className="text-xs text-[color:var(--brand-red)]">{errors[0]}</p>
      ) : null}
    </div>
  )
}
