'use client'

import { createBrowserClient } from '@supabase/ssr'

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

let client: ReturnType<typeof getSupabaseClient> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    return getSupabaseClient()
  }
  if (!client) {
    client = getSupabaseClient()
  }
  return client
}
