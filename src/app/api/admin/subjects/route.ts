import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const isActive = searchParams.get('isActive')
    const q = searchParams.get('q')

    const where: Record<string, unknown> = {}
    if (classId) {
      if (!classId.startsWith('cm') || classId.length < 20) {
        const classBySlug = await db.classCategory.findFirst({ where: { slug: classId } })
        if (classBySlug) where.classId = classBySlug.id
        else where.classId = classId
      } else {
        where.classId = classId
      }
    }
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
        { description: { contains: q } },
      ]
    }

    const data = await db.subject.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, slug: true } },
        _count: { select: { chapters: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Subjects')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { name, slug, classId, icon, color, description, order, isActive } = body

    if (!name || !classId) return apiError('বিষয়ের নাম এবং শ্রেণি আবশ্যক', 400)

    const subjectSlug = slug || name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    const existingSlug = await db.subject.findFirst({
      where: { slug: subjectSlug, classId },
    })
    if (existingSlug) return apiError('এই শ্রেণিতে এই স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে।', 409)

    const data = await db.subject.create({
      data: {
        name,
        slug: subjectSlug,
        classId,
        icon: icon || null,
        color: color || null,
        description: description || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        class: { select: { id: true, name: true, slug: true } },
        _count: { select: { chapters: true } },
      },
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Subject')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) return apiError('বিষয় ID আবশ্যক', 400)

    const existing = await db.subject.findUnique({ where: { id } })
    if (!existing) return apiError('বিষয় খুঁজে পাওয়া যায়নি', 404)

    const newSlug = updateData.slug !== undefined ? updateData.slug : existing.slug
    const newClassId = updateData.classId !== undefined ? updateData.classId : existing.classId
    if ((updateData.slug !== undefined && updateData.slug !== existing.slug) ||
        (updateData.classId !== undefined && updateData.classId !== existing.classId)) {
      const slugExists = await db.subject.findFirst({
        where: { slug: newSlug, classId: newClassId, NOT: { id } },
      })
      if (slugExists) return apiError('এই শ্রেণিতে এই স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে।', 409)
    }

    const data: Record<string, unknown> = {}
    const allowedFields: string[] = ['name', 'slug', 'classId', 'icon', 'color', 'description', 'order', 'isActive']
    const nullableFields: string[] = ['icon', 'color', 'description']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = (nullableFields.includes(field) && updateData[field] === '') ? null : updateData[field]
      }
    }

    const updated = await db.subject.update({
      where: { id },
      data,
      include: {
        class: { select: { id: true, name: true, slug: true } },
        _count: { select: { chapters: true } },
      },
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Subject')
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

    if (!id) return apiError('বিষয় ID আবশ্যক', 400)

    const existing = await db.subject.findUnique({ where: { id } })
    if (!existing) return apiError('বিষয় খুঁজে পাওয়া যায়নি', 404)

    await db.subject.delete({ where: { id } })
    return apiResponse({ id, message: 'বিষয় সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Subject')
  }
}
