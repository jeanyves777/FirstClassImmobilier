'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/rbac'
import { localizedTextSchema } from '@/lib/zod/localized'
import {
  findPlaceIdByText,
  getPlaceDetails,
  type GoogleReview,
} from '@/lib/google-places'

type State = { ok: boolean; errors?: Record<string, string[]>; timestamp?: number }

const schema = z.object({
  source: z
    .string()
    .optional()
    .transform((v) => (v === 'google' ? 'google' : 'direct')),
  authorName: z.string().min(2).max(120),
  authorRole: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  /** Uploaded Media URL from our upload flow (direct testimonials). */
  uploadedPhotoUrl: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  /** External avatar URL (Google reviewer photo). */
  externalPhotoUrl: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  rating: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return null
      const n = parseInt(v, 10)
      if (Number.isNaN(n) || n < 1 || n > 5) return null
      return n
    }),
  reviewDate: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  sourceUrl: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  programId: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  quote: z.string().transform((raw, ctx) => {
    try {
      const parsed = localizedTextSchema.parse(JSON.parse(raw))
      if (!parsed.fr.trim() && !parsed.en.trim()) {
        ctx.addIssue({ code: 'custom', message: 'Both languages empty' })
        return JSON.stringify({ fr: '', en: '' })
      }
      return JSON.stringify(parsed)
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid payload' })
      return raw
    }
  }),
  published: z
    .string()
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
  order: z.coerce.number().int().min(0).default(0),
})

async function attachPhoto(testimonialId: string, photoUrl: string | null) {
  if (!photoUrl) return
  const media = await prisma.media.create({ data: { kind: 'image', url: photoUrl } })
  await prisma.testimonial.update({
    where: { id: testimonialId },
    data: { photoId: media.id },
  })
}

export async function createTestimonial(_prev: State, fd: FormData): Promise<State> {
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  const parsed = schema.safeParse({
    source: String(fd.get('source') ?? 'direct'),
    authorName: String(fd.get('authorName') ?? '').trim(),
    authorRole: String(fd.get('authorRole') ?? ''),
    uploadedPhotoUrl: String(fd.get('uploadedPhotoUrl') ?? ''),
    externalPhotoUrl: String(fd.get('externalPhotoUrl') ?? ''),
    rating: String(fd.get('rating') ?? ''),
    reviewDate: String(fd.get('reviewDate') ?? ''),
    sourceUrl: String(fd.get('sourceUrl') ?? ''),
    programId: String(fd.get('programId') ?? ''),
    quote: String(fd.get('quote') ?? ''),
    published: String(fd.get('published') ?? ''),
    order: fd.get('order'),
  })
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }

  const d = parsed.data
  const created = await prisma.testimonial.create({
    data: {
      source: d.source,
      authorName: d.authorName,
      authorRole: d.authorRole,
      photoUrl: d.externalPhotoUrl,
      rating: d.source === 'google' ? d.rating : null,
      reviewDate: d.reviewDate ? new Date(d.reviewDate) : null,
      sourceUrl: d.sourceUrl,
      programId: d.programId,
      quote: d.quote,
      published: d.published,
      order: d.order,
    },
  })
  // Direct-source testimonials may have an uploaded avatar → store as Media.
  if (d.source === 'direct') {
    await attachPhoto(created.id, d.uploadedPhotoUrl)
  }

  revalidatePath(`/${locale}/admin/testimonials`)
  revalidatePath(`/${locale}`)
  revalidatePath(`/${locale}/nos-realisations`)
  return { ok: true, timestamp: Date.now() }
}

export async function togglePublished(fd: FormData): Promise<void> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return
  const current = await prisma.testimonial.findUnique({
    where: { id },
    select: { published: true },
  })
  if (!current) return
  await prisma.testimonial.update({
    where: { id },
    data: { published: !current.published },
  })
  revalidatePath(`/${locale}/admin/testimonials`)
  revalidatePath(`/${locale}`)
  revalidatePath(`/${locale}/nos-realisations`)
}

export async function deleteTestimonial(fd: FormData): Promise<void> {
  const id = String(fd.get('id') ?? '')
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)
  if (!id) return
  await prisma.testimonial.delete({ where: { id } })
  revalidatePath(`/${locale}/admin/testimonials`)
  revalidatePath(`/${locale}`)
  revalidatePath(`/${locale}/nos-realisations`)
}

// ─────────────────────────────────────────────────────────────────────────
// Google Places sync
// ─────────────────────────────────────────────────────────────────────────

export type SyncState = {
  ok: boolean
  error?: string
  inserted?: number
  placeName?: string
  placeId?: string
  timestamp?: number
}

/**
 * Pulls up to 5 reviews from Google Places API (New) and replaces every
 * `source='google'` row in the Testimonial table.
 *
 * Priority for identifying the place:
 *   1. `GOOGLE_PLACE_ID` env var (the ChIJ… identifier)
 *   2. A text search for `GOOGLE_PLACES_QUERY` (defaults to
 *      "FirstClass Immobilier Abidjan")
 */
export async function syncGoogleReviews(
  _prev: SyncState,
  fd: FormData,
): Promise<SyncState> {
  const locale = String(fd.get('locale') ?? 'fr')
  await requireStaff(locale)

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return {
      ok: false,
      error:
        'GOOGLE_PLACES_API_KEY is not set. Add it to .env (value: a key with the Places API (New) enabled) then retry.',
    }
  }

  try {
    const fromEnv = process.env.GOOGLE_PLACE_ID
    const query = process.env.GOOGLE_PLACES_QUERY || 'FirstClass Immobilier Abidjan'

    let placeId = fromEnv ?? null
    if (!placeId) {
      placeId = await findPlaceIdByText(query)
      if (!placeId) {
        return {
          ok: false,
          error: `No place found for query "${query}". Set GOOGLE_PLACE_ID or GOOGLE_PLACES_QUERY in .env.`,
        }
      }
    }

    const details = await getPlaceDetails(placeId)
    const reviews: GoogleReview[] = details.reviews ?? []

    // Replace all existing Google reviews — Google ToS requires re-sync
    // rather than long-term caching.
    await prisma.$transaction([
      prisma.testimonial.deleteMany({ where: { source: 'google' } }),
      ...reviews.map((r, i) =>
        prisma.testimonial.create({
          data: {
            source: 'google',
            authorName: r.authorAttribution?.displayName ?? 'Google user',
            authorRole: r.relativePublishTimeDescription ?? null,
            photoUrl: r.authorAttribution?.photoUri ?? null,
            rating: r.rating ?? null,
            reviewDate: r.publishTime ? new Date(r.publishTime) : null,
            sourceUrl: r.googleMapsUri ?? r.authorAttribution?.uri ?? null,
            // Google returns reviews in a single language; mirror into both fr/en
            // so the bilingual display layer picks it up either way.
            quote: JSON.stringify({
              fr: r.text?.text ?? r.originalText?.text ?? '',
              en: r.text?.text ?? r.originalText?.text ?? '',
            }),
            order: i,
            published: true,
          },
        }),
      ),
    ])

    revalidatePath(`/${locale}/admin/testimonials`)
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/nos-realisations`)

    return {
      ok: true,
      inserted: reviews.length,
      placeName: details.displayName?.text,
      placeId,
      timestamp: Date.now(),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    return { ok: false, error: `Sync failed: ${message}` }
  }
}
