import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, withCsrf } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const supabase = await createClient()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true, data: { message: 'সফলভাবে লগআউট হয়েছে' } })
  } catch {
    return apiError('লগআউট ব্যর্থ হয়েছে', 500, 'LOGOUT_FAILED')
  }
}
