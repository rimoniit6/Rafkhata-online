import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Transform raw MCQ Prisma object to frontend-expected format
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
}) {
  return {
    id: mcq.id,
    text: mcq.question,
    options: [
      { key: 'A', text: mcq.optionA },
      { key: 'B', text: mcq.optionB },
      { key: 'C', text: mcq.optionC },
      { key: 'D', text: mcq.optionD },
    ],
    correctAnswer: mcq.correctAnswer,
    explanation: mcq.explanation || '',
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { classLevel, subjectId, chapterId, count, duration } = body

    if (!count || count < 1) {
      return NextResponse.json(
        { error: 'প্রশ্নের সংখ্যা কমপক্ষে ১ হতে হবে' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: Record<string, unknown> = { isActive: true }

    if (chapterId) {
      // Single chapter
      where.chapterId = chapterId
    } else if (chapterId && Array.isArray(chapterId)) {
      // Multiple chapters
      where.chapterId = { in: chapterId }
    }

    if (classLevel) where.classLevel = classLevel
    if (subjectId) where.subjectId = subjectId

    // Support both chapterIds (array) and single chapterId
    if (body.chapterIds && Array.isArray(body.chapterIds) && body.chapterIds.length > 0) {
      where.chapterId = { in: body.chapterIds }
    }

    // Get total available MCQs
    const totalAvailable = await db.mCQ.count({ where })

    if (totalAvailable === 0) {
      return NextResponse.json(
        { error: 'নির্বাচিত মানদণ্ডে কোনো MCQ পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    const actualCount = Math.min(count, totalAvailable)

    // Get random MCQs
    const allMcqs = await db.mCQ.findMany({
      where,
      include: {
        chapter: {
          select: { id: true, name: true },
        },
      },
    })

    // Shuffle and take the requested count
    const shuffled = allMcqs.sort(() => Math.random() - 0.5).slice(0, actualCount)

    // Transform to frontend-expected format
    // In exam mode, remove correctAnswer from response
    const examMcqs = shuffled.map(({ correctAnswer, explanation, ...rest }) => ({
      ...transformMCQ({ ...rest, correctAnswer, explanation }),
      correctAnswer: '',
      hasExplanation: !!explanation,
    }))

    return NextResponse.json({
      exam: {
        questions: examMcqs,
        totalQuestions: actualCount,
        duration: duration || actualCount * 2, // default 2 min per question
        availableInDb: totalAvailable,
      },
    })
  } catch (error) {
    console.error('Generate exam error:', error)
    return NextResponse.json(
      { error: 'পরীক্ষা তৈরি করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
