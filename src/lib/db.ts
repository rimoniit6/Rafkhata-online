import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create a fresh PrismaClient in development to pick up schema changes
// In production, reuse the global singleton for connection pooling
const shouldReuse = process.env.NODE_ENV === 'production'

export const db =
  (shouldReuse && globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : new PrismaClient({
        log: ['error'],
      })

if (shouldReuse) globalForPrisma.prisma = db
