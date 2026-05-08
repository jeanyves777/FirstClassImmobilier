/**
 * Wipes all Google-sourced testimonials so the admin can start clean and
 * repopulate via the "Sync from Google" button (or manual entry).
 *
 * Run once:  pnpm tsx prisma/wipe-fabricated-reviews.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: url.replace(/^file:/, '') }),
})

async function main() {
  const res = await prisma.testimonial.deleteMany({ where: { source: 'google' } })
  console.log(`Deleted ${res.count} Google testimonial${res.count === 1 ? '' : 's'}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
