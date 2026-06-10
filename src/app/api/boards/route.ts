import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/boards - Public: list active boards
export async function GET() {
  try {
    const boards = await db.board.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, color: true },
    })
    return NextResponse.json({ data: boards })
  } catch (error) {
    console.error('Boards list error:', error)
    return NextResponse.json({ data: [] })
  }
}
