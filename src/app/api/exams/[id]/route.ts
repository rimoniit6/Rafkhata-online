import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

function transformMCQ(mcq: {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string | null
  [key: string]: unknown
}, includeAnswers: boolean) {
  return {
    id: mcq.id,
    text: mcq.question,
    options: [
      { key: 'A', text: mcq.optionA },
      { key: 'B', text: mcq.optionB },
      { key: 'C', text: mcq.optionC },
      { key: 'D', text: mcq.optionD },
    ],
    correctAnswer: includeAnswers ? mcq.correctAnswer : '',
    explanation: includeAnswers ? (mcq.explanation || '') : '',
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    // Check if answers should be included
    // Admins always get answers
    // Regular users get answers if showAnswers=true (for result review after submission)
    const { searchParams } = new URL(request.url)
    const showAnswers = searchParams.get('showAnswers') === 'true'
    const auth = await verifyAuth(request)
    const includeAnswers = auth?.isAdmin || showAnswers

    const exam = await db.exam.findUnique({
      where: { id, isActive: true },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!exam) {
      return apiError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)
    }

    const mcqQuestions: Array<{
      id: string
      text: string
      options: Array<{ key: string; text: string }>
      correctAnswer: string
      explanation: string
      marks: number
      order: number
    }> = []
    for (const eq of exam.questions) {
      if (eq.questionType === 'mcq') {
        const mcq = await db.mCQ.findUnique({
          where: { id: eq.questionId },
        })
        if (mcq) {
          mcqQuestions.push({
            ...transformMCQ(mcq, includeAnswers),
            marks: eq.marks,
            order: eq.order,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          type: exam.type,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          marksPerMcq: exam.marksPerMcq,
          negativeMarks: exam.negativeMarks,
          questions: mcqQuestions,
          totalQuestions: mcqQuestions.length,
        },
      },
    })
  } catch (error) {
    console.error('Get exam detail error:', error)
    return apiError('পরীক্ষার বিস্তারিত তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}
