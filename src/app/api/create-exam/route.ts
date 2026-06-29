import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const body = await request.json()
    const { chapterIds, questionCount: requestedCount, duration, negativeMarks, marksPerMcq, title, freeOnly } = body

    if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
      return apiError('অন্তত একটি অধ্যায় নির্বাচন করুন', 400)
    }

    if (chapterIds.length > 20) {
      return apiError('সর্বোচ্চ ২০টি অধ্যায় নির্বাচন করা যাবে', 400)
    }

    // Resolve class slug from first chapter (single query with include)
    const chapter = await db.chapter.findFirst({
      where: { id: chapterIds[0] },
      select: {
        subject: {
          select: {
            class: {
              select: { slug: true },
            },
          },
        },
      },
    })
    const classSlug = chapter?.subject?.class?.slug || ''

    // Check if user has active subscription for this class
    let hasSubscription = false
    if (classSlug && !freeOnly) {
      const subscription = await db.userSubscription.findFirst({
        where: {
          userId: auth.user.id,
          classLevel: classSlug,
          isActive: true,
          endDate: { gte: new Date() },
        },
      })
      hasSubscription = !!subscription
    }

    const maxQuestions = 30

    const mcqWhere: Record<string, unknown> = {
      chapterId: { in: chapterIds },
      isActive: true,
    }
    if (!hasSubscription) {
      mcqWhere.isPremium = false
    }

    const mcqs = await db.mCQ.findMany({
      where: mcqWhere,
      select: { id: true },
      take: maxQuestions,
      orderBy: { createdAt: 'desc' },
    })

    if (mcqs.length === 0) {
      return apiError('নির্বাচিত অধ্যায়ে কোনো' + (hasSubscription ? '' : ' ফ্রি') + ' MCQ পাওয়া যায়নি', 404)
    }

    const userCount = requestedCount ? Math.min(requestedCount, maxQuestions) : maxQuestions
    const questionCount = Math.min(mcqs.length, userCount)
    const shuffled = mcqs.sort(() => Math.random() - 0.5).slice(0, questionCount)

    const examTitle = title || `কাস্টম MCQ পরীক্ষা (${chapterIds.length}টি অধ্যায়)`
    const examDuration = duration || Math.ceil(questionCount / 2)
    const examMarksPerMcq = marksPerMcq ?? 1
    const examNegativeMarks = negativeMarks ?? 0

    const result = await db.exam.create({
      data: {
        title: examTitle,
        type: 'mcq',
        classLevel: classSlug,
        duration: examDuration,
        marksPerMcq: examMarksPerMcq,
        negativeMarks: examNegativeMarks,
        totalMarks: Math.round(questionCount * examMarksPerMcq),
        isPremium: false,
        price: 0,
        isActive: true,
        status: 'published',
        creatorId: auth.user.id,
        questions: {
          create: shuffled.map((mcq, index) => ({
            questionType: 'mcq',
            questionId: mcq.id,
            order: index + 1,
            marks: examMarksPerMcq,
          })),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        examId: result.id,
        hadPremiumFilter: !hasSubscription,
        hasSubscription,
        classSlug,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create Exam error:', error)
    return apiError('পরীক্ষা তৈরি করতে সমস্যা হয়েছে', 500)
  }
}
