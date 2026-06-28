import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const superAdmins = await db.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: {
      id: true,
      email: true,
      name: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  if (superAdmins.length === 0) {
    console.log('No SUPER_ADMIN users found.')
    console.log('Create one with: npx tsx scripts/create-super-admin.ts <email>')
    await db.$disconnect()
    return
  }

  console.log(`\nFound ${superAdmins.length} SUPER_ADMIN user(s):\n`)
  console.log('Email'.padEnd(40) + 'Name'.padEnd(25) + 'Verified'.padEnd(12) + 'Created')
  console.log('-'.repeat(100))

  for (const admin of superAdmins) {
    console.log(
      admin.email.padEnd(40) +
      (admin.name || 'N/A').padEnd(25) +
      (admin.isVerified ? 'Yes' : 'No').padEnd(12) +
      admin.createdAt.toISOString().split('T')[0]
    )
  }

  await db.$disconnect()
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
