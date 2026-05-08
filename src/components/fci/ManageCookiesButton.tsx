'use client'

import { useTranslations } from 'next-intl'
import { clearConsent } from '@/lib/cookie-consent'

export function ManageCookiesButton() {
  const t = useTranslations('cookies.banner')
  return (
    <button
      type="button"
      onClick={() => clearConsent()}
      className="hover:text-foreground"
    >
      {t('manage')}
    </button>
  )
}
