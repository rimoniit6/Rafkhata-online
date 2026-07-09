import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return apiError('অনুমতি নেই', 403)
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId') || ''
    const userId = searchParams.get('userId') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (examId) where.examId = examId
    if (userId) where.userId = userId

    const [results, total] = await Promise.all([
      db.examResult.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          exam: {
            select: { id: true, title: true, type: true, classLevel: true, totalMarks: true },
          },
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.examResult.count({ where }),
    ])

    // Stats summary — use database aggregation instead of fetching all rows
    // Use raw SQL for avg percentage score (can't express division in Prisma aggregate)
    const whereClauses: string[] = []
    const params: unknown[] = []
    let paramIndex = 1
    if (examId) { whereClauses.push(`"examId" = $${paramIndex++}`); params.push(examId) }
    if (userId) { whereClauses.push(`"userId" = $${paramIndex++}`); params.push(userId) }
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const [stats] = await db.$queryRawUnsafe<Array<{ avgScore: number | null; avgTime: number | null; highestScore: number | null }>>(
      `SELECT
        AVG(score * 100.0 / NULLIF("totalMarks", 0)) AS "avgScore",
        AVG("timeTaken") AS "avgTime",
        MAX(score) AS "highestScore"
      FROM "ExamResult" ${whereSql}`,
      ...params
    )

    const avgScore = stats?.avgScore ?? 0
    const avgTime = stats?.avgTime ?? 0
    const highestScore = stats?.highestScore ?? 0

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalResults: total,
        avgScore: Math.round(avgScore * 10) / 10,
        avgTime: Math.round(avgTime),
        highestScore: Math.round(highestScore * 10) / 10,
      },
    })
  } catch (error) {
    console.error('Admin Get Exam Results error:', error)
    return apiError('পরীক্ষার ফলাফল আনতে সমস্যা হয়েছে', 500)
  }
}
