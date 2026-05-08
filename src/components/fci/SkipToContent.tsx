import type { Locale } from '@/i18n/routing'

/**
 * Keyboard-only "Skip to content" link.
 *
 * Hidden off-screen until it receives focus (first Tab press from the URL bar)
 * — a baseline accessibility affordance so keyboard / screen-reader users can
 * bypass the header nav and jump straight to the page's main landmark.
 *
 * Targets `#main` — every public/admin/portal layout exposes that id on its
 * `<main>` element.
 */
export function SkipToContent({ locale }: { locale: Locale }) {
  const label = locale === 'fr' ? 'Aller au contenu' : 'Skip to content'
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[color:var(--brand-navy)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline focus:outline-2 focus:outline-[color:var(--brand-red)]"
    >
      {label}
    </a>
  )
}
