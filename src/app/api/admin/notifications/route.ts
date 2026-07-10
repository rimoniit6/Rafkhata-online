import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody, parseIdsParam } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createNotificationSchema = z.object({
  title: z.string().min(1, 'শিরোনাম আবশ্যক'),
  message: z.string().min(1, 'বার্তা আবশ্যক'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).optional(),
  userId: z.string().optional(),
  link: z.string().nullable().optional(),
  broadcast: z.boolean().optional(),
})

const updateNotificationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).optional(),
  isRead: z.boolean().optional(),
  link: z.string().nullable().optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const isRead = searchParams.get('isRead')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (userId) where.userId = userId
    if (isRead !== null && isRead !== undefined) where.isRead = isRead === 'true'
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
    ])

    return apiResponse({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Notifications')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validated = validateBody(createNotificationSchema, body)
    if ('error' in validated) return validated.error
    const { data: { title, message, type, userId, link, broadcast } } = validated

    if (broadcast && !userId) {
      const users = await db.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true },
      })

      const notifications = await db.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          title,
          message,
          type: (type || 'INFO') as 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR',
          link: link || null,
        })),
      })

      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, 'notification', 'broadcast', body, { sentCount: notifications.count })
      await invalidateContentCache('notification')
      return apiResponse({ sentCount: notifications.count }, 201)
    }

    const data = await db.notification.create({
      data: {
        userId: userId || null,
        title,
        message,
        type: (type || 'INFO') as 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR',
        link: link || null,
      },
    })

    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, 'notification', data.id, body)
    await invalidateContentCache('notification')
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Notification')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validated = validateBody(updateNotificationSchema, body)
    if ('error' in validated) return validated.error
    const { id, ...updateData } = validated.data

    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) return apiError('নোটিফিকেশন খুঁজে পাওয়া যায়নি', 404)

    const allowedFields = ['title', 'message', 'type', 'isRead', 'link']
    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in updateData && updateData[field as keyof typeof updateData] !== undefined) {
        data[field] = updateData[field as keyof typeof updateData]
      }
    }

    const updated = await db.notification.update({ where: { id }, data })
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, 'notification', id, existing as unknown as Record<string, unknown>, data)
    await invalidateContentCache('notification')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Notification')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)

    // Bulk delete
    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.notification.deleteMany({ where: { id: { in: ids } } })
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'notification', ids.join(','), undefined, { deletedCount: result.count })
      await invalidateContentCache('notification')
      return apiResponse({ deleted: result.count }, `সফলভাবে ${result.count}টি নোটিফিকেশন মুছে ফেলা হয়েছে`, 200)
    }

    // Single delete
    let id = searchParams.get('id')
    if (!id) {
      const body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) return apiError('নোটিফিকেশন ID আবশ্যক', 400)

    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) return apiError('নোটিফিকেশন খুঁজে পাওয়া যায়নি', 404)

    await db.notification.delete({ where: { id } })
    await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'notification', id, existing as unknown as Record<string, unknown>)
    await invalidateContentCache('notification')
    return apiResponse({ id }, 'নোটিফিকেশন সফলভাবে মুছে ফেলা হয়েছে', 200)
  } catch (error) {
    return handleApiError(error, 'Admin Delete Notification')
  }
}
