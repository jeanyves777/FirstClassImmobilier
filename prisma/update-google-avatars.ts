/**
 * Attaches stable portrait URLs to existing Google-sourced testimonials so
 * every review card shows a real-looking face (matching Google's pattern of
 * always having a reviewer avatar).
 *
 * Uses randomuser.me — free, stable portrait CDN. Safe to rerun.
 *
 * Run with:  pnpm tsx prisma/update-google-avatars.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: url.replace(/^file:/, '') }),
})

const MAP: Record<string, string> = {
  'Jean-Baptiste Koffi': 'https://randomuser.me/api/portraits/men/32.jpg',
  'Aminata Traoré': 'https://randomuser.me/api/portraits/women/44.jpg',
  'Serge N\u2019Guessan': 'https://randomuser.me/api/portraits/men/18.jpg',
  'Fatoumata Diallo': 'https://randomuser.me/api/portraits/women/51.jpg',
  'Patrice Ekra': 'https://randomuser.me/api/portraits/men/65.jpg',
  'Yao Désiré Kouamé': 'https://randomuser.me/api/portraits/men/72.jpg',
}

async function main() {
  let updated = 0
  for (const [name, url] of Object.entries(MAP)) {
    const row = await prisma.testimonial.findFirst({
      where: { source: 'google', authorName: name },
      select: { id: true, photoUrl: true },
    })
    if (!row) continue
    if (row.photoUrl) continue // leave admin-edited values alone
    await prisma.testimonial.update({
      where: { id: row.id },
      data: { photoUrl: url },
    })
    updated += 1
  }
  console.log(`Attached avatar to ${updated} Google testimonial${updated === 1 ? '' : 's'}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
