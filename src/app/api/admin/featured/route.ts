import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createFeaturedSchema = z.object({
  contentType: z.string().min(1, 'কন্টেন্ট টাইপ আবশ্যক'),
  contentId: z.string().min(1, 'কন্টেন্ট ID আবশ্যক'),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  section: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
})

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

const courseInclude = {
  classCategory: { select: { name: true } },
  subject: { select: { name: true } },
}

const THUMBNAIL_TYPES = new Set(['lecture', 'bundle', 'package', 'suggestion', 'course'])
const CHAPTER_TYPES = new Set(['lecture', 'mcq', 'cq'])
const TITLE_FIELD: Record<string, string> = {
  lecture: 'title',
  mcq: 'question',
  cq: 'uddeepok',
  bundle: 'title',
  package: 'title',
  suggestion: 'title',
  exam: 'title',
  course: 'title',
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

    const resolved = await resolveFeaturedContent(data)
    return apiResponse(resolved)
  } catch (error) {
    return handleApiError(error, 'Admin Get Featured')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validation = validateBody(createFeaturedSchema, body)
    if ('error' in validation) return validation.error
    const {
      contentType,
      contentId,
      title,
      subtitle,
      thumbnail,
      section,
      isActive,
      order,
    } = validation.data

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

    const created = await db.featuredContent.create({
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

    return apiResponse(created, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Featured')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
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

async function resolveFeaturedContent(data: { contentType: string; contentId: string; title: string | null; subtitle: string | null; thumbnail: string | null }[]) {
  // Group contentIds by type
  const idsByType: Record<string, string[]> = {}
  for (const item of data) {
    if (!idsByType[item.contentType]) idsByType[item.contentType] = []
    idsByType[item.contentType].push(item.contentId)
  }

  // Batch-resolve per type
  const lectureMap = await batchFind('lecture', idsByType.lecture)
  const mcqMap = await batchFind('mcq', idsByType.mcq, chapterInclude)
  const cqMap = await batchFind('cq', idsByType.cq, chapterInclude)
  const bundleMap = await batchFind('bundle', idsByType.bundle)
  const packageMap = await batchFind('package', idsByType.package)
  const suggestionMap = await batchFind('suggestion', idsByType.suggestion)
  const examMap = await batchFind('exam', idsByType.exam)
  const courseMap = await batchFindCourse(idsByType.course)

  const contentMap: Record<string, Record<string, unknown>> = {
    lecture: lectureMap,
    mcq: mcqMap,
    cq: cqMap,
    bundle: bundleMap,
    package: packageMap,
    suggestion: suggestionMap,
    exam: examMap,
    course: courseMap,
  }

  return data.map((item) => {
    const entry = contentMap[item.contentType]?.[item.contentId] as Record<string, unknown> | undefined
    let contentExists = true
    let resolvedTitle: string | null = null
    let resolvedSubtitle: string | null = null
    let resolvedThumbnail: string | null = null
    let resolvedPremium = false

    if (!entry) {
      contentExists = false
    } else {
      resolvedTitle = getTitle(item.contentType, entry)
      resolvedSubtitle = getSubtitle(item.contentType, entry)
      resolvedThumbnail = THUMBNAIL_TYPES.has(item.contentType) ? (entry as any).thumbnail || null : null
      resolvedPremium = getPremium(item.contentType, entry)
    }

    return {
      ...item,
      displayTitle: item.title || resolvedTitle || 'শিরোনাম নেই',
      displaySubtitle: item.subtitle || resolvedSubtitle || null,
      displayThumbnail: item.thumbnail || resolvedThumbnail || null,
      isPremium: resolvedPremium,
      contentExists,
    }
  })
}

async function batchFind(type: string, ids?: string[], include?: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!ids || ids.length === 0) return {}

  const modelMap: Record<string, any> = {
    lecture: db.lecture,
    mcq: db.mCQ,
    cq: db.cQ,
    bundle: db.contentBundle,
    package: db.contentPackage,
    suggestion: db.suggestion,
    exam: db.exam,
  }

  const model = modelMap[type]
  if (!model) return {}

  const items = await model.findMany({
    where: { id: { in: ids } },
    include,
  })

  const map: Record<string, unknown> = {}
  for (const item of items) {
    map[item.id] = item
  }
  return map
}

async function batchFindCourse(ids?: string[]): Promise<Record<string, unknown>> {
  if (!ids || ids.length === 0) return {}
  const items = await db.course.findMany({
    where: { id: { in: ids } },
    include: courseInclude,
  })
  const map: Record<string, unknown> = {}
  for (const item of items) {
    map[item.id] = item
  }
  return map
}

function getTitle(type: string, entry: Record<string, unknown>): string | null {
  if (type === 'mcq') {
    const q = (entry as any).question
    return q ? (q.length > 60 ? q.slice(0, 60) + '...' : q) : null
  }
  if (type === 'cq') {
    const u = (entry as any).uddeepok
    return u ? (u.length > 60 ? u.slice(0, 60) + '...' : u) : null
  }
  return (entry as any).title || null
}

function getSubtitle(type: string, entry: Record<string, unknown>): string | null {
  if (type === 'lecture' || type === 'mcq' || type === 'cq') {
    const ch = (entry as any).chapter
    if (ch?.subject?.class?.name && ch?.subject?.name) {
      return `${ch.subject.class.name} › ${ch.subject.name}`
    }
  }
  if (type === 'course') {
    const c = entry as any
    if (c.classCategory?.name && c.subject?.name) {
      return `${c.classCategory.name} › ${c.subject.name}`
    }
  }
  if (type === 'exam') {
    const e = entry as any
    if (e.classLevel && e.type && e.duration) {
      return `${e.classLevel} › ${e.type.toUpperCase()} › ${e.duration} মিনিট`
    }
  }
  if (type === 'package') {
    return (entry as any).durationLabel || null
  }
  return null
}

function getPremium(type: string, entry: Record<string, unknown>): boolean {
  const e = entry as any
  if (type === 'bundle' || type === 'package') return e.price > 0
  return e.isPremium || false
}
