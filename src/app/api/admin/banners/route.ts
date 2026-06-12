import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, parseIdsParam } from '@/lib/api-utils'
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

    const data = await db.banner.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Banners')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { title, subtitle, image, link, buttonText, isActive, order, startDate, endDate } = body

    if (!title) {
      return apiError('ব্যানার শিরোনাম আবশ্যক', 400)
    }

    const data = await db.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        image: image || null,
        link: link || null,
        buttonText: buttonText || null,
        isActive: isActive ?? true,
        order: order ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    await invalidateContentCache('banner')
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Banner')
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
      const result = await db.banner.updateMany({ where: { id: { in: ids } }, data: updateData })
      await invalidateContentCache('banner')
      return apiResponse({ updated: result.count }, `${result.count}টি আপডেট হয়েছে`)
    }
    const { id, ...updateData } = body

    if (!id) {
      return apiError('ব্যানার ID আবশ্যক', 400)
    }

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      return apiError('ব্যানার খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'subtitle', 'image', 'link', 'buttonText',
      'isActive', 'order',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    if (updateData.startDate !== undefined) {
      data.startDate = updateData.startDate ? new Date(updateData.startDate) : null
    }
    if (updateData.endDate !== undefined) {
      data.endDate = updateData.endDate ? new Date(updateData.endDate) : null
    }

    const updated = await db.banner.update({
      where: { id },
      data,
    })

    await invalidateContentCache('banner')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Banner')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)

    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.banner.deleteMany({ where: { id: { in: ids } } })
      await invalidateContentCache('banner')
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
      return apiError('ব্যানার ID আবশ্যক', 400)
    }

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      return apiError('ব্যানার খুঁজে পাওয়া যায়নি', 404)
    }

    await db.banner.delete({ where: { id } })

    await invalidateContentCache('banner')
    return apiResponse({ id }, 'ব্যানার সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Banner')
  }
}
