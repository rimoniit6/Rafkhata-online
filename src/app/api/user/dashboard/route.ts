import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'প্রমাণীকরণ প্রয়োজন।', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const userId = auth.user.id

    const [
      user,
      progress,
      totalLectures,
      examResults,
      savedQuestions,
      bookmarks,
      payments,
      recentlyViewed,
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
      }),
      db.bookmark.count({ where: { userId } }),
      db.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: 5,
      }),
    ])

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    const lectureProgress = progress.filter((p) => p.contentType === 'lecture')
    const completedLectures = lectureProgress.filter((p) => p.progress >= 100).length

    const mcqResults = examResults.filter((r) => r.totalMarks > 0)
    const avgMcqScore =
      mcqResults.length > 0
        ? Math.round(mcqResults.reduce((sum, r) => sum + (r.score / r.totalMarks) * 100, 0) / mcqResults.length)
        : 0

    const progressMap = new Map(lectureProgress.map((p) => [p.contentId, p.progress]))

    const recentLectures = recentlyViewed
      .filter((rv) => rv.contentType === 'lecture')
      .map((rv) => ({
        id: rv.contentId,
        title: rv.title,
        subject: '',
        progress: progressMap.get(rv.contentId) || 0,
      }))

    const recentExams = examResults.map((er) => ({
      id: er.id,
      subject: 'পরীক্ষা',
      score: Math.round(er.score),
      total: Math.round(er.totalMarks),
      date: new Date(er.completedAt).toLocaleDateString('bn-BD'),
    }))

    const bookmarkedQuestions = bookmarks.map((b) => ({
      id: b.contentId,
      text: b.contentType === 'mcq' ? 'MCQ প্রশ্ন' : 'সৃজনশীল প্রশ্ন',
      type: b.contentType as 'mcq' | 'cq',
    }))

    const paymentHistory = payments.map((p) => ({
      id: p.id,
      planName: p.contentTitle || p.contentType || 'পেমেন্ট',
      amount: p.amount,
      date: new Date(p.createdAt).toLocaleDateString('bn-BD'),
      status: p.status === 'approved' ? ('completed' as const) : p.status === 'rejected' ? ('failed' as const) : ('pending' as const),
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
        recentLectures,
        recentExams,
        bookmarkedQuestions,
        paymentHistory,
      },
    })
  } catch (error) {
    console.error('Get user dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'ড্যাশবোর্ড ডাটা আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
