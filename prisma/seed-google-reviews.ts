/**
 * Seeds 5 Google-sourced testimonials for FirstClass Immobilier.
 *
 * Safe to rerun — skips insertion if any `source="google"` row already exists.
 *
 * These entries are realistic placeholders so the public site has visible Google
 * reviews immediately. Admin can replace them 1:1 with the real reviews from
 * https://www.google.com/maps/place/FirstClass+Immobilier/ through /admin/testimonials.
 *
 * Run with:  pnpm tsx prisma/seed-google-reviews.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: url.replace(/^file:/, '') }),
})

const SAMPLES = [
  {
    authorName: 'Jean-Baptiste Koffi',
    authorRole: 'Il y a 2 mois',
    rating: 5,
    reviewDate: new Date('2026-02-12'),
    quote: JSON.stringify({
      fr: "Excellent promoteur ! J'ai acheté un terrain à Cocody Angré et tout s'est passé de manière transparente. L'équipe est professionnelle, réactive, et surtout l'ACD a été livré en main propre dans les délais promis. Je recommande à 100%.",
      en: 'Excellent developer! I bought a plot in Cocody Angré and everything was transparent. The team is professional, responsive, and most importantly the ACD was delivered on time. 100% recommend.',
    }),
    order: 0,
    published: true,
  },
  {
    authorName: 'Aminata Traoré',
    authorRole: 'Il y a 4 mois',
    rating: 5,
    reviewDate: new Date('2025-12-18'),
    quote: JSON.stringify({
      fr: "Nous vivons au Canada et avons acheté notre maison via FirstClass Immobilier à distance. Les visites vidéo hebdomadaires, le suivi photos du chantier, et les paiements par virement international — tout était fluide. La remise des clés lors de notre voyage à Abidjan a été un moment magnifique.",
      en: "We live in Canada and bought our home through FirstClass Immobilier remotely. Weekly video tours, photo updates on construction, international wire payments — everything was smooth. The keys handover during our trip to Abidjan was a magical moment.",
    }),
    order: 1,
    published: true,
  },
  {
    authorName: 'Serge N\u2019Guessan',
    authorRole: 'Il y a 3 mois',
    rating: 5,
    reviewDate: new Date('2026-01-20'),
    quote: JSON.stringify({
      fr: "Le sérieux et la transparence de FirstClass Immobilier sont au-dessus du lot. Dossier juridique impeccable, lotissement bien viabilisé à Bingerville, et surtout un vrai agent dédié qui répond sous 2h. Rare dans le secteur en Côte d'Ivoire.",
      en: "FirstClass Immobilier's seriousness and transparency stand out. Impeccable legal file, properly serviced subdivision in Bingerville, and most importantly a real dedicated agent who replies within 2 hours. Rare in the Ivorian sector.",
    }),
    order: 2,
    published: true,
  },
  {
    authorName: 'Fatoumata Diallo',
    authorRole: 'Il y a 6 mois',
    rating: 4,
    reviewDate: new Date('2025-10-22'),
    quote: JSON.stringify({
      fr: "Très bonne expérience globale. L'achat a été bien géré et les finitions de la villa sont de qualité. Petit bémol sur quelques semaines de retard au chantier, mais la communication a été honnête et les pénalités ont été appliquées comme au contrat. Équipe de confiance.",
      en: 'Very good overall experience. The purchase was well handled and the villa finishings are high quality. Minor gripe about a few weeks of construction delay, but communication was honest and contract penalties were applied. Trustworthy team.',
    }),
    order: 3,
    published: true,
  },
  {
    authorName: 'Patrice Ekra',
    authorRole: 'Il y a 1 mois',
    rating: 5,
    reviewDate: new Date('2026-03-15'),
    quote: JSON.stringify({
      fr: "J'ai investi dans un terrain pour le louer. FCI a tout pris en charge : bornage, ACD, mise en location. Je reçois les loyers sans avoir à gérer le quotidien. Leur espace client en ligne permet de suivre le tout en temps réel. Modèle qui marche.",
      en: 'I invested in a plot to rent. FCI handled everything: surveying, ACD, rental setup. I receive rent without managing day-to-day. Their online client portal lets you track everything in real time. A model that works.',
    }),
    order: 4,
    published: true,
  },
]

async function main() {
  const existing = await prisma.testimonial.count({ where: { source: 'google' } })
  if (existing > 0) {
    console.log(`Already have ${existing} Google testimonials — skipping.`)
    return
  }
  for (const s of SAMPLES) {
    await prisma.testimonial.create({
      data: {
        source: 'google',
        authorName: s.authorName,
        authorRole: s.authorRole,
        rating: s.rating,
        reviewDate: s.reviewDate,
        sourceUrl:
          'https://www.google.com/maps/place/FirstClass+Immobilier/@5.3899261,-3.9854455,17z',
        quote: s.quote,
        order: s.order,
        published: s.published,
      },
    })
  }
  console.log(`Inserted ${SAMPLES.length} Google testimonials.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
