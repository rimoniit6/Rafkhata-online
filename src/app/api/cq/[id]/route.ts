import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { checkContentAccess } from '@/lib/access-control'
import { apiError, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

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
  chapterId: string
  chapter?: { id: string; name: string; slug: string; subject?: { id: string; name: string; slug: string; class?: { id: string; name: string; slug: string } } }
  [key: string]: unknown
}) {
  const BENGALI_LABELS = ['ক', 'খ', 'গ', 'ঘ']

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
        label: BENGALI_LABELS[i - 1],
        number: i,
        text,
        marks: i,
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
    price: cq.price,
    year: cq.year || undefined,
    board: cq.board || undefined,
  }
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const cq = await db.cQ.findUnique({
      where: { id, isActive: true },
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
    })

    if (!cq) {
      return apiError('CQ খুঁজে পাওয়া যায়নি', 404)
    }

    if (cq.isPremium) {
      const auth = await verifyAuth()
      const userId = auth?.user.id

      if (!userId) {
        return apiError('এই CQ টি দেখতে লগইন করুন', 401, 'PREMIUM_REQUIRES_AUTH')
      }

      const access = await checkContentAccess({
        userId,
        contentType: 'cq',
        contentId: id,
      })

      if (!access.hasAccess) {
        return NextResponse.json({
          success: true,
          data: {
            id: cq.id,
            uddeepok: cq.uddeepok,
            isPremium: true,
            price: cq.price,
            chapterId: cq.chapterId,
            chapterName: cq.chapter?.name || '',
            subjectName: cq.chapter?.subject?.name || '',
            className: cq.chapter?.subject?.class?.name || '',
            classSlug: cq.chapter?.subject?.class?.slug || '',
            hasAccess: false,
            pendingPayment: access.pendingPayment,
          },
        })
      }
    }

    return NextResponse.json({ success: true, data: transformCQ(cq) })
  } catch (error) {
    return handleApiError(error, 'Get CQ detail error')
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
    if (!auth?.user || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
      return apiError('CQ আপডেট করার অনুমতি নেই', 403)
    }

    const { id } = await props.params
    const body = await request.json()

    const existingCq = await db.cQ.findUnique({ where: { id } })

    if (!existingCq) {
      return apiError('CQ খুঁজে পাওয়া যায়নি', 404)
    }

    const cq = await db.cQ.update({
      where: { id },
      data: {
        ...(body.uddeepok !== undefined && { uddeepok: body.uddeepok }),
        ...(body.uddeepokImage !== undefined && { uddeepokImage: body.uddeepokImage }),
        ...(body.question1 !== undefined && { question1: body.question1 }),
        ...(body.question1Image !== undefined && { question1Image: body.question1Image }),
        ...(body.question2 !== undefined && { question2: body.question2 }),
        ...(body.question2Image !== undefined && { question2Image: body.question2Image }),
        ...(body.question3 !== undefined && { question3: body.question3 }),
        ...(body.question3Image !== undefined && { question3Image: body.question3Image }),
        ...(body.question4 !== undefined && { question4: body.question4 }),
        ...(body.question4Image !== undefined && { question4Image: body.question4Image }),
        ...(body.answer1 !== undefined && { answer1: body.answer1 }),
        ...(body.answer1Image !== undefined && { answer1Image: body.answer1Image }),
        ...(body.answer2 !== undefined && { answer2: body.answer2 }),
        ...(body.answer2Image !== undefined && { answer2Image: body.answer2Image }),
        ...(body.answer3 !== undefined && { answer3: body.answer3 }),
        ...(body.answer3Image !== undefined && { answer3Image: body.answer3Image }),
        ...(body.answer4 !== undefined && { answer4: body.answer4 }),
        ...(body.answer4Image !== undefined && { answer4Image: body.answer4Image }),
        ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
        ...(body.isPremium !== undefined && { isPremium: body.isPremium }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.board !== undefined && { board: body.board }),
        ...(body.year !== undefined && { year: body.year }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    return NextResponse.json({ success: true, data: { message: 'CQ আপডেট হয়েছে', cq } })
  } catch (error) {
    console.error('Update CQ error:', error)
    return apiError('CQ আপডেট করতে সমস্যা হয়েছে', 500)
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
    if (!auth?.user || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
      return apiError('CQ মুছে ফেলার অনুমতি নেই', 403)
    }

    const { id } = await props.params

    const existingCq = await db.cQ.findUnique({ where: { id } })

    if (!existingCq) {
      return apiError('CQ খুঁজে পাওয়া যায়নি', 404)
    }

    await db.cQ.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, data: { message: 'CQ সফলভাবে মুছে ফেলা হয়েছে' } })
  } catch (error) {
    console.error('Delete CQ error:', error)
    return apiError('CQ মুছে ফেলতে সমস্যা হয়েছে', 500)
  }
}
