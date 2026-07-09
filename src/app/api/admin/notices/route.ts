import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, parseIdsParam, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createNoticeSchema = z.object({
  title: z.string().min(1, 'নোটিশ শিরোনাম আবশ্যক'),
  content: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  linkLabel: z.string().nullable().optional(),
  type: z.enum(['text', 'pdf', 'link']).optional(),
  thumbnail: z.string().nullable().optional(),
  classLevel: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const classLevel = searchParams.get('classLevel')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    if (type) where.type = type
    if (classLevel) where.classLevel = classLevel
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const [data, total] = await Promise.all([
      db.notice.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notice.count({ where }),
    ])

    return apiResponse({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Notices')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validated = validateBody(createNoticeSchema, body)
    if ('error' in validated) return validated.error
    const { data: { title, content, pdfUrl, linkUrl, linkLabel, type, thumbnail, classLevel, isPinned, isActive, order } } = validated

    // Auto-determine type based on what's provided
    let noticeType = type
    if (!noticeType) {
      if (pdfUrl) {
        noticeType = 'pdf'
      } else if (linkUrl) {
        noticeType = 'link'
      } else {
        noticeType = 'text'
      }
    }

    const data = await db.notice.create({
      data: {
        title,
        content: content || null,
        pdfUrl: pdfUrl || null,
        linkUrl: linkUrl || null,
        linkLabel: linkLabel || null,
        type: noticeType,
        thumbnail: thumbnail || null,
        classLevel: classLevel || null,
        isPinned: isPinned ?? false,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    })

    await invalidateContentCache('notice')
    return apiResponse({ data }, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Notice')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { ids, isActive } = body
    if (Array.isArray(ids) && ids.length > 0) {
      const updateData: Record<string, unknown> = {}
      if (isActive !== undefined) updateData.isActive = isActive
      const result = await db.notice.updateMany({ where: { id: { in: ids } }, data: updateData })
      await invalidateContentCache('notice')
      return apiResponse({ updated: result.count }, `${result.count}টি আপডেট হয়েছে`)
    }
    const { id, ...updateData } = body

    if (!id) {
      return apiError('নোটিশ ID আবশ্যক', 400)
    }

    const existing = await db.notice.findUnique({ where: { id } })
    if (!existing) {
      return apiError('নোটিশ খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'content', 'pdfUrl', 'linkUrl', 'linkLabel',
      'type', 'thumbnail', 'classLevel', 'isPinned', 'isActive', 'order',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    // Auto-determine type if not explicitly set but pdfUrl/linkUrl changed
    if (data.type === undefined && (data.pdfUrl !== undefined || data.linkUrl !== undefined)) {
      const effectivePdfUrl = data.pdfUrl !== undefined ? data.pdfUrl : existing.pdfUrl
      const effectiveLinkUrl = data.linkUrl !== undefined ? data.linkUrl : existing.linkUrl

      if (effectivePdfUrl) {
        data.type = 'pdf'
      } else if (effectiveLinkUrl) {
        data.type = 'link'
      } else {
        data.type = 'text'
      }
    }

    const updated = await db.notice.update({
      where: { id },
      data: data as never,
    })

    await invalidateContentCache('notice')
    return apiResponse({ data: updated })
  } catch (error) {
    return handleApiError(error, 'Admin Update Notice')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)

    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.notice.deleteMany({ where: { id: { in: ids } } })
      await invalidateContentCache('notice')
      return apiResponse({ deleted: result.count }, `${result.count}টি সফলভাবে মুছে ফেলা হয়েছে`)
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
      return apiError('নোটিশ ID আবশ্যক', 400)
    }

    const existing = await db.notice.findUnique({ where: { id } })
    if (!existing) {
      return apiError('নোটিশ খুঁজে পাওয়া যায়নি', 404)
    }

    await db.notice.delete({ where: { id } })

    await invalidateContentCache('notice')
    return apiResponse({ data: { id }, message: 'নোটিশ সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Notice')
  }
}
