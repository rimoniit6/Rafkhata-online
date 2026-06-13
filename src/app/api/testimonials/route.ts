import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { cacheHeaders } from '@/lib/cache-headers'

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, data: { testimonials } }, { headers: cacheHeaders.public.long })
  } catch (error) {
    console.error('Get testimonials error:', error)
    return apiError('টেস্টিমোনিয়াল আনতে সমস্যা হয়েছে', 500)
  }
}
