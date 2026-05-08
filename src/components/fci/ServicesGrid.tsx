'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type ServiceItem = {
  /** Stable id used for the open/closed state and React keys. */
  slug: string
  /** Tile cover image (typically a branded marketing poster). */
  image: { src: string; alt: string }
  title: string
  lede: string
  body: string
  bullets: string[]
}

/**
 * Six-tile services grid for the "Nous Découvrir" page.
 *
 * Per the client brief: each service shows its photo, click expands an
 * accordion panel with the full description + bullets. Only one tile is
 * expanded at a time on small screens; on desktop the panel sits beneath
 * its tile so multiple can be open simultaneously without layout collapse.
 */
export function ServicesGrid({
  items,
  expandLabel,
  collapseLabel,
}: {
  items: ServiceItem[]
  expandLabel: string
  collapseLabel: string
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => {
        const open = openSlug === it.slug
        return (
          <li key={it.slug} className="flex flex-col">
            <button
              type="button"
              onClick={() => setOpenSlug(open ? null : it.slug)}
              aria-expanded={open}
              aria-controls={`service-panel-${it.slug}`}
              className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-muted text-left transition-transform duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-30px_rgba(15,23,42,.35)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-red)] focus:ring-offset-2 focus:ring-offset-background"
            >
              <Image
                src={it.image.src}
                alt={it.image.alt}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent"
              />
              <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] drop-shadow">
                  {it.title}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-red)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-[0_8px_20px_-8px_rgba(200,16,46,.6)]">
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
                </span>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={`service-panel-${it.slug}`}
                  role="region"
                  aria-label={it.title}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-2xl border border-[color:var(--border)] bg-surface p-5">
                    <p className="font-display text-base font-semibold text-[color:var(--brand-red)]">
                      {it.lede}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{it.body}</p>
                    <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted">
                      {it.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2">
                          <span
                            aria-hidden
                            className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-[color:var(--brand-red)]"
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}
