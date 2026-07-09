import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      creatorId: auth.user.id,
    }
    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    const [exams, total] = await Promise.all([
      db.exam.findMany({
        where,
        include: {
          _count: {
            select: { questions: true, results: true },
          },
          results: {
            select: {
              score: true,
              totalMarks: true,
              timeTaken: true,
              completedAt: true,
            },
            orderBy: { completedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.exam.count({ where }),
    ])

    const data = exams.map((exam) => {
      const attemptCount = exam.results.length
      const scores = exam.results.map((r) =>
        r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0
      )
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0
      const averageScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0
      const lastAttempt = exam.results[0]?.completedAt || null

      return {
        id: exam.id,
        title: exam.title,
        classLevel: exam.classLevel,
        duration: exam.duration,
        totalQuestions: exam._count.questions,
        totalMarks: exam.totalMarks,
        attempts: attemptCount,
        highestScore: Math.round(highestScore),
        averageScore: Math.round(averageScore),
        lastAttempt,
        status: exam.status,
        createdAt: exam.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get my exams error:', error)
    return apiError('পরীক্ষার তালিকা আনতে সমস্যা হয়েছে', 500)
  }
}
