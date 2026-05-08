import { setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import type { Locale } from '@/i18n/routing'

export default async function CGUPage({
  params,
}: PageProps<'/[locale]/legal/cgu'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale

  const fr = {
    eyebrow: 'Conditions',
    title: 'Conditions d\u2019utilisation',
    intro:
      'Les présentes conditions régissent l\u2019utilisation du site firstclassimmo.com et de l\u2019espace client FCI.',
    updated: 'Dernière mise à jour : avril 2026',
    sections: [
      {
        h: '1. Objet',
        p: 'Le site permet de découvrir les programmes immobiliers FCI, de demander une visite, de réserver un lot et, pour les acquéreurs, de suivre leur projet via un espace client sécurisé.',
      },
      {
        h: '2. Création de compte',
        list: [
          'L\u2019inscription est gratuite et nécessite une adresse e-mail valide.',
          'L\u2019utilisateur garantit l\u2019exactitude des informations fournies.',
          'Chaque compte est strictement personnel. L\u2019utilisateur est responsable de la confidentialité de son mot de passe.',
          'FCI peut suspendre tout compte en cas d\u2019usage contraire aux présentes CGU.',
        ],
      },
      {
        h: '3. Réservations et ventes',
        list: [
          'La réservation d\u2019un lot n\u2019est effective qu\u2019après confirmation par un agent FCI.',
          'La vente fait l\u2019objet d\u2019un contrat distinct, signé entre FCI et l\u2019acquéreur, conforme au droit ivoirien.',
          'Les prix affichés sont indicatifs et peuvent évoluer ; seul le contrat signé fait foi.',
        ],
      },
      {
        h: '4. Contenu et propriété intellectuelle',
        p: 'L\u2019ensemble des contenus (textes, images, vidéos, plans, visites virtuelles) reste la propriété exclusive de FirstClass Immobilier. Toute reproduction sans autorisation écrite est interdite.',
      },
      {
        h: '5. Responsabilité',
        list: [
          'FCI met en œuvre les meilleurs efforts pour assurer la disponibilité du site, sans garantie d\u2019accès continu.',
          'Les informations publiées le sont à titre indicatif ; il appartient à l\u2019utilisateur de les vérifier avant tout engagement.',
          'FCI ne saurait être tenue responsable des dommages indirects résultant de l\u2019utilisation du site.',
        ],
      },
      {
        h: '6. Données personnelles',
        p: 'Le traitement des données personnelles est détaillé dans la Politique de confidentialité, conforme à la loi ivoirienne n°2013-450.',
      },
      {
        h: '7. Loi applicable et juridiction',
        p: 'Les présentes CGU sont soumises au droit ivoirien. Tout litige relève des tribunaux d\u2019Abidjan.',
      },
    ],
  }

  const en = {
    eyebrow: 'Terms',
    title: 'Terms of use',
    intro: 'These terms govern the use of firstclassimmo.com and the FCI client area.',
    updated: 'Last updated: April 2026',
    sections: [
      {
        h: '1. Purpose',
        p: 'The site allows visitors to discover FCI real-estate programs, request visits, reserve lots, and — for buyers — track their project through a secure client area.',
      },
      {
        h: '2. Account creation',
        list: [
          'Registration is free and requires a valid email address.',
          'The user warrants the accuracy of the information provided.',
          'Each account is strictly personal. The user is responsible for keeping their password confidential.',
          'FCI may suspend any account in case of misuse contrary to these Terms.',
        ],
      },
      {
        h: '3. Reservations and sales',
        list: [
          'A lot reservation only becomes effective once confirmed by an FCI agent.',
          'The sale is subject to a separate contract signed between FCI and the buyer, governed by Ivorian law.',
          'Prices shown are indicative and subject to change; only the signed contract is binding.',
        ],
      },
      {
        h: '4. Content and intellectual property',
        p: 'All content (text, images, videos, plans, virtual tours) remains the exclusive property of FirstClass Immobilier. Any reproduction without written permission is prohibited.',
      },
      {
        h: '5. Liability',
        list: [
          'FCI makes best efforts to ensure site availability, with no guarantee of continuous access.',
          'Information published is indicative; users must verify it before acting on it.',
          'FCI is not liable for indirect damages arising from use of the site.',
        ],
      },
      {
        h: '6. Personal data',
        p: 'Personal data processing is detailed in the Privacy policy, compliant with Ivorian law no. 2013-450.',
      },
      {
        h: '7. Governing law and jurisdiction',
        p: 'These Terms are governed by Ivorian law. Any dispute falls within the jurisdiction of the courts of Abidjan.',
      },
    ],
  }

  const t = l === 'fr' ? fr : en

  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <p className="mb-6 text-xs text-muted">{t.updated}</p>
      <div className="space-y-6">
        {t.sections.map((s) => (
          <section key={s.h} className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-8">
            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">{s.h}</h2>
            {'p' in s && s.p && <p className="mb-2 text-sm leading-relaxed text-muted">{s.p}</p>}
            {'list' in s && s.list && (
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </PageShell>
  )
}
