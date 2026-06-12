import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin, parseIdsParam } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const classLevel = searchParams.get('classLevel')
    const subjectId = searchParams.get('subjectId')
    const chapterId = searchParams.get('chapterId')
    const difficulty = searchParams.get('difficulty')
    const board = searchParams.get('board')
    const year = searchParams.get('year')
    const topic = searchParams.get('topic')
    const isPremium = searchParams.get('isPremium')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (q) {
      where.OR = [
        { uddeepok: { contains: q } },
        { question1: { contains: q } },
        { question2: { contains: q } },
        { question3: { contains: q } },
        { question4: { contains: q } },
      ]
    }
    if (classLevel) where.classLevel = classLevel
    if (subjectId) where.subjectId = subjectId
    if (chapterId) where.chapterId = chapterId
    if (difficulty) where.difficulty = difficulty
    if (board) where.board = board
    if (year) where.year = year
    if (topic) where.topic = topic
    if (isPremium !== null && isPremium !== undefined) where.isPremium = isPremium === 'true'
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const [data, total] = await Promise.all([
      db.cQ.findMany({
        where,
        include: {
          chapter: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.cQ.count({ where }),
    ])

    return paginatedApiResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get CQs')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const {
      uddeepok, uddeepokImage, question1, question1Image,
      question2, question2Image, question3, question3Image,
      question4, question4Image, answer1, answer1Image,
      answer2, answer2Image, answer3, answer3Image,
      answer4, answer4Image, chapterId, classLevel, subjectId,
      board, year, topic, difficulty, isPremium, price, tags, isActive,
    } = body

    if (!uddeepok || !question1 || !answer1 || !chapterId || !classLevel || !subjectId) {
      return apiError('প্রয়োজনীয় ফিল্ড পূরণ করুন (উদ্দীপক, প্রশ্ন ১, উত্তর ১, অধ্যায়, শ্রেণি, বিষয়)', 400)
    }

    const data = await db.cQ.create({
      data: {
        uddeepok, uddeepokImage: uddeepokImage || null,
        question1, question1Image: question1Image || null,
        question2: question2 || '', question2Image: question2Image || null,
        question3: question3 || '', question3Image: question3Image || null,
        question4: question4 || '', question4Image: question4Image || null,
        answer1, answer1Image: answer1Image || null,
        answer2: answer2 || '', answer2Image: answer2Image || null,
        answer3: answer3 || '', answer3Image: answer3Image || null,
        answer4: answer4 || '', answer4Image: answer4Image || null,
        chapterId, classLevel, subjectId,
        board: board || null, year: year || null, topic: topic || null,
        difficulty: difficulty || 'medium',
        isPremium: isPremium ?? false, price: price ?? 0,
        tags: tags || null, isActive: isActive ?? true,
      },
    })

    await invalidateContentCache('cq')
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create CQ')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return apiError('CQ ID আবশ্যক', 400)
    }

    const existing = await db.cQ.findUnique({ where: { id } })
    if (!existing) {
      return apiError('CQ খুঁজে পাওয়া যায়নি', 404)
    }

    const updateFields: Record<string, unknown> = {}
    const allowedFields = [
      'uddeepok', 'uddeepokImage',
      'question1', 'question1Image', 'question2', 'question2Image',
      'question3', 'question3Image', 'question4', 'question4Image',
      'answer1', 'answer1Image', 'answer2', 'answer2Image',
      'answer3', 'answer3Image', 'answer4', 'answer4Image',
      'chapterId', 'classLevel', 'subjectId', 'board', 'year', 'topic',
      'difficulty', 'isPremium', 'price', 'tags', 'isActive',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field]
      }
    }

    const updated = await db.cQ.update({ where: { id }, data: updateFields })

    await invalidateContentCache('cq')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update CQ')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)

    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.cQ.deleteMany({ where: { id: { in: ids } } })
      await invalidateContentCache('cq')
      return apiResponse({ deleted: result.count }, `${result.count}টি CQ মুছে ফেলা হয়েছে`)
    }

    const idFromQuery = searchParams.get('id')

    let id = idFromQuery

    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch {
        // No body provided
      }
    }

    if (!id) {
      return apiError('CQ ID আবশ্যক', 400)
    }

    const existing = await db.cQ.findUnique({ where: { id } })
    if (!existing) {
      return apiError('CQ খুঁজে পাওয়া যায়নি', 404)
    }

    await db.cQ.delete({ where: { id } })

    await invalidateContentCache('cq')
    return apiResponse({ id }, 'CQ সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete CQ')
  }
}
