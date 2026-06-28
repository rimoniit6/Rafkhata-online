import { batchCheckContentAccess } from '@/lib/access-control'
import { withCsrf } from '@/lib/api-utils'
import { verifyAuth } from '@/lib/auth'
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
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
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

    if (body.chapterIds && Array.isArray(body.chapterIds) && body.chapterIds.length > 0) {
      where.chapterId = { in: body.chapterIds }
    } else if (chapterId) {
      where.chapterId = chapterId
    }

    if (classLevel) where.classLevel = classLevel
    if (subjectId) where.subjectId = subjectId

    // Get total available MCQs
    const totalAvailable = await db.mCQ.count({ where })

    if (totalAvailable === 0) {
      return NextResponse.json(
        { error: 'নির্বাচিত মানদণ্ডে কোনো MCQ পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    const actualCount = Math.min(count, totalAvailable)

    // Get random MCQs (limit to prevent loading all records into memory)
    const allMcqs = await db.mCQ.findMany({
      where,
      include: {
        chapter: {
          select: { id: true, name: true },
        },
      },
      take: Math.min(actualCount * 2, 500),
    })

    // Shuffle and take the requested count
    const shuffled = allMcqs.sort(() => Math.random() - 0.5).slice(0, actualCount)

    // Access control — filter out premium MCQs user hasn't purchased
    const auth = await verifyAuth(request)
    let accessibleIds: Set<string> | null = null
    if (auth) {
      const accessItems = shuffled.map(mcq => ({
        contentType: 'mcq' as const,
        contentId: mcq.id,
      }))
      const accessMap = await batchCheckContentAccess({ userId: auth.user.id, items: accessItems })
      accessibleIds = new Set(
        shuffled.filter(mcq => !mcq.isPremium || accessMap.get(mcq.id)?.hasAccess).map(mcq => mcq.id)
      )
    } else {
      accessibleIds = new Set(shuffled.filter(mcq => !mcq.isPremium).map(mcq => mcq.id))
    }

    const filteredMcqs = shuffled.filter(mcq => accessibleIds!.has(mcq.id))

    if (filteredMcqs.length === 0) {
      return NextResponse.json(
        { error: 'আপনার প্যাকেজে এই মানদণ্ডের কোনো MCQ নেই। দয়া করে প্যাকেজ আপগ্রেড করুন।' },
        { status: 403 }
      )
    }

    // Transform to frontend-expected format
    // In exam mode, remove correctAnswer from response
    const examMcqs = filteredMcqs.map(({ correctAnswer, explanation, ...rest }) => ({
      ...transformMCQ({ ...rest, correctAnswer, explanation }),
      correctAnswer: '',
      hasExplanation: !!explanation,
    }))

    const durationMinutes = duration || Math.max(1, examMcqs.length * 2)

    return NextResponse.json({
      exam: {
        questions: examMcqs,
        totalQuestions: examMcqs.length,
        duration: durationMinutes,
        availableInDb: totalAvailable,
        filteredCount: shuffled.length - filteredMcqs.length,
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
