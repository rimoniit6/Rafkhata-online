import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const teachers = await db.teacherModerator.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, data: { teachers } })
  } catch (error) {
    console.error('Get teacher-moderators error:', error)
    return NextResponse.json(
      { success: false, error: 'টিচার/মডারেটর আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
