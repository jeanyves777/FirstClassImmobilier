import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hash as argonHash } from '@node-rs/argon2'
import 'dotenv/config'

const url = (process.env.DATABASE_URL ?? 'file:./dev.db').replace(/^file:/, '')
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

const loc = (fr: string, en: string) => JSON.stringify({ fr, en })

async function main() {
  // ─── Admin user ────────────────────────────────────────────────────────
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@firstclassimmo.com').toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!'
  const adminName = process.env.SEED_ADMIN_NAME ?? 'FCI Admin'
  const passwordHash = await argonHash(adminPassword, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  })
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', fullName: adminName, passwordHash },
    create: {
      email: adminEmail,
      fullName: adminName,
      role: 'ADMIN',
      locale: 'fr',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  })
  console.log('Admin user ready:', adminEmail)

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
        'Le Plaisir de vous loger — cité intelligente bord de lagune Ébrié.',
        'The pleasure of fine living — smart estate by the Ébrié lagoon.',
      ),
      description: loc(
        '<p>Dans le souci de bien loger des familles, tout en respectant les normes et standards internationaux en termes de qualité de vie ; <strong>AEROCITY BEACH</strong> est situé sur l’autoroute de Bassam côté lagune Ébrié. Bâti sur 3 hectares, ce Programme Immobilier (Cité) est initié par <strong>FirstClass Immobilier</strong>.</p><p>C’est une cité intelligente alimentée par un système d’énergie solaire européen, un système de sécurité avancé, des fosses septiques biologiques et une fibre optique. Programme agréé par le Ministère de la Construction du Logement et de l’Urbanisme – MCLAU.</p><p><strong>3 types de villas :</strong></p><ul><li>18 villas duplex F6 avec piscine</li><li>26 villas duplex F6 sans piscine</li><li>13 villas duplex F4 sans piscine</li></ul><p><em>AEROCITY BEACH, le Plaisir de vous loger.</em></p>',
        '<p>Designed to house families to international quality-of-life standards, <strong>AEROCITY BEACH</strong> sits on the Bassam highway by the Ébrié lagoon. Built on 3 hectares, this residential program is developed by <strong>FirstClass Immobilier</strong>.</p><p>A smart estate powered by a European solar energy system, advanced security, biological septic systems and fibre. Licensed by the Ministry of Construction, Housing and Urban Planning – MCLAU.</p><p><strong>3 villa types:</strong></p><ul><li>18 F6 duplex villas with pool</li><li>26 F6 duplex villas without pool</li><li>13 F4 duplex villas without pool</li></ul><p><em>AEROCITY BEACH, the pleasure of fine living.</em></p>',
      ),
      type: 'LOTISSEMENT',
      status: 'ON_SALE',
      zone: 'Port-Bouët',
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
        'Là où réside bien vivre et confort — Cocody Bessikoi.',
        'Where comfort and fine living meet — Cocody Bessikoi.',
      ),
      description: loc(
        '<p><strong>LaBella Résidence</strong> est un projet immobilier (immeuble) agréé par le Ministère de la Construction, du Logement et de l’Urbanisme. Cet immeuble de prestige développé par <strong>FirstClass Immobilier</strong> est bâti sur 556 m² et situé dans la zone prisée de Cocody Bessikoi, composé d’un rez-de-chaussée + 6 étages et un Penthouse de 4 pièces.</p><p><strong>L’édifice comprend :</strong></p><ul><li>13 appartements de 4 pièces de très haut standing</li><li>2 espaces de parking dont un au sous-sol</li><li>2 ascenseurs pour desservir le tout</li></ul><p>La sécurité des résidents est totalement assurée grâce à un système de vidéosurveillance performant.</p><p><em>LaBella Résidence, là où réside bien vivre et confort.</em></p>',
        '<p><strong>LaBella Residence</strong> is a residential building licensed by the Ministry of Construction, Housing and Urban Planning. Developed by <strong>FirstClass Immobilier</strong>, the prestige tower sits on 556 m² in the sought-after Cocody Bessikoi neighbourhood — ground floor + 6 storeys + a 4-bedroom Penthouse.</p><p><strong>The building offers:</strong></p><ul><li>13 ultra-premium 4-bedroom apartments</li><li>2 parking areas, one in the basement</li><li>2 lifts serving the whole tower</li></ul><p>Resident safety is fully ensured by a high-performance CCTV system.</p><p><em>LaBella Residence — where comfort and fine living meet.</em></p>',
      ),
      type: 'LOTISSEMENT',
      status: 'ON_SALE',
      zone: 'Cocody Bessikoi',
      featured: true,
    },
  })

  // Aerocity Beach — program-level media (gallery + 2D video). Idempotent:
  // we only insert if no media exists for this program yet, so re-running the
  // seed against a populated DB doesn't duplicate.
  const aerocityMediaCount = await prisma.media.count({ where: { programId: aerocity.id } })
  if (aerocityMediaCount === 0) {
    const galleryFiles = [
      'aerocity-01.jpg',
      'aerocity-02.jpg',
      'aerocity-03.jpg',
      'aerocity-04.jpg',
      'aerocity-05.jpg',
      'aerocity-06.jpg',
      'aerocity-07.jpg',
      'aerocity-08.jpg',
      'aerocity-09.jpg',
    ]
    await prisma.media.createMany({
      data: [
        ...galleryFiles.map((f, i) => ({
          programId: aerocity.id,
          kind: 'image',
          url: `/brand/aerocity/gallery/${f}`,
          alt: loc('Aerocity Beach — vue chantier', 'Aerocity Beach — site view'),
          order: i,
        })),
        {
          programId: aerocity.id,
          kind: 'video',
          url: '/brand/aerocity/video.mp4',
          alt: loc('Aerocity Beach — vidéo de présentation 2D', 'Aerocity Beach — 2D presentation video'),
          order: 100,
        },
      ],
    })
  }

  // Labella Residence — hero media (cover render).
  const labellaMediaCount = await prisma.media.count({ where: { programId: labella.id } })
  if (labellaMediaCount === 0) {
    await prisma.media.create({
      data: {
        programId: labella.id,
        kind: 'image',
        url: '/brand/labella/cover.jpg',
        alt: loc('LaBella Résidence — façade', 'LaBella Residence — facade'),
        order: 0,
      },
    })
  }

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
