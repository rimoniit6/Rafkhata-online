import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'অনুগ্রহ করে লগইন করুন' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { examId, score, totalMarks, timeTaken, answers } = body

    // Validate required fields
    if (!examId) {
      return NextResponse.json(
        { success: false, error: 'পরীক্ষার ID আবশ্যক' },
        { status: 400 }
      )
    }

    // Verify the exam exists and is active/published
    const exam = await db.exam.findUnique({
      where: { id: examId },
    })

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'পরীক্ষা খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    if (!exam.isActive || exam.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'এই পরীক্ষাটি বর্তমানে উপলব্ধ নয়' },
        { status: 400 }
      )
    }

    // Create the exam result
    const result = await db.examResult.create({
      data: {
        userId: auth.user.id,
        examId,
        score: score ?? 0,
        totalMarks: totalMarks ?? 0,
        timeTaken: timeTaken ?? 0,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers ?? []),
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 })
  } catch (error) {
    console.error('Save Exam Result error:', error)
    return NextResponse.json(
      { success: false, error: 'পরীক্ষার ফলাফল সংরক্ষণ করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
