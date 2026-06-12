import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const data = await db.classCategory.findMany({
      where,
      include: { _count: { select: { subjects: true } } },
      orderBy: { order: 'asc' },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Classes')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const { name, slug, order, icon, color, gradient, description, isActive } = body

    if (!name) return apiError('শ্রেণির নাম আবশ্যক', 400)

    const classSlug = slug || name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    const existingSlug = await db.classCategory.findFirst({ where: { slug: classSlug } })
    if (existingSlug) return apiError('এই স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে।', 409)

    const data = await db.classCategory.create({
      data: {
        name,
        slug: classSlug,
        order: order ?? 0,
        icon: icon || null,
        color: color || null,
        gradient: gradient || null,
        description: description || null,
        isActive: isActive ?? true,
      },
      include: { _count: { select: { subjects: true } } },
    })

    await invalidateContentCache('class')
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Class')
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

    if (!id) return apiError('শ্রেণি ID আবশ্যক', 400)

    const existing = await db.classCategory.findUnique({ where: { id } })
    if (!existing) return apiError('শ্রেণি খুঁজে পাওয়া যায়নি', 404)

    if (updateData.slug && updateData.slug !== existing.slug) {
      const slugExists = await db.classCategory.findFirst({ where: { slug: updateData.slug, NOT: { id } } })
      if (slugExists) return apiError('এই স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে।', 409)
    }

    const data: Record<string, unknown> = {}
    const allowedFields: string[] = ['name', 'slug', 'order', 'icon', 'color', 'gradient', 'description', 'isActive']
    const nullableFields: string[] = ['icon', 'color', 'gradient', 'description']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = (nullableFields.includes(field) && updateData[field] === '') ? null : updateData[field]
      }
    }

    const updated = await db.classCategory.update({
      where: { id },
      data,
      include: { _count: { select: { subjects: true } } },
    })

    await invalidateContentCache('class')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Class')
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

    if (!id) return apiError('শ্রেণি ID আবশ্যক', 400)

    const existing = await db.classCategory.findUnique({ where: { id } })
    if (!existing) return apiError('শ্রেণি খুঁজে পাওয়া যায়নি', 404)

    await db.classCategory.delete({ where: { id } })
    await invalidateContentCache('class')
    return apiResponse({ id, message: 'শ্রেণি সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Class')
  }
}
