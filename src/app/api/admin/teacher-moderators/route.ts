import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { invalidateContentCache } from '@/lib/cache-invalidate'

const createTeacherModeratorSchema = z.object({
  name: z.string().min(1, 'নাম আবশ্যক'),
  image: z.string().nullable().optional(),
  title: z.string().min(1, 'পদবী আবশ্যক'),
  institution: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const data = await db.teacherModerator.findMany({
      orderBy: { order: 'asc' },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get TeacherModerators error')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validation = validateBody(createTeacherModeratorSchema, body)
    if ('error' in validation) return validation.error
    const { name, image, title, institution, isActive, order } = validation.data

    const data = await db.teacherModerator.create({
      data: {
        name,
        image: image || null,
        title,
        institution: institution || null,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    })

    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, 'teacher', data.id, body)
    await invalidateContentCache('settings')
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create TeacherModerator error')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return apiError('ID আবশ্যক', 400)
    }

    const existing = await db.teacherModerator.findUnique({ where: { id } })
    if (!existing) {
      return apiError('টিচার/মডারেটর খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = ['name', 'image', 'title', 'institution', 'isActive', 'order']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    const updated = await db.teacherModerator.update({
      where: { id },
      data,
    })

    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, 'teacher', updated.id)
    await invalidateContentCache('settings')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update TeacherModerator error')
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
        // No body
      }
    }

    if (!id) {
      return apiError('ID আবশ্যক', 400)
    }

    const existing = await db.teacherModerator.findUnique({ where: { id } })
    if (!existing) {
      return apiError('টিচার/মডারেটর খুঁজে পাওয়া যায়নি', 404)
    }

    await db.teacherModerator.delete({ where: { id } })

    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'teacher', id)
    await invalidateContentCache('settings')
    return apiResponse({ id }, 'সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete TeacherModerator error')
  }
}
