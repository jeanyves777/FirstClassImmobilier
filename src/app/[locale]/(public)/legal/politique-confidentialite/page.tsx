import { setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import { getSiteConfig } from '@/lib/site'
import type { Locale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

export default async function PrivacyPage({
  params,
}: PageProps<'/[locale]/legal/politique-confidentialite'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const site = await getSiteConfig()
  const l = locale as Locale

  const fr = {
    eyebrow: 'Vos données',
    title: 'Politique de confidentialité',
    intro:
      'FirstClass Immobilier s\u2019engage à protéger la vie privée des personnes qui utilisent ce site, dans le respect de la loi ivoirienne n°2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel et des exigences de l\u2019Autorité de Protection des Données Personnelles (APDP).',
    updated: 'Dernière mise à jour : avril 2026',
    sections: [
      {
        h: 'Qui est responsable du traitement ?',
        p: `Le responsable de traitement est FirstClass Immobilier, dont le siège social est situé à ${site.address}. Vous pouvez nous joindre à ${site.email}.`,
      },
      {
        h: 'Quelles données collectons-nous ?',
        list: [
          'Données d\u2019identité : nom, prénom, date de naissance (pour les contrats).',
          'Données de contact : e-mail, téléphone, WhatsApp, adresse postale.',
          'Données de transaction : réservations, ventes, paiements, documents justificatifs téléversés (pièce d\u2019identité, justificatif de domicile, etc.).',
          'Données de connexion : adresse IP, navigateur, pages consultées, date de visite (journaux techniques et analytique interne).',
          'Cookies : voir la Politique Cookies.',
        ],
      },
      {
        h: 'Pourquoi traitons-nous vos données ?',
        list: [
          'Gestion de la relation client : réponse aux demandes, suivi des réservations, exécution du contrat de vente — base légale : contrat ou mesures précontractuelles.',
          'Obligations légales : facturation, comptabilité, lutte anti-blanchiment — base légale : obligation légale.',
          'Amélioration du site : mesure d\u2019audience, correction des incidents — base légale : intérêt légitime.',
          'Communication commerciale : newsletters, offres programmes — base légale : consentement.',
        ],
      },
      {
        h: 'Combien de temps conservons-nous vos données ?',
        list: [
          'Prospects : 3 ans à compter du dernier contact.',
          'Clients : durée du contrat + 10 ans (obligations comptables et fiscales).',
          'Cookies et journaux : 13 mois maximum.',
        ],
      },
      {
        h: 'Avec qui partageons-nous vos données ?',
        p: 'Vos données sont traitées par notre équipe FCI ainsi que, dans la stricte limite de leur mission, nos prestataires techniques : hébergeur du site, fournisseur e-mail transactionnel (SMTP FCI), notaires et banques partenaires pour la finalisation des transactions immobilières. Aucune donnée n\u2019est vendue à des tiers.',
      },
      {
        h: 'Transferts hors de Côte d\u2019Ivoire',
        p: 'Certains prestataires techniques peuvent être situés hors de Côte d\u2019Ivoire. Nous veillons à ce que ces transferts soient encadrés par des garanties appropriées (clauses contractuelles, hébergement UE, etc.).',
      },
      {
        h: 'Vos droits',
        p: 'Conformément à la loi n°2013-450, vous disposez d\u2019un droit d\u2019accès, de rectification, d\u2019opposition, d\u2019effacement, de limitation et de portabilité sur vos données, ainsi que du droit de définir des directives post-mortem.',
        list: [
          `Pour exercer ces droits : envoyez un e-mail à ${site.email} ou un courrier à ${site.address}, accompagné d\u2019un justificatif d\u2019identité.`,
          'Nous répondons sous 30 jours.',
          'Vous pouvez également introduire une réclamation auprès de l\u2019APDP (Autorité de Protection des Données Personnelles — https://www.apdp.ci).',
        ],
      },
      {
        h: 'Sécurité',
        p: 'Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables : mots de passe chiffrés (Argon2), connexion HTTPS, journalisation des accès, séparation des environnements. En cas de violation de données susceptible d\u2019engendrer un risque élevé pour vos droits, nous vous informerons dans les meilleurs délais.',
      },
    ],
  }

  const en = {
    eyebrow: 'Your data',
    title: 'Privacy policy',
    intro:
      'FirstClass Immobilier is committed to protecting the privacy of visitors to this site, in accordance with Ivorian Law no. 2013-450 of 19 June 2013 on personal data protection and the guidance of the APDP (Autorité de Protection des Données Personnelles).',
    updated: 'Last updated: April 2026',
    sections: [
      {
        h: 'Who is the data controller?',
        p: `The data controller is FirstClass Immobilier, with its registered office at ${site.address}. You may reach us at ${site.email}.`,
      },
      {
        h: 'What data do we collect?',
        list: [
          'Identity data: first name, last name, date of birth (for contracts).',
          'Contact data: email, phone, WhatsApp, postal address.',
          'Transaction data: reservations, sales, payments, supporting documents uploaded (ID, proof of address, etc.).',
          'Connection data: IP address, browser, pages viewed, visit date (technical logs and internal analytics).',
          'Cookies: see the Cookie policy.',
        ],
      },
      {
        h: 'Why do we process your data?',
        list: [
          'Client relationship: answering queries, tracking reservations, performing the sales contract — legal basis: contract or pre-contractual steps.',
          'Legal obligations: invoicing, accounting, AML — legal basis: legal obligation.',
          'Site improvement: audience measurement, incident resolution — legal basis: legitimate interest.',
          'Commercial communication: newsletters, program offers — legal basis: consent.',
        ],
      },
      {
        h: 'How long do we keep your data?',
        list: [
          'Prospects: 3 years from last contact.',
          'Clients: contract duration + 10 years (accounting & tax obligations).',
          'Cookies and logs: 13 months maximum.',
        ],
      },
      {
        h: 'Who do we share your data with?',
        p: 'Your data is processed by our FCI team and, strictly within the scope of their mission, by our technical service providers: site host, transactional email provider (FCI SMTP), and partner notaries and banks for real-estate closing. No data is sold to third parties.',
      },
      {
        h: 'Transfers outside Côte d\u2019Ivoire',
        p: 'Some technical providers may be located outside Côte d\u2019Ivoire. We ensure these transfers are framed by appropriate safeguards (contractual clauses, EU hosting, etc.).',
      },
      {
        h: 'Your rights',
        p: 'Under law no. 2013-450, you have rights of access, rectification, objection, erasure, limitation and portability, as well as the right to issue post-mortem directives.',
        list: [
          `To exercise these rights: email ${site.email} or write to ${site.address}, with proof of identity.`,
          'We will respond within 30 days.',
          'You may also lodge a complaint with the APDP (Autorité de Protection des Données Personnelles — https://www.apdp.ci).',
        ],
      },
      {
        h: 'Security',
        p: 'We implement reasonable technical and organizational measures: hashed passwords (Argon2), HTTPS connection, access logging, environment separation. In case of a data breach that poses a high risk to your rights, we will notify you promptly.',
      },
    ],
  }

  const t = l === 'fr' ? fr : en

  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <p className="mb-6 text-xs text-muted">{t.updated}</p>
      <div className="space-y-8">
        {t.sections.map((s) => (
          <Section key={s.h} h={s.h}>
            {'p' in s && s.p && <p className="mb-3 text-sm leading-relaxed text-muted">{s.p}</p>}
            {'list' in s && s.list && (
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
          </Section>
        ))}
      </div>
    </PageShell>
  )
}

function Section({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-8">
      <h2 className="mb-3 font-display text-xl font-semibold text-foreground">{h}</h2>
      {children}
    </section>
  )
}
