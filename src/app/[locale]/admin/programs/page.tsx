import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { AdminHeader, LinkButton } from '@/components/fci/admin/AdminHeader'

export default async function AdminProgramsList({
  params,
}: PageProps<'/[locale]/admin/programs'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale

  const programs = await prisma.program.findMany({
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    include: { _count: { select: { lots: true } } },
  })

  return (
    <div>
      <AdminHeader
        eyebrow={t('navDashboard')}
        title={t('navPrograms')}
        description="Create, edit, and publish real-estate programs."
        action={<LinkButton href="/admin/programs/new">+ New program</LinkButton>}
      />

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[color:var(--border)] bg-surface-muted text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Program</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium">Lots</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {programs.map((p) => (
              <tr key={p.id} className="hover:bg-surface-muted/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/programs/${p.id}`} className="block">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      {tr(p.name, l)}
                      {p.featured && (
                        <span className="rounded-full bg-[color:var(--brand-red)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--brand-red)]">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">{p.slug}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{p.type}</td>
                <td className="px-4 py-3">
                  <StatusPill value={p.status} />
                </td>
                <td className="px-4 py-3 text-muted">{p.zone}</td>
                <td className="px-4 py-3 text-muted">{p._count.lots}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/programs/${p.id}`}
                    className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  No programs yet. Create the first one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    ON_SALE: 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
    DRAFT: 'bg-surface-muted text-muted',
    SOLD_OUT: 'bg-zinc-900 text-white',
    DELIVERED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
