import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const [
      totalUsers,
      totalMcqs,
      totalLectures,
      totalCqs,
      totalExams,
    ] = await Promise.all([
      db.user.count({ where: { role: 'STUDENT' } }),
      db.mCQ.count({ where: { isActive: true } }),
      db.lecture.count({ where: { isActive: true } }),
      db.cQ.count({ where: { isActive: true } }),
      db.exam.count({ where: { isActive: true } }),
    ])

    return NextResponse.json({
      students: totalUsers,
      mcqs: totalMcqs,
      lectures: totalLectures,
      cqs: totalCqs,
      exams: totalExams,
    })
  } catch (error) {
    return handleApiError(error, 'Get public stats error')
  }
}
