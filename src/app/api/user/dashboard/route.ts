import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন।', 401, 'UNAUTHORIZED')
    }

    const userId = auth.user.id

    const [
      user,
      progress,
      totalLectures,
      examResults,
      savedQuestions,
    ] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.progress.findMany({
        where: { userId },
        orderBy: { lastAccessed: 'desc' },
        take: 10,
      }),
      db.lecture.count({ where: { isActive: true } }),
      db.examResult.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: { exam: { select: { title: true } } },
      }),
      db.bookmark.count({ where: { userId } }),
    ])

    if (!user) {
      return apiError('ব্যবহারকারী খুঁজে পাওয়া যায়নি', 404)
    }

    const lectureProgress = progress.filter((p) => p.contentType === 'lecture')
    const completedLectures = lectureProgress.filter((p) => p.progress >= 100).length

    const mcqResults = examResults.filter((r) => r.totalMarks > 0)
    const avgMcqScore =
      mcqResults.length > 0
        ? Math.round(mcqResults.reduce((sum, r) => sum + (r.score / r.totalMarks) * 100, 0) / mcqResults.length)
        : 0

    const recentExams = examResults.map((er) => ({
      id: er.id,
      subject: er.exam?.title || 'পরীক্ষা',
      score: Math.round(er.score),
      total: Math.round(er.totalMarks),
      date: new Date(er.completedAt).toLocaleDateString('bn-BD'),
    }))

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          completedLectures,
          totalLectures,
          avgMcqScore,
          savedQuestions,
          isPremium: user.isPremium,
          premiumExpiry: user.premiumExpiry ? new Date(user.premiumExpiry).toLocaleDateString('bn-BD') : null,
        },
        recentExams,
      },
    })
  } catch (error) {
    console.error('Get user dashboard error:', error)
    return apiError('ড্যাশবোর্ড ডাটা আনতে সমস্যা হয়েছে', 500)
  }
}
