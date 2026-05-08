import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import { getSiteConfig } from '@/lib/site'
import { ApplicationForm, FeedbackForm } from './ContactForms'
import type { Locale } from '@/i18n/routing'
import Image from 'next/image'
import { buildSeo } from '@/lib/seo'
import { JsonLd, localBusinessLd } from '@/lib/seo/structured-data'
import { CONTACTS_IMAGES } from '@/lib/stock-images'
import { BlueprintGrid } from '@/components/fci/illustrations'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/contacts'>): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  return buildSeo({
    locale: l,
    path: '/contacts',
    title:
      l === 'fr'
        ? 'Contact — FirstClass Immobilier, Abidjan'
        : 'Contact — FirstClass Immobilier, Abidjan',
    description:
      l === 'fr'
        ? 'Téléphone, WhatsApp, e-mail, adresse et horaires d\u2019ouverture. Équipe joignable sous 2 h ouvrées du lundi au samedi.'
        : 'Phone, WhatsApp, email, address and opening hours. Team reachable within 2 working hours Monday to Saturday.',
  })
}

function waLink(whatsapp: string, msg?: string) {
  const digits = whatsapp.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base
}

export default async function ContactsPage({ params }: PageProps<'/[locale]/contacts'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('contact')
  const l = locale as Locale
  const site = await getSiteConfig()

  const mapQuery = encodeURIComponent(site.address)
  const hours = site.hours[l]
  const c = copy(l, site.whatsapp)

  return (
    <PageShell eyebrow="FCI" title={t('title')} intro={c.lead} wide>
      <JsonLd data={localBusinessLd(site, l)} />
      {/* Contact channel cards */}
      <section className="mb-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ChannelCard
            icon={<IconPhone />}
            label={t('phone')}
            primary={site.phone}
            href={`tel:${site.phone.replace(/\s/g, '')}`}
            note={c.channels.phoneNote}
          />
          <ChannelCard
            icon={<IconWhatsApp />}
            label={t('whatsapp')}
            primary={`+${site.whatsapp}`}
            href={waLink(site.whatsapp, c.channels.whatsappMessage)}
            external
            note={c.channels.whatsappNote}
            accent
          />
          <ChannelCard
            icon={<IconMail />}
            label={t('email')}
            primary={site.email}
            href={`mailto:${site.email}`}
            note={c.channels.emailNote}
          />
          <ChannelCard
            icon={<IconPin />}
            label={c.channels.visitLabel}
            primary={site.address}
            href={`https://www.google.com/maps?q=${mapQuery}`}
            external
            note={c.channels.visitNote}
          />
        </div>
      </section>

      {/* Map + opening hours */}
      <section className="mb-14 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-3 text-xs">
            <p className="font-semibold uppercase tracking-wider text-muted">
              {c.map.label}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[color:var(--brand-navy)] hover:underline dark:text-foreground"
            >
              {c.map.directions} →
            </a>
          </div>
          <iframe
            title="FirstClass Immobilier — Map"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            className="h-80 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
            {c.hours.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
            {c.hours.title}
          </h2>
          <ul className="mt-5 divide-y divide-[color:var(--border)] text-sm">
            {c.hours.schedule.map((row) => (
              <li key={row.day} className="flex items-center justify-between py-2.5">
                <span className="font-medium text-foreground">{row.day}</span>
                <span className={row.closed ? 'text-muted' : 'text-foreground'}>
                  {row.closed ? c.hours.closed : row.slots}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl bg-[color:var(--brand-red)]/5 p-3 text-xs leading-relaxed text-[color:var(--brand-red)]">
            {c.hours.note}
          </p>
          <p className="mt-3 text-xs text-muted">
            <span className="font-semibold text-foreground">{t('hours')} :</span> {hours}
          </p>
        </div>
      </section>

      {/* Meeting image banner */}
      <section className="mb-14 overflow-hidden rounded-2xl border border-[color:var(--border)]">
        <div className="relative aspect-[16/6] w-full bg-surface-muted">
          <Image
            src={CONTACTS_IMAGES.meeting.src}
            alt={CONTACTS_IMAGES.meeting.alt[l]}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--brand-navy)]/85 via-[color:var(--brand-navy)]/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 text-white sm:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-red)]">
              {l === 'fr' ? 'Un accueil humain' : 'Human support'}
            </p>
            <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold leading-tight sm:text-4xl">
              {l === 'fr'
                ? 'Un agent dédié pour chaque projet, FR ou EN.'
                : 'A dedicated agent for each project, FR or EN.'}
            </h2>
          </div>
        </div>
      </section>

      {/* How to reach us — transportation note */}
      <section className="relative mb-14 overflow-hidden rounded-2xl bg-[color:var(--brand-navy)] p-8 text-white sm:p-10">
        <BlueprintGrid
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] [filter:brightness(0)_invert(1)]"
        />
        <div className="relative grid gap-6 lg:grid-cols-3">
          <ReachTile icon={<IconCar />} title={c.reach.car.title} body={c.reach.car.body} />
          <ReachTile icon={<IconBus />} title={c.reach.transit.title} body={c.reach.transit.body} />
          <ReachTile icon={<IconPlane />} title={c.reach.airport.title} body={c.reach.airport.body} />
        </div>
      </section>

      {/* Visit FAQ */}
      <section className="mb-14">
        <SectionHeader eyebrow={c.faq.eyebrow} title={c.faq.title} intro={c.faq.intro} />
        <div className="mt-8 space-y-3">
          {c.faq.items.map((q) => (
            <details
              key={q.q}
              className="group rounded-xl border border-[color:var(--border)] bg-surface"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-foreground">
                {q.q}
                <span
                  aria-hidden
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-muted">{q.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Forms */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div id="postuler" className="scroll-mt-24">
          <ApplicationForm />
        </div>
        <div id="avis" className="scroll-mt-24">
          <FeedbackForm />
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

function ChannelCard({
  icon,
  label,
  primary,
  href,
  external,
  note,
  accent,
}: {
  icon: React.ReactNode
  label: string
  primary: string
  href: string
  external?: boolean
  note: string
  accent?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`flex h-full flex-col rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${
        accent
          ? 'border-transparent bg-[#25D366]/10 hover:border-[#25D366]/40'
          : 'border-[color:var(--border)] bg-surface hover:border-[color:var(--brand-navy)]/30'
      } hover:shadow-[0_24px_60px_-28px_rgba(15,23,42,.25)]`}
    >
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${
          accent
            ? 'bg-[#25D366] text-white'
            : 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]'
        }`}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 truncate font-display text-base font-semibold text-foreground">
        {primary}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{note}</p>
    </a>
  )
}

function ReachTile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[color:var(--brand-red)]">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/75">{body}</p>
      </div>
    </div>
  )
}

// Icons
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}
function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M20.5 3.48A11.84 11.84 0 0 0 12.04 0C5.5 0 .22 5.27.22 11.76a11.6 11.6 0 0 0 1.66 6.02L0 24l6.41-1.67a11.83 11.83 0 0 0 5.63 1.43h.01c6.54 0 11.82-5.28 11.82-11.77a11.68 11.68 0 0 0-3.35-8.51zM12.04 21.5h-.01a9.76 9.76 0 0 1-4.98-1.36l-.36-.22-3.8.99 1.01-3.71-.23-.38a9.67 9.67 0 0 1-1.47-5.1c0-5.36 4.38-9.72 9.76-9.72 2.6 0 5.05 1.01 6.89 2.85a9.66 9.66 0 0 1 2.85 6.87c0 5.36-4.38 9.78-9.76 9.78z" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function IconCar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 13h18l-2-6H5l-2 6zM5 13v5h4v-2h6v2h4v-5" />
      <circle cx="7.5" cy="15.5" r="1.5" />
      <circle cx="16.5" cy="15.5" r="1.5" />
    </svg>
  )
}
function IconBus() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="4" width="16" height="14" rx="2" />
      <path d="M4 11h16M6 18v2M18 18v2M7 15h.01M17 15h.01" />
    </svg>
  )
}
function IconPlane() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 2 20 2c-1 0-5 0-6.5 1.5L10 7 1.8 5.2c-.5-.1-.8.2-.4.6l5.3 3.5L4 14l-1.4.3c-.4 0-.4.6 0 .8l4.3 1.6 1.6 4.3c.2.4.8.4.8 0L9.7 20l4.7-2.7 3.5 5.3c.4.4.6 0 .5-.4z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function copy(l: Locale, whatsapp: string) {
  const fr = {
    lead:
      'Notre équipe est joignable par téléphone, WhatsApp, e-mail ou directement à nos bureaux. Choisissez le canal qui vous convient — nous répondons sous 2 h ouvrées.',
    channels: {
      phoneNote: 'Du lundi au samedi, pendant nos heures d\u2019ouverture.',
      whatsappNote: 'Notre canal le plus réactif. Écrivez-nous à toute heure.',
      whatsappMessage: 'Bonjour FirstClass Immobilier, je souhaiterais avoir plus d\u2019informations.',
      emailNote: 'Idéal pour les dossiers détaillés et les documents à joindre.',
      visitLabel: 'Visite au bureau',
      visitNote: 'Cocody Angré 7e Tranche. Ouvrez l\u2019itinéraire sur Google Maps.',
    },
    map: {
      label: 'Notre adresse',
      directions: 'Itinéraire',
    },
    hours: {
      eyebrow: 'Ouverture',
      title: 'Nos horaires d\u2019accueil',
      closed: 'Fermé',
      note: 'Prise de rendez-vous recommandée pour garantir la disponibilité d\u2019un commercial.',
      schedule: [
        { day: 'Lundi', slots: '08h00 – 17h00' },
        { day: 'Mardi', slots: '08h00 – 17h00' },
        { day: 'Mercredi', slots: '08h00 – 17h00' },
        { day: 'Jeudi', slots: '08h00 – 17h00' },
        { day: 'Vendredi', slots: '08h00 – 17h00' },
        { day: 'Samedi', slots: '09h00 – 12h30' },
        { day: 'Dimanche', slots: '', closed: true },
      ] as { day: string; slots: string; closed?: boolean }[],
    },
    reach: {
      car: {
        title: 'En voiture',
        body: 'Parking sécurisé disponible sur site. GPS : Cocody Angré 7e Tranche — notre enseigne est visible depuis la route principale.',
      },
      transit: {
        title: 'Transport en commun',
        body: 'Ligne SOTRA 82 arrêt « Angré Terminus » à 8 minutes à pied. Taxis et VTC largement disponibles.',
      },
      airport: {
        title: 'Depuis l\u2019aéroport',
        body: 'Environ 45 minutes depuis l\u2019aéroport Félix-Houphouët-Boigny (ABJ) en taxi ou VTC.',
      },
    },
    faq: {
      eyebrow: 'Venir nous voir',
      title: 'Questions pratiques',
      intro:
        'Tout ce qu\u2019il faut savoir avant de passer au bureau ou de nous appeler.',
      items: [
        {
          q: 'Dois-je prendre rendez-vous avant de venir au bureau ?',
          a: 'Ce n\u2019est pas obligatoire, mais fortement recommandé. Un rendez-vous garantit qu\u2019un commercial est disponible pour votre profil spécifique (terrain, maison clé en main, diaspora). Vous pouvez le prendre par WhatsApp ou via le formulaire Feedback ci-dessous.',
        },
        {
          q: 'Les visites de programmes se font-elles depuis le bureau ?',
          a: 'Les visites se font directement sur site. Nous vous y accompagnons en voiture depuis le bureau, ou nous vous retrouvons sur place selon votre préférence. Durée moyenne d\u2019une visite : 1 h.',
        },
        {
          q: 'Quels documents apporter pour une première visite ?',
          a: 'Pour un premier contact, aucun document n\u2019est nécessaire. Pour une réservation, nous demandons une pièce d\u2019identité, un justificatif de domicile, et une preuve de capacité financière (non obligatoire au premier rendez-vous).',
        },
        {
          q: 'Je suis à l\u2019étranger, puis-je tout faire à distance ?',
          a: 'Oui, c\u2019est un cas que nous maîtrisons : visite virtuelle en live, signature électronique ou par procuration, virement international, suivi chantier par espace client, livraison ACD par DHL. N\u2019hésitez pas à nous contacter par e-mail ou WhatsApp.',
        },
        {
          q: 'Combien de temps dure un rendez-vous type ?',
          a: 'Un premier rendez-vous dure 30 à 45 minutes — présentation de nos programmes, réponses à vos questions, remise d\u2019une documentation détaillée. Une visite de site s\u2019étend sur 1 à 2 h selon les programmes visités.',
        },
      ],
    },
  }

  const en = {
    lead:
      'Our team is reachable by phone, WhatsApp, email, or directly at our offices. Pick the channel that suits you — we answer within 2 working hours.',
    channels: {
      phoneNote: 'Monday to Saturday during our opening hours.',
      whatsappNote: 'Our fastest channel. Message us anytime.',
      whatsappMessage: "Hello FirstClass Immobilier, I'd like more information.",
      emailNote: 'Best for detailed files and documents to attach.',
      visitLabel: 'Office visit',
      visitNote: 'Cocody Angré 7ème Tranche. Open directions on Google Maps.',
    },
    map: {
      label: 'Our address',
      directions: 'Directions',
    },
    hours: {
      eyebrow: 'Opening',
      title: 'Office hours',
      closed: 'Closed',
      note: 'Appointments are recommended to ensure an advisor is available for you.',
      schedule: [
        { day: 'Monday', slots: '8:00 AM – 5:00 PM' },
        { day: 'Tuesday', slots: '8:00 AM – 5:00 PM' },
        { day: 'Wednesday', slots: '8:00 AM – 5:00 PM' },
        { day: 'Thursday', slots: '8:00 AM – 5:00 PM' },
        { day: 'Friday', slots: '8:00 AM – 5:00 PM' },
        { day: 'Saturday', slots: '9:00 AM – 12:30 PM' },
        { day: 'Sunday', slots: '', closed: true },
      ] as { day: string; slots: string; closed?: boolean }[],
    },
    reach: {
      car: {
        title: 'By car',
        body: 'Secure on-site parking available. GPS: Cocody Angré 7ème Tranche — our signage is visible from the main road.',
      },
      transit: {
        title: 'Public transport',
        body: 'SOTRA line 82, "Angré Terminus" stop — 8-minute walk. Taxis and ride-hails widely available.',
      },
      airport: {
        title: 'From the airport',
        body: 'About 45 minutes by taxi or ride-hail from Félix-Houphouët-Boigny International (ABJ).',
      },
    },
    faq: {
      eyebrow: 'Visiting us',
      title: 'Practical questions',
      intro: "Everything to know before stopping by the office or calling us.",
      items: [
        {
          q: 'Do I need an appointment to visit the office?',
          a: "Not required, but strongly recommended. Booking guarantees an advisor is available for your specific profile (land, turn-key home, diaspora). You can book by WhatsApp or via the Feedback form below.",
        },
        {
          q: 'Are program visits done from the office?',
          a: 'Program visits happen on site. We can drive you there from the office, or meet you on-site depending on your preference. Typical visit: 1 hour.',
        },
        {
          q: 'What documents should I bring for a first visit?',
          a: 'For a first contact, no documents are needed. For a reservation we ask for ID, proof of address, and a proof of financial capacity (not required at first meeting).',
        },
        {
          q: "I'm abroad — can I do everything remotely?",
          a: 'Yes, a case we handle routinely: live virtual tour, electronic or proxy signing, international wire transfer, construction tracked via the client portal, ACD delivered by DHL. Reach us by email or WhatsApp.',
        },
        {
          q: 'How long does a typical meeting last?',
          a: 'A first meeting runs 30–45 minutes — program walkthrough, Q&A, detailed documentation handed over. A site tour takes 1–2 hours depending on programs visited.',
        },
      ],
    },
  }
  return l === 'fr' ? fr : en
}
