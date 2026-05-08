import Image from 'next/image'
import { Link } from '@/i18n/navigation'

export type FeatureWindow = {
  /** Stable id for keys. */
  slug: string
  /** Cover image (logo/banner) above the card. */
  image: { src: string; alt: string }
  /** Optional small chip ("Programme phare", "Terrains", etc). */
  eyebrow?: string
  title: string
  /** 1-2 sentence pitch shown on the card. */
  body: string
  /** Optional metric chips (e.g. "57 villas", "Bassam"). */
  chips?: string[]
  primaryCta: { label: string; href: string }
  /** Optional secondary CTA (e.g. download catalogue). Renders as outline. */
  secondaryCta?: { label: string; href: string; external?: boolean }
  /**
   * Optional sub-nav rendered inline below the body — e.g. zone shortcuts on
   * the Terrains tile (Abidjan · Grand-Abidjan · Intérieur · Extérieur).
   */
  subLinks?: { label: string; href: string }[]
  subLinksLabel?: string
}

/**
 * Three "fenêtres" featured at the top of /a-la-une per the client brief —
 * Aerocity Beach · Labella Residence · Offre de Terrains. Server-rendered
 * (deep-links to existing detail pages); no client state needed.
 */
export function FeatureWindows({
  windows,
  sectionTitle,
  sectionEyebrow,
}: {
  windows: FeatureWindow[]
  sectionTitle: string
  sectionEyebrow: string
}) {
  return (
    <section className="mb-12">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
          {sectionEyebrow}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {sectionTitle}
        </h2>
      </header>
      <div className="grid gap-5 md:grid-cols-3">
        {windows.map((w) => (
          <article
            key={w.slug}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]">
              <Image
                src={w.image.src}
                alt={w.image.alt}
                fill
                sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {w.eyebrow && (
                <span className="absolute left-3 top-3 rounded-full bg-[color:var(--brand-red)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                  {w.eyebrow}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
                {w.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{w.body}</p>
              {w.chips && w.chips.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {w.chips.map((c) => (
                    <li
                      key={c}
                      className="rounded-full border border-[color:var(--border)] bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-muted"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              {w.subLinks && w.subLinks.length > 0 && (
                <div className="mt-3">
                  {w.subLinksLabel && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {w.subLinksLabel}
                    </p>
                  )}
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {w.subLinks.map((sl) => (
                      <li key={sl.href}>
                        <Link
                          href={sl.href}
                          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--brand-navy)]/15 bg-[color:var(--brand-navy)]/5 px-2.5 py-1 text-[11px] font-medium text-[color:var(--brand-navy)] transition-colors hover:bg-[color:var(--brand-navy)] hover:text-white dark:border-white/15 dark:bg-white/5 dark:text-foreground"
                        >
                          {sl.label}
                          <span aria-hidden>→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Link
                  href={w.primaryCta.href}
                  className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-red)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_8px_20px_-8px_rgba(200,16,46,.6)] transition-colors hover:bg-[color:var(--brand-red-600)]"
                >
                  {w.primaryCta.label}
                  <span aria-hidden>→</span>
                </Link>
                {w.secondaryCta &&
                  (w.secondaryCta.external ? (
                    <a
                      href={w.secondaryCta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-surface-muted"
                    >
                      {w.secondaryCta.label}
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M14 3h7v7M10 14 21 3M21 14v7h-7M10 10 3 3M3 10v-7h7" />
                      </svg>
                    </a>
                  ) : (
                    <Link
                      href={w.secondaryCta.href}
                      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-surface-muted"
                    >
                      {w.secondaryCta.label}
                    </Link>
                  ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
