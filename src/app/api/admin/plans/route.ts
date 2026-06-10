import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const data = await db.contentPackage.findMany({
      where,
      orderBy: { price: 'asc' },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Plans error')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { title, price, duration, durationLabel, description, classLevel, isActive } = body

    if (!title || price === undefined || !duration) {
      return apiResponse(null, 'নাম, মূল্য এবং সময়কাল আবশ্যক', 400)
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    // Ensure slug is unique
    const existingSlug = await db.contentPackage.findFirst({ where: { slug } })
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

    const data = await db.contentPackage.create({
      data: {
        title,
        slug: finalSlug,
        price: parseFloat(String(price)),
        originalPrice: parseFloat(String(price)),
        duration: parseInt(String(duration)),
        durationLabel: durationLabel || `${duration} দিন`,
        description: description || null,
        classLevel: classLevel || null,
        isActive: isActive ?? true,
      },
    })

    return apiResponse(data, null, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Plan error')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return apiResponse(null, 'প্ল্যান ID আবশ্যক', 400)
    }

    const existing = await db.contentPackage.findUnique({ where: { id } })
    if (!existing) {
      return apiResponse(null, 'প্ল্যান খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = ['title', 'duration', 'durationLabel', 'isActive', 'description', 'classLevel']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    if (updateData.price !== undefined) {
      data.price = parseFloat(String(updateData.price))
      data.originalPrice = parseFloat(String(updateData.price))
    }

    const updated = await db.contentPackage.update({
      where: { id },
      data,
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Plan error')
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
      return apiResponse(null, 'প্ল্যান ID আবশ্যক', 400)
    }

    const existing = await db.contentPackage.findUnique({ where: { id } })
    if (!existing) {
      return apiResponse(null, 'প্ল্যান খুঁজে পাওয়া যায়নি', 404)
    }

    await db.contentPackage.delete({ where: { id } })

    return apiResponse({ id }, 'সাবস্ক্রিপশন প্ল্যান সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Plan error')
  }
}
