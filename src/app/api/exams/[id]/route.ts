import { db } from '@/lib/db'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { checkContentAccess } from '@/lib/access-control'

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
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

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

    // Access control — check for premium exams
    if (exam.isPremium) {
      if (!auth) {
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
              isPremium: true,
              totalQuestions: exam.questions.length,
              questions: [],
            },
          },
        })
      }
      const access = await checkContentAccess({
        userId: auth.user.id,
        contentType: 'exam',
        contentId: exam.id,
      })
      if (!access.hasAccess) {
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
              isPremium: true,
              totalQuestions: exam.questions.length,
              questions: [],
            },
          },
        })
      }
    }

    // Batch-fetch all MCQs (fixes N+1)
    const mcqIds = exam.questions.filter(eq => eq.questionType === 'mcq').map(eq => eq.questionId)
    const mcqs = mcqIds.length > 0
      ? await db.mCQ.findMany({ where: { id: { in: mcqIds } } })
      : []
    const mcqMap = new Map(mcqs.map(m => [m.id, m]))

    // Per-MCQ premium access: a free exam may still contain individually-premium
    // MCQs. Exclude those the user has not purchased/subscribed to. This is enforced
    // server-side so a direct API call cannot leak paid question content.
    const accessiblePremiumMcqIds = new Set<string>()
    if (auth?.user?.id) {
      const premiumMcqs = mcqs.filter(m => m.isPremium)
      const accessResults = await Promise.all(
        premiumMcqs.map(async (m) => {
          const access = await checkContentAccess({
            userId: auth.user.id,
            contentType: 'mcq',
            contentId: m.id,
          })
          return access.hasAccess ? m.id : null
        })
      )
      accessResults.forEach((id) => { if (id) accessiblePremiumMcqIds.add(id) })
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
        const mcq = mcqMap.get(eq.questionId)
        if (mcq) {
          // Skip premium MCQs inside a free exam when the user lacks access.
          if (mcq.isPremium && !exam.isPremium && !accessiblePremiumMcqIds.has(mcq.id)) {
            continue
          }
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
