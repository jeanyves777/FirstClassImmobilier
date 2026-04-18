import 'server-only'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const buildClient = () => {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db'
  const filename = url.replace(/^file:/, '')
  const adapter = new PrismaBetterSqlite3({ url: filename })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
