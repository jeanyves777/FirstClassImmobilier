import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { PageShell } from '@/components/fci/PageShell'
import { prisma } from '@/lib/db'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'
import { buildSeo } from '@/lib/seo'
import { TEAM_IMAGES } from '@/lib/stock-images'
import { KeyHandover, BlueprintGrid } from '@/components/fci/illustrations'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/nos-equipes'>): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  return buildSeo({
    locale: l,
    path: '/nos-equipes',
    title:
      l === 'fr'
        ? 'Notre équipe — FirstClass Immobilier'
        : 'Our team — FirstClass Immobilier',
    description:
      l === 'fr'
        ? 'Une équipe pluridisciplinaire — commercial, juridique, architecture, chantier, ACD, finance, digital — au service de votre projet immobilier à Abidjan.'
        : 'A multidisciplinary team — sales, legal, architecture, construction, ACD, finance, digital — at the service of your real-estate project in Abidjan.',
  })
}

export default async function TeamPage({ params }: PageProps<'/[locale]/nos-equipes'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('team')
  const l = locale as Locale

  const members = await prisma.teamMember.findMany({
    orderBy: [{ order: 'asc' }, { fullName: 'asc' }],
  })

  const photoIds = members.map((m) => m.photoId).filter((v): v is string => !!v)
  const photos = photoIds.length
    ? await prisma.media.findMany({
        where: { id: { in: photoIds } },
        select: { id: true, url: true },
      })
    : []
  const photoById = new Map(photos.map((p) => [p.id, p.url]))

  const c = copy(l)

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={t('intro')} wide>
      {/* Intro block */}
      <section className="mb-14 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface">
        <div className="grid lg:grid-cols-[1.3fr_1fr]">
          <div className="p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {c.intro.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {c.intro.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{c.intro.body}</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <HeadlineStat value={String(members.length || c.intro.fallbackTeamSize)} label={c.intro.statTeam} />
              <HeadlineStat value="24h" label={c.intro.statResponse} />
              <HeadlineStat value="FR / EN" label={c.intro.statLanguages} />
            </div>
          </div>
          <div className="relative min-h-[280px] bg-surface-muted lg:min-h-0">
            <Image
              src={TEAM_IMAGES.group.src}
              alt={TEAM_IMAGES.group.alt[l]}
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Team grid */}
      <section className="mb-16">
        <SectionHeader eyebrow={c.members.eyebrow} title={c.members.title} intro={c.members.intro} />
        {members.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[color:var(--border)] bg-surface-muted p-10 text-center">
            <p className="text-sm text-muted">{c.members.empty}</p>
            <Link
              href="/contacts"
              className="mt-4 inline-flex items-center rounded-full bg-[color:var(--brand-navy)] px-5 py-2 text-xs font-semibold text-white hover:bg-[color:var(--brand-navy-700)]"
            >
              {c.members.emptyCta}
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => {
              const url = m.photoId ? photoById.get(m.photoId) : undefined
              return (
                <li
                  key={m.id}
                  className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_28px_70px_-28px_rgba(15,23,42,.35)]"
                >
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-[color:var(--brand-navy-700)] to-[color:var(--brand-navy)]">
                    {url && (
                      <Image
                        src={url}
                        alt={m.fullName}
                        fill
                        sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                  <div className="space-y-1 p-5">
                    <p className="font-display text-lg font-semibold text-foreground">
                      {m.fullName}
                    </p>
                    <p className="text-sm text-muted">{tr(m.role, l)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Values in action */}
      <section className="mb-16">
        <SectionHeader eyebrow={c.values.eyebrow} title={c.values.title} intro={c.values.intro} />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.values.items.map((v) => (
            <article
              key={v.title}
              className="rounded-2xl border border-[color:var(--border)] bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-navy)]/30 hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,.25)]"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
                {v.icon}
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Expertise pillars */}
      <section className="relative mb-16 overflow-hidden rounded-2xl bg-[color:var(--brand-navy)] p-8 text-white sm:p-10">
        <BlueprintGrid
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1] [filter:brightness(0)_invert(1)]"
        />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {c.expertise.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
              {c.expertise.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{c.expertise.intro}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {c.expertise.items.map((x) => (
              <li key={x.title} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="font-semibold">{x.title}</p>
                <p className="mt-1 text-xs text-white/70">{x.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recruitment CTA */}
      <section className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface p-8 sm:p-10">
        <KeyHandover
          aria-hidden
          className="pointer-events-none absolute -right-6 -bottom-6 hidden h-48 w-80 opacity-30 lg:block"
        />
        <div className="relative grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {c.recruit.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {c.recruit.title}
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">{c.recruit.body}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {c.recruit.roles.map((r) => (
                <li
                  key={r}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-red)]" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/contacts#postuler"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-red-600)]"
            >
              {c.recruit.primary}
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              {c.recruit.secondary}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

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

// ─────────────────────────────────────────────────────────────────────────

function copy(l: Locale) {
  const IconUsers = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
  const IconChat = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
  const IconCheck = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
  const IconHeart = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )

  const fr = {
    intro: {
      eyebrow: 'Les personnes derrière FCI',
      title: 'Une équipe pluridisciplinaire au service de votre projet',
      body: 'Des commerciaux, architectes, ingénieurs civils, juristes et chargés de suivi ACD — tous rassemblés sous le même toit à Abidjan. Un seul agent dédié vous accompagne de la visite à la remise des clés.',
      fallbackTeamSize: 25,
      statTeam: 'collaborateurs',
      statResponse: 'délai de réponse',
      statLanguages: 'langues',
    },
    members: {
      eyebrow: 'Le team',
      title: 'Celles et ceux qui font FCI chaque jour',
      intro:
        'Profils triés sur le volet, présentés ici par ordre d\u2019ancienneté. Pour contacter un membre précis, passez par les Contacts.',
      empty: 'Les présentations de l\u2019équipe seront publiées prochainement.',
      emptyCta: 'Nous contacter en attendant',
    },
    values: {
      eyebrow: 'Comment on travaille',
      title: 'Quatre valeurs qui se voient dans nos actes',
      intro: 'Pas des slogans — ces valeurs se traduisent par des règles concrètes dans notre quotidien.',
      items: [
        {
          icon: IconCheck,
          title: 'Transparence',
          body: 'Tout est écrit au contrat : prix, échéancier, pénalités. Aucun frais caché, jamais.',
        },
        {
          icon: IconUsers,
          title: 'Proximité',
          body: 'Un seul agent dédié par client, du premier contact à la remise des clés.',
        },
        {
          icon: IconHeart,
          title: 'Exigence',
          body: 'Un contrôle qualité à chaque étape du chantier — gros œuvre, finitions, ACD.',
        },
        {
          icon: IconChat,
          title: 'Réactivité',
          body: 'Réponses sous 2 h ouvrées par e-mail ou WhatsApp, suivi proactif des dossiers.',
        },
      ],
    },
    expertise: {
      eyebrow: 'Nos expertises internes',
      title: 'Cinq métiers sous un même toit',
      intro:
        'Nous ne sous-traitons pas le cœur du métier. Le suivi commercial, juridique et technique reste chez FCI — c\u2019est là que se joue la qualité.',
      items: [
        { title: 'Commercial & relation client', body: 'Conseil, accompagnement diaspora, visites virtuelles.' },
        { title: 'Juridique & ACD', body: 'Due diligence foncière, procédure ACD, notaires partenaires.' },
        { title: 'Architecture & conception', body: 'Plans types, plans custom, études solaires.' },
        { title: 'Ingénierie & suivi chantier', body: 'Gros œuvre, finitions, raccordements, contrôles qualité.' },
        { title: 'Finance & paiements', body: 'Échéanciers, virements internationaux, suivi encaissements.' },
        { title: 'Plateforme digitale', body: 'Espace client, chatbot, photos chantier en temps réel.' },
      ],
    },
    recruit: {
      eyebrow: 'Rejoignez-nous',
      title: 'Nous recrutons dans plusieurs métiers',
      body: 'Vous êtes passionné par l\u2019immobilier en Côte d\u2019Ivoire et voulez travailler dans une équipe sérieuse, bilingue et tournée vers la diaspora ? Déposez votre candidature via le formulaire Postuler.',
      roles: [
        'Commercial(e) terrain',
        'Chargé(e) de projet ACD',
        'Chef de chantier',
        'Architecte / dessinateur',
        'Responsable diaspora',
        'Développeur full-stack',
      ],
      primary: 'Postuler',
      secondary: 'Nous contacter',
    },
  }

  const en = {
    intro: {
      eyebrow: 'The people behind FCI',
      title: 'A multidisciplinary team at the service of your project',
      body: 'Sales advisors, architects, civil engineers, legal officers and ACD coordinators — all under one roof in Abidjan. A single dedicated agent walks you from first visit to keys handover.',
      fallbackTeamSize: 25,
      statTeam: 'team members',
      statResponse: 'response time',
      statLanguages: 'languages',
    },
    members: {
      eyebrow: 'The team',
      title: 'The people who make FCI every day',
      intro:
        'Hand-picked profiles, shown in seniority order. To reach a specific member, go through Contacts.',
      empty: 'Team profiles will be published shortly.',
      emptyCta: 'Contact us in the meantime',
    },
    values: {
      eyebrow: 'How we work',
      title: 'Four values you can see in our actions',
      intro: 'Not slogans — these values translate into concrete daily rules.',
      items: [
        {
          icon: IconCheck,
          title: 'Transparency',
          body: 'Everything is in the contract: price, schedule, penalties. No hidden fees, ever.',
        },
        {
          icon: IconUsers,
          title: 'Closeness',
          body: 'One dedicated agent per client, from the first call to the keys handover.',
        },
        {
          icon: IconHeart,
          title: 'Exacting standards',
          body: 'Quality control at every construction stage — structure, finishing, ACD.',
        },
        {
          icon: IconChat,
          title: 'Responsiveness',
          body: 'Answers within 2 working hours by email or WhatsApp, proactive file follow-up.',
        },
      ],
    },
    expertise: {
      eyebrow: 'Our in-house expertise',
      title: 'Five disciplines under one roof',
      intro:
        'We don\u2019t outsource the core of the job. Commercial, legal and technical follow-up stays at FCI — that\u2019s where quality is won.',
      items: [
        { title: 'Sales & client relations', body: 'Advisory, diaspora support, virtual tours.' },
        { title: 'Legal & ACD', body: 'Land due diligence, ACD procedure, partner notaries.' },
        { title: 'Architecture & design', body: 'Standard plans, custom plans, solar studies.' },
        { title: 'Engineering & site tracking', body: 'Structural, finishing, utilities, quality checks.' },
        { title: 'Finance & payments', body: 'Schedules, international wires, collection follow-up.' },
        { title: 'Digital platform', body: 'Client portal, chatbot, live construction photos.' },
      ],
    },
    recruit: {
      eyebrow: 'Join us',
      title: 'We\u2019re hiring across several roles',
      body: 'Passionate about real estate in Côte d\u2019Ivoire and want to work in a serious, bilingual, diaspora-focused team? Apply through the Apply form on the Contacts page.',
      roles: [
        'Field sales advisor',
        'ACD project manager',
        'Site supervisor',
        'Architect / draftsman',
        'Diaspora manager',
        'Full-stack developer',
      ],
      primary: 'Apply',
      secondary: 'Contact us',
    },
  }

  return l === 'fr' ? fr : en
}
