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

    // Stats summary
    const allResults = await db.examResult.findMany({
      where,
      select: { score: true, totalMarks: true, timeTaken: true },
    })

    const totalResults = allResults.length
    const avgScore = totalResults > 0
      ? allResults.reduce((sum, r) => sum + (r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0), 0) / totalResults
      : 0
    const avgTime = totalResults > 0
      ? allResults.reduce((sum, r) => sum + r.timeTaken, 0) / totalResults
      : 0
    const highestScore = totalResults > 0
      ? Math.max(...allResults.map(r => r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0))
      : 0

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
        totalResults,
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
