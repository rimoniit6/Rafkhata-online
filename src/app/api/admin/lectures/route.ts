import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin, parseIdsParam, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auditFromRequest, AuditActions, EntityTypes } from '@/lib/audit'

const createLectureSchema = z.object({
  title: z.string().min(1, 'শিরোনাম আবশ্যক'),
  slug: z.string().optional(),
  chapterId: z.string().min(1, 'অধ্যায় আইডি আবশ্যক'),
  content: z.string().min(1, 'বিষয়বস্তু আবশ্যক'),
  videoUrl: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  duration: z.number().min(0).optional(),
  order: z.number().min(0).optional(),
  isPremium: z.boolean().optional(),
  price: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

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
    const body = await request.json()
    const validated = validateBody(createLectureSchema, body)
    if ('error' in validated) return validated.error
    const { data: fields } = validated

    const lectureSlug = fields.slug || fields.title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    const data = await db.lecture.create({
      data: {
        title: fields.title, slug: lectureSlug, chapterId: fields.chapterId, content: fields.content,
        videoUrl: fields.videoUrl || null, audioUrl: fields.audioUrl || null, pdfUrl: fields.pdfUrl || null,
        thumbnail: fields.thumbnail || null, duration: fields.duration ?? 0, order: fields.order ?? 0,
        isPremium: fields.isPremium ?? false, price: fields.price ?? 0, isActive: fields.isActive ?? true,
      },
    })

    await invalidateContentCache('lecture')
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, EntityTypes.LECTURE, data.id, body)
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Lecture')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
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

    const updated = await db.lecture.update({ where: { id }, data: updateFields as never })

    await invalidateContentCache('lecture')
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, EntityTypes.LECTURE, existing.id, { ...existing }, updateData)
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Lecture')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)

    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.lecture.deleteMany({ where: { id: { in: ids } } })
      await invalidateContentCache('lecture')
      await Promise.all(ids.map(id => auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, EntityTypes.LECTURE, id)))
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
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, EntityTypes.LECTURE, id)
    return apiResponse({ id }, 'লেকচার সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Lecture')
  }
}
