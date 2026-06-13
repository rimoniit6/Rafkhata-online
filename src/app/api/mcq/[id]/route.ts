import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { checkContentAccess } from '@/lib/access-control'
import { apiError, withCsrf } from '@/lib/api-utils'

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
  isPremium: boolean
  price: number
  chapterId?: string
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
    chapterId: mcq.chapterId || null,
    isPremium: mcq.isPremium,
    price: mcq.price,
  }
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const mcq = await db.mCQ.findUnique({
      where: { id, isActive: true },
      include: {
        chapter: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!mcq) {
      return NextResponse.json(
        { success: false, error: 'MCQ খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    if (mcq.isPremium) {
      const auth = await verifyAuth()
      const userId = auth?.user.id

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'এই MCQ টি দেখতে লগইন করুন', code: 'PREMIUM_REQUIRES_AUTH' },
          { status: 401 }
        )
      }

      const access = await checkContentAccess({
        userId,
        contentType: 'mcq',
        contentId: id,
      })

      if (!access.hasAccess) {
        return NextResponse.json({
          success: true,
          data: {
            id: mcq.id,
            text: mcq.question,
            isPremium: true,
            price: mcq.price,
            chapterId: mcq.chapterId,
            chapterName: mcq.chapter?.name || '',
            hasAccess: false,
            pendingPayment: access.pendingPayment,
          },
        })
      }
    }

    return NextResponse.json({ success: true, data: transformMCQ(mcq) })
  } catch (error) {
    console.error('Get MCQ detail error:', error)
    return NextResponse.json(
      { success: false, error: 'MCQ এর বিস্তারিত তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth || !auth.user || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
      return NextResponse.json({ success: false, error: 'MCQ আপডেট করার অনুমতি নেই' }, { status: 403 })
    }

    const { id } = await props.params
    const body = await request.json()

    const existingMcq = await db.mCQ.findUnique({ where: { id } })

    if (!existingMcq) {
      return NextResponse.json(
        { success: false, error: 'MCQ খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    const mcq = await db.mCQ.update({
      where: { id },
      data: {
        ...(body.question !== undefined && { question: body.question }),
        ...(body.questionImage !== undefined && { questionImage: body.questionImage }),
        ...(body.optionA !== undefined && { optionA: body.optionA }),
        ...(body.optionAImage !== undefined && { optionAImage: body.optionAImage }),
        ...(body.optionB !== undefined && { optionB: body.optionB }),
        ...(body.optionBImage !== undefined && { optionBImage: body.optionBImage }),
        ...(body.optionC !== undefined && { optionC: body.optionC }),
        ...(body.optionCImage !== undefined && { optionCImage: body.optionCImage }),
        ...(body.optionD !== undefined && { optionD: body.optionD }),
        ...(body.optionDImage !== undefined && { optionDImage: body.optionDImage }),
        ...(body.correctAnswer !== undefined && { correctAnswer: body.correctAnswer }),
        ...(body.explanation !== undefined && { explanation: body.explanation }),
        ...(body.explanationImage !== undefined && { explanationImage: body.explanationImage }),
        ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
        ...(body.isPremium !== undefined && { isPremium: body.isPremium }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.board !== undefined && { board: body.board }),
        ...(body.year !== undefined && { year: body.year }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    return NextResponse.json({ success: true, data: { message: 'MCQ আপডেট হয়েছে', mcq: transformMCQ(mcq) } })
  } catch (error) {
    console.error('Update MCQ error:', error)
    return NextResponse.json(
      { success: false, error: 'MCQ আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth || !auth.user || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
      return NextResponse.json({ success: false, error: 'MCQ মুছে ফেলার অনুমতি নেই' }, { status: 403 })
    }

    const { id } = await props.params

    const existingMcq = await db.mCQ.findUnique({ where: { id } })

    if (!existingMcq) {
      return NextResponse.json(
        { success: false, error: 'MCQ খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    await db.mCQ.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, data: { message: 'MCQ সফলভাবে মুছে ফেলা হয়েছে' } })
  } catch (error) {
    console.error('Delete MCQ error:', error)
    return NextResponse.json(
      { success: false, error: 'MCQ মুছে ফেলতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
