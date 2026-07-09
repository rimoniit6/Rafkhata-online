import { apiError,apiResponse,paginatedApiResponse,parseIdsParam,validateBody,withAdmin } from '@/lib/api-utils'
import { AuditActions,auditFromRequest,EntityTypes } from '@/lib/audit'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createMcqSchema = z.object({
  question: z.string().min(1, 'প্রশ্ন আবশ্যক'),
  questionImage: z.string().nullable().optional(),
  optionA: z.string().min(1, 'অপশন A আবশ্যক'),
  optionAImage: z.string().nullable().optional(),
  optionB: z.string().min(1, 'অপশন B আবশ্যক'),
  optionBImage: z.string().nullable().optional(),
  optionC: z.string().min(1, 'অপশন C আবশ্যক'),
  optionCImage: z.string().nullable().optional(),
  optionD: z.string().min(1, 'অপশন D আবশ্যক'),
  optionDImage: z.string().nullable().optional(),
  correctAnswer: z.enum(['A', 'B', 'C', 'D'], { message: 'সঠিক উত্তর অবশ্যই A, B, C, বা D হতে হবে' }),
  explanation: z.string().nullable().optional(),
  explanationImage: z.string().nullable().optional(),
  chapterId: z.string().min(1, 'অধ্যায় আইডি আবশ্যক'),
  classLevel: z.string().min(1, 'শ্রেণি আবশ্যক'),
  subjectId: z.string().min(1, 'বিষয় আইডি আবশ্যক'),
  board: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  isPremium: z.boolean().optional(),
  price: z.number().min(0).optional(),
  tags: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

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
    const validated = validateBody(createMcqSchema, body)
    if ('error' in validated) return validated.error
    const { data: fields } = validated

    const data = await db.mCQ.create({
      data: {
        question: fields.question,
        questionImage: fields.questionImage ?? null,
        optionA: fields.optionA,
        optionAImage: fields.optionAImage ?? null,
        optionB: fields.optionB,
        optionBImage: fields.optionBImage ?? null,
        optionC: fields.optionC,
        optionCImage: fields.optionCImage ?? null,
        optionD: fields.optionD,
        optionDImage: fields.optionDImage ?? null,
        correctAnswer: fields.correctAnswer,
        explanation: fields.explanation ?? null,
        explanationImage: fields.explanationImage ?? null,
        chapterId: fields.chapterId,
        classLevel: fields.classLevel,
        subjectId: fields.subjectId,
        board: fields.board ?? null,
        year: fields.year ?? null,
        topic: fields.topic ?? null,
        difficulty: fields.difficulty ?? 'medium',
        isPremium: fields.isPremium ?? false,
        price: fields.price ?? 0,
        tags: fields.tags ?? null,
        isActive: fields.isActive ?? true,
      },
    })

    await invalidateContentCache('mcq')
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, EntityTypes.MCQ_QUESTION, data.id, body)
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
      data: updateFields as never,
    })

    await invalidateContentCache('mcq')
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, EntityTypes.MCQ_QUESTION, existing.id, { ...existing }, updateData)
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

    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.mCQ.deleteMany({ where: { id: { in: ids } } })
      await invalidateContentCache('mcq')
      await Promise.all(ids.map(id => auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, EntityTypes.MCQ_QUESTION, id)))
      return apiResponse({ deleted: result.count }, `${result.count}টি MCQ মুছে ফেলা হয়েছে`)
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
      return apiError('MCQ ID আবশ্যক', 400)
    }

    const existing = await db.mCQ.findUnique({ where: { id } })
    if (!existing) {
      return apiError('MCQ খুঁজে পাওয়া যায়নি', 404)
    }

    await db.mCQ.delete({ where: { id } })

    await invalidateContentCache('mcq')
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, EntityTypes.MCQ_QUESTION, id)
    return apiResponse({ id }, 'MCQ সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete MCQ')
  }
}
