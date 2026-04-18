import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.coverr.co' },
    ],
  },
  experimental: {
    // Prisma driver adapter (Node-only) needs to stay out of the edge bundle.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default withNextIntl(nextConfig)
