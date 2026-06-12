import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env file manually since tsx doesn't auto-load it outside Next.js
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let value = trimmed.slice(eqIdx + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch { /* .env not found */ }
}

loadEnv()

const db = new PrismaClient()

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE env vars')
    console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('  SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
    process.exit(1)
  }

  const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const users = await db.user.findMany({
    where: { supabaseUserId: { not: null } },
    select: { supabaseUserId: true, email: true, role: true },
  })

  console.log(`Found ${users.length} users with Supabase accounts\n`)

  let updated = 0
  let failed = 0

  for (const user of users) {
    try {
      const { error } = await serviceSupabase.auth.admin.updateUserById(
        user.supabaseUserId!,
        { user_metadata: { role: user.role } }
      )

      if (error) {
        console.error(`❌ ${user.email}: ${error.message}`)
        failed++
      } else {
        console.log(`✅ ${user.email}: role → ${user.role}`)
        updated++
      }
    } catch (err: any) {
      console.error(`❌ ${user.email}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone. ${updated} synced, ${failed} failed.`)
  await db.$disconnect()
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
