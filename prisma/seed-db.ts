import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

process.on('beforeExit', async () => {
  await db.$disconnect()
})

export { db }
