import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const isRead = searchParams.get('isRead')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (userId) where.userId = userId
    if (isRead !== null && isRead !== undefined) where.isRead = isRead === 'true'

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
    const { title, message, type, userId, link, broadcast } = body

    if (!title || !message) return apiError('শিরোনাম এবং বার্তা আবশ্যক', 400)

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
          type: type || 'info',
          link: link || null,
        })),
      })

      return apiResponse({ sentCount: notifications.count }, 201)
    }

    const data = await db.notification.create({
      data: {
        userId: userId || null,
        title,
        message,
        type: type || 'info',
        link: link || null,
      },
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Notification')
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

    if (!id) return apiError('নোটিফিকেশন ID আবশ্যক', 400)

    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) return apiError('নোটিফিকেশন খুঁজে পাওয়া যায়নি', 404)

    await db.notification.delete({ where: { id } })
    return apiResponse({ id, message: 'নোটিফিকেশন সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Notification')
  }
}
