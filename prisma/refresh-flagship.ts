/**
 * One-off script: refresh the AEROCITY BEACH and LABELLA RESIDENCE programs in
 * the existing dev DB with their canonical text + zone, ensure their
 * program-level Media rows exist (covers + Aerocity gallery + Aerocity 2D
 * video + Labella cover), and wire `heroMediaId` on each program so the
 * featured-programs grid + program detail pages render their cover images.
 *
 * Idempotent. Safe to run multiple times. Run with:
 *   pnpm tsx prisma/refresh-flagship.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'

const url = (process.env.DATABASE_URL ?? 'file:./dev.db').replace(/^file:/, '')
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

const loc = (fr: string, en: string) => JSON.stringify({ fr, en })

async function ensureCoverMedia(
  programId: string,
  url: string,
  alt: string,
  order = -1,
) {
  // If a cover Media row already points at this URL, reuse it; otherwise create one.
  const existing = await prisma.media.findFirst({
    where: { programId, url },
  })
  if (existing) return existing
  return prisma.media.create({
    data: { programId, kind: 'image', url, alt, order },
  })
}

async function ensureMediaRow(
  programId: string,
  url: string,
  kind: 'image' | 'video',
  alt: string,
  order: number,
) {
  const existing = await prisma.media.findFirst({ where: { programId, url } })
  if (existing) return existing
  return prisma.media.create({
    data: { programId, kind, url, alt, order },
  })
}

async function main() {
  // 1) AEROCITY BEACH — canonical text + zone + cover + gallery + video
  const aerocity = await prisma.program.update({
    where: { slug: 'aerocity-beach' },
    data: {
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

  const aerocityCover = await ensureCoverMedia(
    aerocity.id,
    '/brand/aerocity/cover.jpg',
    loc('Aerocity Beach — vue extérieure villas', 'Aerocity Beach — villa exterior'),
  )

  const aerocityGallery = [
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
  for (let i = 0; i < aerocityGallery.length; i++) {
    await ensureMediaRow(
      aerocity.id,
      `/brand/aerocity/gallery/${aerocityGallery[i]}`,
      'image',
      loc('Aerocity Beach — vue chantier', 'Aerocity Beach — site view'),
      i,
    )
  }
  await ensureMediaRow(
    aerocity.id,
    '/brand/aerocity/video.mp4',
    'video',
    loc('Aerocity Beach — vidéo de présentation 2D', 'Aerocity Beach — 2D presentation video'),
    100,
  )

  await prisma.program.update({
    where: { id: aerocity.id },
    data: { heroMediaId: aerocityCover.id },
  })

  // 2) LABELLA RESIDENCE — canonical text + zone + cover
  const labella = await prisma.program.update({
    where: { slug: 'labella-residence' },
    data: {
      name: loc('LABELLA RESIDENCE', 'LABELLA RESIDENCE'),
      tagline: loc(
        'Là où réside bien vivre et confort — Cocody Bessikoi.',
        'Where comfort and fine living meet — Cocody Bessikoi.',
      ),
      description: loc(
        '<p><strong>LaBella Résidence</strong> est un projet immobilier (immeuble) agréé par le Ministère de la Construction, du Logement et de l’Urbanisme. Cet immeuble de prestige développé par <strong>FirstClass Immobilier</strong> est bâti sur 556 m² et situé dans la zone prisée de Cocody Bessikoi, composé d’un rez-de-chaussée + 6 étages et un Penthouse de 4 pièces.</p><p><strong>L’édifice comprend :</strong></p><ul><li>13 appartements de 4 pièces de très haut standing</li><li>2 espaces de parking dont un au sous-sol</li><li>2 ascenseurs pour desservir le tout</li></ul><p>La sécurité des résidents est totalement assurée grâce à un système de vidéosurveillance performant.</p><p><em>LaBella Résidence, là où réside bien vivre et confort.</em></p>',
        '<p><strong>LaBella Residence</strong> is a residential building licensed by the Ministry of Construction, Housing and Urban Planning. Developed by <strong>FirstClass Immobilier</strong>, the prestige tower sits on 556 m² in the sought-after Cocody Bessikoi neighbourhood — ground floor + 6 storeys + a 4-bedroom Penthouse.</p><p><strong>The building offers:</strong></p><ul><li>13 ultra-premium 4-bedroom apartments</li><li>2 parking areas, one in the basement</li><li>2 lifts serving the whole tower</li></ul><p>Resident safety is fully ensured by a high-performance CCTV system.</p><p><em>LaBella Residence — where comfort and fine living meet.</em></p>',
      ),
      type: 'LOTISSEMENT',
      status: 'ON_SALE',
      zone: 'Cocody Bessikoi',
      featured: true,
    },
  })

  const labellaCover = await ensureCoverMedia(
    labella.id,
    '/brand/labella/cover.jpg',
    loc('LaBella Résidence — façade', 'LaBella Residence — facade'),
  )

  await prisma.program.update({
    where: { id: labella.id },
    data: { heroMediaId: labellaCover.id },
  })

  console.log('✓ Aerocity Beach refreshed (cover + 9 gallery images + 2D video + heroMediaId set)')
  console.log('✓ Labella Residence refreshed (cover + heroMediaId set)')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
