import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createTopicSchema = z.object({
  name: z.string().min(1, 'টপিকের নাম আবশ্যক'),
  slug: z.string().optional(),
  chapterId: z.string().min(1, 'অধ্যায় আবশ্যক'),
  order: z.number().min(0).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const subjectId = searchParams.get('subjectId')
    const isActive = searchParams.get('isActive')
    const q = searchParams.get('q')

    const where: Record<string, unknown> = {}
    if (chapterId) where.chapterId = chapterId
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
      ]
    }

    // If subjectId is provided, find all chapters for that subject first
    if (subjectId && !chapterId) {
      const chapters = await db.chapter.findMany({
        where: { subjectId },
        select: { id: true },
      })
      where.chapterId = { in: chapters.map(c => c.id) }
    }

    const data = await db.topic.findMany({
      where,
      include: {
        chapter: {
          select: { id: true, name: true, slug: true, subjectId: true, subject: { select: { id: true, name: true, slug: true, classId: true, class: { select: { id: true, name: true, slug: true } } } } },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Topics error')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validation = validateBody(createTopicSchema, body)
    if ('error' in validation) return validation.error
    const { name, slug, chapterId, order, description, isActive } = validation.data

    const topicSlug = slug || name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    const data = await db.topic.create({
      data: {
        name,
        slug: topicSlug,
        chapterId,
        order: order ?? 0,
        description: description || null,
        isActive: isActive ?? true,
      },
      include: {
        chapter: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Topic error')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return apiError('টপিক ID আবশ্যক', 400)
    }

    const existing = await db.topic.findUnique({ where: { id } })
    if (!existing) {
      return apiError('টপিক খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = ['name', 'slug', 'chapterId', 'order', 'description', 'isActive']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    const updated = await db.topic.update({
      where: { id },
      data,
      include: {
        chapter: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Topic error')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
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
      return apiError('টপিক ID আবশ্যক', 400)
    }

    const existing = await db.topic.findUnique({ where: { id } })
    if (!existing) {
      return apiError('টপিক খুঁজে পাওয়া যায়নি', 404)
    }

    await db.topic.delete({ where: { id } })

    return apiResponse({ id }, 'টপিক সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Topic error')
  }
}
