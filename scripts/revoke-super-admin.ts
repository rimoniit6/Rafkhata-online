import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email || !email.includes('@')) {
    console.error('Usage: npx tsx scripts/revoke-super-admin.ts <email>')
    console.error('Example: npx tsx scripts/revoke-super-admin.ts admin@example.com')
    process.exit(1)
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await db.user.findUnique({ where: { email: normalizedEmail } })

  if (!user) {
    console.error(`User not found: ${normalizedEmail}`)
    await db.$disconnect()
    process.exit(1)
  }

  if (user.role !== 'SUPER_ADMIN') {
    console.log(`User "${normalizedEmail}" is not a SUPER_ADMIN. Current role: ${user.role}`)
    await db.$disconnect()
    process.exit(0)
  }

  // Check if this is the last SUPER_ADMIN
  const superAdminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } })
  if (superAdminCount <= 1) {
    console.error('❌ Cannot revoke the last SUPER_ADMIN. There must be at least one SUPER_ADMIN in the system.')
    console.error('Create another SUPER_ADMIN first, then revoke this one.')
    await db.$disconnect()
    process.exit(1)
  }

  await db.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
  })

  console.log(`✅ Successfully revoked SUPER_ADMIN from "${normalizedEmail}"`)
  console.log(`   Name: ${user.name || 'N/A'}`)
  console.log(`   New role: ADMIN`)
  console.log(`   Remaining SUPER_ADMIN count: ${superAdminCount - 1}`)

  await db.$disconnect()
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
