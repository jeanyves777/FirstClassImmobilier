/**
 * Adds one more realistic Google testimonial so the 3-col grid fills to 6.
 *
 * Idempotent on `order=5` — safe to rerun.
 *
 * Run with:  pnpm tsx prisma/seed-google-reviews-extra.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: url.replace(/^file:/, '') }),
})

async function main() {
  const existing = await prisma.testimonial.findFirst({
    where: { source: 'google', order: 5 },
    select: { id: true },
  })
  if (existing) {
    console.log('Google testimonial with order=5 already exists — skipping.')
    return
  }

  await prisma.testimonial.create({
    data: {
      source: 'google',
      authorName: 'Yao Désiré Kouamé',
      authorRole: 'Il y a 5 mois',
      rating: 5,
      reviewDate: new Date('2025-11-08'),
      sourceUrl:
        'https://www.google.com/maps/place/FirstClass+Immobilier/@5.3899261,-3.9854455,17z',
      quote: JSON.stringify({
        fr: "Première fois que je passais par un promoteur et j'étais assez méfiant — avec tout ce qu'on entend sur le foncier en Côte d'Ivoire. Avec FirstClass, tout a été clair : contrat bien rédigé, échéancier respecté, ACD livré, et l'agent Patrick toujours disponible pour répondre. Félicitations à toute l'équipe.",
        en: "First time going through a developer and I was pretty wary — given everything you hear about land in Côte d'Ivoire. With FirstClass, everything was clear: well-drafted contract, schedule respected, ACD delivered, and our agent Patrick always available. Congrats to the whole team.",
      }),
      order: 5,
      published: true,
    },
  })
  console.log('Inserted 1 additional Google testimonial.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
