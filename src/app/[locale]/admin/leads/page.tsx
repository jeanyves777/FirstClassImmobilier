import { setRequestLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import type { Locale } from '@/i18n/routing'
import { AdminHeader } from '@/components/fci/admin/AdminHeader'
import { setLeadStatus } from '../appointments/actions'

const STATUS_ORDER = ['new', 'contacted', 'qualified', 'lost', 'converted']

export default async function LeadsInbox({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/leads'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('admin')
  const l = locale as Locale
  const sp = await searchParams
  const status = typeof sp.status === 'string' ? sp.status : undefined

  const leads = await prisma.lead.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <AdminHeader
        eyebrow={t('eyebrow.pipeline')}
        title={t('navLeads')}
        description={t('descriptions.leads')}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip href="/admin/leads" active={!status} label={t('labels.all')} />
        {STATUS_ORDER.map((s) => (
          <Chip key={s} href={`/admin/leads?status=${s}`} active={status === s} label={t(`statusFilter.${s}`)} />
        ))}
      </div>

      <div className="space-y-4">
        {leads.map((lead) => {
          let data: { fullName?: string; email?: string; phone?: string; message?: string } = {}
          try { data = JSON.parse(lead.payload) } catch {}
          return (
            <article key={lead.id} className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-surface p-5 md:grid-cols-[1fr_240px]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-foreground">{data.fullName ?? 'Anonymous'}</h3>
                  <Pill value={lead.status} />
                </div>
                <p className="text-xs text-muted">
                  {data.email && <a href={`mailto:${data.email}`} className="hover:text-foreground">{data.email}</a>}
                  {data.phone && <> · <a href={`tel:${data.phone}`} className="hover:text-foreground">{data.phone}</a></>}
                </p>
                <p className="text-xs text-muted">
                  Source: {lead.source} · {new Date(lead.createdAt).toLocaleDateString(l === 'fr' ? 'fr-FR' : 'en-US')}
                </p>
                {data.message && (
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-muted p-3 text-sm text-foreground">{data.message}</p>
                )}
              </div>

              <form action={setLeadStatus} className="flex items-start gap-2">
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="locale" value={locale} />
                <select
                  name="status"
                  defaultValue={lead.status}
                  className="flex-1 rounded-lg border border-[color:var(--border)] bg-background px-2 py-1.5 text-xs"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-[color:var(--brand-navy)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
                >
                  Update
                </button>
              </form>
            </article>
          )
        })}
        {leads.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center text-sm text-muted">
            No leads in this view yet.
          </p>
        )}
      </div>
    </div>
  )
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-transparent bg-[color:var(--brand-navy)] text-white'
          : 'border-[color:var(--border)] bg-surface text-foreground hover:bg-surface-muted'
      }`}
    >
      {label}
    </a>
  )
}

function Pill({ value }: { value: string }) {
  const map: Record<string, string> = {
    new: 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]',
    contacted: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    qualified: 'bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)] dark:text-foreground',
    converted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    lost: 'bg-zinc-900 text-white',
  }
  const cls = map[value] ?? 'bg-surface-muted text-muted'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {value}
    </span>
  )
}
