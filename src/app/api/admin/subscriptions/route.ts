import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, parseIdsParam, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSubscriptionSchema = z.object({
  id: z.string().optional(),
  ids: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  extendDays: z.number().int().positive().optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const packageId = searchParams.get('packageId') || ''
    const userId = searchParams.get('userId') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (packageId) where.packageId = packageId
    if (userId) where.userId = userId

    const [subscriptions, total] = await Promise.all([
      db.userSubscription.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          package: { select: { id: true, title: true, duration: true, durationLabel: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.userSubscription.count({ where }),
    ])

    const totalSubs = await db.userSubscription.count()
    const activeSubs = await db.userSubscription.count({ where: { isActive: true } })
    const expiredSubs = await db.userSubscription.count({
      where: { endDate: { lt: new Date() }, isActive: true },
    })

    return apiResponse({
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalSubscriptions: totalSubs,
        activeSubscriptions: activeSubs,
        expiredButActive: expiredSubs,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Subscriptions')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validation = validateBody(updateSubscriptionSchema, body)
    if ('error' in validation) return validation.error
    const { id, ids, isActive, extendDays } = validation.data

    if (Array.isArray(ids) && ids.length > 0) {
      const updateData: Record<string, unknown> = {}
      if (isActive !== undefined) updateData.isActive = isActive
      const result = await db.userSubscription.updateMany({ where: { id: { in: ids } }, data: updateData })
      return apiResponse({ updated: result.count }, `${result.count}টি আপডেট হয়েছে`)
    }

    if (!id) return apiError('সাবস্ক্রিপশন ID প্রদান করুন', 400)

    const existing = await db.userSubscription.findUnique({ where: { id } })
    if (!existing) return apiError('সাবস্ক্রিপশন পাওয়া যায়নি', 404)

    const updateData: Record<string, unknown> = {}

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    if (extendDays && typeof extendDays === 'number' && extendDays > 0) {
      const currentEnd = new Date(existing.endDate)
      const now = new Date()
      const baseDate = currentEnd > now ? currentEnd : now
      const newEnd = new Date(baseDate)
      newEnd.setDate(newEnd.getDate() + extendDays)
      updateData.endDate = newEnd
      updateData.isActive = true
    }

    const updated = await db.userSubscription.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, title: true, duration: true, durationLabel: true, price: true } },
      },
    })

    return apiResponse({ message: 'সাবস্ক্রিপশন আপডেট হয়েছে', data: updated })
  } catch (error) {
    return handleApiError(error, 'Admin Update Subscription')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const ids = parseIdsParam(searchParams)
    if (ids) {
      const result = await db.userSubscription.updateMany({ where: { id: { in: ids } }, data: { isActive: false } })
      return apiResponse({ updated: result.count }, `${result.count}টি নিষ্ক্রিয় করা হয়েছে`)
    }
    const id = searchParams.get('id')

    if (!id) return apiError('সাবস্ক্রিপশন ID প্রদান করুন', 400)

    const existing = await db.userSubscription.findUnique({ where: { id } })
    if (!existing) return apiError('সাবস্ক্রিপশন পাওয়া যায়নি', 404)

    await db.userSubscription.update({
      where: { id },
      data: { isActive: false },
    })

    return apiResponse({ message: 'সাবস্ক্রিপশন নিষ্ক্রিয় করা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Admin Deactivate Subscription')
  }
}
