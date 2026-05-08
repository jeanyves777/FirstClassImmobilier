/**
 * Audit script: report any rows that depend on a Media reference but don't
 * have one set. Catches the "card with no cover" UI regression after data
 * imports / migrations.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'

const url = (process.env.DATABASE_URL ?? 'file:./dev.db').replace(/^file:/, '')
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

async function main() {
  const programs = await prisma.program.findMany({
    select: { slug: true, name: true, heroMediaId: true, status: true, featured: true },
  })
  const programsMissingHero = programs.filter((p) => !p.heroMediaId)
  console.log(`\n[Programs] ${programs.length} total, ${programsMissingHero.length} missing heroMediaId:`)
  for (const p of programsMissingHero) {
    console.log(`  - ${p.slug} (status=${p.status}, featured=${p.featured})`)
  }

  const lots = await prisma.lot.findMany({
    select: { id: true, reference: true, programId: true, _count: { select: { media: true } } },
  })
  const lotsNoMedia = lots.filter((l) => l._count.media === 0)
  console.log(`\n[Lots] ${lots.length} total, ${lotsNoMedia.length} with zero media:`)
  for (const l of lotsNoMedia) console.log(`  - ${l.reference}`)

  const activities = await prisma.activity.findMany({
    select: { id: true, title: true, coverId: true, publishedAt: true },
  })
  const actsNoCover = activities.filter((a) => !a.coverId && a.publishedAt)
  console.log(`\n[Activities] ${activities.length} total, ${actsNoCover.length} published with no cover:`)
  for (const a of actsNoCover) console.log(`  - ${a.id}`)

  const teams = await prisma.teamMember.findMany({
    select: { fullName: true, photoId: true },
  })
  const teamsNoPhoto = teams.filter((t) => !t.photoId)
  console.log(`\n[Team] ${teams.length} total, ${teamsNoPhoto.length} with no photoId:`)
  for (const t of teamsNoPhoto) console.log(`  - ${t.fullName}`)

  const partners = await prisma.partner.findMany({
    select: { name: true, logoId: true },
  })
  const partnersNoLogo = partners.filter((p) => !p.logoId)
  console.log(`\n[Partners] ${partners.length} total, ${partnersNoLogo.length} with no logoId:`)
  for (const p of partnersNoLogo) console.log(`  - ${p.name}`)

  const testimonials = await prisma.testimonial.findMany({
    select: { authorName: true, photoId: true, photoUrl: true, published: true },
  })
  const tsNoPhoto = testimonials.filter((t) => !t.photoId && !t.photoUrl && t.published)
  console.log(`\n[Testimonials] ${testimonials.length} total, ${tsNoPhoto.length} published with no photo:`)
  for (const t of tsNoPhoto) console.log(`  - ${t.authorName}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
