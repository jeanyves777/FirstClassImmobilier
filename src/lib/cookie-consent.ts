/**
 * Cookie consent helpers.
 *
 * State is stored in **both** localStorage (so the banner can re-render
 * across tabs) and a same-name cookie (so the server gate on `/api/track`
 * can reject beacons that don't carry consent). Three states:
 *   - `null`      → no choice yet; show banner, do not fire analytics
 *   - `accepted`  → non-essential cookies allowed (analytics fires)
 *   - `rejected`  → only strictly necessary; no analytics
 */

export const CONSENT_STORAGE_KEY = 'fci_cookie_consent'
export const CONSENT_EVENT = 'fci:cookie-consent-changed'
const COOKIE_MAX_AGE_DAYS = 365

export type ConsentState = 'accepted' | 'rejected' | null

function setCookie(value: string, maxAgeDays: number) {
  if (typeof document === 'undefined') return
  const maxAge = maxAgeDays > 0 ? `; max-age=${maxAgeDays * 24 * 60 * 60}` : '; max-age=0'
  const secure = window.location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${CONSENT_STORAGE_KEY}=${value}; path=/; samesite=lax${maxAge}${secure}`
}

export function readConsent(): ConsentState {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (raw === 'accepted' || raw === 'rejected') return raw
  } catch {
    // localStorage may throw in private mode
  }
  return null
}

export function writeConsent(next: Exclude<ConsentState, null>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, next)
    setCookie(next, COOKIE_MAX_AGE_DAYS)
    window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: next }))
  } catch {
    // swallow
  }
}

export function clearConsent() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY)
    setCookie('', 0)
    window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: null }))
  } catch {
    // swallow
  }
}
