/**
 * FirstClass Immobilier site configuration.
 *
 * `site` (the sync export) holds the env-defined defaults used by client
 * components that can't hit Prisma. Server components should prefer
 * `getSiteConfig()` which merges env defaults with the editable
 * `SiteSettings` singleton so admin edits take effect live.
 */

type Social = {
  facebook: string
  instagram: string
  linkedin: string
  youtube: string
  tiktok: string
}

export type SiteConfig = {
  name: string
  shortName: string
  slogan: { fr: string; en: string }
  brandTagline: { fr: string; en: string }
  heroStatement: { fr: string; en: string }
  address: string
  hours: { fr: string; en: string }
  phone: string
  mobile: string
  whatsapp: string
  email: string
  siteUrl: string
  social: Social
  countries: readonly string[]
  footerCopy?: { fr: string; en: string } | null
}

const DEFAULTS = {
  name: 'FirstClass Immobilier',
  shortName: 'FCI',
  slogan: { fr: 'Une Nouvelle Vie Commence !', en: 'A New Life Begins!' },
  brandTagline: {
    fr: 'Promoteur Immobilier Agréé — Leader dans ses secteurs d\u2019Activité.',
    en: 'Licensed Real Estate Developer — Leader in its sectors.',
  },
  heroStatement: {
    fr: 'Avec nous, soyez-en sûr, l\u2019Immobilier se fait et se vit autrement.',
    en: 'With us, rest assured, real estate is done and lived differently.',
  },
  address: process.env.NEXT_PUBLIC_ADDRESS ?? 'Abidjan, Cocody Angré 7ème Tranche',
  hours: {
    fr: 'Lundi au Vendredi 08h00–17h00 · Samedi 09h00–12h30',
    en: 'Monday–Friday 8:00 AM – 5:00 PM · Saturday 9:00 AM – 12:30 PM',
  },
  phone: process.env.NEXT_PUBLIC_PHONE ?? '+225 25 22 00 11 03',
  mobile: process.env.NEXT_PUBLIC_MOBILE ?? '+225 07 69 00 45 57',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '2250584212929',
  email: process.env.NEXT_PUBLIC_EMAIL ?? 'info@firstclassimmo.com',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || '',
  },
  countries: ['CI', 'USA'] as const,
  footerCopy: null as { fr: string; en: string } | null,
} satisfies SiteConfig

/** Env-only snapshot. Safe to import from Client Components. */
export const site: SiteConfig = DEFAULTS

export const whatsappLink = (message?: string, number?: string) => {
  const n = (number ?? site.whatsapp).replace(/\D/g, '')
  const base = `https://wa.me/${n}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/**
 * Server-only: merge env defaults with the editable SiteSettings row.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  // Dynamically import to keep this file client-safe.
  const { prisma } = await import('@/lib/db')
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } })
  if (!row) return DEFAULTS

  const merged: SiteConfig = {
    ...DEFAULTS,
    phone: row.phone || DEFAULTS.phone,
    mobile: row.mobile || DEFAULTS.mobile,
    whatsapp: row.whatsapp || DEFAULTS.whatsapp,
    email: row.email || DEFAULTS.email,
    address: row.address || DEFAULTS.address,
    hours: {
      fr: row.hoursFr || DEFAULTS.hours.fr,
      en: row.hoursEn || DEFAULTS.hours.en,
    },
    social: {
      facebook: row.facebookUrl || DEFAULTS.social.facebook,
      instagram: row.instagramUrl || DEFAULTS.social.instagram,
      linkedin: row.linkedinUrl || DEFAULTS.social.linkedin,
      youtube: row.youtubeUrl || DEFAULTS.social.youtube,
      tiktok: row.tiktokUrl || DEFAULTS.social.tiktok,
    },
    footerCopy: row.footerCopy
      ? (() => {
          try {
            return JSON.parse(row.footerCopy) as { fr: string; en: string }
          } catch {
            return null
          }
        })()
      : null,
  }
  return merged
}
