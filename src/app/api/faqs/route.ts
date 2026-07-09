import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cacheHeaders } from '@/lib/cache-headers'
import { handleApiError } from '@/lib/errors'
import { applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const faqs = await db.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      take: 100,
    })

    return NextResponse.json({ success: true, data: { faqs } }, { headers: cacheHeaders.public.long })
  } catch (error) {
    return handleApiError(error, 'Get FAQs error')
  }
}
