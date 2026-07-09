import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { invalidateContentCache } from '@/lib/cache-invalidate'

const createYearSchema = z.object({
  year: z.string().min(1, 'সাল আবশ্যক'),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
})

// GET /api/admin/years - List all exam years
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const years = await db.examYear.findMany({
      orderBy: { order: 'desc' },
    })
    return apiResponse(years)
  } catch (error) {
    return handleApiError(error, 'Year list error')
  }
}

// POST /api/admin/years - Create a new exam year
export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validation = validateBody(createYearSchema, body)
    if ('error' in validation) return validation.error
    const { year, isActive, order } = validation.data

    const existing = await db.examYear.findFirst({
      where: { year: year.trim() },
    })
    if (existing) {
      return apiError('এই সাল ইতিমধ্যে আছে', 400)
    }

    const examYear = await db.examYear.create({
      data: {
        year: year.trim(),
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    })

    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, 'year', examYear.id, body)
    await invalidateContentCache('settings')
    return apiResponse(examYear, 201)
  } catch (error) {
    return handleApiError(error, 'Year create error')
  }
}

// PUT /api/admin/years - Update an exam year
export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, year, isActive, order } = body

    if (!id) {
      return apiResponse(null, 'সাল ID আবশ্যক', 400)
    }

    const updateData: Record<string, unknown> = {}
    if (year !== undefined) updateData.year = year.trim()
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order

    const examYear = await db.examYear.update({
      where: { id },
      data: updateData,
    })

    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, 'year', examYear.id)
    await invalidateContentCache('settings')
    return apiResponse(examYear)
  } catch (error) {
    return handleApiError(error, 'Year update error')
  }
}

// DELETE /api/admin/years?id=xxx - Delete an exam year
export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('সাল ID আবশ্যক', 400)
    }

    await db.examYear.delete({ where: { id } })
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'year', id)
    await invalidateContentCache('settings')
    return apiResponse({ id }, 'সাল সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Year delete error')
  }
}
