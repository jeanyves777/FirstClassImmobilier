import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth/rbac'
import { tr } from '@/lib/zod/localized'
import { formatFCFA, formatSurface } from '@/lib/format'
import type { Locale } from '@/i18n/routing'
import { DeleteSavedSearchButton } from './DeleteSavedSearchButton'

type Tab = 'lots' | 'searches'

export default async function PortalSavedPage({
  params,
  searchParams,
}: PageProps<'/[locale]/portal/saved'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale
  const user = await getSessionUser()
  if (!user) return null

  const sp = await searchParams
  const tabRaw = typeof sp.tab === 'string' ? sp.tab : undefined
  const tab: Tab = tabRaw === 'searches' ? 'searches' : 'lots'

  const [tPortal, tLot, saved, searches] = await Promise.all([
    getTranslations('portal'),
    getTranslations('lot'),
    prisma.savedLot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        lot: {
          include: {
            program: { select: { name: true, slug: true } },
            media: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
    }),
    prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const copy =
    l === 'fr'
      ? {
          intro:
            'Retrouvez ici vos lots favoris et vos recherches sauvegardées pour y revenir en un clic.',
          tabLots: `Lots (${saved.length})`,
          tabSearches: `Recherches (${searches.length})`,
          emptyLots: 'Vous n’avez pas encore de lot sauvegardé.',
          emptyLotsCta: 'Parcourir nos programmes',
          emptySearches:
            'Sauvegardez une recherche depuis la page « À la Une » pour y revenir plus tard.',
          emptySearchesCta: 'Ouvrir À la Une',
          openSearch: 'Appliquer cette recherche',
          searchesSectionTitle: 'Mes recherches sauvegardées',
          statusLabels: {
            available: 'Disponible',
            reserved: 'Réservé',
            sold: 'Vendu',
          } as Record<string, string>,
        }
      : {
          intro:
            'Your saved lots and saved searches, one click away.',
          tabLots: `Lots (${saved.length})`,
          tabSearches: `Searches (${searches.length})`,
          emptyLots: 'You haven’t saved any lot yet.',
          emptyLotsCta: 'Browse our programs',
          emptySearches: 'Save a search from the Featured page to come back to it later.',
          emptySearchesCta: 'Open Featured',
          openSearch: 'Apply this search',
          searchesSectionTitle: 'My saved searches',
          statusLabels: {
            available: 'Available',
            reserved: 'Reserved',
            sold: 'Sold',
          } as Record<string, string>,
        }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          {tPortal('portalSaved')}
        </h1>
        <p className="mt-2 text-sm text-muted">{copy.intro}</p>
      </header>

      {/* Tabs */}
      <nav
        role="tablist"
        aria-label={tPortal('portalSaved')}
        className="inline-flex rounded-full border border-[color:var(--border)] bg-surface p-1 text-xs font-semibold"
      >
        <TabLink href="/portal/saved?tab=lots" active={tab === 'lots'} label={copy.tabLots} />
        <TabLink href="/portal/saved?tab=searches" active={tab === 'searches'} label={copy.tabSearches} />
      </nav>

      {tab === 'lots' ? (
        saved.length === 0 ? (
          <EmptyCard body={copy.emptyLots} cta={copy.emptyLotsCta} href="/a-la-une" />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => {
              const lot = s.lot
              const cover = lot.media[0]
              const href = `/a-la-une/${lot.program.slug}/lots/${lot.reference}`
              const statusClass =
                lot.status === 'sold'
                  ? 'bg-zinc-900 text-white'
                  : lot.status === 'reserved'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
              return (
                <li key={s.id}>
                  <Link
                    href={href}
                    className="group block overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
                  >
                    <div className="relative aspect-[4/3] bg-surface-muted">
                      {cover ? (
                        <Image
                          src={cover.url}
                          alt={tr(cover.alt, l) || lot.reference}
                          fill
                          sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover"
                        />
                      ) : null}
                      <span
                        className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow ${statusClass}`}
                      >
                        {copy.statusLabels[lot.status] ?? lot.status}
                      </span>
                    </div>
                    <div className="space-y-2 p-5">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                        <span className="font-semibold text-[color:var(--brand-red)]">
                          {lot.reference}
                        </span>
                        <span className="text-muted">{formatSurface(lot.surfaceM2, l)}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold leading-tight text-foreground">
                        {tr(lot.title, l) || tLot('lot')}
                      </h3>
                      <p className="text-xs text-muted">{tr(lot.program.name, l)}</p>
                      <p className="pt-2 text-sm font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                        {formatFCFA(lot.priceFCFA, l)}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )
      ) : searches.length === 0 ? (
        <EmptyCard
          body={copy.emptySearches}
          cta={copy.emptySearchesCta}
          href="/a-la-une"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {searches.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-5"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{s.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted">{s.query}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/a-la-une${s.query}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--brand-navy)] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
                  >
                    {copy.openSearch}
                    <span aria-hidden>→</span>
                  </Link>
                  <DeleteSavedSearchButton id={s.id} label={s.label} locale={locale} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 transition-colors ${
        active
          ? 'bg-[color:var(--brand-navy)] text-white shadow-sm'
          : 'text-muted hover:text-foreground'
      }`}
    >
      {label}
    </Link>
  )
}

function EmptyCard({ body, cta, href }: { body: string; cta: string; href: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center">
      <p className="text-sm text-muted">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center rounded-full bg-[color:var(--brand-navy)] px-5 py-2 text-xs font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
      >
        {cta}
      </Link>
    </div>
  )
}
