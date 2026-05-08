import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { parse as parseLocalized } from '@/lib/zod/localized'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { ProgramForm } from '../ProgramForm'
import { deleteProgram } from '../actions'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { ProgramMediaManager } from './ProgramMediaManager'

export default async function EditProgramPage({
  params,
}: PageProps<'/[locale]/admin/programs/[id]'>) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      _count: { select: { lots: true } },
      media: { orderBy: { order: 'asc' } },
      plans: { orderBy: { id: 'asc' } },
    },
  })
  if (!program) notFound()

  return (
    <div>
      <AdminHeader
        backHref="/admin/programs"
        backLabel="Programs"
        eyebrow={program.slug}
        title={parseLocalized(program.name).fr || 'Untitled program'}
        description={`${program._count.lots} lots · ${program.zone} · ${program.status}`}
        action={
          <Link
            href={`/admin/lots?programId=${program.id}`}
            className="inline-flex h-10 items-center rounded-full border border-[color:var(--border)] bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-muted"
          >
            Manage lots
          </Link>
        }
      />

      <ProgramForm
        locale={locale}
        mode="edit"
        program={{
          id: program.id,
          slug: program.slug,
          name: parseLocalized(program.name),
          tagline: parseLocalized(program.tagline),
          description: parseLocalized(program.description),
          type: program.type,
          status: program.status,
          zone: program.zone,
          featured: program.featured,
        }}
      />

      <ProgramMediaManager
        programId={program.id}
        locale={locale}
        media={program.media.map((m) => ({ id: m.id, kind: m.kind, url: m.url }))}
        plans={program.plans.map((p) => ({ id: p.id, label: p.label, fileUrl: p.fileUrl }))}
        heroMediaId={program.heroMediaId}
      />

      <section className="mt-10 rounded-2xl border border-[color:var(--brand-red)]/30 bg-[color:var(--brand-red)]/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Delete this program</h3>
            <p className="text-xs text-muted">
              Cascading delete: removes all {program._count.lots} lots, their media, and linked reservations. Irreversible.
            </p>
          </div>
          <ConfirmButton
            action={deleteProgram}
            hiddenFields={{ id: program.id, locale }}
            title={t('confirm.deleteProgram.title')}
            description={t('confirm.deleteProgram.description', { count: program._count.lots })}
            confirmLabel={t('confirm.deleteProgram.confirmLabel')}
            cancelLabel={t('confirm.cancel')}
            variant="danger"
            size="md"
          >
            {t('confirm.deleteProgram.confirmLabel')}
          </ConfirmButton>
        </div>
      </section>
    </div>
  )
}
