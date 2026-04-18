import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe Auth.js config shared between proxy.ts and the full auth setup.
 * Keeps Prisma and other Node-only code out of the edge runtime.
 * Providers are declared in the full config at ./auth.ts.
 */
export default {
  pages: {
    signIn: '/fr/signin',
    error: '/fr/signin',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'VISITOR'
        token.locale = (user as { locale?: string }).locale ?? 'fr'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as typeof session.user & { role?: string; locale?: string }).role =
          (token.role as string | undefined) ?? 'VISITOR'
        ;(session.user as typeof session.user & { role?: string; locale?: string }).locale =
          (token.locale as string | undefined) ?? 'fr'
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
