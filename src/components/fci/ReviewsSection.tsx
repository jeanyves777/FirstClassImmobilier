import Image from 'next/image'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { GoogleG } from './GoogleG'

type ReviewCardData = {
  id: string
  source: string
  authorName: string
  authorRole: string | null
  rating: number | null
  quote: string
  reviewDate: Date | null
  sourceUrl: string | null
  uploadedPhotoUrl: string | null
  externalPhotoUrl: string | null
}

/**
 * Server component that fetches the top published testimonials and renders
 * them with Google-branded styling when `source === 'google'`.
 *
 * Best-5 sort: Google reviews ranked by rating desc → reviewDate desc,
 * direct testimonials weighted after. `order` field breaks ties.
 */
export async function ReviewsSection({
  locale,
  eyebrow,
  title,
  subtitle,
  limit = 5,
  className,
}: {
  locale: Locale
  eyebrow: string
  title: string
  subtitle?: string
  limit?: number
  className?: string
}) {
  const raw = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
  if (raw.length === 0) return null

  // Resolve uploaded photos (direct testimonials).
  const photoIds = raw.map((r) => r.photoId).filter((v): v is string => !!v)
  const photos = photoIds.length
    ? await prisma.media.findMany({
        where: { id: { in: photoIds } },
        select: { id: true, url: true },
      })
    : []
  const byId = new Map(photos.map((p) => [p.id, p.url]))

  // Sort: ratings desc (only Google has them), then by review date, then order.
  const sorted = raw
    .map<ReviewCardData>((r) => ({
      id: r.id,
      source: r.source,
      authorName: r.authorName,
      authorRole: r.authorRole,
      rating: r.rating,
      quote: r.quote,
      reviewDate: r.reviewDate,
      sourceUrl: r.sourceUrl,
      uploadedPhotoUrl: r.photoId ? (byId.get(r.photoId) ?? null) : null,
      externalPhotoUrl: r.photoUrl,
    }))
    .sort((a, b) => {
      const ar = a.rating ?? 0
      const br = b.rating ?? 0
      if (br !== ar) return br - ar
      const at = a.reviewDate?.getTime() ?? 0
      const bt = b.reviewDate?.getTime() ?? 0
      return bt - at
    })
    .slice(0, limit)

  const googleCount = raw.filter((r) => r.source === 'google' && r.rating).length
  const avgRating =
    googleCount > 0
      ? (
          raw
            .filter((r) => r.source === 'google' && r.rating)
            .reduce((acc, r) => acc + (r.rating ?? 0), 0) / googleCount
        ).toFixed(1)
      : null

  return (
    <section className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className ?? ''}`}>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
            {eyebrow}
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-sm text-muted sm:text-base">{subtitle}</p>
          )}
        </div>
        {avgRating && (
          <div className="inline-flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-surface px-4 py-2.5 shadow-sm">
            <GoogleG className="h-5 w-5" />
            <div>
              <p className="font-display text-xl font-semibold leading-none text-foreground">
                {avgRating}
                <span className="ml-1 text-sm font-normal text-muted">/ 5</span>
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted">
                <StarRow value={Number(avgRating)} size={11} />
                <span className="ml-1">
                  {googleCount} {locale === 'fr' ? 'avis' : 'reviews'}
                </span>
              </p>
            </div>
          </div>
        )}
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((r) => (
          <ReviewCard key={r.id} review={r} locale={locale} />
        ))}
      </div>
    </section>
  )
}

function ReviewCard({ review: r, locale }: { review: ReviewCardData; locale: Locale }) {
  const isGoogle = r.source === 'google'
  const quote = tr(r.quote, locale)
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]">
      {/* Source badge */}
      <div className="mb-4 flex items-center justify-between gap-3">
        {isGoogle ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-[11px] font-semibold text-foreground">
            <GoogleG className="h-3.5 w-3.5" />
            Google
          </span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[color:var(--brand-red)]" fill="currentColor" aria-hidden>
            <path d="M7 11a4 4 0 1 1 0 8 8 8 0 0 1 8-8V6a12 12 0 0 0-12 12 6 6 0 0 0 12 0 6 6 0 0 0-8-5.66V11zM24 11a4 4 0 1 1 0 8 8 8 0 0 1 8-8V6a12 12 0 0 0-12 12 6 6 0 0 0 12 0 6 6 0 0 0-8-5.66V11z" />
          </svg>
        )}
        {r.rating && <StarRow value={r.rating} size={16} />}
      </div>

      <p className="flex-1 text-sm leading-relaxed text-foreground sm:text-[15px]">
        « {quote} »
      </p>

      <div className="mt-5 flex items-center gap-3 border-t border-[color:var(--border)] pt-4">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[color:var(--border)] bg-surface-muted">
          {r.uploadedPhotoUrl ? (
            <Image src={r.uploadedPhotoUrl} alt={r.authorName} fill sizes="44px" className="object-cover" />
          ) : r.externalPhotoUrl ? (
            // External avatar (Google) — plain img avoids whitelisting every CDN host.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.externalPhotoUrl}
              alt={r.authorName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-sm font-semibold text-muted">
              {r.authorName.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{r.authorName}</p>
          {r.authorRole && (
            <p className="truncate text-[11px] uppercase tracking-wider text-muted">
              {r.authorRole}
            </p>
          )}
        </div>
        {r.sourceUrl && (
          <a
            href={r.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={locale === 'fr' ? 'Voir sur Google' : 'View on Google'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14 3h7v7" />
              <path d="M21 3 10 14" />
              <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
          </a>
        )}
      </div>
    </article>
  )
}

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = i < full ? 'full' : i === full && half ? 'half' : 'empty'
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            style={{ width: size, height: size }}
            aria-hidden
          >
            <defs>
              <linearGradient id={`star-half-${i}`}>
                <stop offset="50%" stopColor="#FBBC04" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <polygon
              points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"
              fill={fill === 'full' ? '#FBBC04' : fill === 'half' ? `url(#star-half-${i})` : 'transparent'}
              stroke="#FBBC04"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
    </span>
  )
}
