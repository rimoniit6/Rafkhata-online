import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
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

    const data = await db.testimonial.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Testimonials error')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { name, role, avatar, content, rating, isActive, order } = body

    if (!name || !content) {
      return apiError('নাম এবং বিষয়বস্তু আবশ্যক', 400)
    }

    const data = await db.testimonial.create({
      data: {
        name,
        role: role || null,
        avatar: avatar || null,
        content,
        rating: rating ?? 5,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Testimonial error')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return apiError('টেস্টিমোনিয়াল ID আবশ্যক', 400)
    }

    const existing = await db.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return apiError('টেস্টিমোনিয়াল খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = ['name', 'role', 'avatar', 'content', 'rating', 'isActive', 'order']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    const updated = await db.testimonial.update({
      where: { id },
      data,
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Testimonial error')
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
      return apiError('টেস্টিমোনিয়াল ID আবশ্যক', 400)
    }

    const existing = await db.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return apiError('টেস্টিমোনিয়াল খুঁজে পাওয়া যায়নি', 404)
    }

    await db.testimonial.delete({ where: { id } })

    return apiResponse({ id }, 'টেস্টিমোনিয়াল সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Testimonial error')
  }
}
