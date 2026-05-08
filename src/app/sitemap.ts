import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { site } from '@/lib/site'
import { routing } from '@/i18n/routing'

/**
 * Dynamic sitemap covering every public URL across both locales.
 *
 * - Static public routes (home, 7 onglets, 4 legal pages) emitted for /fr and /en.
 * - Every Program emitted at /fr/a-la-une/[slug] + /en/a-la-une/[slug].
 * - Every Lot emitted at .../lots/[reference] for both locales.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.siteUrl.replace(/\/$/, '')
  const now = new Date()

  const staticPaths = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/a-la-une', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/nous-decouvrir', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/nos-realisations', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/nos-activites', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/nos-equipes', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/contacts', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/legal/mentions-legales', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/legal/politique-confidentialite', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/legal/cgu', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/legal/cookies', priority: 0.3, changeFrequency: 'yearly' as const },
  ] as const

  const entries: MetadataRoute.Sitemap = []

  for (const { path, priority, changeFrequency } of staticPaths) {
    entries.push({
      url: `${base}/${routing.defaultLocale}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${base}/${l}${path}`]),
        ),
      },
    })
  }

  // Dynamic: programs + lots (public, non-draft only)
  const programs = await prisma.program.findMany({
    where: { status: { in: ['ON_SALE', 'SOLD_OUT', 'DELIVERED'] } },
    select: { slug: true, updatedAt: true },
  })
  const lots = await prisma.lot.findMany({
    where: { program: { status: { in: ['ON_SALE', 'SOLD_OUT', 'DELIVERED'] } } },
    select: { reference: true, updatedAt: true, program: { select: { slug: true } } },
  })

  for (const p of programs) {
    entries.push({
      url: `${base}/${routing.defaultLocale}/a-la-une/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.85,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${base}/${l}/a-la-une/${p.slug}`]),
        ),
      },
    })
  }

  for (const lot of lots) {
    entries.push({
      url: `${base}/${routing.defaultLocale}/a-la-une/${lot.program.slug}/lots/${lot.reference}`,
      lastModified: lot.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [
            l,
            `${base}/${l}/a-la-une/${lot.program.slug}/lots/${lot.reference}`,
          ]),
        ),
      },
    })
  }

  return entries
}
