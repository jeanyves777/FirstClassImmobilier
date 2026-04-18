import { setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { LotForm } from '../LotForm'

export default async function NewLotPage({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/lots/new'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale
  const sp = await searchParams
  const programId = typeof sp.programId === 'string' ? sp.programId : undefined

  const programs = await prisma.program.findMany({ orderBy: { updatedAt: 'desc' } })
  const options = programs.map((p) => ({ id: p.id, slug: p.slug, label: tr(p.name, l) || p.slug }))

  if (options.length === 0) {
    return (
      <div>
        <AdminHeader
          backHref="/admin/lots"
          backLabel="Lots"
          title="Create a lot"
        />
        <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-8 text-center text-sm text-muted">
          You need at least one program first. Go to Programs → New program.
        </p>
      </div>
    )
  }

  return (
    <div>
      <AdminHeader
        backHref="/admin/lots"
        backLabel="Lots"
        title="Create a lot"
        description="A lot is an individual parcel or unit in one of your programs."
      />
      <LotForm
        locale={locale}
        mode="create"
        programs={options}
        lot={
          programId
            ? ({
                programId,
                reference: '',
                surfaceM2: 0,
                priceFCFA: '0',
                status: 'available',
                bedrooms: null,
                bathrooms: null,
                title: null,
                description: null,
                highlights: null,
                features: null,
                videoUrl: null,
                virtualTourUrl: null,
              })
            : undefined
        }
      />
    </div>
  )
}
