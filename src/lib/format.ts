import type { Locale } from '@/i18n/routing'

export function formatFCFA(value: bigint | number, locale: Locale): string {
  const amount = typeof value === 'bigint' ? Number(value) : value
  const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    maximumFractionDigits: 0,
  })
  return `${formatter.format(amount)} FCFA`
}

export function formatSurface(m2: number, locale: Locale): string {
  const n = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(m2)
  return `${n} m²`
}
