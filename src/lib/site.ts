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

export type LegalInfo = {
  companyName: string
  form: string
  capital: string
  rccm: string
  taxId: string
  director: string
  hostName: string
  hostAddress: string
}

/**
 * A country office (CI = primary, USA = secondary). The USA office is
 * scaffolded with nullable fields so the home-page country popover can
 * render placeholders until the client provides the address/contacts.
 */
export type CountryOffice = {
  code: 'CI' | 'USA'
  flag: string
  nameFr: string
  nameEn: string
  address: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
}

/** Year FCI was incorporated — used to compute "années d'expérience" live. */
export const FOUNDING_YEAR = 2018

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
  countries: readonly CountryOffice[]
  footerCopy?: { fr: string; en: string } | null
  legal: LegalInfo
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
  address:
    process.env.NEXT_PUBLIC_ADDRESS ??
    'Abidjan, Cocody Angré 7ème Tranche, Lot 2768, Îlot 231, BP 11345 Abidjan 01',
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
  countries: [
    {
      code: 'CI',
      flag: '🇨🇮',
      nameFr: 'Côte d’Ivoire',
      nameEn: 'Ivory Coast',
      address: 'Abidjan, Cocody Angré 7ème Tranche, Lot 2768, Îlot 231, BP 11345 Abidjan 01',
      phone: '+225 25 22 00 11 03',
      whatsapp: '2250584212929',
      email: 'info@firstclassimmo.com',
    },
    {
      code: 'USA',
      flag: '🇺🇸',
      nameFr: 'États-Unis',
      nameEn: 'United States',
      address: null,
      phone: null,
      whatsapp: null,
      email: null,
    },
  ] as const,
  footerCopy: null as { fr: string; en: string } | null,
  legal: {
    companyName: 'FirstClass Immobilier',
    form: '',
    capital: '',
    rccm: '',
    taxId: '',
    director: '',
    hostName: '',
    hostAddress: '',
  } as LegalInfo,
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

  const mergedAddress = row.address || DEFAULTS.address
  const mergedPhone = row.phone || DEFAULTS.phone
  const mergedWhatsapp = row.whatsapp || DEFAULTS.whatsapp
  const mergedEmail = row.email || DEFAULTS.email

  const merged: SiteConfig = {
    ...DEFAULTS,
    phone: mergedPhone,
    mobile: row.mobile || DEFAULTS.mobile,
    whatsapp: mergedWhatsapp,
    email: mergedEmail,
    address: mergedAddress,
    // Mirror admin-edited primary contact info into the CI country card so the
    // home-page country popover stays in sync with admin edits.
    countries: DEFAULTS.countries.map((c) =>
      c.code === 'CI'
        ? { ...c, address: mergedAddress, phone: mergedPhone, whatsapp: mergedWhatsapp, email: mergedEmail }
        : c,
    ),
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
    legal: {
      companyName: row.legalCompanyName || DEFAULTS.legal.companyName,
      form: row.legalForm || DEFAULTS.legal.form,
      capital: row.legalCapital || DEFAULTS.legal.capital,
      rccm: row.legalRCCM || DEFAULTS.legal.rccm,
      taxId: row.legalTaxId || DEFAULTS.legal.taxId,
      director: row.legalDirector || DEFAULTS.legal.director,
      hostName: row.legalHostName || DEFAULTS.legal.hostName,
      hostAddress: row.legalHostAddress || DEFAULTS.legal.hostAddress,
    },
  }
  return merged
}
