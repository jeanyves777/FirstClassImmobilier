import type { Locale } from '@/i18n/routing'
import type { SiteConfig } from '@/lib/site'

/**
 * Helpers to build schema.org JSON-LD payloads for key public pages.
 *
 * Each function returns a POJO that callers should serialize with
 * `JSON.stringify(obj)` inside a `<script type="application/ld+json">` tag.
 */

export function realEstateAgentLd(site: SiteConfig, locale: Locale) {
  const baseUrl = site.siteUrl.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${baseUrl}#organization`,
    name: site.name,
    url: `${baseUrl}/${locale}`,
    description:
      locale === 'fr'
        ? 'Promoteur immobilier agréé à Abidjan, spécialisé dans les terrains viabilisés, maisons clé en main et lotissements premium.'
        : 'Licensed real-estate developer in Abidjan, specialized in serviced land, turn-key homes and premium subdivisions.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address,
      addressLocality: 'Abidjan',
      addressRegion: 'Cocody',
      addressCountry: 'CI',
    },
    telephone: site.phone,
    email: site.email,
    sameAs: [
      site.social.facebook,
      site.social.instagram,
      site.social.linkedin,
      site.social.youtube,
      site.social.tiktok,
    ].filter(Boolean),
    openingHours: openingHoursStrings(locale),
    areaServed: site.countries.map((c) => ({
      '@type': 'Country',
      name: locale === 'fr' ? c.nameFr : c.nameEn,
    })),
  }
}

export function localBusinessLd(site: SiteConfig, locale: Locale) {
  const baseUrl = site.siteUrl.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}#localbusiness`,
    name: site.name,
    url: `${baseUrl}/${locale}/contacts`,
    image: `${baseUrl}/og-default.jpg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address,
      addressLocality: 'Abidjan',
      addressCountry: 'CI',
    },
    telephone: site.phone,
    email: site.email,
    openingHours: openingHoursStrings(locale),
    priceRange: 'FCFA',
  }
}

export function productLd(params: {
  site: SiteConfig
  locale: Locale
  name: string
  description: string
  imageUrl: string | null
  priceFCFA: bigint | number
  availability: 'available' | 'reserved' | 'sold'
  url: string
  programName: string
  zone: string
}) {
  const { site, name, description, imageUrl, priceFCFA, availability, url, programName, zone } =
    params
  const schemaAvailability =
    availability === 'available'
      ? 'https://schema.org/InStock'
      : availability === 'reserved'
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/SoldOut'
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${name} — ${programName}`,
    description,
    image: imageUrl ? [imageUrl] : undefined,
    url,
    category: 'Real estate',
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'XOF',
      price: String(priceFCFA),
      availability: schemaAvailability,
      url,
      seller: {
        '@type': 'RealEstateAgent',
        name: site.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: site.address,
          addressLocality: 'Abidjan',
          addressCountry: 'CI',
        },
      },
      areaServed: { '@type': 'Place', name: zone },
    },
  }
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** Compact "Mo-Fr 08:00-17:00" etc. in schema.org opening-hours format. */
function openingHoursStrings(_locale: Locale): string[] {
  return ['Mo-Fr 08:00-17:00', 'Sa 09:00-12:30']
}

/** React helper — renders a typed JSON-LD script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
