import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'
import { cacheHeaders } from '@/lib/cache-headers'
import { applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const now = new Date()

    const banners = await db.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
        ],
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, data: { banners } }, { headers: cacheHeaders.public.short })
  } catch (error) {
    return handleApiError(error, 'Get banners error')
  }
}
