import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Logo } from '@/components/fci/Logo'
import { SignInForm } from './SignInForm'

export default async function SignInPage({
  params,
  searchParams,
}: PageProps<'/[locale]/signin'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const search = await searchParams
  const raw = search.callbackUrl
  const callbackUrlRaw = Array.isArray(raw) ? raw[0] : raw
  const callbackUrl = isSafeCallbackUrl(callbackUrlRaw)
    ? callbackUrlRaw
    : `/${locale}/admin/dashboard`

  const t = await getTranslations('auth')

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[color:var(--brand-navy)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(200,16,46,.35),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(255,255,255,.08),transparent_60%)]"
        />
        <div className="relative flex items-center gap-3 text-white">
          <Logo variant="mono-white" />
        </div>
        <div className="relative max-w-lg space-y-4">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Une Nouvelle Vie Commence !
          </h1>
          <p className="text-white/75">
            Gérez vos programmes, vos lots, vos prospects et vos ventes depuis un seul espace sécurisé.
          </p>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} FirstClass Immobilier</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-16 sm:py-24">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <Link href="/" className="lg:hidden">
              <Logo />
            </Link>
            <h2 className="font-display text-3xl font-semibold text-foreground">{t('signInTitle')}</h2>
            <p className="text-sm text-muted">{t('signInIntro')}</p>
          </div>
          <SignInForm callbackUrl={callbackUrl} />
          <Link href="/" className="block text-xs text-muted hover:text-foreground">
            ← firstclassimmo.com
          </Link>
        </div>
      </main>
    </div>
  )
}

function isSafeCallbackUrl(raw: string | undefined): raw is string {
  if (!raw) return false
  if (!raw.startsWith('/')) return false
  if (raw.startsWith('//')) return false
  return true
}
