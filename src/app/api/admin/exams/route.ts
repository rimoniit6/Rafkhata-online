import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin, parseIdsParam } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const classLevel = searchParams.get('classLevel')
    const subjectId = searchParams.get('subjectId')
    const type = searchParams.get('type')
    const isPremium = searchParams.get('isPremium')
    const isActive = searchParams.get('isActive')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (classLevel) where.classLevel = classLevel
    if (subjectId) where.subjectId = subjectId
    if (type) where.type = type
    if (isPremium !== null && isPremium !== undefined) where.isPremium = isPremium === 'true'
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'
    if (status) where.status = status

    const [data, total] = await Promise.all([
      db.exam.findMany({
        where,
        include: {
          questions: { orderBy: { order: 'asc' } },
          _count: { select: { results: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.exam.count({ where }),
    ])

    return paginatedApiResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Exams')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const {
      title, description, classLevel, subjectId, chapterIds, type, duration,
      totalMarks, marksPerMcq, negativeMarks, isPremium, price, isActive,
      status, instructions, startsAt, endsAt, questions,
    } = body

    if (!title || !classLevel || !type || !duration) {
      return apiError('প্রয়োজনীয় ফিল্ড পূরণ করুন', 400)
    }

    const exam = await db.exam.create({
      data: {
        title, description: description || null, classLevel, subjectId: subjectId || null,
        chapterIds: chapterIds || null, type, duration,
        totalMarks: totalMarks ?? 0, marksPerMcq: marksPerMcq ?? 1, negativeMarks: negativeMarks ?? 0,
        isPremium: isPremium ?? false, price: price ?? 0, isActive: isActive ?? true,
        status: status ?? 'draft', instructions: instructions || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        questions: questions && questions.length > 0
          ? { create: questions.map((q: { questionType: string; questionId: string; marks: number; order: number }) => ({ questionType: q.questionType, questionId: q.questionId, marks: q.marks || 0, order: q.order || 0 })) }
          : undefined,
      },
      include: { questions: true },
    })

    if (exam.totalMarks === 0 && exam.questions.length > 0) {
      const calcMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0)
      await db.exam.update({ where: { id: exam.id }, data: { totalMarks: calcMarks } })
      exam.totalMarks = calcMarks
    }

    return apiResponse(exam, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Exam')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, questions, ...updateData } = body

    if (!id) return apiError('পরীক্ষা ID আবশ্যক', 400)

    const existing = await db.exam.findUnique({ where: { id } })
    if (!existing) return apiError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)

    const updateFields: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'description', 'classLevel', 'subjectId', 'chapterIds',
      'type', 'duration', 'totalMarks', 'marksPerMcq', 'negativeMarks',
      'isPremium', 'price', 'isActive', 'status', 'instructions',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) updateFields[field] = updateData[field]
    }

    if (updateData.startsAt !== undefined) updateFields.startsAt = updateData.startsAt ? new Date(updateData.startsAt) : null
    if (updateData.endsAt !== undefined) updateFields.endsAt = updateData.endsAt ? new Date(updateData.endsAt) : null

    if (questions !== undefined) {
      await db.examQuestion.deleteMany({ where: { examId: id } })
      if (Array.isArray(questions) && questions.length > 0) {
        updateFields.questions = {
          create: questions.map((q: { questionType: string; questionId: string; marks: number; order: number }) => ({
            questionType: q.questionType, questionId: q.questionId, marks: q.marks || 0, order: q.order || 0,
          })),
        }
        updateFields.totalMarks = questions.reduce((sum: number, q: { marks: number }) => sum + (q.marks || 0), 0)
      }
    }

    const updated = await db.exam.update({
      where: { id },
      data: updateFields,
      include: { questions: true },
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Exam')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.exam.deleteMany({ where: { id: { in: ids } } })
      return apiResponse({ deleted: result.count }, `${result.count}টি সফলভাবে মুছে ফেলা হয়েছে`)
    }
    const id = searchParams.get('id')

    if (!id) return apiError('পরীক্ষা ID আবশ্যক', 400)

    const existing = await db.exam.findUnique({ where: { id } })
    if (!existing) return apiError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)

    await db.exam.delete({ where: { id } })
    return apiResponse({ id }, 'পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Exam')
  }
}
