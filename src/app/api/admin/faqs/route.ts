import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, parseIdsParam } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const data = await db.fAQ.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get FAQs')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { question, answer, category, order, isActive } = body

    if (!question || !answer) {
      return apiError('প্রশ্ন এবং উত্তর আবশ্যক', 400)
    }

    const data = await db.fAQ.create({
      data: {
        question, answer,
        category: category || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create FAQ')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ids, ...updateData } = body

    if (Array.isArray(ids) && ids.length > 0) {
      const bulkData: Record<string, unknown> = {}
      if (updateData.isActive !== undefined) bulkData.isActive = updateData.isActive
      const result = await db.fAQ.updateMany({ where: { id: { in: ids } }, data: bulkData })
      return apiResponse({ updated: result.count }, `${result.count}টি আপডেট হয়েছে`)
    }

    if (!id) {
      return apiError('FAQ ID আবশ্যক', 400)
    }

    const existing = await db.fAQ.findUnique({ where: { id } })
    if (!existing) {
      return apiError('FAQ খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = ['question', 'answer', 'category', 'order', 'isActive']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    const updated = await db.fAQ.update({
      where: { id },
      data,
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update FAQ')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.fAQ.deleteMany({ where: { id: { in: ids } } })
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
      return apiError('FAQ ID আবশ্যক', 400)
    }

    const existing = await db.fAQ.findUnique({ where: { id } })
    if (!existing) {
      return apiError('FAQ খুঁজে পাওয়া যায়নি', 404)
    }

    await db.fAQ.delete({ where: { id } })
    return apiResponse({ id }, 'FAQ সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete FAQ')
  }
}
