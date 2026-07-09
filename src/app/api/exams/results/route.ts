import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const body = await request.json()
    const { examId, timeTaken, answers, idempotencyKey } = body

    if (!examId) {
      return apiError('পরীক্ষার ID আবশ্যক', 400)
    }

    const exam = await db.exam.findUnique({
      where: { id: examId },
    })

    if (!exam) {
      return apiError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)
    }

    if (!exam.isActive || exam.status !== 'published') {
      return apiError('এই পরীক্ষাটি বর্তমানে উপলব্ধ নয়', 400)
    }

    // ── Duplicate prevention ──

    if (idempotencyKey) {
      const existingByIdempotency = await db.examResult.findUnique({
        where: { idempotencyKey },
      })
      if (existingByIdempotency) {
        return NextResponse.json({
          success: true,
          data: { resultId: existingByIdempotency.id },
          message: 'এই পরীক্ষাটি ইতিমধ্যে জমা দেওয়া হয়েছে',
        })
      }
    }

    const existingByUser = await db.examResult.findUnique({
      where: { userId_examId: { userId: auth.user.id, examId } },
    })
    if (existingByUser) {
      return NextResponse.json({
        success: true,
        data: { resultId: existingByUser.id },
        message: 'আপনি ইতিমধ্যে এই পরীক্ষাটি জমা দিয়েছেন',
      })
    }

    // ── Score calculation (server-side) ──
    // Fetch all MCQ questions for this exam and compute correct/wrong counts
    const examQuestions = await db.examQuestion.findMany({
      where: { examId, questionType: 'mcq' },
    })

    const mcqIds = examQuestions.map(eq => eq.questionId)
    const mcqs = mcqIds.length > 0
      ? await db.mCQ.findMany({
          where: { id: { in: mcqIds } },
          select: { id: true, correctAnswer: true },
        })
      : []
    const correctAnswerMap = new Map(mcqs.map(m => [m.id, m.correctAnswer]))

    let correct = 0
    let wrong = 0
    const userAnswers = (answers as Record<string, string>) || {}

    for (const eq of examQuestions) {
      const ua = userAnswers[eq.questionId]
      if (!ua) continue
      if (ua === correctAnswerMap.get(eq.questionId)) correct++
      else wrong++
    }

    const marksPerMcq = exam.marksPerMcq ?? 1
    const negativeMarks = exam.negativeMarks ?? 0
    const calculatedScore = correct * marksPerMcq - wrong * negativeMarks
    const totalMarks = examQuestions.length * marksPerMcq

    // ── Create the exam result ──
    const result = await db.examResult.create({
      data: {
        userId: auth.user.id,
        examId,
        score: Math.max(0, calculatedScore),
        totalMarks,
        timeTaken: timeTaken ?? 0,
        answers: answers ?? {},
        idempotencyKey: idempotencyKey || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: { resultId: result.id },
    }, { status: 201 })
  } catch (error) {
    console.error('Save Exam Result error:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return apiError('আপনি ইতিমধ্যে এই পরীক্ষাটি জমা দিয়েছেন', 409)
    }
    return apiError('পরীক্ষার ফলাফল সংরক্ষণ করতে সমস্যা হয়েছে', 500)
  }
}
