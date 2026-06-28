import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    // Verify user authentication
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const body = await request.json()
    const { examId, score, totalMarks, timeTaken, answers } = body

    // Validate required fields
    if (!examId) {
      return apiError('পরীক্ষার ID আবশ্যক', 400)
    }

    // Verify the exam exists and is active/published
    const exam = await db.exam.findUnique({
      where: { id: examId },
    })

    if (!exam) {
      return apiError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)
    }

    if (!exam.isActive || exam.status !== 'published') {
      return apiError('এই পরীক্ষাটি বর্তমানে উপলব্ধ নয়', 400)
    }

    // Create the exam result
    const result = await db.examResult.create({
      data: {
        userId: auth.user.id,
        examId,
        score: score ?? 0,
        totalMarks: totalMarks ?? 0,
        timeTaken: timeTaken ?? 0,
        answers: answers ?? [],
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 })
  } catch (error) {
    console.error('Save Exam Result error:', error)
    return apiError('পরীক্ষার ফলাফল সংরক্ষণ করতে সমস্যা হয়েছে', 500)
  }
}
