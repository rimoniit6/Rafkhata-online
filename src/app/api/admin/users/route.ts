import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin, parseIdsParam, parseBulkActionBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const isPremium = searchParams.get('isPremium')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (role) where.role = role
    if (isPremium !== null && isPremium !== undefined && isPremium !== '') {
      where.isPremium = isPremium === 'true'
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, avatar: true,
          phone: true, institute: true, classLevel: true, board: true,
          isVerified: true, isPremium: true, premiumExpiry: true, createdAt: true,
          _count: { select: { payments: true, progress: true, bookmarks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return paginatedApiResponse(users, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error, 'Get users')
  }
}

export async function PATCH(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { id, ids, name, role, phone, institute, classLevel, board, isVerified, isPremium, premiumExpiry } = body

    if (Array.isArray(ids) && ids.length > 0) {
      const updateData: Record<string, unknown> = {}
      if (role !== undefined) updateData.role = role
      if (isPremium !== undefined) updateData.isPremium = isPremium
      if (isVerified !== undefined) updateData.isVerified = isVerified

      const result = await db.user.updateMany({
        where: { id: { in: ids } },
        data: updateData,
      })
      return apiResponse({ updated: result.count }, `${result.count} জন ব্যবহারকারী আপডেট হয়েছে`)
    }

    if (!id) {
      return apiError('ব্যবহারকারী ID আবশ্যক', 400)
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return apiError('ব্যবহারকারী খুঁজে পাওয়া যায়নি', 404)
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(phone !== undefined && { phone }),
        ...(institute !== undefined && { institute }),
        ...(classLevel !== undefined && { classLevel }),
        ...(board !== undefined && { board }),
        ...(isVerified !== undefined && { isVerified }),
        ...(isPremium !== undefined && { isPremium }),
        ...(premiumExpiry !== undefined && { premiumExpiry: premiumExpiry ? new Date(premiumExpiry) : null }),
      },
      select: {
        id: true, email: true, name: true, role: true, avatar: true,
        phone: true, institute: true, classLevel: true, board: true,
        isVerified: true, isPremium: true, premiumExpiry: true,
        createdAt: true, updatedAt: true,
      },
    })

    return apiResponse(user, 'ব্যবহারকারী আপডেট হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Update user')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const ids = parseIdsParam(searchParams)
    const id = searchParams.get('id')

    if (ids) {
      const result = await db.user.deleteMany({ where: { id: { in: ids } } })
      return apiResponse({ deleted: result.count }, `${result.count} জন ব্যবহারকারী মুছে ফেলা হয়েছে`)
    }

    if (!id) {
      return apiError('ব্যবহারকারী ID আবশ্যক', 400)
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return apiError('ব্যবহারকারী খুঁজে পাওয়া যায়নি', 404)
    }

    await db.user.delete({ where: { id } })
    return apiResponse({ id }, 'ব্যবহারকারী সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Delete user')
  }
}
