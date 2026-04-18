import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import { Link } from '@/i18n/navigation'

export default async function FeaturedPage({ params }: PageProps<'/[locale]/a-la-une'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('featured')

  const windows = [
    {
      slug: 'aerocity-beach',
      title: t('programs.aerocity'),
      accent: 'from-[#0b1b3d] via-[#13284f] to-[#1f3d72]',
    },
    {
      slug: 'labella-residence',
      title: t('programs.labella'),
      accent: 'from-[#1f1226] via-[#3a1e46] to-[#5b2a63]',
    },
    {
      slug: 'offres-terrains',
      title: t('programs.lands'),
      accent: 'from-[#1a2e1a] via-[#25472a] to-[#386d44]',
    },
  ] as const

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      <div className="grid gap-6 md:grid-cols-3">
        {windows.map((w) => (
          <Link
            key={w.slug}
            href={`/a-la-une/${w.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)]"
          >
            <div className={`aspect-[4/5] bg-gradient-to-br ${w.accent}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <h3 className="font-display text-xl font-semibold leading-tight">{w.title}</h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
                {t('catalogCta')}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
