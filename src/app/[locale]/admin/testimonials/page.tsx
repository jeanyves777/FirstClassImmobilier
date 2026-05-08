import { setRequestLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { TestimonialForm } from './TestimonialForm'
import { deleteTestimonial, togglePublished } from './actions'
import { SyncGoogleButton } from './SyncGoogleButton'
import type { Locale } from '@/i18n/routing'
import { GoogleG } from '@/components/fci/GoogleG'

export default async function AdminTestimonialsPage({
  params,
}: PageProps<'/[locale]/admin/testimonials'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale

  const [testimonials, programs] = await Promise.all([
    prisma.testimonial.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { program: { select: { name: true, slug: true } } },
    }),
    prisma.program.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, slug: true },
    }),
  ])

  const photoIds = testimonials.map((t) => t.photoId).filter((v): v is string => !!v)
  const photos = photoIds.length
    ? await prisma.media.findMany({
        where: { id: { in: photoIds } },
        select: { id: true, url: true },
      })
    : []
  const photoById = new Map(photos.map((m) => [m.id, m.url]))

  const hasApiKey = Boolean(process.env.GOOGLE_PLACES_API_KEY)

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.content')}
        title={l === 'fr' ? 'Témoignages' : 'Testimonials'}
        description={
          l === 'fr'
            ? 'Les témoignages publiés s\u2019affichent sur l\u2019accueil et la page Nos Réalisations. Triés par ordre d\u2019affichage puis par date.'
            : 'Published testimonials appear on the home page and the Realizations page. Sorted by display order then by date.'
        }
        action={<SyncGoogleButton locale={locale} hasApiKey={hasApiKey} />}
      />

      {testimonials.length > 0 && (
        <ul className="mb-10 space-y-4">
          {testimonials.map((ti) => {
            const photoUrl = ti.photoId ? photoById.get(ti.photoId) : undefined
            return (
              <li
                key={ti.id}
                className={`flex items-start gap-4 rounded-2xl border bg-surface p-5 ${
                  ti.published
                    ? 'border-[color:var(--border)]'
                    : 'border-dashed border-[color:var(--border)] opacity-75'
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[color:var(--border)] bg-surface-muted">
                  {photoUrl ? (
                    <Image src={photoUrl} alt={ti.authorName} fill sizes="64px" className="object-cover" />
                  ) : ti.photoUrl ? (
                    // External (Google) avatar — use plain img so we don't need to whitelist every host
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ti.photoUrl} alt={ti.authorName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                      {ti.authorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{ti.authorName}</p>
                    {ti.source === 'google' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-2 py-0.5 text-[10px] font-semibold text-foreground">
                        <GoogleG className="h-3 w-3" />
                        Google
                      </span>
                    )}
                    {ti.rating && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FBBC04]/15 px-2 py-0.5 text-[10px] font-semibold text-[#b88700]">
                        {'★'.repeat(ti.rating)}
                        <span className="opacity-50">{'★'.repeat(5 - ti.rating)}</span>
                      </span>
                    )}
                    {ti.authorRole && (
                      <span className="text-[11px] uppercase tracking-wider text-muted">
                        {ti.authorRole}
                      </span>
                    )}
                    {!ti.published && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        {l === 'fr' ? 'Brouillon' : 'Draft'}
                      </span>
                    )}
                    {ti.program && (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-muted">
                        → {tr(ti.program.name, l)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground">
                    « {tr(ti.quote, l)} »
                  </p>
                  <p className="mt-2 text-[11px] text-muted">
                    {l === 'fr' ? 'Ordre' : 'Order'}: {ti.order}
                    {ti.sourceUrl && (
                      <>
                        {' · '}
                        <a href={ti.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                          {l === 'fr' ? 'Source' : 'Source'}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <form action={togglePublished}>
                    <input type="hidden" name="id" value={ti.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        ti.published
                          ? 'border border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
                          : 'bg-[color:var(--brand-navy)] text-white hover:bg-[color:var(--brand-navy-700)]'
                      }`}
                    >
                      {ti.published
                        ? l === 'fr'
                          ? 'Dépublier'
                          : 'Unpublish'
                        : l === 'fr'
                          ? 'Publier'
                          : 'Publish'}
                    </button>
                  </form>
                  <ConfirmButton
                    action={deleteTestimonial}
                    hiddenFields={{ id: ti.id, locale }}
                    title={l === 'fr' ? 'Supprimer ce témoignage ?' : 'Delete this testimonial?'}
                    description={
                      l === 'fr'
                        ? 'Cette action est irréversible. Le témoignage disparaîtra immédiatement des pages publiques.'
                        : 'This cannot be undone. The testimonial will disappear from public pages immediately.'
                    }
                    confirmLabel={l === 'fr' ? 'Supprimer' : 'Delete'}
                    cancelLabel={l === 'fr' ? 'Annuler' : 'Cancel'}
                    variant="danger"
                    size="sm"
                  >
                    {l === 'fr' ? 'Supprimer' : 'Delete'}
                  </ConfirmButton>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <h2 className="mb-3 font-display text-xl font-semibold text-foreground">
        {l === 'fr' ? 'Ajouter un témoignage' : 'Add a testimonial'}
      </h2>
      <TestimonialForm
        locale={locale}
        programs={programs.map((p) => ({ id: p.id, label: `${tr(p.name, l)} (${p.slug})` }))}
      />
    </div>
  )
}
