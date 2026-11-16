import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Uploaded files live in public/uploads and are served by nginx at runtime;
    // Next's image optimizer can't read runtime-added files, so serve images as-is.
    unoptimized: true,
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
