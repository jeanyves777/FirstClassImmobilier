import { setRequestLocale } from 'next-intl/server'
import { PageShell } from '@/components/fci/PageShell'
import type { Locale } from '@/i18n/routing'

export default async function CookiesPage({
  params,
}: PageProps<'/[locale]/legal/cookies'>) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale

  const fr = {
    eyebrow: 'Cookies',
    title: 'Politique des cookies',
    intro:
      'Ce site utilise un nombre limité de cookies et traceurs techniques, décrits ci-dessous.',
    updated: 'Dernière mise à jour : avril 2026',
    tableLabels: { name: 'Nom', purpose: 'Finalité', duration: 'Durée', category: 'Catégorie' },
    cookies: [
      { name: 'next-auth.session-token', purpose: 'Authentification de l\u2019utilisateur connecté.', duration: 'Session', category: 'Strictement nécessaire' },
      { name: 'NEXT_LOCALE', purpose: 'Mémorisation de la langue choisie (FR/EN).', duration: '12 mois', category: 'Strictement nécessaire' },
      { name: 'theme', purpose: 'Préférence clair / sombre.', duration: '12 mois', category: 'Strictement nécessaire' },
      { name: 'fci_sid', purpose: 'Identifiant de session analytique (/api/track).', duration: '13 mois', category: 'Mesure d\u2019audience' },
    ],
    sections: [
      {
        h: 'Qu\u2019est-ce qu\u2019un cookie ?',
        p: 'Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d\u2019un site. Il permet au site de reconnaître votre navigateur lors de visites ultérieures.',
      },
      {
        h: 'Cookies strictement nécessaires',
        p: 'Ces cookies sont indispensables au fonctionnement du site : ils sécurisent votre connexion, mémorisent votre langue et votre thème. Ils ne peuvent pas être désactivés.',
      },
      {
        h: 'Cookies de mesure d\u2019audience',
        p: 'Nous utilisons notre propre outil d\u2019analytique interne (pas de Google Analytics ni de tiers) pour comprendre comment les visiteurs naviguent, améliorer le site, et mesurer l\u2019efficacité de nos programmes. Les données sont anonymisées et conservées 13 mois maximum.',
      },
      {
        h: 'Gestion de vos préférences',
        p: 'Vous pouvez à tout moment supprimer les cookies via les paramètres de votre navigateur (Chrome, Safari, Firefox, Edge). Leur suppression peut dégrader votre expérience sur le site (déconnexion, perte de préférence de langue).',
      },
    ],
  }

  const en = {
    eyebrow: 'Cookies',
    title: 'Cookie policy',
    intro: 'This site uses a limited number of cookies and technical trackers, listed below.',
    updated: 'Last updated: April 2026',
    tableLabels: { name: 'Name', purpose: 'Purpose', duration: 'Duration', category: 'Category' },
    cookies: [
      { name: 'next-auth.session-token', purpose: 'Authenticates the signed-in user.', duration: 'Session', category: 'Strictly necessary' },
      { name: 'NEXT_LOCALE', purpose: 'Stores your selected language (FR/EN).', duration: '12 months', category: 'Strictly necessary' },
      { name: 'theme', purpose: 'Light / dark theme preference.', duration: '12 months', category: 'Strictly necessary' },
      { name: 'fci_sid', purpose: 'Analytics session identifier (/api/track).', duration: '13 months', category: 'Analytics' },
    ],
    sections: [
      {
        h: 'What is a cookie?',
        p: 'A cookie is a small text file placed on your device when you visit a site. It lets the site recognize your browser on subsequent visits.',
      },
      {
        h: 'Strictly necessary cookies',
        p: 'These cookies are essential to the operation of the site: they secure your session and remember your language and theme. They cannot be disabled.',
      },
      {
        h: 'Analytics cookies',
        p: 'We use our own internal analytics tool (no Google Analytics or third parties) to understand how visitors navigate the site, improve it, and measure the effectiveness of our programs. Data is anonymized and retained for at most 13 months.',
      },
      {
        h: 'Managing your preferences',
        p: 'You can delete cookies at any time through your browser settings (Chrome, Safari, Firefox, Edge). Removing them may degrade your experience (sign-out, lost language preference).',
      },
    ],
  }

  const t = l === 'fr' ? fr : en

  return (
    <PageShell eyebrow={t.eyebrow} title={t.title} intro={t.intro}>
      <p className="mb-6 text-xs text-muted">{t.updated}</p>

      <section className="mb-8 overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[color:var(--border)] bg-surface-muted text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t.tableLabels.name}</th>
              <th className="px-4 py-3 font-medium">{t.tableLabels.purpose}</th>
              <th className="px-4 py-3 font-medium">{t.tableLabels.duration}</th>
              <th className="px-4 py-3 font-medium">{t.tableLabels.category}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {t.cookies.map((c) => (
              <tr key={c.name}>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.purpose}</td>
                <td className="px-4 py-3 text-muted">{c.duration}</td>
                <td className="px-4 py-3 text-muted">{c.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="space-y-6">
        {t.sections.map((s) => (
          <section key={s.h} className="rounded-2xl border border-[color:var(--border)] bg-surface p-6 sm:p-8">
            <h2 className="mb-3 font-display text-lg font-semibold text-foreground">{s.h}</h2>
            <p className="text-sm leading-relaxed text-muted">{s.p}</p>
          </section>
        ))}
      </div>
    </PageShell>
  )
}
