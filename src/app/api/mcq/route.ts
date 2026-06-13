import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiError, withCsrf, applyRateLimit } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { apiLimiter } from '@/lib/rate-limit'

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
  questionImage?: string | null
  optionAImage?: string | null
  optionBImage?: string | null
  optionCImage?: string | null
  optionDImage?: string | null
  explanationImage?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  isPremium: boolean
  price: number
  difficulty: string
  board?: string | null
  year?: string | null
  chapter?: { id: string; name: string; slug: string } | null
  [key: string]: unknown
}) {
  return {
    id: mcq.id,
    text: mcq.question,
    questionImage: mcq.questionImage || null,
    options: [
      { key: 'A', text: mcq.optionA, image: mcq.optionAImage || null },
      { key: 'B', text: mcq.optionB, image: mcq.optionBImage || null },
      { key: 'C', text: mcq.optionC, image: mcq.optionCImage || null },
      { key: 'D', text: mcq.optionD, image: mcq.optionDImage || null },
    ],
    correctAnswer: mcq.correctAnswer,
    explanation: mcq.explanation || '',
    explanationImage: mcq.explanationImage || null,
    // Premium metadata for listing/purchase flow
    isPremium: mcq.isPremium || false,
    price: mcq.price || 0,
    classLevel: mcq.classLevel || '',
    subjectId: mcq.subjectId || '',
    chapterId: mcq.chapterId || '',
    chapterName: mcq.chapter?.name || '',
    difficulty: mcq.difficulty || 'medium',
    board: mcq.board || null,
    year: mcq.year || null,
  }
}

// Lightweight transform for listing pages — includes question text preview but not full options/answer
function transformMCQList(mcq: {
  id: string
  question: string
  questionImage?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  isPremium: boolean
  price: number
  difficulty: string
  board?: string | null
  year?: string | null
  chapter?: { id: string; name: string; slug: string } | null
}) {
  return {
    id: mcq.id,
    text: mcq.question,
    questionImage: mcq.questionImage || null,
    isPremium: mcq.isPremium || false,
    price: mcq.price || 0,
    classLevel: mcq.classLevel || '',
    subjectId: mcq.subjectId || '',
    chapterId: mcq.chapterId || '',
    chapterName: mcq.chapter?.name || '',
    difficulty: mcq.difficulty || 'medium',
    board: mcq.board || null,
    year: mcq.year || null,
  }
}

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const classLevel = searchParams.get('classLevel')
    const subjectId = searchParams.get('subjectId')
    const type = searchParams.get('type') // "exam" for exam mode, "list" for listing page
    const difficulty = searchParams.get('difficulty')
    const board = searchParams.get('board')
    const year = searchParams.get('year')
    const isPremium = searchParams.get('isPremium')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '500')

    const where: Record<string, unknown> = { isActive: true }

    // Hierarchy-based filtering: prefer most specific filter available
    // chapterId > subjectId > classLevel
    // Never combine classLevel with subjectId/chapterId because classLevel
    // values in MCQ records may be inconsistent (created before rename, etc.)
    if (chapterId) {
      where.chapterId = chapterId
    } else if (subjectId) {
      where.subjectId = subjectId
    } else if (classLevel) {
      where.classLevel = classLevel
    }
    if (difficulty) where.difficulty = difficulty
    if (board) where.board = board
    if (year) where.year = year
    if (isPremium !== null && isPremium !== undefined && isPremium !== '') {
      where.isPremium = isPremium === 'true'
    }

    // ─── LIST MODE: lightweight data for listing pages (paginated) ───
    if (type === 'list') {
      // List mode defaults: page=1, limit=20 (matching admin pages)
      const listPage = searchParams.has('page') ? page : 1
      const listLimit = searchParams.has('limit') ? limit : 20

      const [mcqs, total, freeCount, premiumCount, boardCount, practiceCount] = await Promise.all([
        db.mCQ.findMany({
          where,
          include: {
            chapter: { select: { id: true, name: true, slug: true } },
          },
          orderBy: [
            { isPremium: 'asc' },  // free first
            { createdAt: 'desc' },
          ],
          skip: (listPage - 1) * listLimit,
          take: listLimit,
        }),
        db.mCQ.count({ where }),
        db.mCQ.count({ where: { ...where, isPremium: false } }),
        db.mCQ.count({ where: { ...where, isPremium: true } }),
        db.mCQ.count({ where: { ...where, board: { not: null }, year: { not: null } } }),
        db.mCQ.count({ where: { ...where, board: null } }),
      ])

      const questions = mcqs.map(transformMCQList)
      const totalPages = Math.ceil(total / listLimit)

      return NextResponse.json({
        success: true,
        data: {
          questions,
          total,
          freeCount,
          premiumCount,
          boardCount,
          practiceCount,
        },
        pagination: {
          page: listPage,
          limit: listLimit,
          totalPages,
        },
      })
    }

    // ─── EXAM MODE: random MCQs with shuffled order ───
    if (type === 'exam') {
      const allMcqs = await db.mCQ.findMany({
        where,
        include: {
          chapter: {
            select: { id: true, name: true, slug: true },
          },
        },
      })

      // Shuffle the MCQs
      const shuffled = allMcqs.sort(() => Math.random() - 0.5)

      // Transform and remove correctAnswer from response for exam mode
      const examMcqs = shuffled.map(({ correctAnswer, explanation, ...rest }) => ({
        ...transformMCQ({ ...rest, correctAnswer, explanation } as Parameters<typeof transformMCQ>[0]),
        // In exam mode, don't send correctAnswer to client
        correctAnswer: '',
        hasExplanation: !!explanation,
      }))

      return NextResponse.json({
        success: true,
        data: {
          questions: examMcqs,
          total: examMcqs.length,
          mode: 'exam',
        },
      })
    }

    // ─── NORMAL MODE: full data with pagination ───
    const [mcqs, total] = await Promise.all([
      db.mCQ.findMany({
        where,
        include: {
          chapter: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mCQ.count({ where }),
    ])

    // Fetch user access control list
    const auth = await verifyAuth(request)
    const isAdmin = auth?.user && ['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)
    
    let accessMap = new Map()
    if (!isAdmin && auth?.user) {
      const premiumMcqIds = mcqs.filter((m) => m.isPremium).map((m) => m.id)
      if (premiumMcqIds.length > 0) {
        const { batchCheckContentAccess } = await import('@/lib/access-control')
        accessMap = await batchCheckContentAccess({
          userId: auth.user.id,
          items: premiumMcqIds.map((id) => ({ contentType: 'mcq', contentId: id })),
        })
      }
    }

    // Transform to frontend-expected format
    const questions = mcqs.map((mcq) => {
      const baseTransformed = transformMCQ(mcq)
      if (mcq.isPremium && !isAdmin) {
        const hasAccess = auth?.user ? !!accessMap.get(mcq.id)?.hasAccess : false
        if (!hasAccess) {
          return {
            id: baseTransformed.id,
            text: baseTransformed.text,
            questionImage: baseTransformed.questionImage,
            isPremium: true,
            price: baseTransformed.price,
            classLevel: baseTransformed.classLevel,
            subjectId: baseTransformed.subjectId,
            chapterId: baseTransformed.chapterId,
            chapterName: baseTransformed.chapterName,
            difficulty: baseTransformed.difficulty,
            board: baseTransformed.board,
            year: baseTransformed.year,
            hasAccess: false,
            options: [],
            correctAnswer: '',
            explanation: '',
            explanationImage: null,
          }
        }
      }
      return { ...baseTransformed, hasAccess: true }
    })

    return NextResponse.json({
      success: true,
      data: { questions },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Get MCQs error')
  }
}

export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    // Require admin auth for creating MCQs
    const auth = await verifyAuth(request)
    if (!auth || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
      return apiError('MCQ তৈরি করার অনুমতি নেই', 403, 'FORBIDDEN')
    }

    const body = await request.json()
    const {
      question,
      questionImage,
      optionA,
      optionB,
      optionC,
      optionD,
      optionAImage,
      optionBImage,
      optionCImage,
      optionDImage,
      correctAnswer,
      explanation,
      explanationImage,
      chapterId,
      classLevel,
      subjectId,
      board,
      year,
      difficulty,
      isPremium,
      price,
      tags,
    } = body

    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !chapterId || !classLevel || !subjectId) {
      return apiError('প্রয়োজনীয় ফিল্ড পূরণ করুন', 400)
    }

    const mcq = await db.mCQ.create({
      data: {
        question,
        questionImage: questionImage || null,
        optionA,
        optionAImage: optionAImage || null,
        optionB,
        optionBImage: optionBImage || null,
        optionC,
        optionCImage: optionCImage || null,
        optionD,
        optionDImage: optionDImage || null,
        correctAnswer,
        explanation: explanation || null,
        explanationImage: explanationImage || null,
        chapterId,
        classLevel,
        subjectId,
        board: board || null,
        year: year || null,
        difficulty: difficulty || 'medium',
        isPremium: isPremium || false,
        price: price || 0,
        tags: tags || null,
      },
    })

    return NextResponse.json(
      { message: 'MCQ সফলভাবে তৈরি হয়েছে', mcq: transformMCQ(mcq as Parameters<typeof transformMCQ>[0]) },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, 'Create MCQ error')
  }
}
