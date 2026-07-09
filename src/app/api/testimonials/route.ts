import { db } from '@/lib/db'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { apiLimiter } from '@/lib/rate-limit'
import { cacheHeaders } from '@/lib/cache-headers'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const testimonials = await db.testimonial.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      take: 100,
    })

    return NextResponse.json({ success: true, data: { testimonials } }, { headers: cacheHeaders.public.long })
  } catch (error) {
    console.error('Get testimonials error:', error)
    return apiError('টেস্টিমোনিয়াল আনতে সমস্যা হয়েছে', 500)
  }
}
