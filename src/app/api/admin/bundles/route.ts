import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin, parseIdsParam, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { toDecimal } from '@/lib/decimal'

const createBundleSchema = z.object({
  title: z.string().min(1, 'শিরোনাম আবশ্যক'),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  price: z.coerce.number().min(0).optional(),
  originalPrice: z.coerce.number().min(0).optional(),
  classLevel: z.string().nullable().optional(),
  board: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  type: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
  items: z.array(z.object({
    contentType: z.string(),
    contentId: z.string(),
    order: z.number().optional(),
  })).optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const classLevel = searchParams.get('classLevel')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (classLevel) where.classLevel = classLevel
    if (type) where.type = type
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [data, total] = await Promise.all([
      db.contentBundle.findMany({
        where,
        include: { items: { orderBy: { order: 'asc' } } },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contentBundle.count({ where }),
    ])

    return paginatedApiResponse(data, {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Bundles')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validation = validateBody(createBundleSchema, body)
    if ('error' in validation) return validation.error
    const { title, slug, description, thumbnail, price, originalPrice, classLevel, board, year, type, isActive, order, items } = validation.data

    const bundleSlug = slug || title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    let calculatedOriginalPrice = originalPrice || 0
    if (items && items.length > 0 && !originalPrice) {
      const mcqIds = items.filter((i: { contentType: string }) => i.contentType === 'MCQ').map((i: { contentId: string }) => i.contentId)
      const cqIds = items.filter((i: { contentType: string }) => i.contentType === 'CQ').map((i: { contentId: string }) => i.contentId)
      const lectureIds = items.filter((i: { contentType: string }) => i.contentType === 'lecture').map((i: { contentId: string }) => i.contentId)
      const suggestionIds = items.filter((i: { contentType: string }) => i.contentType === 'suggestion').map((i: { contentId: string }) => i.contentId)
      const examIds = items.filter((i: { contentType: string }) => i.contentType === 'exam').map((i: { contentId: string }) => i.contentId)

      const [mcqs, cqs, lectures, suggestions, exams] = await Promise.all([
        mcqIds.length > 0 ? db.mCQ.findMany({ where: { id: { in: mcqIds } }, select: { id: true, price: true } }) : [],
        cqIds.length > 0 ? db.cQ.findMany({ where: { id: { in: cqIds } }, select: { id: true, price: true } }) : [],
        lectureIds.length > 0 ? db.lecture.findMany({ where: { id: { in: lectureIds } }, select: { id: true, price: true } }) : [],
        suggestionIds.length > 0 ? db.suggestion.findMany({ where: { id: { in: suggestionIds } }, select: { id: true, price: true } }) : [],
        examIds.length > 0 ? db.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, price: true } }) : [],
      ])

      const priceMap = new Map<string, number>()
      mcqs.forEach((m) => priceMap.set(m.id, Number(m.price)))
      cqs.forEach((c) => priceMap.set(c.id, Number(c.price)))
      lectures.forEach((l) => priceMap.set(l.id, Number(l.price)))
      suggestions.forEach((s) => priceMap.set(s.id, Number(s.price)))
      exams.forEach((e) => priceMap.set(e.id, Number(e.price)))

      calculatedOriginalPrice = items.reduce((sum: number, item: { contentId: string }) => sum + toDecimal(priceMap.get(item.contentId) || 0), 0)
    }

    const bundle = await db.contentBundle.create({
      data: {
        title, slug: bundleSlug,
        description: description || null, thumbnail: thumbnail || null,
        price: price ?? 0, originalPrice: calculatedOriginalPrice,
        classLevel: classLevel || null, board: board || null, year: year || null,
        type: (type || 'mixed') as 'MCQ' | 'CQ' | 'MIXED', isActive: isActive ?? true, order: order ?? 0,
        items: items && items.length > 0
          ? { create: items.map((item: { contentType: string; contentId: string; order?: number }) => ({ contentType: item.contentType, contentId: item.contentId, order: item.order || 0 })) }
          : undefined,
      },
      include: { items: true },
    })

    await invalidateContentCache('bundle')
    return apiResponse(bundle, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Bundle')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, items, ...updateData } = body

    if (!id) {
      return apiError('বান্ডেল ID আবশ্যক', 400)
    }

    const existing = await db.contentBundle.findUnique({ where: { id } })
    if (!existing) {
      return apiError('বান্ডেল খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'slug', 'description', 'thumbnail', 'price', 'originalPrice',
      'classLevel', 'board', 'year', 'type', 'isActive', 'order',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    if (items !== undefined) {
      const mcqIds = items.filter((i: { contentType: string }) => i.contentType === 'MCQ').map((i: { contentId: string }) => i.contentId)
      const cqIds = items.filter((i: { contentType: string }) => i.contentType === 'CQ').map((i: { contentId: string }) => i.contentId)
      const lectureIds = items.filter((i: { contentType: string }) => i.contentType === 'lecture').map((i: { contentId: string }) => i.contentId)
      const suggestionIds = items.filter((i: { contentType: string }) => i.contentType === 'suggestion').map((i: { contentId: string }) => i.contentId)
      const examIds = items.filter((i: { contentType: string }) => i.contentType === 'exam').map((i: { contentId: string }) => i.contentId)

      const [mcqs, cqs, lectures, suggestions, exams] = await Promise.all([
        mcqIds.length > 0 ? db.mCQ.findMany({ where: { id: { in: mcqIds } }, select: { id: true, price: true } }) : [],
        cqIds.length > 0 ? db.cQ.findMany({ where: { id: { in: cqIds } }, select: { id: true, price: true } }) : [],
        lectureIds.length > 0 ? db.lecture.findMany({ where: { id: { in: lectureIds } }, select: { id: true, price: true } }) : [],
        suggestionIds.length > 0 ? db.suggestion.findMany({ where: { id: { in: suggestionIds } }, select: { id: true, price: true } }) : [],
        examIds.length > 0 ? db.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, price: true } }) : [],
      ])

      const priceMap = new Map<string, number>()
      mcqs.forEach((m) => priceMap.set(m.id, Number(m.price)))
      cqs.forEach((c) => priceMap.set(c.id, Number(c.price)))
      lectures.forEach((l) => priceMap.set(l.id, Number(l.price)))
      suggestions.forEach((s) => priceMap.set(s.id, Number(s.price)))
      exams.forEach((e) => priceMap.set(e.id, Number(e.price)))

      data.originalPrice = items.reduce((sum: number, item: { contentId: string }) => sum + toDecimal(priceMap.get(item.contentId) || 0), 0)

      await db.bundleItem.deleteMany({ where: { bundleId: id } })

      if (Array.isArray(items) && items.length > 0) {
        data.items = {
          create: items.map((item: { contentType: string; contentId: string; order?: number }) => ({
            contentType: item.contentType, contentId: item.contentId, order: item.order || 0,
          })),
        }
      }
    }

    const updated = await db.contentBundle.update({
      where: { id },
      data,
      include: { items: true },
    })

    await invalidateContentCache('bundle')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Bundle')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.contentBundle.deleteMany({ where: { id: { in: ids } } })
      await invalidateContentCache('bundle')
      return apiResponse({ deleted: result.count }, `${result.count}টি সফলভাবে মুছে ফেলা হয়েছে`)
    }
    const idFromQuery = searchParams.get('id')

    let id = idFromQuery
    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch { /* empty */ }
    }

    if (!id) {
      return apiError('বান্ডেল ID আবশ্যক', 400)
    }

    const existing = await db.contentBundle.findUnique({ where: { id } })
    if (!existing) {
      return apiError('বান্ডেল খুঁজে পাওয়া যায়নি', 404)
    }

    await db.contentBundle.delete({ where: { id } })
    await invalidateContentCache('bundle')
    return apiResponse({ id }, 'বান্ডেল সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Bundle')
  }
}
