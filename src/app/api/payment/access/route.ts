import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiLimiter, getClientIdentifier, rateLimitHeaders } from '@/lib/rate-limit'
import { apiError } from '@/lib/api-utils'
import { getValidContentTypes } from '@/lib/content-type-labels'
import { handleApiError } from '@/lib/errors'
import { resolveCourseLayerAccess } from '@/lib/course-access-resolver'

export async function GET(request: Request) {
  try {
    // Require authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন।', 401, 'UNAUTHORIZED')
    }

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateResult = await apiLimiter.limit(identifier)
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'অনেক বেশি অনুরোধ।', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      )
    }

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const contentId = searchParams.get('contentId')

    // Use session userId instead of query param
    const userId = auth.user.id

    if (!contentType) {
      return apiError('কন্টেন্ট টাইপ প্রয়োজন', 400)
    }

    const VALID_CONTENT_TYPES = await getValidContentTypes()
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return apiError('সঠিক কন্টেন্ট টাইপ দিন। সমর্থিত: ' + VALID_CONTENT_TYPES.join(', '), 400)
    }

    if (!contentId) {
      return apiError('কন্টেন্ট আইডি প্রয়োজন', 400)
    }

    // NOTE: isPremium flag NO LONGER grants blanket access.
    // Access is only granted through: direct payment, bundle purchase, or active subscription.
    // The isPremium flag is kept for UI display purposes only.

    // ===== Check active subscription for this content's class =====
    let contentClassLevel: string | null = null

    if (['mcq', 'cq', 'board-mcq', 'board-cq'].includes(contentType)) {
      if (contentType === 'mcq' || contentType === 'board-mcq') {
        const mcq = await db.mCQ.findUnique({ where: { id: contentId }, select: { classLevel: true } })
        contentClassLevel = mcq?.classLevel || null
      } else {
        const cq = await db.cQ.findUnique({ where: { id: contentId }, select: { classLevel: true } })
        contentClassLevel = cq?.classLevel || null
      }
    } else if (contentType === 'lecture') {
      const lecture = await db.lecture.findUnique({
        where: { id: contentId },
        select: { chapter: { select: { subject: { select: { classId: true } } } } },
      })
      if (lecture) {
        const classCat = await db.classCategory.findUnique({
          where: { id: lecture.chapter.subject.classId },
          select: { slug: true },
        })
        contentClassLevel = classCat?.slug || null
      }
    } else if (contentType === 'exam') {
      const exam = await db.exam.findUnique({ where: { id: contentId }, select: { classLevel: true } })
      contentClassLevel = exam?.classLevel || null
    } else if (contentType === 'suggestion') {
      const suggestion = await db.suggestion.findUnique({ where: { id: contentId }, select: { classId: true } })
      if (suggestion?.classId) {
        const classCat = await db.classCategory.findUnique({
          where: { id: suggestion.classId },
          select: { slug: true },
        })
        contentClassLevel = classCat?.slug || null
      }
    } else if (contentType === 'mcq-exam-package') {
      const pkg = await db.mCQExamPackage.findUnique({ where: { id: contentId }, select: { class: { select: { slug: true } } } })
      contentClassLevel = pkg?.class?.slug || null
    }

    // Check subscription access
    if (contentClassLevel) {
      const activeSubscription = await db.userSubscription.findFirst({
        where: {
          userId,
          classLevel: contentClassLevel,
          isActive: true,
          endDate: { gte: new Date() },
        },
        include: {
          package: { select: { title: true, durationLabel: true } },
        },
      })

      if (activeSubscription) {
        return NextResponse.json({
          success: true,
          data: {
            hasAccess: true,
            purchase: {
              id: activeSubscription.id,
              contentType: 'package',
              contentId: activeSubscription.packageId,
              amount: 0,
              createdAt: activeSubscription.startDate,
              subscription: {
                packageName: activeSubscription.package.title,
                durationLabel: activeSubscription.package.durationLabel,
                endDate: activeSubscription.endDate,
              },
            },
            isPremium: false,
            accessReason: 'active_subscription',
          },
        })
      }
    }

    // CQ exam packages — dedicated purchase only (never subscription/bundle unlock)
    if (contentType === 'cq-exam-package') {
      const examPkgPurchase = await db.cQExamPackagePurchase.findFirst({
        where: { userId, packageId: contentId, isActive: true },
      })
      if (examPkgPurchase) {
        return NextResponse.json({
          success: true,
          data: {
            hasAccess: true,
            purchase: {
              id: examPkgPurchase.id,
              contentType: 'cq-exam-package',
              contentId,
              amount: 0,
              createdAt: examPkgPurchase.purchasedAt,
            },
            isPremium: false,
            accessReason: 'exam_package_purchase',
          },
        })
      }
    }

    // ===== Check course-granted access (Layer 2) =====
    // Only reachable if no MCQ/CQ direct purchase or subscription was found
    if (['mcq-exam-package', 'cq-exam-package'].includes(contentType)) {
      const courseAccess = await resolveCourseLayerAccess(userId, contentType, contentId)
      if (courseAccess.hasAccess) {
        return NextResponse.json({
          success: true,
          data: {
            hasAccess: true,
            purchase: null,
            isPremium: false,
            accessReason: courseAccess.source,
          },
        })
      }
    }

    // ===== Check direct payment =====
    const approvedPayment = await db.payment.findFirst({
      where: {
        userId,
        contentType,
        contentId,
        status: 'approved',
        isActive: true,
      },
      select: {
        id: true,
        amount: true,
        contentType: true,
        contentId: true,
        createdAt: true,
      },
    })

    let hasAccess = !!approvedPayment

    // For bundles, also check individual items
    if (contentType === 'bundle' && !hasAccess) {
      const bundle = await db.contentBundle.findUnique({
        where: { id: contentId },
        include: { items: true },
      })
      if (bundle && bundle.items.length > 0) {
        const itemPayments = await db.payment.findMany({
          where: {
            userId,
            status: 'approved',
            isActive: true,
            OR: bundle.items.map(item => ({
              contentType: item.contentType,
              contentId: item.contentId,
            })),
          },
        })
        if (itemPayments.length === bundle.items.length) {
          hasAccess = true
        } else if (itemPayments.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              hasAccess: false,
              purchase: null,
              isPremium: false,
              partialAccess: true,
              purchasedItemCount: itemPayments.length,
              totalItemCount: bundle.items.length,
            },
          })
        }
      }
    }

    // For packages, check active subscription
    if (contentType === 'package' && !hasAccess) {
      const classLevel = searchParams.get('classLevel')
      if (classLevel) {
        const activeSub = await db.userSubscription.findFirst({
          where: {
            userId,
            packageId: contentId,
            classLevel,
            isActive: true,
            endDate: { gte: new Date() },
          },
        })
        if (activeSub) {
          hasAccess = true
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasAccess,
        purchase: approvedPayment
          ? {
              id: approvedPayment.id,
              contentType: approvedPayment.contentType,
              contentId: approvedPayment.contentId,
              amount: approvedPayment.amount,
              createdAt: approvedPayment.createdAt,
            }
          : null,
        isPremium: false,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Check access error')
  }
}
