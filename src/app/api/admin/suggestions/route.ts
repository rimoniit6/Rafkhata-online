import { db } from '@/lib/db'
import { apiResponse, withAdmin, parseIdsParam } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const chapterId = searchParams.get('chapterId')
    const isPremium = searchParams.get('isPremium')
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
    if (classId) where.classId = classId
    if (subjectId) where.subjectId = subjectId
    if (chapterId) where.chapterId = chapterId
    if (isPremium !== null && isPremium !== undefined) where.isPremium = isPremium === 'true'
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const [suggestions, total] = await Promise.all([
      db.suggestion.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.suggestion.count({ where }),
    ])

    // Enrich with class/subject/chapter names
    const classIds = [...new Set(suggestions.map((s) => s.classId).filter(Boolean) as string[])]
    const subjectIds = [...new Set(suggestions.map((s) => s.subjectId).filter(Boolean) as string[])]
    const chapterIds = [...new Set(suggestions.map((s) => s.chapterId).filter(Boolean) as string[])]

    const [classes, subjects, chapters] = await Promise.all([
      classIds.length > 0
        ? db.classCategory.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
        : [],
      subjectIds.length > 0
        ? db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
        : [],
      chapterIds.length > 0
        ? db.chapter.findMany({ where: { id: { in: chapterIds } }, select: { id: true, name: true } })
        : [],
    ])

    const classMap = new Map<string, string>(classes.map((c) => [c.id, c.name] as [string, string]))
    const subjectMap = new Map<string, string>(subjects.map((s) => [s.id, s.name] as [string, string]))
    const chapterMap = new Map<string, string>(chapters.map((c) => [c.id, c.name] as [string, string]))

    const enriched = suggestions.map((s) => ({
      ...s,
      className: s.classId ? classMap.get(s.classId) || null : null,
      subjectName: s.subjectId ? subjectMap.get(s.subjectId) || null : null,
      chapterName: s.chapterId ? chapterMap.get(s.chapterId) || null : null,
    }))

    return apiResponse({
      suggestions: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Suggestions error')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const {
      title,
      slug,
      content,
      classId,
      subjectId,
      chapterId,
      thumbnail,
      pdfUrl,
      isPremium,
      price,
      order,
      isActive,
    } = body

    if (!title || !content) {
      return apiResponse(null, 'প্রয়োজনীয় ফিল্ড পূরণ করুন (শিরোনাম, বিষয়বস্তু)', 400)
    }

    const suggestionSlug = slug || title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    const data = await db.suggestion.create({
      data: {
        title,
        slug: suggestionSlug,
        content,
        classId: classId || null,
        subjectId: subjectId || null,
        chapterId: chapterId || null,
        thumbnail: thumbnail || null,
        pdfUrl: pdfUrl || null,
        isPremium: isPremium ?? false,
        price: price ?? 0,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    })

    return apiResponse(data, null, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Suggestion error')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return apiResponse(null, 'সাজেশন ID আবশ্যক', 400)
    }

    const existing = await db.suggestion.findUnique({ where: { id } })
    if (!existing) {
      return apiResponse(null, 'সাজেশন খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'slug', 'content', 'classId', 'subjectId', 'chapterId',
      'thumbnail', 'pdfUrl', 'isPremium', 'price', 'order', 'viewCount',
      'isActive',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    const updated = await db.suggestion.update({
      where: { id },
      data,
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Suggestion error')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)

    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.suggestion.deleteMany({ where: { id: { in: ids } } })
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
      return apiResponse(null, 'সাজেশন ID আবশ্যক', 400)
    }

    const existing = await db.suggestion.findUnique({ where: { id } })
    if (!existing) {
      return apiResponse(null, 'সাজেশন খুঁজে পাওয়া যায়নি', 404)
    }

    await db.suggestion.delete({ where: { id } })

    return apiResponse({ id }, 'সাজেশন সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Suggestion error')
  }
}
