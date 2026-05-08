import type { Metadata } from 'next'
import { site } from '@/lib/site'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

export type SeoInput = {
  locale: Locale
  path: string // e.g. "/a-la-une" or "/a-la-une/aerocity-beach"
  title: string
  description: string
  image?: string | null // absolute URL preferred; relative /path also accepted
  keywords?: string[]
  type?: 'website' | 'article'
}

const OG_LOCALE: Record<Locale, string> = {
  fr: 'fr_CI',
  en: 'en_US',
}

export function buildSeo({
  locale,
  path,
  title,
  description,
  image,
  keywords,
  type = 'website',
}: SeoInput): Metadata {
  const base = site.siteUrl.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const canonical = `${base}/${locale}${cleanPath === '/' ? '' : cleanPath}`
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${base}/${l}${cleanPath === '/' ? '' : cleanPath}`]),
  )
  const ogImage =
    image && image.startsWith('http')
      ? image
      : image
        ? `${base}${image.startsWith('/') ? image : `/${image}`}`
        : `${base}/og-default`

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: site.name,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      type,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}
