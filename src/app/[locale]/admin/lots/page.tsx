import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader, LinkButton } from '@/components/fci/admin/AdminHeader'
import { formatFCFA, formatSurface } from '@/lib/format'

export default async function AdminLotsList({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/lots'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale
  const sp = await searchParams
  const programId = typeof sp.programId === 'string' ? sp.programId : undefined

  const [programs, lots] = await Promise.all([
    prisma.program.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.lot.findMany({
      where: programId ? { programId } : undefined,
      orderBy: [{ status: 'asc' }, { reference: 'asc' }],
      include: {
        program: { select: { name: true, slug: true } },
        _count: { select: { media: true } },
      },
    }),
  ])

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.content')}
        title={t('navLots')}
        description={t('descriptions.lots')}
        action={
          <LinkButton
            href={programId ? `/admin/lots/new?programId=${programId}` : '/admin/lots/new'}
          >
            {t('newLot')}
          </LinkButton>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip href="/admin/lots" active={!programId} label="All programs" />
        {programs.map((p) => (
          <FilterChip
            key={p.id}
            href={`/admin/lots?programId=${p.id}`}
            active={programId === p.id}
            label={tr(p.name, l) || p.slug}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-surface">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-[color:var(--border)] bg-surface-muted text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Program</th>
              <th className="px-4 py-3 font-medium">Surface</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Media</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {lots.map((lot) => (
              <tr key={lot.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3 font-semibold text-foreground">{lot.reference}</td>
                <td className="px-4 py-3 text-muted">{tr(lot.program.name, l)}</td>
                <td className="px-4 py-3 text-muted">{formatSurface(lot.surfaceM2, l)}</td>
                <td className="px-4 py-3 text-muted">{formatFCFA(lot.priceFCFA, l)}</td>
                <td className="px-4 py-3 text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    {lot._count.media}
                    {lot.virtualTourUrl && (
                      <span className="rounded-full bg-[color:var(--brand-navy)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--brand-navy)] dark:text-foreground">
                        360
                      </span>
                    )}
                    {lot.videoUrl && (
                      <span className="rounded-full bg-[color:var(--brand-red)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--brand-red)]">
                        VID
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <LotStatusPill value={lot.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/lots/${lot.id}`}
                    className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {lots.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  No lots in this view yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-transparent bg-[color:var(--brand-navy)] text-white'
          : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
      }`}
    >
      {label}
    </Link>
  )
}

function LotStatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    available: 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
    reserved: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    sold: 'bg-zinc-900 text-white',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
