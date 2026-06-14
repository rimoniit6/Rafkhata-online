import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (chapterId) where.chapterId = chapterId
    if (type) where.type = type

    const data = await db.knowledgeQuestion.findMany({
      where,
      include: {
        chapter: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ type: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Knowledge Questions')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { chapterId, type, question, answer, questionImage, answerImage, isPremium, price, order } = body

    if (!chapterId || !type || !question || !answer) {
      return apiError('chapterId, type, question, and answer are required', 400)
    }

    if (!['knowledge', 'comprehension'].includes(type)) {
      return apiError('type must be "knowledge" or "comprehension"', 400)
    }

    const chapter = await db.chapter.findUnique({ where: { id: chapterId } })
    if (!chapter) return apiError('Chapter not found', 404)

    const data = await db.knowledgeQuestion.create({
      data: {
        chapterId,
        type,
        question,
        answer,
        questionImage: questionImage || null,
        answerImage: answerImage || null,
        isPremium: isPremium ?? false,
        price: price ?? 0,
        order: order ?? 0,
      },
      include: {
        chapter: { select: { id: true, name: true, slug: true } },
      },
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Knowledge Question')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, chapterId, type, question, answer, questionImage, answerImage, isPremium, price, order, isActive } = body

    if (!id) return apiError('id is required', 400)

    const existing = await db.knowledgeQuestion.findUnique({ where: { id } })
    if (!existing) return apiError('Knowledge question not found', 404)

    const updateData: Record<string, unknown> = {}
    if (chapterId !== undefined) updateData.chapterId = chapterId
    if (type !== undefined) {
      if (!['knowledge', 'comprehension'].includes(type)) return apiError('type must be "knowledge" or "comprehension"', 400)
      updateData.type = type
    }
    if (question !== undefined) updateData.question = question
    if (answer !== undefined) updateData.answer = answer
    if (questionImage !== undefined) updateData.questionImage = questionImage
    if (answerImage !== undefined) updateData.answerImage = answerImage
    if (isPremium !== undefined) updateData.isPremium = isPremium
    if (price !== undefined) updateData.price = price
    if (order !== undefined) updateData.order = order
    if (isActive !== undefined) updateData.isActive = isActive

    const data = await db.knowledgeQuestion.update({
      where: { id },
      data: updateData,
      include: {
        chapter: { select: { id: true, name: true, slug: true } },
      },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Update Knowledge Question')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return apiError('id is required', 400)

    const existing = await db.knowledgeQuestion.findUnique({ where: { id } })
    if (!existing) return apiError('Knowledge question not found', 404)

    await db.knowledgeQuestion.delete({ where: { id } })

    return apiResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Knowledge Question')
  }
}
