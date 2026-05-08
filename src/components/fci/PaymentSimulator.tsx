'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

/**
 * Lot-level payment-plan simulator.
 *
 * Input: full lot price (FCFA, BigInt-safe as a string prop from the server).
 * Controls: deposit percentage (10–50%) + duration in months (6–36).
 * Output: rounded monthly payment shown live, plus CTAs toward a real agent.
 *
 * Intentionally kept indicative — the card prints a bilingual disclaimer so
 * there's no confusion with a contractual quote.
 */
export function PaymentSimulator({
  priceFCFA,
  contactHref,
}: {
  priceFCFA: string // stringified BigInt from the server
  contactHref: string
}) {
  const t = useTranslations('lot.simulator')
  const total = Number(priceFCFA)
  const [depositPct, setDepositPct] = useState(20)
  const [months, setMonths] = useState(12)

  const { deposit, balance, monthly } = useMemo(() => {
    const deposit = Math.round((total * depositPct) / 100)
    const balance = Math.max(0, total - deposit)
    const monthly = months > 0 ? Math.round(balance / months) : balance
    return { deposit, balance, monthly }
  }, [total, depositPct, months])

  const fmt = (n: number) => formatFCFAShort(n)

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 shadow-[0_14px_40px_-24px_rgba(15,23,42,.2)]">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 8h6M7 12h10M7 16h4" />
          </svg>
        </span>
        <h3 className="font-display text-base font-semibold text-foreground">{t('title')}</h3>
      </div>
      <p className="mt-1.5 text-[11px] text-muted">{t('subtitle')}</p>

      <div className="mt-5 space-y-4">
        {/* Deposit */}
        <label className="block">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t('deposit')}
            </span>
            <span className="font-display text-sm font-semibold text-foreground">
              {depositPct}% · {fmt(deposit)}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={depositPct}
            onChange={(e) => setDepositPct(Number(e.target.value))}
            aria-label={t('deposit')}
            className="mt-2 w-full accent-[color:var(--brand-red)]"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-muted">
            <span>10%</span>
            <span>50%</span>
          </div>
        </label>

        {/* Months */}
        <label className="block">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t('duration')}
            </span>
            <span className="font-display text-sm font-semibold text-foreground">
              {months} {t('months')}
            </span>
          </div>
          <input
            type="range"
            min={6}
            max={36}
            step={3}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            aria-label={t('duration')}
            className="mt-2 w-full accent-[color:var(--brand-navy)]"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-muted">
            <span>6</span>
            <span>36</span>
          </div>
        </label>

        {/* Result */}
        <div className="rounded-xl bg-[color:var(--brand-navy)]/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            {t('monthly')}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-[color:var(--brand-red)]">
            {fmt(monthly)}
            <span className="ml-1.5 text-[11px] font-medium text-muted">/ {t('monthsShort')}</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-muted">
            <div>
              <p className="uppercase tracking-wider">{t('totalBalance')}</p>
              <p className="mt-0.5 font-semibold text-foreground">{fmt(balance)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider">{t('fullPrice')}</p>
              <p className="mt-0.5 font-semibold text-foreground">{fmt(total)}</p>
            </div>
          </div>
        </div>
      </div>

      <Link
        href={contactHref}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[color:var(--brand-navy)] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[color:var(--brand-navy-700)]"
      >
        {t('cta')}
      </Link>
      <p className="mt-2 text-center text-[10px] text-muted">{t('disclaimer')}</p>
    </div>
  )
}

function formatFCFAShort(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2)} Md FCFA`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} M FCFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K FCFA`
  return `${n.toLocaleString('fr-FR')} FCFA`
}
