import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const items = await db.navigation.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, data: { items } })
  } catch (error) {
    return handleApiError(error, 'Get navigation error')
  }
}
