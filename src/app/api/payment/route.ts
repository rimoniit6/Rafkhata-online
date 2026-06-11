import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiResponse, apiError, validateBody, applyRateLimit } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { apiLimiter } from '@/lib/rate-limit'
import { createPaymentSchema, paginationSchema } from '@/lib/validations'
import { getContentTypeLabels, getValidContentTypes } from '@/lib/content-type-labels'

export async function GET(request: Request) {
  try {
    // Require authentication
    const auth = await verifyAuth(request)
    if (!auth) return apiError('প্রমাণীকরণ প্রয়োজন।', 401, 'UNAUTHORIZED')

    // Rate limiting
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const { searchParams } = new URL(request.url)
    const { page, limit } = paginationSchema.parse(Object.fromEntries(searchParams))
    const status = searchParams.get('status')
    const contentType = searchParams.get('contentType')
    let userId = searchParams.get('userId')

    // Non-admin users can only see their own payments
    if (!auth.isAdmin) {
      userId = auth.user.id
    }

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (status) where.status = status
    if (contentType) where.contentType = contentType

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, 'Get payments error')
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const auth = await verifyAuth(request)
    if (!auth) return apiError('প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।', 401, 'UNAUTHORIZED')

    // Rate limiting
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const body = await request.json()
    const validation = validateBody(createPaymentSchema, body)
    if ('error' in validation) return validation.error
    const {
      amount,
      method,
      transactionId,
      paymentNumber,
      screenshot,
      contentType,
      contentId,
      contentTitle,
      classLevel,
      idempotencyKey,
    } = validation.data

    // Get userId from authenticated session, NOT from request body
    const userId = auth.user.id

    // Check idempotency key if provided
    if (idempotencyKey) {
      const existingByIdempotency = await db.payment.findUnique({
        where: { idempotencyKey },
        select: { id: true, status: true, createdAt: true },
      })
      if (existingByIdempotency) {
        // Return existing payment instead of creating duplicate
        return NextResponse.json(
          { success: true, data: { message: 'পেমেন্ট ইতিমধ্যে প্রক্রিয়াধীন', payment: existingByIdempotency }, idempotent: true },
          { status: 200 }
        )
      }
    }

    // Validate contentType if provided
    const VALID_CONTENT_TYPES = await getValidContentTypes()
    if (contentType && !VALID_CONTENT_TYPES.includes(contentType)) {
      return apiError('অবৈধ কন্টেন্ট টাইপ। সমর্থিত: ' + VALID_CONTENT_TYPES.join(', '), 400)
    }

    // For per-content payments, check if there's already an approved payment
    // Cross-type: mcq ↔ board-mcq, cq ↔ board-cq — same content, different context
    if (contentType && contentId) {
      const contentTypesToCheck = [contentType]
      if (contentType === 'mcq') contentTypesToCheck.push('board-mcq')
      if (contentType === 'board-mcq') contentTypesToCheck.push('mcq')
      if (contentType === 'cq') contentTypesToCheck.push('board-cq')
      if (contentType === 'board-cq') contentTypesToCheck.push('cq')

      const existingApproved = await db.payment.findFirst({
        where: {
          userId: userId,
          contentType: { in: contentTypesToCheck },
          contentId,
          status: 'approved',
        },
      })
      if (existingApproved) {
        return apiError('আপনি ইতিমধ্যে এই কন্টেন্টের জন্য পেমেন্ট করেছেন', 400, 'ALREADY_PURCHASED')
      }

      const existingPending = await db.payment.findFirst({
        where: {
          userId: userId,
          contentType: { in: contentTypesToCheck },
          contentId,
          status: 'pending',
        },
      })
      if (existingPending) {
        return apiError('এই কন্টেন্টের জন্য একটি পেমেন্ট ইতিমধ্যে অপেক্ষমাণ আছে', 400, 'PENDING_PAYMENT')
      }

      // ===== Also check if content is accessible via BUNDLE purchase =====
      // If the user bought a bundle containing this content, they shouldn't need to buy it individually
      if (['mcq', 'cq', 'board-mcq', 'board-cq', 'lecture', 'suggestion', 'exam'].includes(contentType)) {
        const itemContentTypes = [contentType]
        if (contentType === 'board-mcq') itemContentTypes.push('mcq')
        if (contentType === 'mcq') itemContentTypes.push('board-mcq')
        if (contentType === 'board-cq') itemContentTypes.push('cq')
        if (contentType === 'cq') itemContentTypes.push('board-cq')

        const bundleItemsContainingContent = await db.bundleItem.findMany({
          where: {
            contentType: { in: itemContentTypes },
            contentId,
          },
          select: { bundleId: true },
        })

        const bundleIds = [...new Set(bundleItemsContainingContent.map(bi => bi.bundleId))]

        if (bundleIds.length > 0) {
          const approvedBundlePayment = await db.payment.findFirst({
            where: {
              userId,
              contentType: 'bundle',
              contentId: { in: bundleIds },
              status: 'approved',
            },
          })

          if (approvedBundlePayment) {
            return NextResponse.json(
              { success: false, error: 'আপনি ইতিমধ্যে এই কন্টেন্ট সহ একটি বান্ডেল কিনেছেন', data: { alreadyPurchased: true, reason: 'bundle_purchase' } },
              { status: 400 }
            )
          }

          const pendingBundlePayment = await db.payment.findFirst({
            where: {
              userId,
              contentType: 'bundle',
              contentId: { in: bundleIds },
              status: 'pending',
            },
          })

          if (pendingBundlePayment) {
            return NextResponse.json(
              { success: false, error: 'এই কন্টেন্ট সহ একটি বান্ডেলের পেমেন্ট ইতিমধ্যে অপেক্ষমাণ আছে', data: { pendingPayment: true, reason: 'bundle_payment_pending' } },
              { status: 400 }
            )
          }
        }
      }

      // ===== Also check if content is accessible via active SUBSCRIPTION =====
      if (['mcq', 'cq', 'board-mcq', 'board-cq'].includes(contentType)) {
        let contentClassLevel: string | null = null
        if (contentType === 'mcq' || contentType === 'board-mcq') {
          const mcq = await db.mCQ.findUnique({ where: { id: contentId }, select: { classLevel: true } })
          contentClassLevel = mcq?.classLevel || null
        } else {
          const cq = await db.cQ.findUnique({ where: { id: contentId }, select: { classLevel: true } })
          contentClassLevel = cq?.classLevel || null
        }

        if (contentClassLevel) {
          const activeSubscription = await db.userSubscription.findFirst({
            where: {
              userId,
              classLevel: contentClassLevel,
              isActive: true,
              endDate: { gte: new Date() },
            },
          })

          if (activeSubscription) {
            return NextResponse.json(
              { success: false, error: 'আপনার সাবস্ক্রিপশনে এই কন্টেন্ট ইতিমধ্যে অন্তর্ভুক্ত', data: { alreadyPurchased: true, reason: 'active_subscription' } },
              { status: 400 }
            )
          }
        }
      }
    }

    // Try to resolve contentTitle if not provided
    const contentTypeLabels = await getContentTypeLabels()
    let resolvedTitle = contentTitle || ''
    if (!resolvedTitle && contentType && contentId) {
      try {
        switch (contentType) {
          case 'mcq':
          case 'board-mcq': {
            const mcq = await db.mCQ.findUnique({ where: { id: contentId }, select: { question: true } })
            resolvedTitle = mcq?.question?.slice(0, 80) || contentTypeLabels['mcq'] || 'MCQ প্রশ্ন'
            break
          }
          case 'cq':
          case 'board-cq': {
            const cq = await db.cQ.findUnique({ where: { id: contentId }, select: { uddeepok: true } })
            resolvedTitle = cq?.uddeepok?.slice(0, 80) || contentTypeLabels['cq'] || 'সৃজনশীল প্রশ্ন'
            break
          }
          case 'lecture': {
            const lecture = await db.lecture.findUnique({ where: { id: contentId }, select: { title: true } })
            resolvedTitle = lecture?.title || contentTypeLabels['lecture'] || 'লেকচার'
            break
          }
          case 'suggestion': {
            const suggestion = await db.suggestion.findUnique({ where: { id: contentId }, select: { title: true } })
            resolvedTitle = suggestion?.title || contentTypeLabels['suggestion'] || 'সাজেশন'
            break
          }
          case 'exam': {
            const exam = await db.exam.findUnique({ where: { id: contentId }, select: { title: true } })
            resolvedTitle = exam?.title || contentTypeLabels['exam'] || 'পরীক্ষা'
            break
          }
          case 'bundle': {
            const bundle = await db.contentBundle.findUnique({ where: { id: contentId }, select: { title: true } })
            resolvedTitle = bundle?.title || contentTypeLabels['bundle'] || 'বান্ডেল'
            break
          }
          case 'package': {
            const pkg = await db.contentPackage.findUnique({ where: { id: contentId }, select: { title: true } })
            resolvedTitle = pkg?.title || contentTypeLabels['package'] || 'প্যাকেজ'
            break
          }
          case 'mcq-exam-package': {
            const mcqPkg = await db.mCQExamPackage.findUnique({ where: { id: contentId }, select: { title: true } })
            resolvedTitle = mcqPkg?.title || 'MCQ এক্সাম প্যাকেজ'
            break
          }
          case 'cq-exam-package': {
            const cqPkg = await db.cQExamPackage.findUnique({ where: { id: contentId }, select: { title: true } })
            resolvedTitle = cqPkg?.title || 'CQ এক্সাম প্যাকেজ'
            break
          }
        }
      } catch {
        resolvedTitle = contentType
      }
    }

    const payment = await db.payment.create({
      data: {
        userId: userId,
        amount,
        method,
        transactionId,
        paymentNumber,
        screenshot: screenshot || null,
        contentType: contentType || null,
        contentId: contentId || null,
        contentTitle: resolvedTitle || null,
        classLevel: classLevel || null,
        status: 'pending',
        idempotencyKey: idempotencyKey || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      { success: true, data: { message: 'পেমেন্ট সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাইয়ের পর আপনার কন্টেন্ট অ্যাক্সেস সক্রিয় হবে।', payment } },
      { status: 201 }
    )
  } catch (error: any) {
    // Handle unique constraint violation (race condition: duplicate payment)
    if (error?.code === 'P2002') {
      if (error?.meta?.target?.includes('idempotencyKey')) {
        return apiError('এই অনুরোধ ইতিমধ্যে প্রক্রিয় করা হয়েছে।', 400, 'IDEMPOTENCY_CONFLICT')
      }
      if (error?.meta?.target?.includes('userId')) {
        return apiError('এই কন্টেন্টের জন্য পেমেন্ট ইতিমধ্যে আছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।', 400, 'DUPLICATE_PAYMENT')
      }
    }
    return handleApiError(error, 'Create payment error')
  }
}
