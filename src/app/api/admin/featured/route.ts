import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

const chapterInclude = {
  chapter: {
    select: {
      name: true,
      subject: {
        select: {
          name: true,
          class: { select: { name: true } },
        },
      },
    },
  },
}

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'homepage'
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { section }
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const data = await db.featuredContent.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    const resolved = await Promise.all(
      data.map(async (item) => {
        let resolvedTitle: string | null = null
        let resolvedSubtitle: string | null = null
        let resolvedThumbnail: string | null = null
        let resolvedPremium = false
        let contentExists = true

        try {
          switch (item.contentType) {
            case 'lecture': {
              const lecture = await db.lecture.findUnique({
                where: { id: item.contentId },
                include: chapterInclude,
              })
              if (lecture) {
                resolvedTitle = lecture.title
                resolvedSubtitle = `${lecture.chapter.subject.class.name} › ${lecture.chapter.subject.name}`
                resolvedThumbnail = lecture.thumbnail
                resolvedPremium = lecture.isPremium
              } else { contentExists = false }
              break
            }
            case 'mcq': {
              const mcq = await db.mCQ.findUnique({
                where: { id: item.contentId },
                include: chapterInclude,
              })
              if (mcq) {
                resolvedTitle = mcq.question.length > 60 ? mcq.question.slice(0, 60) + '...' : mcq.question
                resolvedSubtitle = `${mcq.chapter.subject.class.name} › ${mcq.chapter.subject.name}`
                resolvedPremium = mcq.isPremium
              } else { contentExists = false }
              break
            }
            case 'cq': {
              const cq = await db.cQ.findUnique({
                where: { id: item.contentId },
                include: chapterInclude,
              })
              if (cq) {
                resolvedTitle = cq.uddeepok.length > 60 ? cq.uddeepok.slice(0, 60) + '...' : cq.uddeepok
                resolvedSubtitle = `${cq.chapter.subject.class.name} › ${cq.chapter.subject.name}`
                resolvedPremium = cq.isPremium
              } else { contentExists = false }
              break
            }
            case 'bundle': {
              const bundle = await db.contentBundle.findUnique({ where: { id: item.contentId } })
              if (bundle) {
                resolvedTitle = bundle.title
                resolvedThumbnail = bundle.thumbnail
                resolvedPremium = bundle.price > 0
              } else { contentExists = false }
              break
            }
            case 'package': {
              const pkg = await db.contentPackage.findUnique({ where: { id: item.contentId } })
              if (pkg) {
                resolvedTitle = pkg.title
                resolvedSubtitle = pkg.durationLabel
                resolvedThumbnail = pkg.thumbnail
                resolvedPremium = pkg.price > 0
              } else { contentExists = false }
              break
            }
            case 'suggestion': {
              const suggestion = await db.suggestion.findUnique({ where: { id: item.contentId } })
              if (suggestion) {
                resolvedTitle = suggestion.title
                resolvedThumbnail = suggestion.thumbnail
                resolvedPremium = suggestion.isPremium
              } else { contentExists = false }
              break
            }
            case 'exam': {
              const exam = await db.exam.findUnique({ where: { id: item.contentId } })
              if (exam) {
                resolvedTitle = exam.title
                resolvedSubtitle = `${exam.classLevel} › ${exam.type.toUpperCase()} › ${exam.duration} মিনিট`
                resolvedPremium = exam.isPremium
              } else { contentExists = false }
              break
            }
          }
        } catch { contentExists = false }

        return {
          ...item,
          displayTitle: item.title || resolvedTitle || 'শিরোনাম নেই',
          displaySubtitle: item.subtitle || resolvedSubtitle || null,
          displayThumbnail: item.thumbnail || resolvedThumbnail || null,
          isPremium: resolvedPremium,
          contentExists,
        }
      })
    )

    return apiResponse(resolved)
  } catch (error) {
    return handleApiError(error, 'Admin Get Featured')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const {
      contentType,
      contentId,
      title,
      subtitle,
      thumbnail,
      section,
      isActive,
      order,
    } = body

    if (!contentType || !contentId) return apiError('কন্টেন্ট টাইপ এবং কন্টেন্ট ID আবশ্যক', 400)

    const existing = await db.featuredContent.findUnique({
      where: {
        section_contentType_contentId: {
          section: section || 'homepage',
          contentType,
          contentId,
        },
      },
    })

    if (existing) return apiError('এই কন্টেন্টটি ইতিমধ্যে এই সেকশনে ফিচার্ড আছে', 409)

    const maxOrderItem = await db.featuredContent.findFirst({
      where: { section: section || 'homepage' },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const data = await db.featuredContent.create({
      data: {
        contentType,
        contentId,
        title: title || null,
        subtitle: subtitle || null,
        thumbnail: thumbnail || null,
        section: section || 'homepage',
        isActive: isActive ?? true,
        order: order ?? (maxOrderItem ? maxOrderItem.order + 1 : 0),
      },
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Featured')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) return apiError('ফিচার্ড কন্টেন্ট ID আবশ্যক', 400)

    const existing = await db.featuredContent.findUnique({ where: { id } })
    if (!existing) return apiError('ফিচার্ড কন্টেন্ট খুঁজে পাওয়া যায়নি', 404)

    const data: Record<string, unknown> = {}
    const allowedFields: string[] = [
      'contentType', 'contentId', 'title', 'subtitle',
      'thumbnail', 'section', 'isActive', 'order',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) data[field] = updateData[field]
    }

    const updated = await db.featuredContent.update({ where: { id }, data })
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Featured')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      const body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) return apiError('ফিচার্ড কন্টেন্ট ID আবশ্যক', 400)

    const existing = await db.featuredContent.findUnique({ where: { id } })
    if (!existing) return apiError('ফিচার্ড কন্টেন্ট খুঁজে পাওয়া যায়নি', 404)

    await db.featuredContent.delete({ where: { id } })
    return apiResponse({ id, message: 'ফিচার্ড কন্টেন্ট সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Featured')
  }
}
