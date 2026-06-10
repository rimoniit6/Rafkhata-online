import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cacheHeaders } from '@/lib/cache-headers'

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ testimonials }, { headers: cacheHeaders.public.long })
  } catch (error) {
    console.error('Get testimonials error:', error)
    return NextResponse.json(
      { error: 'টেস্টিমোনিয়াল আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
