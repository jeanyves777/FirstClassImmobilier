import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// Next.js 16 renamed `middleware` → `proxy`. We wrap next-intl's middleware
// handler so locale detection and routing keep working unchanged.
const handleI18n = createIntlMiddleware(routing)

export function proxy(request: Request) {
  return handleI18n(request as Parameters<typeof handleI18n>[0])
}

export const config = {
  matcher: [
    // Run on every path except Next internals, static files, images, and public metadata.
    '/((?!api|_next|.*\\..*|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
