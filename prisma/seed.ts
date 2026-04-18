import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'

const url = (process.env.DATABASE_URL ?? 'file:./dev.db').replace(/^file:/, '')
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

const loc = (fr: string, en: string) => JSON.stringify({ fr, en })

async function main() {
  await prisma.siteStats.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      yearsExperience: 8,
      satisfiedClients: 350,
      projectsCount: 7,
      landsSold: 450,
      housesBuilt: 57,
      acdDelivered: 380,
    },
    update: {
      yearsExperience: 8,
      satisfiedClients: 350,
      projectsCount: 7,
      landsSold: 450,
      housesBuilt: 57,
      acdDelivered: 380,
    },
  })

  const aerocity = await prisma.program.upsert({
    where: { slug: 'aerocity-beach' },
    update: {},
    create: {
      slug: 'aerocity-beach',
      name: loc('AEROCITY BEACH', 'AEROCITY BEACH'),
      tagline: loc(
        'Le programme immobilier en bord de mer qui redéfinit l\u2019élégance.',
        'The seaside real-estate program redefining elegance.',
      ),
      description: loc(
        'AEROCITY BEACH est un programme immobilier haut de gamme situé à proximité immédiate de l\u2019aéroport d\u2019Abidjan. Terrains viabilisés, infrastructures premium, accompagnement complet.',
        'AEROCITY BEACH is a premium real-estate program right next to Abidjan airport, with serviced lots, premium infrastructure and full support.',
      ),
      type: 'LOTISSEMENT',
      status: 'ON_SALE',
      zone: 'Grand Abidjan',
      featured: true,
    },
  })

  const labella = await prisma.program.upsert({
    where: { slug: 'labella-residence' },
    update: {},
    create: {
      slug: 'labella-residence',
      name: loc('LABELLA RESIDENCE', 'LABELLA RESIDENCE'),
      tagline: loc(
        'Résidences privées — art de vivre et sécurité au cœur d\u2019Abidjan.',
        'Private residences — refined living and security in the heart of Abidjan.',
      ),
      description: loc(
        'Villas et appartements contemporains avec services, sécurité 24/7 et espaces verts intégrés.',
        'Contemporary villas and apartments with services, 24/7 security and integrated green spaces.',
      ),
      type: 'LOTISSEMENT',
      status: 'ON_SALE',
      zone: 'Abidjan',
      featured: true,
    },
  })

  console.log('Seeded:', { aerocity: aerocity.slug, labella: labella.slug })
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
