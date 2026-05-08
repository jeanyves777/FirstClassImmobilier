/**
 * One-shot seed: adds 3 sample published testimonials if the table is empty.
 * Safe to rerun — exits early when data already exists.
 *
 * Run with:  pnpm tsx prisma/seed-testimonials.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: url.replace(/^file:/, '') }),
})

const SAMPLES = [
  {
    authorName: 'Koffi N.',
    authorRole: 'Acquéreur diaspora — Montréal',
    quote: JSON.stringify({
      fr: "J'ai acheté depuis Montréal sans mettre les pieds à Abidjan pendant 14 mois. Visites vidéo hebdomadaires, paiements par virement, et l'ACD arrivé par DHL six mois après la remise des clés. Aucune mauvaise surprise.",
      en: "I bought from Montreal without setting foot in Abidjan for 14 months. Weekly video tours, wire-transfer payments, and the ACD arrived by DHL six months after handover. Zero bad surprises.",
    }),
    order: 0,
    published: true,
  },
  {
    authorName: 'Mariam T.',
    authorRole: 'Primo-acquéreur — Bingerville',
    quote: JSON.stringify({
      fr: "C'est notre premier achat. L'équipe FCI a tout expliqué, pas à pas. Le contrat est clair, le chantier a tenu les délais, et nous avons déjà notre ACD en main. Notre famille est enfin dans sa maison.",
      en: "This is our first home. The FCI team walked us through every step. The contract was clear, the build was on time, and the ACD is already in our hands. Our family is finally home.",
    }),
    order: 1,
    published: true,
  },
  {
    authorName: 'Sébastien D.',
    authorRole: 'Investisseur — Grand-Bassam',
    quote: JSON.stringify({
      fr: "Je cherchais un terrain avec titre sécurisé pour un projet locatif. FCI a livré le lot borné, viabilisé, avec l'ACD en procédure dès la réservation. Le suivi photo hebdomadaire m'a permis de tout contrôler à distance.",
      en: "I was looking for a plot with secure title for a rental project. FCI delivered the surveyed, serviced lot with ACD in progress from day one. The weekly photo updates let me keep an eye on everything remotely.",
    }),
    order: 2,
    published: true,
  },
]

async function main() {
  const existing = await prisma.testimonial.count()
  if (existing > 0) {
    console.log(`Testimonial table already has ${existing} rows — skipping.`)
    return
  }
  for (const s of SAMPLES) {
    await prisma.testimonial.create({ data: s })
  }
  console.log(`Inserted ${SAMPLES.length} testimonials.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
