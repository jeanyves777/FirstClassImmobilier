import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const base = site.siteUrl.replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/admin/',
          '/portal/',
          '/signin',
          '/signup',
          '/*/admin/',
          '/*/portal/',
          '/*/signin',
          '/*/signup',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
