import { defineRouting } from 'next-intl/routing'

export const locales = ['fr', 'en'] as const
export const defaultLocale = 'fr' as const
export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
})
