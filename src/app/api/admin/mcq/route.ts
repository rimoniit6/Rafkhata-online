import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
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
        { question: { contains: q } },
        { explanation: { contains: q } },
        { tags: { contains: q } },
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
      db.mCQ.findMany({
        where,
        include: {
          chapter: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mCQ.count({ where }),
    ])

    return paginatedApiResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get MCQs')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const {
      question,
      questionImage,
      optionA,
      optionAImage,
      optionB,
      optionBImage,
      optionC,
      optionCImage,
      optionD,
      optionDImage,
      correctAnswer,
      explanation,
      explanationImage,
      chapterId,
      classLevel,
      subjectId,
      board,
      year,
      topic,
      difficulty,
      isPremium,
      price,
      tags,
      isActive,
    } = body

    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !chapterId || !classLevel || !subjectId) {
      return apiError('প্রয়োজনীয় ফিল্ড পূরণ করুন', 400)
    }

    const data = await db.mCQ.create({
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
        topic: topic || null,
        difficulty: difficulty || 'medium',
        isPremium: isPremium ?? false,
        price: price ?? 0,
        tags: tags || null,
        isActive: isActive ?? true,
      },
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create MCQ')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return apiError('MCQ ID আবশ্যক', 400)
    }

    const existing = await db.mCQ.findUnique({ where: { id } })
    if (!existing) {
      return apiError('MCQ খুঁজে পাওয়া যায়নি', 404)
    }

    // Build clean update object with only provided fields
    const updateFields: Record<string, unknown> = {}
    const allowedFields = [
      'question', 'questionImage',
      'optionA', 'optionAImage',
      'optionB', 'optionBImage',
      'optionC', 'optionCImage',
      'optionD', 'optionDImage',
      'correctAnswer', 'explanation', 'explanationImage',
      'chapterId', 'classLevel',
      'subjectId', 'board', 'year', 'topic', 'difficulty', 'isPremium',
      'price', 'tags', 'isActive',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field]
      }
    }

    const updated = await db.mCQ.update({
      where: { id },
      data: updateFields,
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update MCQ')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
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
      return apiError('MCQ ID আবশ্যক', 400)
    }

    const existing = await db.mCQ.findUnique({ where: { id } })
    if (!existing) {
      return apiError('MCQ খুঁজে পাওয়া যায়নি', 404)
    }

    await db.mCQ.delete({ where: { id } })

    return apiResponse({ id }, 'MCQ সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete MCQ')
  }
}
