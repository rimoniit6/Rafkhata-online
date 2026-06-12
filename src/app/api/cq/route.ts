import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, withCsrf } from '@/lib/api-utils'

// Transform raw CQ Prisma object to frontend-expected format
function transformCQ(cq: {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  question1: string
  question1Image?: string | null
  question2: string
  question2Image?: string | null
  question3: string
  question3Image?: string | null
  question4: string
  question4Image?: string | null
  answer1: string
  answer1Image?: string | null
  answer2: string
  answer2Image?: string | null
  answer3: string
  answer3Image?: string | null
  answer4: string
  answer4Image?: string | null
  isPremium: boolean
  price: number
  board: string | null
  year: string | null
  difficulty: string
  chapterId: string
  chapter?: { id: string; name: string; slug: string; subject?: { id: string; name: string; slug: string; class?: { id: string; name: string; slug: string } } }
  [key: string]: unknown
}) {
  // Bengali sub-question labels: ক, খ, গ, ঘ
  const BENGALI_LABELS = ['ক', 'খ', 'গ', 'ঘ']

  // Build questions array from question1-4 and answer1-4
  const questions: Array<{
    id: string
    label: string
    number: number
    text: string
    marks: number
    answer: string
    questionImage: string | null
    answerImage: string | null
  }> = []
  for (let i = 1; i <= 4; i++) {
    const text = cq[`question${i}` as keyof typeof cq] as string
    const answer = cq[`answer${i}` as keyof typeof cq] as string
    const questionImage = cq[`question${i}Image` as keyof typeof cq] as string | null | undefined
    const answerImage = cq[`answer${i}Image` as keyof typeof cq] as string | null | undefined
    if (text) {
      questions.push({
        id: `${cq.id}-q${i}`,
        label: BENGALI_LABELS[i - 1], // ক, খ, গ, ঘ
        number: i,
        text,
        marks: i, // ক=১, খ=২, গ=৩, ঘ=৪
        answer: answer || '',
        questionImage: questionImage || null,
        answerImage: answerImage || null,
      })
    }
  }

  return {
    id: cq.id,
    uddeepok: cq.uddeepok,
    uddeepokImage: cq.uddeepokImage || null,
    questions,
    chapterName: cq.chapter?.name || '',
    subjectName: cq.chapter?.subject?.name || '',
    className: cq.chapter?.subject?.class?.name || '',
    classSlug: cq.chapter?.subject?.class?.slug || '',
    subjectId: cq.chapter?.subject?.id || '',
    chapterId: cq.chapterId,
    isPremium: cq.isPremium,
    price: cq.price || 0,
    difficulty: cq.difficulty || 'medium',
    year: cq.year || undefined,
    board: cq.board || undefined,
  }
}

// Lightweight transform for listing pages — includes uddeepok preview but not full questions/answers
function transformCQList(cq: {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  isPremium: boolean
  price: number
  difficulty: string
  board: string | null
  year: string | null
  chapterId: string
  question1: string
  question2: string
  question3: string
  question4: string
  chapter?: { id: string; name: string; slug: string; subject?: { id: string; name: string; slug: string; class?: { id: string; name: string; slug: string } } }
}) {
  // Count how many questions are non-empty
  let questionCount = 0
  for (let i = 1; i <= 4; i++) {
    if (cq[`question${i}` as keyof typeof cq] as string) questionCount++
  }

  return {
    id: cq.id,
    uddeepok: cq.uddeepok,
    uddeepokImage: cq.uddeepokImage || null,
    questionCount,
    isPremium: cq.isPremium || false,
    price: cq.price || 0,
    difficulty: cq.difficulty || 'medium',
    board: cq.board || null,
    year: cq.year || null,
    chapterId: cq.chapterId,
    chapterName: cq.chapter?.name || '',
    subjectName: cq.chapter?.subject?.name || '',
    className: cq.chapter?.subject?.class?.name || '',
    classSlug: cq.chapter?.subject?.class?.slug || '',
    subjectId: cq.chapter?.subject?.id || '',
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const classLevel = searchParams.get('classLevel')
    const subjectId = searchParams.get('subjectId')
    const board = searchParams.get('board')
    const year = searchParams.get('year')
    const isPremium = searchParams.get('isPremium')
    const difficulty = searchParams.get('difficulty')
    const type = searchParams.get('type') // "list" for listing page
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { isActive: true }

    // Hierarchy-based filtering: prefer most specific filter available
    // chapterId > subjectId > classLevel
    // Never combine classLevel with subjectId/chapterId because classLevel
    // values in CQ records may be inconsistent
    if (chapterId) {
      where.chapterId = chapterId
    } else if (subjectId) {
      where.subjectId = subjectId
    } else if (classLevel) {
      where.classLevel = classLevel
    }
    if (board) where.board = board
    if (year) where.year = year
    if (difficulty) where.difficulty = difficulty
    if (isPremium !== null && isPremium !== undefined && isPremium !== '') {
      where.isPremium = isPremium === 'true'
    }

    // ─── LIST MODE: lightweight data for listing pages (free-first, paginated) ───
    if (type === 'list') {
      // List mode defaults: page=1, limit=20 (matching admin pages)
      const listPage = searchParams.has('page') ? page : 1
      const listLimit = searchParams.has('limit') ? limit : 20

      const [cqs, total, freeCount, premiumCount] = await Promise.all([
        db.cQ.findMany({
          where,
          include: {
            chapter: {
              select: {
                id: true,
                name: true,
                slug: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    class: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: [
            { isPremium: 'asc' }, // free first
            { createdAt: 'desc' },
          ],
          skip: (listPage - 1) * listLimit,
          take: listLimit,
        }),
        db.cQ.count({ where }),
        db.cQ.count({ where: { ...where, isPremium: false } }),
        db.cQ.count({ where: { ...where, isPremium: true } }),
      ])

      const list = cqs.map(transformCQList)
      const totalPages = Math.ceil(total / listLimit)

      return NextResponse.json({
        cqs: list,
        total,
        freeCount,
        premiumCount,
        pagination: {
          page: listPage,
          limit: listLimit,
          totalPages,
        },
      })
    }

    // ─── NORMAL MODE: full data with pagination ───
    const [cqs, total] = await Promise.all([
      db.cQ.findMany({
        where,
        include: {
          chapter: {
            select: {
              id: true,
              name: true,
              slug: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  class: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.cQ.count({ where }),
    ])

    // Fetch user access control list
    const auth = await verifyAuth(request)
    const isAdmin = auth?.user && ['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)

    let accessMap = new Map()
    if (!isAdmin && auth?.user) {
      const premiumCqIds = cqs.filter((c) => c.isPremium).map((c) => c.id)
      if (premiumCqIds.length > 0) {
        const { batchCheckContentAccess } = await import('@/lib/access-control')
        accessMap = await batchCheckContentAccess({
          userId: auth.user.id,
          items: premiumCqIds.map((id) => ({ contentType: 'cq', contentId: id })),
        })
      }
    }

    // Transform to frontend-expected format and apply access restriction
    const transformedCqs = cqs.map((cq) => {
      const baseTransformed = transformCQ(cq)
      if (cq.isPremium && !isAdmin) {
        const hasAccess = auth?.user ? !!accessMap.get(cq.id)?.hasAccess : false
        if (!hasAccess) {
          // Return stripped version of questions (questions list without answers)
          const strippedQuestions = baseTransformed.questions.map((q) => ({
            id: q.id,
            label: q.label,
            number: q.number,
            text: q.text,
            marks: q.marks,
            questionImage: q.questionImage,
            answer: '',
            answerImage: null,
          }))

          return {
            id: baseTransformed.id,
            uddeepok: baseTransformed.uddeepok,
            uddeepokImage: baseTransformed.uddeepokImage,
            questions: strippedQuestions,
            chapterName: baseTransformed.chapterName,
            subjectName: baseTransformed.subjectName,
            className: baseTransformed.className,
            classSlug: baseTransformed.classSlug,
            subjectId: baseTransformed.subjectId,
            chapterId: baseTransformed.chapterId,
            isPremium: true,
            price: baseTransformed.price,
            difficulty: baseTransformed.difficulty,
            year: baseTransformed.year,
            board: baseTransformed.board,
            hasAccess: false,
          }
        }
      }
      return { ...baseTransformed, hasAccess: true }
    })

    return NextResponse.json({
      cqs: transformedCqs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get CQs error:', error)
    return NextResponse.json(
      { error: 'সৃজনশীল প্রশ্নের তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    // Require admin auth for creating CQs
    const auth = await verifyAuth(request)
    if (!auth?.user || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'সৃজনশীল প্রশ্ন তৈরি করার অনুমতি নেই' }, { status: 403 })
    }

    const body = await request.json()
    const {
      uddeepok,
      uddeepokImage,
      question1,
      question1Image,
      question2,
      question2Image,
      question3,
      question3Image,
      question4,
      question4Image,
      answer1,
      answer1Image,
      answer2,
      answer2Image,
      answer3,
      answer3Image,
      answer4,
      answer4Image,
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

    if (!uddeepok || !question1 || !chapterId || !classLevel || !subjectId) {
      return NextResponse.json(
        { error: 'প্রয়োজনীয় ফিল্ড পূরণ করুন' },
        { status: 400 }
      )
    }

    const cq = await db.cQ.create({
      data: {
        uddeepok,
        uddeepokImage: uddeepokImage || null,
        question1,
        question1Image: question1Image || null,
        question2: question2 || '',
        question2Image: question2Image || null,
        question3: question3 || '',
        question3Image: question3Image || null,
        question4: question4 || '',
        question4Image: question4Image || null,
        answer1: answer1 || '',
        answer1Image: answer1Image || null,
        answer2: answer2 || '',
        answer2Image: answer2Image || null,
        answer3: answer3 || '',
        answer3Image: answer3Image || null,
        answer4: answer4 || '',
        answer4Image: answer4Image || null,
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
      { message: 'সৃজনশীল প্রশ্ন সফলভাবে তৈরি হয়েছে', cq },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create CQ error:', error)
    return NextResponse.json(
      { error: 'সৃজনশীল প্রশ্ন তৈরি করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
