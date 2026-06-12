import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin, parseIdsParam, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const chapterId = searchParams.get('chapterId')
    const subjectId = searchParams.get('subjectId')
    const isPremium = searchParams.get('isPremium')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
      ]
    }
    if (chapterId) where.chapterId = chapterId
    if (isPremium !== null && isPremium !== undefined) where.isPremium = isPremium === 'true'
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    if (subjectId) {
      where.chapter = { subjectId }
    }

    const [data, total] = await Promise.all([
      db.lecture.findMany({
        where,
        include: {
          chapter: {
            select: {
              id: true, name: true, slug: true, subjectId: true,
              subject: {
                select: {
                  id: true, name: true, classId: true,
                  class: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
          _count: { select: { resources: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lecture.count({ where }),
    ])

    return paginatedApiResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Lectures')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const { title, slug, chapterId, content, videoUrl, audioUrl, pdfUrl, thumbnail, duration, order, isPremium, price, isActive } = body

    if (!title || !chapterId || !content) {
      return apiError('প্রয়োজনীয় ফিল্ড পূরণ করুন (শিরোনাম, অধ্যায়, বিষয়বস্তু)', 400)
    }

    const lectureSlug = slug || title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    const data = await db.lecture.create({
      data: {
        title, slug: lectureSlug, chapterId, content,
        videoUrl: videoUrl || null, audioUrl: audioUrl || null, pdfUrl: pdfUrl || null,
        thumbnail: thumbnail || null, duration: duration ?? 0, order: order ?? 0,
        isPremium: isPremium ?? false, price: price ?? 0, isActive: isActive ?? true,
      },
    })

    await invalidateContentCache('lecture')
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Lecture')
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

    if (!id) {
      return apiError('লেকচার ID আবশ্যক', 400)
    }

    const existing = await db.lecture.findUnique({ where: { id } })
    if (!existing) {
      return apiError('লেকচার খুঁজে পাওয়া যায়নি', 404)
    }

    const updateFields: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'slug', 'chapterId', 'content', 'videoUrl', 'audioUrl',
      'pdfUrl', 'thumbnail', 'duration', 'order', 'isPremium', 'price', 'viewCount', 'isActive',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field]
      }
    }

    const updated = await db.lecture.update({ where: { id }, data: updateFields })

    await invalidateContentCache('lecture')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Lecture')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const { searchParams } = new URL(request.url)

    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.lecture.deleteMany({ where: { id: { in: ids } } })
      await invalidateContentCache('lecture')
      return apiResponse({ deleted: result.count }, `${result.count}টি লেকচার মুছে ফেলা হয়েছে`)
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
      return apiError('লেকচার ID আবশ্যক', 400)
    }

    const existing = await db.lecture.findUnique({ where: { id } })
    if (!existing) {
      return apiError('লেকচার খুঁজে পাওয়া যায়নি', 404)
    }

    await db.lecture.delete({ where: { id } })

    await invalidateContentCache('lecture')
    return apiResponse({ id }, 'লেকচার সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Lecture')
  }
}
