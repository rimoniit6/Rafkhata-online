import { apiError,apiResponse,paginatedApiResponse,parseIdsParam,parsePaginationParams,validateBody,withAdmin } from '@/lib/api-utils'
import { AuditActions,EntityTypes,auditFromRequest } from '@/lib/audit'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/errors'
import { createServiceClient } from '@/lib/supabase/server'
import { adminUpdateUserSchema } from '@/lib/validations'
import type { Role } from '@prisma/client'
import { NextResponse } from 'next/server'

const SUPER_ADMIN_ROLE: Role = 'SUPER_ADMIN'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const isPremium = searchParams.get('isPremium')
    const search = searchParams.get('search')
    const { page, limit } = parsePaginationParams(searchParams)

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
    const validation = validateBody(adminUpdateUserSchema, body)
    if ('error' in validation) return validation.error
    const { id, ids, name, role, phone, institute, classLevel, board, isVerified, isPremium, premiumExpiry } = validation.data

    // NEVER allow setting role to SUPER_ADMIN through API
    if (role === SUPER_ADMIN_ROLE || role === ('SUPER_ADMIN' as any)) {
      return apiError('এই API দিয়ে সুপার অ্যাডমিন তৈরি করা যাবে না। শুধুমাত্র CLI স্ক্রিপ্ট ব্যবহার করুন।', 403, 'FORBIDDEN')
    }

    if (ids && ids.length > 0) {
      // Block bulk role change to SUPER_ADMIN
      if (role === SUPER_ADMIN_ROLE) {
        return apiError('বাল্ক আপডেটে সুপার অ্যাডমিন রোল সেট করা যাবে না।', 403, 'FORBIDDEN')
      }

      // Check if any target users are SUPER_ADMIN
      const superAdminTargets = await db.user.count({
        where: { id: { in: ids }, role: SUPER_ADMIN_ROLE },
      })
      if (superAdminTargets > 0 && auth.user.role !== SUPER_ADMIN_ROLE) {
        return apiError('সুপার অ্যাডমিন ব্যবহারকারীদের পরিবর্তন করতে সুপার অ্যাডমিন অনুমতি প্রয়োজন।', 403, 'FORBIDDEN')
      }

      const updateData: Record<string, unknown> = {}
      if (role !== undefined) updateData.role = role
      if (isPremium !== undefined) updateData.isPremium = isPremium
      if (isVerified !== undefined) updateData.isVerified = isVerified

      const result = await db.user.updateMany({
        where: { id: { in: ids }, role: { not: SUPER_ADMIN_ROLE } },
        data: updateData,
      })

      await auditFromRequest(request, auth.user.id, AuditActions.USER_UPDATE, EntityTypes.USER, ids.join(','), undefined, updateData)
      return apiResponse({ updated: result.count }, `${result.count} জন ব্যবহারকারী আপডেট হয়েছে`)
    }

    if (!id) {
      return apiError('ব্যবহারকারী ID আবশ্যক', 400)
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return apiError('ব্যবহারকারী খুঁজে পাওয়া যায়নি', 404)
    }

    // SUPER_ADMIN users can only be modified by SUPER_ADMIN
    if (existingUser.role === SUPER_ADMIN_ROLE && auth.user.role !== SUPER_ADMIN_ROLE) {
      return apiError('সুপার অ্যাডমিন ব্যবহারকারীদের তথ্য পরিবর্তন করতে সুপার অ্যাডমিন অনুমতি প্রয়োজন।', 403, 'FORBIDDEN')
    }

    const oldData = { role: existingUser.role, isPremium: existingUser.isPremium, isVerified: existingUser.isVerified }

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

    await auditFromRequest(request, auth.user.id, AuditActions.USER_UPDATE, EntityTypes.USER, id, oldData, { role: user.role, isPremium: user.isPremium })
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

    const targetIds = ids || (id ? [id] : null)
    if (!targetIds || targetIds.length === 0) {
      return apiError('ব্যবহারকারী ID আবশ্যক', 400)
    }

    // Check if any targets are SUPER_ADMIN
    const superAdminTargets = await db.user.count({
      where: { id: { in: targetIds }, role: SUPER_ADMIN_ROLE },
    })

    if (superAdminTargets > 0) {
      return apiError('সুপার অ্যাডমিন ব্যবহারকারীদের মুছে ফেলা যাবে না।', 403, 'FORBIDDEN')
    }

    if (ids) {
      const usersToDelete = await db.user.findMany({
        where: { id: { in: ids }, role: { not: SUPER_ADMIN_ROLE } },
        select: { id: true, supabaseUserId: true },
      })
      const result = await db.$transaction(async (tx) => {
        await tx.feedbackMessage.deleteMany({ where: { feedback: { userId: { in: ids } } } })
        await tx.cQExamAnswer.deleteMany({ where: { submission: { userId: { in: ids } } } })
        await tx.payment.deleteMany({ where: { userId: { in: ids } } })
        await tx.bookmark.deleteMany({ where: { userId: { in: ids } } })
        await tx.progress.deleteMany({ where: { userId: { in: ids } } })
        await tx.examResult.deleteMany({ where: { userId: { in: ids } } })
        await tx.note.deleteMany({ where: { userId: { in: ids } } })
        await tx.notification.deleteMany({ where: { userId: { in: ids } } })
        await tx.recentlyViewed.deleteMany({ where: { userId: { in: ids } } })
        await tx.userSubscription.deleteMany({ where: { userId: { in: ids } } })
        await tx.mCQExamPackagePurchase.deleteMany({ where: { userId: { in: ids } } })
        await tx.cQExamPackagePurchase.deleteMany({ where: { userId: { in: ids } } })
        await tx.cQExamSubmission.deleteMany({ where: { userId: { in: ids } } })
        await tx.userFeedback.deleteMany({ where: { userId: { in: ids } } })
        await tx.mCQExamSetResult.deleteMany({ where: { userId: { in: ids } } })
        return tx.user.deleteMany({ where: { id: { in: ids }, role: { not: SUPER_ADMIN_ROLE } } })
      })
      // Clean up Supabase auth users
      try {
        const serviceSupabase = await createServiceClient()
        for (const u of usersToDelete) {
          if (u.supabaseUserId) {
            await serviceSupabase.auth.admin.deleteUser(u.supabaseUserId).catch(() => {})
          }
        }
      } catch { /* best-effort cleanup */ }
      await auditFromRequest(request, auth.user.id, AuditActions.USER_DELETE, EntityTypes.USER, ids.join(','))
      return apiResponse({ deleted: result.count }, `${result.count} জন ব্যবহারকারী মুছে ফেলা হয়েছে`)
    }

    if (!id) {
      return apiError('ব্যবহারকারী ID আবশ্যক', 400)
    }

    const existingUser = await db.user.findUnique({ where: { id } })
    if (!existingUser) {
      return apiError('ব্যবহারকারী খুঁজে পাওয়া যায়নি', 404)
    }

    // Clean up Supabase auth user first
    try {
      if (existingUser.supabaseUserId) {
        const serviceSupabase = await createServiceClient()
        await serviceSupabase.auth.admin.deleteUser(existingUser.supabaseUserId)
      }
    } catch { /* best-effort cleanup */ }

    // Clean up orphaned records before deleting user
    await db.$transaction(async (tx) => {
      await tx.feedbackMessage.deleteMany({ where: { feedback: { userId: id } } })
      await tx.cQExamAnswer.deleteMany({ where: { submission: { userId: id } } })
      await tx.payment.deleteMany({ where: { userId: id } })
      await tx.bookmark.deleteMany({ where: { userId: id } })
      await tx.progress.deleteMany({ where: { userId: id } })
      await tx.examResult.deleteMany({ where: { userId: id } })
      await tx.note.deleteMany({ where: { userId: id } })
      await tx.notification.deleteMany({ where: { userId: id } })
      await tx.recentlyViewed.deleteMany({ where: { userId: id } })
      await tx.userSubscription.deleteMany({ where: { userId: id } })
      await tx.mCQExamPackagePurchase.deleteMany({ where: { userId: id } })
      await tx.cQExamPackagePurchase.deleteMany({ where: { userId: id } })
      await tx.cQExamSubmission.deleteMany({ where: { userId: id } })
      await tx.userFeedback.deleteMany({ where: { userId: id } })
      await tx.mCQExamSetResult.deleteMany({ where: { userId: id } })
      await tx.user.delete({ where: { id } })
    })
    await auditFromRequest(request, auth.user.id, AuditActions.USER_DELETE, EntityTypes.USER, id)
    return apiResponse({ id }, 'ব্যবহারকারী সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Delete user')
  }
}
