'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

/**
 * Syncs the authenticated user's stored theme preference into next-themes.
 *
 * Mounted once per authenticated portal/admin session. Runs the sync only on
 * the first mount for that value so we don't fight the user when they toggle
 * the theme locally mid-session (the saved pref is restored on the *next*
 * page load, not during the current one).
 */
export function ApplyUserTheme({
  value,
}: {
  /** "system" | "light" | "dark" — as stored on User.themePreference. */
  value: string
}) {
  const { setTheme } = useTheme()
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current) return
    if (value === 'light' || value === 'dark' || value === 'system') {
      setTheme(value)
      applied.current = true
    }
  }, [value, setTheme])

  return null
}
