import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody, applyRateLimit, withCsrf, parsePaginationParams } from '@/lib/api-utils'
import { handleApiError, safeTransaction } from '@/lib/errors'
import { reviewPaymentSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'
import { createAuditLog, AuditActions, EntityTypes, getClientIP } from '@/lib/audit'
import { apiLimiter } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const contentType = searchParams.get('contentType')
    const q = searchParams.get('q')
    const { page, limit } = parsePaginationParams(searchParams)

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (method) where.method = method
    if (contentType) where.contentType = contentType
    if (q) {
      where.OR = [
        { transactionId: { contains: q } },
        { paymentNumber: { contains: q } },
        { contentTitle: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isPremium: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
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
    return handleApiError(error, 'Admin Get Payments')
  }
}

async function handleSubscriptionCreation(payment: { id: string; userId: string; contentId: string | null; classLevel: string | null }) {
  if (!payment.contentId || !payment.classLevel) return
  const pkg = await db.contentPackage.findUnique({
    where: { id: payment.contentId },
    select: { duration: true },
  })
  if (!pkg) return

  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + pkg.duration)

  const existingSub = await db.userSubscription.findFirst({
    where: { userId: payment.userId, packageId: payment.contentId, classLevel: payment.classLevel },
  })

  if (!existingSub) {
    await db.userSubscription.create({
      data: { userId: payment.userId, packageId: payment.contentId, classLevel: payment.classLevel, startDate, endDate, isActive: true, paymentId: payment.id },
    })
  } else {
    const currentEnd = new Date(existingSub.endDate)
    const newEnd = currentEnd > startDate ? currentEnd : startDate
    newEnd.setDate(newEnd.getDate() + pkg.duration)
    await db.userSubscription.update({ where: { id: existingSub.id }, data: { endDate: newEnd, isActive: true, paymentId: payment.id } })
  }
}

async function handleMCQExamPurchase(payment: { id: string; userId: string; contentId: string | null }) {
  if (!payment.contentId) return
  const existingPurchase = await db.mCQExamPackagePurchase.findFirst({
    where: { userId: payment.userId, packageId: payment.contentId },
  })
  if (!existingPurchase) {
    await db.mCQExamPackagePurchase.create({
      data: { userId: payment.userId, packageId: payment.contentId, paymentId: payment.id, isActive: true },
    })
  } else {
    await db.mCQExamPackagePurchase.update({ where: { id: existingPurchase.id }, data: { isActive: true, paymentId: payment.id } })
  }
}

async function handleCQExamPurchase(payment: { id: string; userId: string; contentId: string | null }) {
  if (!payment.contentId) return
  const existingPurchase = await db.cQExamPackagePurchase.findFirst({
    where: { userId: payment.userId, packageId: payment.contentId },
  })
  if (!existingPurchase) {
    await db.cQExamPackagePurchase.create({
      data: { userId: payment.userId, packageId: payment.contentId, paymentId: payment.id, isActive: true },
    })
  } else {
    await db.cQExamPackagePurchase.update({ where: { id: existingPurchase.id }, data: { isActive: true, paymentId: payment.id } })
  }
}

export async function PATCH(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    // CSRF validation for mutation
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error

    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const body = await request.json()
    const validation = validateBody(reviewPaymentSchema, body)
    if ('error' in validation) return validation.error
    const { id, status, adminNote } = validation.data

    if (status === 'rejected' && !adminNote?.trim()) {
      return apiError('প্রত্যাখ্যানের কারণ লিখুন', 400)
    }

    const result = await safeTransaction(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: { id },
        include: { user: true },
      })

      if (!existing) throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 })
      if (existing.status !== 'pending') throw Object.assign(new Error('ALREADY_REVIEWED'), { statusCode: 400 })
      // Prevent self-approval: admin cannot approve their own payment
      if (existing.userId === auth.user.id) {
        throw Object.assign(new Error('SELF_APPROVAL'), { statusCode: 403 })
      }

      const updated = await tx.payment.update({
        where: { id },
        data: {
          status,
          adminNote: adminNote?.trim() || null,
          reviewedBy: auth.user.email || auth.user.id,
          reviewedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, isPremium: true } },
        },
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId: existing.userId,
          title: status === 'approved' ? 'পেমেন্ট অনুমোদিত' : 'পেমেন্ট প্রত্যাখ্যাত',
          message: status === 'approved'
            ? `আপনার "${existing.contentTitle || existing.contentType || 'কন্টেন্ট'}" ক্রয়ের ৳${existing.amount} পেমেন্ট অনুমোদিত হয়েছে।`
            : `আপনার ৳${existing.amount} পেমেন্ট প্রত্যাখ্যাত হয়েছে।${adminNote ? ` কারণ: ${adminNote}` : ''}`,
          type: status === 'approved' ? 'success' : 'error',
        },
      })

      return { existing, updated }
    })

    // Post-transaction side effects (non-critical — run outside transaction)
    if (status === 'approved') {
      if (result.existing.contentType === 'mcq-exam-package') {
        await handleMCQExamPurchase({ id: result.existing.id, userId: result.existing.userId, contentId: result.existing.contentId })
      } else if (result.existing.contentType === 'cq-exam-package') {
        await handleCQExamPurchase({ id: result.existing.id, userId: result.existing.userId, contentId: result.existing.contentId })
      }
    }

    // Audit log (non-critical — run outside transaction)
    await createAuditLog({
      adminId: auth.user.id,
      action: status === 'approved' ? AuditActions.PAYMENT_APPROVE : AuditActions.PAYMENT_REJECT,
      entityType: EntityTypes.PAYMENT,
      entityId: id,
      oldData: { status: result.existing.status, adminNote: result.existing.adminNote },
      newData: { status: result.updated.status, adminNote: result.updated.adminNote },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return apiResponse(result.updated)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return apiError('পেমেন্ট খুঁজে পাওয়া যায়নি', 404)
    }
    if (error instanceof Error && error.message === 'ALREADY_REVIEWED') {
      return apiError('এই পেমেন্ট ইতিমধ্যে রিভিউ করা হয়েছে', 400)
    }
    if (error instanceof Error && error.message === 'SELF_APPROVAL') {
      return apiError('আপনি নিজের পেমেন্ট অনুমোদন করতে পারবেন না। অন্য অ্যাডমিনকে অনুরোধ করুন।', 403)
    }
    return handleApiError(error, 'Admin Update Payment')
  }
}
