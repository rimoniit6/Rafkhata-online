import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const board = searchParams.get('board')

    const where: Record<string, unknown> = {
      isActive: true,
    }
    if (board) where.board = board

    const data = await db.boardYear.findMany({
      where,
      orderBy: [{ year: 'desc' }, { board: 'asc' }],
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Public Get BoardYears error:', error)
    return NextResponse.json({ success: false, error: 'বোর্ড সাল আনতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
