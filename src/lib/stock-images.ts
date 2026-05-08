/**
 * Curated stock imagery used across the public site.
 *
 * Sourced from Unsplash (free for commercial use per Unsplash License).
 * URLs are parametrized with fit/quality so Next's `next/image` optimizer
 * receives a reasonable initial resolution and can further adjust per viewport.
 *
 * When the client provides their own photography, swap the URLs here — callers
 * always import from this registry so there's one place to update.
 */

type StockImage = {
  src: string
  alt: { fr: string; en: string }
  credit?: string
}

const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

/** Hero slideshow on the home page — 4 cinematic real-estate shots. */
export const HERO_SLIDES: StockImage[] = [
  {
    src: '/brand/hero-family.jpg',
    alt: {
      fr: 'Famille recevant les clés de leur villa avec FirstClass Immobilier',
      en: 'Family receiving the keys to their villa from FirstClass Immobilier',
    },
    credit: 'FirstClass Immobilier',
  },
  {
    src: U('1564013799919-ab600027ffc6'),
    alt: {
      fr: 'Vue aérienne d\u2019un quartier résidentiel haut de gamme',
      en: 'Aerial view of a premium residential neighborhood',
    },
    credit: 'Unsplash',
  },
  {
    src: U('1600585154340-be6161a56a0c'),
    alt: {
      fr: 'Villa contemporaine avec piscine au crépuscule',
      en: 'Contemporary villa with pool at dusk',
    },
    credit: 'Unsplash',
  },
  {
    src: U('1570129477492-45c003edd2be'),
    alt: {
      fr: 'Maisons alignées dans un lotissement neuf',
      en: 'Homes lined up in a new subdivision',
    },
    credit: 'Unsplash',
  },
  {
    src: U('1572120360610-d971b9d7767c'),
    alt: {
      fr: 'Façade d\u2019une villa moderne avec terrasse',
      en: 'Facade of a modern villa with terrace',
    },
    credit: 'Unsplash',
  },
]

/** About / story section — building + architect-style shots. */
export const ABOUT_IMAGES = {
  story: {
    src: '/brand/facade.jpg',
    alt: {
      fr: 'Façade des bureaux FirstClass Immobilier à Cocody Angré 7e Tranche',
      en: 'FirstClass Immobilier office facade in Cocody Angré 7e Tranche',
    },
  },
  office: {
    src: U('1497366216548-37526070297c'),
    alt: {
      fr: 'Bureau collaboratif clair avec plans étalés',
      en: 'Bright collaborative office with plans on a table',
    },
  },
} as const

/** Nos Réalisations — hero for portfolio section when no delivered program images. */
export const PORTFOLIO_IMAGES = {
  delivered: {
    src: '/brand/realisations.jpg',
    alt: {
      fr: 'Cliente recevant son ACD avec un agent FirstClass Immobilier',
      en: 'Client receiving her ACD certificate from a FirstClass Immobilier agent',
    },
  },
} as const

/** Team page supporting imagery. */
export const TEAM_IMAGES = {
  group: {
    src: U('1522071820081-009f0129c71c'),
    alt: {
      fr: 'Équipe professionnelle en réunion autour d\u2019une table',
      en: 'Professional team meeting around a table',
    },
  },
} as const

/** Contacts page supporting imagery. */
export const CONTACTS_IMAGES = {
  meeting: {
    src: U('1556761175-5973dc0f32e7'),
    alt: {
      fr: 'Poignée de main entre un conseiller et un client',
      en: 'Handshake between an advisor and a client',
    },
  },
} as const

/** Service tile covers — branded marketing posters supplied by the client. */
export const SERVICE_IMAGES = {
  promotionImmobiliere: {
    src: '/brand/services/promotion-immobiliere.jpg',
    alt: {
      fr: 'Promotion immobilière — projets neufs FirstClass Immobilier',
      en: 'Real-estate development — FirstClass Immobilier new projects',
    },
  },
  amenagementFoncier: {
    src: '/brand/services/amenagement-foncier.jpg',
    alt: {
      fr: 'Aménagement foncier — viabilisation et planification',
      en: 'Land development — site preparation and planning',
    },
  },
  construction: {
    src: '/brand/services/construction.jpg',
    alt: {
      fr: 'Construction — bâtiments de haute qualité',
      en: 'Construction — high-quality buildings',
    },
  },
  architecture: {
    src: '/brand/services/architecture.jpg',
    alt: {
      fr: 'Architecture — conception et plans techniques',
      en: 'Architecture — design and technical drawings',
    },
  },
  renovation: {
    src: U('1503387762-cf66c10cb29c'),
    alt: {
      fr: 'Rénovation de bâtiments — réhabilitation et modernisation',
      en: 'Building renovation — refurbishment and modernization',
    },
  },
  transaction: {
    src: U('1560518883-ce09059eeffa'),
    alt: {
      fr: 'Transaction immobilière — achat, vente, location',
      en: 'Real-estate transactions — buy, sell, rent',
    },
  },
} as const

/** Activities fallback cover (used when no cover has been uploaded). */
export const ACTIVITY_FALLBACK: StockImage = {
  src: U('1511632765486-a01980e01a18'),
  alt: {
    fr: 'Événement d\u2019entreprise avec invités',
    en: 'Corporate event with guests',
  },
}
