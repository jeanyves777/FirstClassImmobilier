'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { AvailabilityWindow } from '@/lib/schedule/availability'

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

export function AvailabilityEditor({
  name,
  defaultValue,
}: {
  name: string
  defaultValue?: AvailabilityWindow[]
}) {
  const [rows, setRows] = useState<AvailabilityWindow[]>(
    defaultValue && defaultValue.length > 0
      ? defaultValue
      : [{ day: 1, start: '09:00', end: '12:00' }],
  )

  const update = (i: number, patch: Partial<AvailabilityWindow>) => {
    setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  const remove = (i: number) => {
    setRows((cur) => cur.filter((_, idx) => idx !== i))
  }
  const add = () => {
    setRows((cur) => [...cur, { day: 1, start: '09:00', end: '12:00' }])
  }

  const serialized = JSON.stringify(rows)

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serialized} />
      {rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted p-4 text-xs text-muted">
          No availability defined — buyers will only see a free-form datetime picker.
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li
            key={i}
            className="grid grid-cols-[auto_auto_auto_auto] items-center gap-2 rounded-xl border border-[color:var(--border)] bg-background px-3 py-2"
          >
            <select
              value={row.day}
              onChange={(e) => update(i, { day: Number(e.target.value) })}
              className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <input
              type="time"
              value={row.start}
              onChange={(e) => update(i, { start: e.target.value })}
              className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
            />
            <input
              type="time"
              value={row.end}
              onChange={(e) => update(i, { end: e.target.value })}
              className="rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-full p-1.5 text-muted hover:bg-[color:var(--brand-red)]/10 hover:text-[color:var(--brand-red)]"
              aria-label="Remove window"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" size="sm" onClick={add}>
        + Add window
      </Button>
    </div>
  )
}
