import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'
import { auditFromRequest, AuditActions } from '@/lib/audit'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const isActive = searchParams.get('isActive')
    const q = searchParams.get('q')

    const where: Record<string, unknown> = {}
    if (subjectId) where.subjectId = subjectId
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
        { description: { contains: q } },
      ]
    }

    const data = await db.chapter.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, slug: true, classId: true } },
        _count: { select: { lectures: true, mcqs: true, cqs: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Chapters')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { name, slug, subjectId, order, description, isActive } = body

    if (!name || !subjectId) return apiError('অধ্যায়ের নাম এবং বিষয় আবশ্যক', 400)

    const chapterSlug = slug || name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    const existingSlug = await db.chapter.findFirst({
      where: { slug: chapterSlug, subjectId },
    })
    if (existingSlug) return apiError('এই বিষয়ে এই স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে।', 409)

    const data = await db.chapter.create({
      data: {
        name,
        slug: chapterSlug,
        subjectId,
        order: order ?? 0,
        description: description || null,
        isActive: isActive ?? true,
      },
      include: {
        subject: { select: { id: true, name: true, slug: true, classId: true } },
        _count: { select: { lectures: true, mcqs: true, cqs: true } },
      },
    })

    await invalidateContentCache('chapter')
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, 'chapter', data.id, body)
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Chapter')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) return apiError('অধ্যায় ID আবশ্যক', 400)

    const existing = await db.chapter.findUnique({ where: { id } })
    if (!existing) return apiError('অধ্যায় খুঁজে পাওয়া যায়নি', 404)

    const newSlug = updateData.slug !== undefined ? updateData.slug : existing.slug
    const newSubjectId = updateData.subjectId !== undefined ? updateData.subjectId : existing.subjectId
    if ((updateData.slug !== undefined && updateData.slug !== existing.slug) ||
        (updateData.subjectId !== undefined && updateData.subjectId !== existing.subjectId)) {
      const slugExists = await db.chapter.findFirst({
        where: { slug: newSlug, subjectId: newSubjectId, NOT: { id } },
      })
      if (slugExists) return apiError('এই বিষয়ে এই স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে।', 409)
    }

    const data: Record<string, unknown> = {}
    const allowedFields: string[] = ['name', 'slug', 'subjectId', 'order', 'description', 'isActive']
    const nullableFields: string[] = ['description']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = (nullableFields.includes(field) && updateData[field] === '') ? null : updateData[field]
      }
    }

    const updated = await db.chapter.update({
      where: { id },
      data,
      include: {
        subject: { select: { id: true, name: true, slug: true, classId: true } },
        _count: { select: { lectures: true, mcqs: true, cqs: true } },
      },
    })

    await invalidateContentCache('chapter')
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, 'chapter', existing.id, { ...existing }, data)
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Chapter')
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

    if (!id) return apiError('অধ্যায় ID আবশ্যক', 400)

    const existing = await db.chapter.findUnique({ where: { id } })
    if (!existing) return apiError('অধ্যায় খুঁজে পাওয়া যায়নি', 404)

    await db.chapter.delete({ where: { id } })
    await invalidateContentCache('chapter')
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'chapter', id)
    return apiResponse({ id, message: 'অধ্যায় সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Chapter')
  }
}
