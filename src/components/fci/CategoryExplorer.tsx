'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'

export type CategoryProgram = {
  slug: string
  name: string
  status: 'ON_SALE' | 'SOLD_OUT' | 'DELIVERED' | 'COMING_SOON' | 'PAUSED'
  availableLots: number
  totalLots: number
}

export type CategoryZoneGroup = {
  zone: string
  programs: CategoryProgram[]
}

export type CategoryExplorerItem = {
  slug: 'TERRAIN' | 'MAISON' | 'LOTISSEMENT'
  label: string
  body: string
  bullets: string[]
  count: number
  countLabel: string
  availableLots: number
  availableLabel: string
  /** Zone-grouped program listing — shown when the user expands the card. */
  zones: CategoryZoneGroup[]
  emptyZonesLabel: string
  icon: React.ReactNode
}

/**
 * Three category cards (Terrains / Maisons / Lotissements) per the client
 * brief. Each card stays presentational by default and expands inline to a
 * zone-grouped program listing when clicked. One card open at a time so the
 * grid layout doesn't shuffle.
 */
export function CategoryExplorer({
  items,
  expandLabel,
  collapseLabel,
  statusLabels,
  zonesLabel,
}: {
  items: CategoryExplorerItem[]
  expandLabel: string
  collapseLabel: string
  statusLabels: Record<CategoryProgram['status'], string>
  zonesLabel: string
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((it) => {
        const open = openSlug === it.slug
        return (
          <article
            key={it.slug}
            className={`group flex h-full flex-col rounded-2xl border bg-surface p-6 transition-all duration-300 ${
              open
                ? 'border-[color:var(--brand-red)] shadow-[0_28px_70px_-28px_rgba(200,16,46,.35)]'
                : 'border-[color:var(--border)] hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]'
            }`}
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
              {it.icon}
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">{it.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
            <ul className="mt-4 space-y-1.5">
              {it.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand-red)]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-5 border-t border-[color:var(--border)] pt-4 text-xs text-muted">
              <span>
                <span className="font-semibold text-foreground">{it.count}</span> {it.countLabel}
              </span>
              {it.availableLots > 0 && (
                <span>
                  <span className="font-semibold text-[color:var(--brand-red)]">
                    {it.availableLots}
                  </span>{' '}
                  {it.availableLabel}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpenSlug(open ? null : it.slug)}
              aria-expanded={open}
              aria-controls={`category-panel-${it.slug}`}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--brand-red)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_8px_20px_-8px_rgba(200,16,46,.6)] transition-colors hover:bg-[color:var(--brand-red-600)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-red)] focus:ring-offset-2 focus:ring-offset-background"
            >
              {open ? collapseLabel : expandLabel}
              <svg
                viewBox="0 0 24 24"
                className={`h-3 w-3 transition-transform duration-300 ${
                  open ? 'rotate-180' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={`category-panel-${it.slug}`}
                  role="region"
                  aria-label={it.label}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-surface-muted p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {zonesLabel}
                    </p>
                    {it.zones.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">{it.emptyZonesLabel}</p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {it.zones.map((zg) => (
                          <li key={zg.zone}>
                            <p className="font-semibold text-foreground">{zg.zone}</p>
                            <ul className="mt-1 space-y-1">
                              {zg.programs.map((p) => (
                                <li key={p.slug}>
                                  <Link
                                    href={`/a-la-une/${p.slug}`}
                                    className="group/row flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm text-foreground hover:bg-surface"
                                  >
                                    <span className="truncate">
                                      <span className="font-medium">{p.name}</span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted">
                                      <span className="rounded-full border border-[color:var(--border)] bg-surface px-2 py-0.5">
                                        {statusLabels[p.status]}
                                      </span>
                                      {p.totalLots > 0 && (
                                        <span>
                                          <span className="font-semibold text-foreground">
                                            {p.availableLots}
                                          </span>
                                          /{p.totalLots}
                                        </span>
                                      )}
                                      <span
                                        aria-hidden
                                        className="opacity-0 transition-opacity group-hover/row:opacity-100"
                                      >
                                        →
                                      </span>
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </article>
        )
      })}
    </div>
  )
}
