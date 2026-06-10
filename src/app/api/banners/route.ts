import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'
import { cacheHeaders } from '@/lib/cache-headers'

export async function GET() {
  try {
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

    return NextResponse.json({ banners }, { headers: cacheHeaders.public.short })
  } catch (error) {
    return handleApiError(error, 'Get banners error')
  }
}
