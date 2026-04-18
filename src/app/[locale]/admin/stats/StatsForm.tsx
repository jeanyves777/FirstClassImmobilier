'use client'

import { useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { updateSiteStats } from './actions'

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }
const initial: State = { ok: false }

const FIELDS = [
  { name: 'yearsExperience', label: 'Years of experience', eg: 'Shown on Accueil' },
  { name: 'satisfiedClients', label: 'Satisfied clients', eg: 'Accueil + Realisations' },
  { name: 'projectsCount', label: 'Projects', eg: 'Accueil + Realisations' },
  { name: 'landsSold', label: 'Lands sold', eg: 'Realisations' },
  { name: 'housesBuilt', label: 'Houses built', eg: 'Realisations' },
  { name: 'acdDelivered', label: 'ACDs delivered', eg: 'Realisations' },
] as const

export function StatsForm({
  locale,
  defaults,
}: {
  locale: string
  defaults: Record<(typeof FIELDS)[number]['name'], number>
}) {
  const [state, action, pending] = useActionState(updateSiteStats, initial)
  const { push } = useToast()

  useEffect(() => {
    if (state.ok && state.timestamp) {
      push({ title: 'Counters updated', description: 'Accueil and Realisations refreshed.', variant: 'success' })
    }
  }, [state, push])

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <section className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.name} className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              {f.label}
            </span>
            <input
              type="number"
              name={f.name}
              defaultValue={defaults[f.name]}
              min={0}
              className="w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40"
            />
            <span className="block text-[11px] text-muted">{f.eg}</span>
            {state.errors?.[f.name]?.length ? (
              <span className="block text-xs text-[color:var(--brand-red)]">{state.errors[f.name]![0]}</span>
            ) : null}
          </label>
        ))}
      </section>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          Save counters
        </Button>
      </div>
    </form>
  )
}
