import { z } from 'zod'
import { locales, defaultLocale, type Locale } from '@/i18n/routing'

export const localizedTextSchema = z.object({
  fr: z.string(),
  en: z.string(),
})

export type LocalizedText = z.infer<typeof localizedTextSchema>

export function serialize(value: LocalizedText): string {
  return JSON.stringify(localizedTextSchema.parse(value))
}

export function parse(value: string | null | undefined): LocalizedText {
  if (!value) return { fr: '', en: '' }
  const parsed = localizedTextSchema.safeParse(
    typeof value === 'string' ? tryJson(value) : value,
  )
  return parsed.success ? parsed.data : { fr: String(value), en: String(value) }
}

function tryJson(v: string) {
  try {
    return JSON.parse(v)
  } catch {
    return { fr: v, en: v }
  }
}

/** Read the string for a given locale, falling back to French, then English. */
export function tr(value: string | LocalizedText | null | undefined, locale: Locale): string {
  const obj = typeof value === 'string' ? parse(value) : (value ?? { fr: '', en: '' })
  return obj[locale] || obj[defaultLocale] || obj.en || ''
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}
