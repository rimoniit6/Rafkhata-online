import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheHeaders } from '@/lib/cache-headers'

// GET /api/years - Public: list active years
export async function GET() {
  try {
    const years = await db.examYear.findMany({
      where: { isActive: true },
      orderBy: { order: 'desc' },
      select: { id: true, year: true },
    })
    return NextResponse.json({ data: years }, { headers: cacheHeaders.public.long })
  } catch (error) {
    console.error('Years list error:', error)
    return NextResponse.json({ data: [] })
  }
}
