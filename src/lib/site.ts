/**
 * Central configuration for FirstClass Immobilier contact & identity.
 * Values come from env vars so staging/prod can swap without code changes.
 */

export const site = {
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
} as const

export const whatsappLink = (message?: string) => {
  const base = `https://wa.me/${site.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
