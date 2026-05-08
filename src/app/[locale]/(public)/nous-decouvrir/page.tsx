import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { PageShell } from '@/components/fci/PageShell'
import { prisma } from '@/lib/db'
import type { Locale } from '@/i18n/routing'
import { buildSeo } from '@/lib/seo'
import { ABOUT_IMAGES, SERVICE_IMAGES } from '@/lib/stock-images'
import { VillaSkyline, GrowthChart, BlueprintGrid } from '@/components/fci/illustrations'
import { ServicesGrid, type ServiceItem } from '@/components/fci/ServicesGrid'
import { site } from '@/lib/site'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/nous-decouvrir'>): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  return buildSeo({
    locale: l,
    path: '/nous-decouvrir',
    title:
      l === 'fr'
        ? 'Nous découvrir — FirstClass Immobilier'
        : 'About us — FirstClass Immobilier',
    description:
      l === 'fr'
        ? 'Promoteur agréé depuis plus de 8 ans à Abidjan. Notre histoire, notre approche, nos valeurs et le réseau de partenaires qui sécurisent chaque transaction.'
        : 'A licensed Abidjan developer with 8+ years of delivery. Our story, approach, values, and the partner network that secures every transaction.',
  })
}

export default async function AboutPage({ params }: PageProps<'/[locale]/nous-decouvrir'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('about')
  const l = locale as Locale

  const [partners, stats] = await Promise.all([
    prisma.partner.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
    prisma.siteStats.findUnique({ where: { id: 1 } }),
  ])
  const logoIds = partners.map((p) => p.logoId).filter((v): v is string => !!v)
  const logos = logoIds.length
    ? await prisma.media.findMany({
        where: { id: { in: logoIds } },
        select: { id: true, url: true },
      })
    : []
  const logoById = new Map(logos.map((l) => [l.id, l.url]))

  const c = copy(l, {
    yearsExperience: stats?.yearsExperience ?? 8,
    satisfiedClients: stats?.satisfiedClients ?? 350,
    acdDelivered: stats?.acdDelivered ?? 380,
  })

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={c.leadIntro} wide>
      {/* Story section */}
      <section className="mb-16 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
            {c.story.eyebrow}
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {t('bioTitle')}
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted sm:text-lg">
            <p>{t('bio')}</p>
            <p>{c.story.paragraph2}</p>
            <p>{c.story.paragraph3}</p>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-navy)]/20 bg-[color:var(--brand-navy)]/[.06] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-navy)] dark:border-white/15 dark:bg-white/5 dark:text-foreground">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            {t('agrementBadge')}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            <HeadlineStat value={`${stats?.yearsExperience ?? 8}+`} label={c.story.statYears} />
            <HeadlineStat value={`${stats?.satisfiedClients ?? 350}+`} label={c.story.statClients} />
            <HeadlineStat value={`${stats?.acdDelivered ?? 380}+`} label={c.story.statACD} />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-muted">
          <Image
            src={ABOUT_IMAGES.story.src}
            alt={ABOUT_IMAGES.story.alt[l]}
            fill
            sizes="(min-width: 1024px) 38vw, 100vw"
            className="object-cover"
          />
          <div className="relative h-[320px] w-full sm:h-[420px] lg:h-full" />
        </div>
      </section>

      {/* Timeline */}
      <section className="relative mb-16">
        <GrowthChart
          aria-hidden
          className="pointer-events-none absolute -top-10 right-0 hidden h-56 w-80 opacity-30 lg:block"
        />
        <SectionHeader eyebrow={c.timeline.eyebrow} title={c.timeline.title} intro={c.timeline.intro} />
        <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {c.timeline.items.map((m, i) => (
            <li
              key={m.year}
              className="relative rounded-2xl border border-[color:var(--border)] bg-surface p-5"
            >
              <span className="absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--brand-red)] text-[10px] font-bold text-white">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="font-display text-xl font-semibold text-[color:var(--brand-navy)] dark:text-foreground">
                {m.year}
              </p>
              <p className="mt-1 font-semibold text-foreground">{m.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{m.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Values, Vision, Mission, Products — richer cards */}
      <section className="mb-16">
        <SectionHeader eyebrow={c.pillars.eyebrow} title={c.pillars.title} intro={c.pillars.intro} />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <PillarCard
            icon={<IconSparkle />}
            title={t('valuesTitle')}
            body={t('values')}
            bullets={c.pillars.valuesBullets}
          />
          <PillarCard
            icon={<IconTarget />}
            title={t('visionTitle')}
            body={t('vision')}
            bullets={c.pillars.visionBullets}
          />
          <PillarCard
            icon={<IconCompass />}
            title={t('missionTitle')}
            body={t('mission')}
            bullets={c.pillars.missionBullets}
          />
          <PillarCard
            icon={<IconCube />}
            title={t('productsTitle')}
            body={t('products')}
            bullets={c.pillars.productsBullets}
          />
        </div>
      </section>

      {/* Services grid (NEW — six expandable tiles per client brief) */}
      <section className="mb-16">
        <SectionHeader
          eyebrow={c.services.eyebrow}
          title={c.services.title}
          intro={c.services.intro}
        />
        <div className="mt-8">
          <ServicesGrid
            items={c.services.items}
            expandLabel={c.services.expand}
            collapseLabel={c.services.collapse}
          />
        </div>
      </section>

      {/* How we work (process) */}
      <section className="relative mb-16">
        <VillaSkyline
          aria-hidden
          className="pointer-events-none absolute -top-6 right-0 hidden h-40 w-64 opacity-40 lg:block"
        />
        <SectionHeader eyebrow={c.process.eyebrow} title={c.process.title} intro={c.process.intro} />
        <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {c.process.steps.map((s, i) => (
            <li
              key={s.title}
              className="rounded-2xl border border-[color:var(--border)] bg-surface p-5"
            >
              <span className="font-display text-3xl font-semibold text-[color:var(--brand-red)]/15">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="font-display text-base font-semibold text-foreground">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Certifications / Trust strip */}
      <section className="relative mb-16 overflow-hidden rounded-2xl bg-[color:var(--brand-navy)] p-8 text-white sm:p-10">
        <BlueprintGrid
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] [filter:brightness(0)_invert(1)]"
        />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {c.trust.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
              {c.trust.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{c.trust.intro}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {c.trust.items.map((it) => (
              <li
                key={it.title}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <p className="font-semibold">{it.title}</p>
                <p className="mt-1 text-xs text-white/70">{it.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Slogan band (NEW per client brief) */}
      <section className="mb-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
          {site.shortName}
        </p>
        <p className="mt-2 font-display text-3xl font-semibold leading-tight text-[color:var(--brand-navy)] dark:text-foreground sm:text-4xl">
          <span className="text-[color:var(--brand-red)]">«</span> {t('slogan')}{' '}
          <span className="text-[color:var(--brand-red)]">»</span>
        </p>
      </section>

      {/* Partners */}
      <section className="mb-16">
        <SectionHeader
          eyebrow={c.partners.eyebrow}
          title={t('partnersTitle')}
          intro={c.partners.intro}
        />
        {partners.length === 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-20 items-center justify-center rounded-xl border border-dashed border-[color:var(--border)] bg-surface-muted text-xs text-muted"
              >
                {c.partners.placeholder}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {partners.map((p) => {
              const url = p.logoId ? logoById.get(p.logoId) : undefined
              const inner = url ? (
                <Image src={url} alt={p.name} fill sizes="180px" className="object-contain p-3" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs text-muted">
                  {p.name}
                </span>
              )
              return p.url ? (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex h-20 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white transition-transform hover:scale-[1.03]"
                  aria-label={p.name}
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={p.id}
                  className="relative flex h-20 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white"
                >
                  {inner}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Final CTA */}
      <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-8 sm:p-10">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              {c.finalCta.title}
            </h2>
            <p className="mt-2 text-sm text-muted sm:text-base">{c.finalCta.body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/a-la-une"
              className="inline-flex items-center rounded-full bg-[color:var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-red-600)]"
            >
              {c.finalCta.primary}
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              {c.finalCta.secondary}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string
  title: string
  intro?: string
}) {
  return (
    <header className="max-w-2xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{intro}</p>}
    </header>
  )
}

function HeadlineStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-surface-muted p-3 text-center">
      <p className="font-display text-xl font-semibold text-[color:var(--brand-navy)] dark:text-foreground sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  )
}

function PillarCard({
  icon,
  title,
  body,
  bullets,
}: {
  icon: React.ReactNode
  title: string
  body: string
  bullets: string[]
}) {
  return (
    <div className="group rounded-2xl border border-[color:var(--border)] bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      <ul className="mt-4 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand-red)]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────

function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
    </svg>
  )
}
function IconCube() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m21 16-9 5-9-5V8l9-5 9 5z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Bilingual copy
// ─────────────────────────────────────────────────────────────────────────

function copy(
  l: Locale,
  data: { yearsExperience: number; satisfiedClients: number; acdDelivered: number },
) {
  const fr = {
    leadIntro:
      'Un promoteur immobilier agréé, fondé à Abidjan, qui transforme l\u2019accès au foncier et à la maison familiale en parcours sécurisé — pour la diaspora comme pour les familles ivoiriennes.',
    story: {
      eyebrow: 'Notre histoire',
      paragraph2: `Fondée il y a plus de ${data.yearsExperience} ans, FirstClass Immobilier est née d\u2019un constat simple : en Côte d\u2019Ivoire, acheter un terrain reste trop souvent opaque, risqué, et inachevé côté titre foncier. Nous avons bâti un modèle qui prend en charge l\u2019intégralité du parcours, de la sélection du foncier jusqu\u2019à la remise de l\u2019ACD entre les mains du propriétaire.`,
      paragraph3: `Notre équipe combine expertise juridique, technique (génie civil, topographie) et commerciale. Nous intervenons à Abidjan et dans le Grand Abidjan, et accompagnons une part grandissante de clients de la diaspora — Canada, USA, France, Europe — qui achètent à distance en toute sécurité.`,
      statYears: "ans d'activité",
      statClients: 'clients satisfaits',
      statACD: 'ACD délivrés',
    },
    timeline: {
      eyebrow: 'Parcours',
      title: 'Une progression année après année',
      intro:
        'Des premiers lots à Cocody aux lotissements livrés dans le Grand Abidjan : une décennie d\u2019exécution, sans raccourci sur l\u2019ACD.',
      items: [
        {
          year: '2018',
          title: 'Fondation à Abidjan',
          body: 'FirstClass Immobilier est agréée par le Ministère de la Construction. Premiers lotissements à Cocody Angré.',
        },
        {
          year: '2020',
          title: 'Extension Grand Abidjan',
          body: 'Ouverture de nouveaux programmes à Bingerville et Grand-Bassam. Mise en place du suivi ACD structuré.',
        },
        {
          year: '2022',
          title: 'Offre clé en main',
          body: 'Lancement des maisons clé en main (villas et duplex) et du contrat unique construction + ACD.',
        },
        {
          year: `${new Date().getFullYear()}`,
          title: 'Plateforme digitale',
          body: 'Espace client en ligne, réservation à distance, suivi chantier en photos. Diaspora 100 % à distance.',
        },
      ],
    },
    pillars: {
      eyebrow: 'Nos fondations',
      title: 'Ce qui nous guide',
      intro:
        'Quatre piliers — pas des slogans. Ils se traduisent par des décisions concrètes que vous retrouvez à chaque étape.',
      valuesBullets: [
        'Transparence contractuelle : tout est écrit, aucun frais caché.',
        'Respect des délais : pénalités internes si le chantier dérape.',
        'Accompagnement unique : un agent dédié du début à la fin.',
      ],
      visionBullets: [
        'Faire de la Côte d\u2019Ivoire une référence régionale du logement maîtrisé.',
        'Rendre l\u2019ACD accessible dans toutes nos ventes, sans exception.',
        'Étendre le modèle à l\u2019UEMOA dans les prochaines années.',
      ],
      missionBullets: [
        'Sécuriser chaque transaction foncière avec un titre opposable.',
        'Ouvrir la propriété à la diaspora sur des canaux 100 % digitaux.',
        'Livrer sur des délais tenables, pas des promesses.',
      ],
      productsBullets: [
        'Terrains viabilisés (bornage, ACD inclus)',
        'Maisons clé en main (villas, duplex)',
        'Lotissements complets avec espaces communs',
        'Gestion locative et revente accompagnée',
      ],
    },
    process: {
      eyebrow: 'Notre approche',
      title: 'Comment on travaille concrètement',
      intro:
        'Un process bien rodé — chaque étape est documentée côté client, du premier contact à la remise des clés.',
      steps: [
        {
          title: 'Écoute & conseil',
          body: 'On comprend votre projet : résidence principale, investissement, préparation retraite, achat diaspora. On ne pousse jamais un programme qui ne colle pas.',
        },
        {
          title: 'Sélection foncière',
          body: 'Nos zones sont choisies après due-diligence (titre, accès, potentiel). Vous recevez le dossier complet avant engagement.',
        },
        {
          title: 'Réservation sécurisée',
          body: 'Acompte versé, lot marqué à votre nom, contrat signé. Tout est traçable depuis votre espace client.',
        },
        {
          title: 'Viabilisation ou construction',
          body: 'Suivi chantier photo hebdomadaire, paiements calés sur l\u2019avancement, visite libre sur place à tout moment.',
        },
        {
          title: 'Procédure ACD',
          body: 'Nous portons la procédure administrative (cadastre, publication, enregistrement). Vous en voyez l\u2019avancée en temps réel.',
        },
        {
          title: 'Remise finale',
          body: 'Clés + ACD physique en main propre, ou expédition DHL pour la diaspora. Votre espace client reste actif à vie.',
        },
      ],
    },
    trust: {
      eyebrow: 'Pourquoi nous faire confiance',
      title: 'Des preuves, pas des promesses',
      intro:
        'Un promoteur sérieux se mesure à ses titres délivrés, pas à ses images 3D. Nos chiffres parlent pour nous.',
      items: [
        { title: `${data.acdDelivered}+ ACD délivrés`, body: 'Chaque vente aboutit à un titre opposable, documenté.' },
        { title: 'Agrément Ministériel', body: 'Promoteur agréé par le Ministère de la Construction de Côte d\u2019Ivoire.' },
        { title: 'Paiements sécurisés', body: 'Virement bancaire, chèque, et Mobile Money. Reçus numérisés systématiques.' },
        { title: 'Espace client à vie', body: 'Tous vos documents, paiements, photos chantier restent accessibles après la remise des clés.' },
      ],
    },
    partners: {
      eyebrow: 'Écosystème',
      intro:
        'Notaires, banques, études topographiques, assureurs — nos partenaires ont été sélectionnés pour la fiabilité de leurs process.',
      placeholder: 'Partenaire',
    },
    services: {
      eyebrow: 'Nos savoir-faire',
      title: 'Nos Services',
      intro: 'Six métiers complémentaires sous le même toit, pour livrer chaque projet de bout en bout.',
      expand: 'Voir le détail',
      collapse: 'Refermer',
      items: [
        {
          slug: 'promotion',
          image: { src: SERVICE_IMAGES.promotionImmobiliere.src, alt: SERVICE_IMAGES.promotionImmobiliere.alt.fr },
          title: 'Promotion immobilière',
          lede: 'Découvrez nos projets immobiliers innovants.',
          body: 'Nos promotions immobilières se distinguent par leur design contemporain et leur fonctionnalité. Chaque projet est élaboré en partenariat avec un personnel dynamique, des architectes de renom et des experts du secteur pour offrir des logements alliant esthétique, confort et durabilité.',
          bullets: [
            'Localisation stratégique : commerces, écoles, transports, centres d’affaires.',
            'Opportunités d’investissement à rentabilité maîtrisée.',
            'Qualité supérieure à coûts accessibles.',
          ],
        },
        {
          slug: 'amenagement',
          image: { src: SERVICE_IMAGES.amenagementFoncier.src, alt: SERVICE_IMAGES.amenagementFoncier.alt.fr },
          title: 'Aménagement foncier',
          lede: 'Optimisez votre parcelle avec notre expertise.',
          body: 'Nous valorisons vos parcelles en maximisant leur potentiel grâce à une connaissance approfondie des réglementations et à une approche stratégique. Nous créons des espaces fonctionnels et esthétiques.',
          bullets: [
            'Études de faisabilité détaillées.',
            'Planification et conception sur mesure.',
            'Travaux de VRD : décapage, voirie, eau, électrification.',
          ],
        },
        {
          slug: 'construction',
          image: { src: SERVICE_IMAGES.construction.src, alt: SERVICE_IMAGES.construction.alt.fr },
          title: 'Construction',
          lede: 'Construisez avec confiance grâce à notre savoir-faire.',
          body: 'Nos équipes de construction réalisent des bâtiments de haute qualité, respectant délais et budgets. Matériaux de premier choix et techniques de pointe pour garantir durabilité et sécurité.',
          bullets: [
            'Qualité et sécurité : matériaux et techniques avancés.',
            'Respect strict des délais et des budgets.',
            'Une équipe dédiée et expérimentée à chaque étape.',
          ],
        },
        {
          slug: 'renovation',
          image: { src: SERVICE_IMAGES.renovation.src, alt: SERVICE_IMAGES.renovation.alt.fr },
          title: 'Rénovation de bâtiments',
          lede: 'Redonnez vie à vos bâtiments.',
          body: 'Une équipe expérimentée maîtrisant les dernières techniques de rénovation, des matériaux de premier choix et une gestion rigoureuse pour livrer dans les temps et le budget.',
          bullets: [
            'Rénovation intérieure : espaces de vie, bureaux, commerces.',
            'Rénovation extérieure : façades, toitures, espaces extérieurs.',
            'Projets résidentiels, commerciaux et publics.',
          ],
        },
        {
          slug: 'architecture',
          image: { src: SERVICE_IMAGES.architecture.src, alt: SERVICE_IMAGES.architecture.alt.fr },
          title: 'Architecture',
          lede: 'Transformez vos idées en réalité.',
          body: 'Un département d’architecture structuré, avec une équipe inscrite à l’Ordre des Architectes de Côte d’Ivoire. Solutions innovantes, durables et esthétiques — de la conception à la réalisation.',
          bullets: [
            'Conception sur mesure et obtention de permis de construire.',
            'Sélection des entreprises et direction de chantier.',
            'Projets résidentiels, commerciaux et espaces publics.',
          ],
        },
        {
          slug: 'transaction',
          image: { src: SERVICE_IMAGES.transaction.src, alt: SERVICE_IMAGES.transaction.alt.fr },
          title: 'Transaction immobilière',
          lede: 'Simplifiez vos transactions immobilières.',
          body: 'Spécialistes des transactions immobilières : achat, vente et location. Un réseau solide d’acheteurs et de vendeurs, transparence et professionnalisme à chaque étape.',
          bullets: [
            'Mise en vente et évaluation au juste prix.',
            'Gestion de biens : location et entretien.',
            'Résidentiel, commercial et foncier.',
          ],
        },
      ] satisfies ServiceItem[],
    },
    finalCta: {
      title: 'Envie de voir nos programmes ?',
      body: 'Parcourez les lots en commercialisation, ou prenez directement rendez-vous avec un agent.',
      primary: 'Voir les programmes',
      secondary: 'Contacter un agent',
    },
  }

  const en = {
    leadIntro:
      'A licensed developer founded in Abidjan that turns land and family-home ownership into a secure journey — for the diaspora as much as for local families.',
    story: {
      eyebrow: 'Our story',
      paragraph2: `Founded over ${data.yearsExperience} years ago, FirstClass Immobilier was born from a simple observation: in Côte d\u2019Ivoire, buying land is too often opaque, risky, and incomplete on the title-deed side. We built a model that owns the full journey, from land sourcing to handing over the ACD.`,
      paragraph3: `Our team combines legal, technical (civil engineering, surveying) and sales expertise. We operate across Abidjan and Greater Abidjan, and serve a growing share of diaspora clients — Canada, USA, France, Europe — who buy safely from abroad.`,
      statYears: 'years active',
      statClients: 'satisfied clients',
      statACD: 'ACD delivered',
    },
    timeline: {
      eyebrow: 'Journey',
      title: 'Progress, year after year',
      intro: 'From the first plots in Cocody to delivered subdivisions across Greater Abidjan — a decade of execution, no shortcuts on the ACD.',
      items: [
        {
          year: '2018',
          title: 'Founded in Abidjan',
          body: 'FirstClass Immobilier is licensed by the Ministry of Construction. First subdivisions in Cocody Angré.',
        },
        {
          year: '2020',
          title: 'Expansion across Greater Abidjan',
          body: 'New programs in Bingerville and Grand-Bassam. Structured ACD tracking established.',
        },
        {
          year: '2022',
          title: 'Turn-key offering',
          body: 'Launch of turn-key homes (villas and duplexes) and the single construction + ACD contract.',
        },
        {
          year: `${new Date().getFullYear()}`,
          title: 'Digital platform',
          body: 'Online client portal, remote reservation, photo construction tracking. 100 % remote for the diaspora.',
        },
      ],
    },
    pillars: {
      eyebrow: 'Foundations',
      title: 'What guides us',
      intro:
        'Four pillars — not slogans. They translate into concrete decisions at every stage.',
      valuesBullets: [
        'Contract transparency: everything in writing, zero hidden fees.',
        'On-time delivery: internal penalties if the site slips.',
        'Single-agent ownership: one advisor from first call to keys.',
      ],
      visionBullets: [
        'Make Côte d\u2019Ivoire a regional reference for well-run housing.',
        'Make the ACD standard in every sale, without exception.',
        'Extend the model across WAEMU in the coming years.',
      ],
      missionBullets: [
        'Secure each land transaction with an enforceable title.',
        'Open ownership to the diaspora through 100 % digital channels.',
        'Deliver on timelines we can keep, not promises.',
      ],
      productsBullets: [
        'Serviced land plots (surveyed, ACD included)',
        'Turn-key homes (villas, duplexes)',
        'Full subdivisions with common areas',
        'Rental management and guided resale',
      ],
    },
    process: {
      eyebrow: 'Our approach',
      title: 'How we actually work',
      intro: 'A repeatable process — every step documented on the client side, from first call to keys handover.',
      steps: [
        {
          title: 'Listen & advise',
          body: 'We understand your project: primary home, investment, retirement prep, diaspora buy. We never push a program that doesn\u2019t fit.',
        },
        {
          title: 'Land sourcing',
          body: 'Zones selected after due diligence (title, access, potential). You get the full pack before committing.',
        },
        {
          title: 'Secure reservation',
          body: 'Deposit paid, lot locked under your name, contract signed. Everything traceable from your client portal.',
        },
        {
          title: 'Servicing or construction',
          body: 'Weekly photo updates, payments staged against progress, visit the site any time.',
        },
        {
          title: 'ACD procedure',
          body: 'We run the administrative procedure (registry, publication, recording). You see progress live.',
        },
        {
          title: 'Final handover',
          body: 'Keys + physical ACD in your hands — or DHL-shipped for the diaspora. Your client portal stays active for life.',
        },
      ],
    },
    trust: {
      eyebrow: 'Why trust us',
      title: 'Proof over promises',
      intro: 'A serious developer is measured by titles delivered, not by 3D renders. Our numbers speak for us.',
      items: [
        { title: `${data.acdDelivered}+ ACD delivered`, body: 'Every sale ends with an enforceable, documented title.' },
        { title: 'Ministerial license', body: 'Licensed developer, recognized by the Ministry of Construction of Côte d\u2019Ivoire.' },
        { title: 'Secure payments', body: 'Bank transfer, check, and Mobile Money. Digital receipts systematically.' },
        { title: 'Lifetime client portal', body: 'All your documents, payments and construction photos stay accessible after handover.' },
      ],
    },
    partners: {
      eyebrow: 'Ecosystem',
      intro: 'Notaries, banks, surveying firms, insurers — partners selected for the reliability of their processes.',
      placeholder: 'Partner',
    },
    services: {
      eyebrow: 'Our trades',
      title: 'Our Services',
      intro: 'Six complementary disciplines under one roof, to deliver every project end-to-end.',
      expand: 'See details',
      collapse: 'Collapse',
      items: [
        {
          slug: 'promotion',
          image: { src: SERVICE_IMAGES.promotionImmobiliere.src, alt: SERVICE_IMAGES.promotionImmobiliere.alt.en },
          title: 'Real-estate development',
          lede: 'Discover our innovative property projects.',
          body: 'Our developments stand out for their contemporary design and functionality. Each project is built in partnership with renowned architects and sector experts, blending aesthetics, comfort and durability.',
          bullets: [
            'Prime locations: shops, schools, transit, business hubs.',
            'Investment opportunities with steady returns.',
            'Premium quality at accessible price points.',
          ],
        },
        {
          slug: 'amenagement',
          image: { src: SERVICE_IMAGES.amenagementFoncier.src, alt: SERVICE_IMAGES.amenagementFoncier.alt.en },
          title: 'Land development',
          lede: 'Make the most of your parcel.',
          body: 'We unlock the potential of your land thanks to deep regulatory knowledge and a strategic approach. We create functional and beautiful outdoor spaces.',
          bullets: [
            'In-depth feasibility studies.',
            'Tailored planning and concept design.',
            'Site works: clearing, roads, water, electricity.',
          ],
        },
        {
          slug: 'construction',
          image: { src: SERVICE_IMAGES.construction.src, alt: SERVICE_IMAGES.construction.alt.en },
          title: 'Construction',
          lede: 'Build with confidence.',
          body: 'Our construction teams deliver high-quality buildings, on time and on budget. Premium materials and modern techniques ensure durability and safety on every project.',
          bullets: [
            'Quality and safety: top materials and modern techniques.',
            'Strict respect for deadlines and budgets.',
            'Dedicated, experienced team at every stage.',
          ],
        },
        {
          slug: 'renovation',
          image: { src: SERVICE_IMAGES.renovation.src, alt: SERVICE_IMAGES.renovation.alt.en },
          title: 'Building renovation',
          lede: 'Bring your buildings back to life.',
          body: 'An experienced crew with mastery of modern renovation techniques, premium materials and rigorous management to deliver on time and on budget.',
          bullets: [
            'Interior: homes, offices, retail spaces.',
            'Exterior: facades, roofs, outdoor areas.',
            'Residential, commercial and public projects.',
          ],
        },
        {
          slug: 'architecture',
          image: { src: SERVICE_IMAGES.architecture.src, alt: SERVICE_IMAGES.architecture.alt.en },
          title: 'Architecture',
          lede: 'Turn ideas into reality.',
          body: 'A structured architecture department whose team is registered with the Order of Architects of Côte d’Ivoire. Innovative, durable, beautiful solutions — from concept to delivery.',
          bullets: [
            'Bespoke design and building-permit handling.',
            'Contractor selection and site supervision.',
            'Residential, commercial and public-space projects.',
          ],
        },
        {
          slug: 'transaction',
          image: { src: SERVICE_IMAGES.transaction.src, alt: SERVICE_IMAGES.transaction.alt.en },
          title: 'Real-estate transactions',
          lede: 'Simplify your property deals.',
          body: 'Specialists in real-estate transactions: buy, sell and rent. A strong network of buyers and sellers, transparent and professional at every step.',
          bullets: [
            'Listing and accurate market valuation.',
            'Property management: rentals and upkeep.',
            'Residential, commercial and land.',
          ],
        },
      ] satisfies ServiceItem[],
    },
    finalCta: {
      title: 'Want to explore our programs?',
      body: 'Browse on-sale lots, or book time directly with an agent.',
      primary: 'View programs',
      secondary: 'Talk to an agent',
    },
  }

  return l === 'fr' ? fr : en
}
