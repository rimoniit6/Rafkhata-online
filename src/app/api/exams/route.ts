import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const classLevel = searchParams.get('classLevel')
    const subjectId = searchParams.get('subjectId')
    const chapterId = searchParams.get('chapterId')
    const type = searchParams.get('type')
    const q = searchParams.get('q')
    const isActive = searchParams.get('isActive')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const where: Record<string, unknown> = {}
    where.isActive = isActive === 'false' ? false : true
    where.status = status || 'published'

    if (classLevel) where.classLevel = classLevel
    if (subjectId) where.subjectId = subjectId
    if (chapterId) where.chapterIds = { contains: chapterId }
    if (type) where.type = type
    if (q?.trim()) where.title = { contains: q.trim() }

    const [data, total] = await Promise.all([
      db.exam.findMany({
        where,
        include: { questions: { select: { id: true, questionType: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.exam.count({ where }),
    ])

    const exams = data.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      classLevel: exam.classLevel,
      type: exam.type,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      marksPerMcq: exam.marksPerMcq,
      negativeMarks: exam.negativeMarks,
      year: null,
      board: null,
      isPremium: exam.isPremium,
      price: exam.price,
      instructions: exam.instructions,
      totalQuestions: exam.questions.length,
    }))

    return NextResponse.json({
      success: true,
      data: exams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, 'Public Get Exams error')
  }
}
