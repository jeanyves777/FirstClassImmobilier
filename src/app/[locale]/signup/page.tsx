import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Logo } from '@/components/fci/Logo'
import { SignUpForm } from './SignUpForm'

export default async function SignUpPage({
  params,
  searchParams,
}: PageProps<'/[locale]/signup'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const search = await searchParams
  const raw = search.callbackUrl
  const callbackUrlRaw = Array.isArray(raw) ? raw[0] : raw
  const callbackUrl =
    callbackUrlRaw && callbackUrlRaw.startsWith('/') && !callbackUrlRaw.startsWith('//')
      ? callbackUrlRaw
      : `/${locale}/portal/dashboard`

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
            Votre espace client FirstClass.
          </h1>
          <p className="text-white/75">
            Suivez vos réservations, vos visites programmées, vos documents et l\u2019avancement de vos
            acquisitions depuis un seul endroit.
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
            <h2 className="font-display text-3xl font-semibold text-foreground">Create your account</h2>
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <Link href="/signin" className="font-semibold text-[color:var(--brand-red)] hover:underline">
                {t('submit')}
              </Link>
            </p>
          </div>
          <SignUpForm callbackUrl={callbackUrl} locale={locale} />
          <Link href="/" className="block text-xs text-muted hover:text-foreground">
            ← firstclassimmo.com
          </Link>
        </div>
      </main>
    </div>
  )
}
