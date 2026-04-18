import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { PartnerForm } from './PartnerForm'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { deletePartner } from './actions'

export default async function AdminPartnersPage({
  params,
}: PageProps<'/[locale]/admin/partners'>) {
  const { locale } = await params
  setRequestLocale(locale)

  const partners = await prisma.partner.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })
  const logoIds = partners.map((p) => p.logoId).filter((v): v is string => !!v)
  const logos = logoIds.length
    ? await prisma.media.findMany({ where: { id: { in: logoIds } }, select: { id: true, url: true } })
    : []
  const logoById = new Map(logos.map((l) => [l.id, l.url]))

  return (
    <div>
      <AdminHeader
        eyebrow="Content"
        title="Partners"
        description="Logos shown in the « Nos Partenaires & Clients » strip on Nous Découvrir."
      />

      {partners.length > 0 && (
        <ul className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => {
            const url = p.logoId ? logoById.get(p.logoId) : undefined
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-4"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
                  {url ? (
                    <Image src={url} alt={p.name} fill sizes="64px" className="object-contain p-1" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">Logo</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{p.name}</p>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-muted hover:text-foreground"
                    >
                      {p.url}
                    </a>
                  )}
                  <p className="mt-1 text-[11px] text-muted">Order {p.order}</p>
                </div>
                <ConfirmButton
                  action={deletePartner}
                  hiddenFields={{ id: p.id, locale }}
                  title="Remove this partner?"
                  confirmLabel="Remove"
                  variant="danger"
                  size="sm"
                >
                  Remove
                </ConfirmButton>
              </li>
            )
          })}
        </ul>
      )}

      <h2 className="mb-3 font-display text-xl font-semibold text-foreground">Add a partner</h2>
      <PartnerForm locale={locale} />
    </div>
  )
}
