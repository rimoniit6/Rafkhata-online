import { apiError, applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const token = await generateCsrfToken()
    await setCsrfCookie(token)
    return NextResponse.json(
      { token },
      {
        headers: {
          'Access-Control-Expose-Headers': 'x-csrf-token',
          'x-csrf-token': token,
        },
      }
    )
  } catch {
    return apiError('CSRF টোকেন জেনারেট করতে ব্যর্থ', 500)
  }
}