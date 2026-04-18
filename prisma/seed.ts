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

  // Unsplash hosted demo imagery (no-cost hotlink). Replace once FCI provides real photography.
  const IMG = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

  await seedLot(aerocity.id, {
    reference: 'AERO-A01',
    surfaceM2: 500,
    priceFCFA: 18_000_000n,
    bedrooms: 4,
    bathrooms: 3,
    status: 'available',
    title: loc('Villa contemporaine T4 — Vue mer', 'Contemporary 4-bed villa — ocean view'),
    description: loc(
      'Villa livrée clé en main avec piscine privative, terrasse panoramique et finitions premium. Accès direct à la promenade bord de mer d\u2019AEROCITY BEACH.',
      'Turn-key villa with private pool, panoramic terrace and premium finishes. Direct access to the AEROCITY BEACH oceanfront promenade.',
    ),
    highlights: loc(
      'Piscine privative · Terrasse panoramique · Domotique · Cuisine équipée',
      'Private pool · Panoramic terrace · Smart home · Fitted kitchen',
    ),
    features: JSON.stringify(['Pool', 'Smart home', 'Ocean view', 'Fitted kitchen', '24/7 security']),
    virtualTourUrl: 'https://my.matterport.com/show/?m=SxQL3iGyoDo',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-a-luxury-home-4432/1080p.mp4',
    media: [
      { url: IMG('1613490493576-7fde63acd811'), alt: loc('Façade principale', 'Front facade') },
      { url: IMG('1600585154340-be6161a56a0c'), alt: loc('Salon', 'Living room') },
      { url: IMG('1600607687939-ce8a6c25118c'), alt: loc('Cuisine', 'Kitchen') },
      { url: IMG('1600566753376-12c8ab7fb75b'), alt: loc('Piscine', 'Pool') },
    ],
  })

  await seedLot(aerocity.id, {
    reference: 'AERO-A02',
    surfaceM2: 420,
    priceFCFA: 15_000_000n,
    bedrooms: 3,
    bathrooms: 2,
    status: 'reserved',
    title: loc('Villa T3 — Standing', 'Premium 3-bed villa'),
    description: loc(
      'Villa T3 dans la tranche privée d\u2019AEROCITY BEACH. Jardin paysagé, double séjour.',
      'Premium 3-bed villa in the private section of AEROCITY BEACH. Landscaped garden, double living room.',
    ),
    highlights: loc('Jardin paysagé · Double séjour · Finitions haut de gamme', 'Landscaped garden · Double living · High-end finishes'),
    features: JSON.stringify(['Garden', 'Double living', 'Premium finishes']),
    media: [
      { url: IMG('1600596542815-ffad4c1539a9'), alt: loc('Villa T3', 'Villa T3') },
      { url: IMG('1600210492486-724fe5c67fb0'), alt: loc('Salon', 'Living room') },
      { url: IMG('1600573472550-8090b5e0745e'), alt: loc('Chambre principale', 'Master bedroom') },
    ],
  })

  await seedLot(aerocity.id, {
    reference: 'AERO-B12',
    surfaceM2: 620,
    priceFCFA: 12_500_000n,
    status: 'available',
    title: loc('Terrain viabilisé', 'Serviced land'),
    description: loc(
      'Parcelle viabilisée à bâtir, face au boulevard principal d\u2019AEROCITY BEACH.',
      'Build-ready serviced plot facing the main AEROCITY BEACH boulevard.',
    ),
    highlights: loc('ACD disponible · Accès goudronné · Eau & électricité', 'ACD ready · Paved access · Water & power hookup'),
    features: JSON.stringify(['Paved access', 'Water', 'Power', 'ACD ready']),
    media: [
      { url: IMG('1486325212027-8081e485255e'), alt: loc('Vue aérienne', 'Aerial view') },
      { url: IMG('1506126613408-eca07ce68773'), alt: loc('Plan de masse', 'Master plan') },
    ],
  })

  await seedLot(labella.id, {
    reference: 'LABL-V01',
    surfaceM2: 380,
    priceFCFA: 22_000_000n,
    bedrooms: 5,
    bathrooms: 4,
    status: 'available',
    title: loc('Villa T5 signature', 'Signature 5-bed villa'),
    description: loc(
      'Villa signature LABELLA avec suite parentale, espace détente et garage double.',
      'LABELLA signature villa with master suite, relaxation area and double garage.',
    ),
    highlights: loc('Suite parentale · Garage double · Espace détente · Domotique', 'Master suite · Double garage · Wellness area · Smart home'),
    features: JSON.stringify(['Master suite', 'Double garage', 'Wellness', 'Smart home']),
    virtualTourUrl: 'https://kuula.co/share/collection/7Y9xk?fs=1&vr=1',
    media: [
      { url: IMG('1613977257363-707ba9348227'), alt: loc('Villa signature', 'Signature villa') },
      { url: IMG('1505691938895-1758d7feb511'), alt: loc('Suite parentale', 'Master suite') },
      { url: IMG('1600566753190-17f0baa2a6c3'), alt: loc('Espace détente', 'Wellness area') },
    ],
  })

  await seedLot(labella.id, {
    reference: 'LABL-V02',
    surfaceM2: 310,
    priceFCFA: 17_500_000n,
    bedrooms: 4,
    bathrooms: 3,
    status: 'available',
    title: loc('Villa T4 jardin', 'Garden 4-bed villa'),
    description: loc('Villa T4 avec jardin arboré dans la résidence sécurisée.', 'Garden villa with mature landscaping in the gated community.'),
    highlights: loc('Jardin arboré · Sécurité 24/7 · Clubhouse', 'Mature garden · 24/7 security · Clubhouse access'),
    features: JSON.stringify(['Mature garden', 'Security 24/7', 'Clubhouse']),
    media: [
      { url: IMG('1568605114967-8130f3a36994'), alt: loc('Façade', 'Facade') },
      { url: IMG('1600585154526-990dced4db0d'), alt: loc('Jardin', 'Garden') },
    ],
  })

  console.log('Seeded:', { aerocity: aerocity.slug, labella: labella.slug })
}

async function seedLot(
  programId: string,
  input: {
    reference: string
    surfaceM2: number
    priceFCFA: bigint
    status: string
    bedrooms?: number
    bathrooms?: number
    title: string
    description: string
    highlights: string
    features: string
    virtualTourUrl?: string
    videoUrl?: string
    media: { url: string; alt: string }[]
  },
) {
  const lot = await prisma.lot.upsert({
    where: { programId_reference: { programId, reference: input.reference } },
    update: {},
    create: {
      programId,
      reference: input.reference,
      surfaceM2: input.surfaceM2,
      priceFCFA: input.priceFCFA,
      status: input.status,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      title: input.title,
      description: input.description,
      highlights: input.highlights,
      features: input.features,
      virtualTourUrl: input.virtualTourUrl ?? null,
      videoUrl: input.videoUrl ?? null,
    },
  })

  const existing = await prisma.media.count({ where: { lotId: lot.id } })
  if (existing === 0) {
    await prisma.media.createMany({
      data: input.media.map((m, i) => ({
        lotId: lot.id,
        kind: 'image',
        url: m.url,
        alt: m.alt,
        order: i,
      })),
    })
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
