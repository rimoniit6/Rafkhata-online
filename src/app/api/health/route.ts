import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks = {
    database: false,
    supabase: false,
    redis: false,
  }
  const errors: Record<string, string> = {}

  // Check Database
  try {
    await db.$queryRaw`SELECT 1`
    checks.database = true
  } catch (e) {
    errors.database = e instanceof Error ? e.message : 'Unknown error'
  }

  // Check Supabase
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.getSession()
    if (!error) {
      checks.supabase = true
    } else {
      errors.supabase = error.message
    }
  } catch (e) {
    errors.supabase = e instanceof Error ? e.message : 'Unknown error'
  }

  // Check Redis (Upstash)
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      })
      if (response.ok) {
        checks.redis = true
      } else {
        errors.redis = `HTTP ${response.status}`
      }
    } else {
      checks.redis = true // Skip if not configured
    }
  } catch (e) {
    errors.redis = e instanceof Error ? e.message : 'Unknown error'
  }

  const allHealthy = Object.values(checks).every(v => v)
  const status = allHealthy ? 200 : 503

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      ...(Object.keys(errors).length > 0 && { errors }),
    },
    { status }
  )
}