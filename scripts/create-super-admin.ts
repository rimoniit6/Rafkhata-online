import { PrismaClient } from '@prisma/client'
import { randomBytes,scryptSync } from 'node:crypto'

const db = new PrismaClient()

function _hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return salt + ':' + hash
}

async function main() {
  const email = process.argv[2]
  if (!email || !email.includes('@')) {
    console.error('Usage: npx tsx scripts/create-super-admin.ts <email>')
    console.error('Example: npx tsx scripts/create-super-admin.ts admin@example.com')
    process.exit(1)
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await db.user.findUnique({ where: { email: normalizedEmail } })

  if (!user) {
    console.error(`User not found: ${normalizedEmail}`)
    console.error('The user must exist in the database before promoting to SUPER_ADMIN.')
    await db.$disconnect()
    process.exit(1)
  }

  if (user.role === 'SUPER_ADMIN') {
    console.log(`User "${normalizedEmail}" is already a SUPER_ADMIN. No changes made.`)
    await db.$disconnect()
    process.exit(0)
  }

  // Verify this wouldn't create a duplicate since we only allow one... actually we allow multiple.
  // But we should log the promotion.

  await db.user.update({
    where: { id: user.id },
    data: { role: 'SUPER_ADMIN', isVerified: true },
  })

  console.log(`✅ Successfully promoted "${normalizedEmail}" to SUPER_ADMIN`)
  console.log(`   Name: ${user.name || 'N/A'}`)
  console.log(`   Previous role: ${user.role}`)

  await db.$disconnect()
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
