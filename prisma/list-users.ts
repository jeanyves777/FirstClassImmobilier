import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'

const url = (process.env.DATABASE_URL ?? 'file:./dev.db').replace(/^file:/, '')
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, fullName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  console.log(`Found ${users.length} users:`)
  for (const u of users) {
    console.log(`  ${u.role.padEnd(10)} ${u.email.padEnd(40)} ${u.fullName ?? ''}`)
  }
}

main().finally(() => prisma.$disconnect())
