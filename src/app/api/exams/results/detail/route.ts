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
    const resultId = searchParams.get('resultId')
    if (!resultId) {
      return apiError('resultId প্রয়োজন', 400)
    }

    const result = await db.examResult.findUnique({
      where: { id: resultId },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!result) {
      return apiError('ফলাফল খুঁজে পাওয়া যায়নি', 404)
    }

    // Security: user can only view their own results
    if (result.userId !== auth.user.id && !auth.isAdmin) {
      return apiError('আপনি শুধুমাত্র নিজের ফলাফল দেখতে পারবেন', 403)
    }

    // Fetch MCQ details for all questions in this exam
    const mcqIds = result.exam.questions
      .filter((eq) => eq.questionType === 'mcq')
      .map((eq) => eq.questionId)

    const mcqs = mcqIds.length > 0
      ? await db.mCQ.findMany({
          where: { id: { in: mcqIds } },
          select: {
            id: true,
            question: true,
            questionImage: true,
            optionA: true,
            optionAImage: true,
            optionB: true,
            optionBImage: true,
            optionC: true,
            optionCImage: true,
            optionD: true,
            optionDImage: true,
            correctAnswer: true,
            explanation: true,
            explanationImage: true,
          },
        })
      : []

    const mcqMap = new Map(mcqs.map((m) => [m.id, m]))
    const answers = (result.answers as Record<string, string>) || {}

    const questions = result.exam.questions
      .filter((eq) => eq.questionType === 'mcq')
      .map((eq) => {
        const mcq = mcqMap.get(eq.questionId)
        if (!mcq) return null

        const userAnswer = answers[eq.questionId] || null
        const isCorrect = userAnswer === mcq.correctAnswer
        const isSkipped = !userAnswer

        return {
          id: eq.questionId,
          questionText: mcq.question,
          questionImage: mcq.questionImage,
          options: [
            { key: 'A', text: mcq.optionA, image: mcq.optionAImage },
            { key: 'B', text: mcq.optionB, image: mcq.optionBImage },
            { key: 'C', text: mcq.optionC, image: mcq.optionCImage },
            { key: 'D', text: mcq.optionD, image: mcq.optionDImage },
          ],
          correctAnswer: mcq.correctAnswer,
          userAnswer,
          isCorrect,
          isSkipped,
          explanation: mcq.explanation || '',
          explanationImage: mcq.explanationImage,
          order: eq.order,
          marks: eq.marks,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        result: {
          id: result.id,
          score: result.score,
          totalMarks: result.totalMarks,
          timeTaken: result.timeTaken,
          completedAt: result.completedAt,
        },
        exam: {
          id: result.exam.id,
          title: result.exam.title,
          description: result.exam.description,
          duration: result.exam.duration,
          totalMarks: result.exam.totalMarks,
          marksPerMcq: result.exam.marksPerMcq,
          negativeMarks: result.exam.negativeMarks,
        },
        questions,
      },
    })
  } catch (error) {
    console.error('Get exam result detail error:', error)
    return apiError('ফলাফলের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}
