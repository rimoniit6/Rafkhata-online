import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiLimiter, getClientIdentifier, rateLimitHeaders } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
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

    if (!contentType || !contentId) {
      return NextResponse.json(
        { success: false, error: 'contentType এবং contentId আবশ্যক' },
        { status: 400 }
      )
    }

    // Try to get userId from session first, fall back to query param
    const auth = await verifyAuth(request)
    const userId = auth?.user.id || searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: true, data: { purchased: false } })
    }

    // NOTE: isPremium flag NO LONGER grants blanket "purchased" status.
    // Access is only granted through: direct payment, bundle purchase, or active subscription.
    // The isPremium flag is kept for UI display purposes only.
    // Admin/super_admin users have access through their role, not through purchase status.

    // ===== Check active subscription (package) for this content's class =====
    // If the content has a classLevel, check if the user has an active subscription
    // that covers that class
    let contentClassLevel: string | null = null

    if (['mcq', 'cq', 'board-mcq', 'board-cq'].includes(contentType)) {
      // Get the classLevel of this content
      if (contentType === 'mcq' || contentType === 'board-mcq') {
        const mcq = await db.mCQ.findUnique({ where: { id: contentId }, select: { classLevel: true } })
        contentClassLevel = mcq?.classLevel || null
      } else {
        const cq = await db.cQ.findUnique({ where: { id: contentId }, select: { classLevel: true } })
        contentClassLevel = cq?.classLevel || null
      }
    } else if (contentType === 'lecture') {
      // Lecture → chapter → subject → class
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
    }

    // If we have a contentClassLevel, check for active subscriptions
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
            purchased: true,
            reason: 'active_subscription',
            subscription: {
              id: activeSubscription.id,
              packageName: activeSubscription.package.title,
              durationLabel: activeSubscription.package.durationLabel,
              endDate: activeSubscription.endDate,
            },
            pendingPayment: false,
          },
        })
      }
    }

    // ===== Check for direct payment for this content =====
    // Cross-type: mcq ↔ board-mcq, cq ↔ board-cq — same content, different context
    const contentTypesToCheck = [contentType]
    if (contentType === 'board-mcq') contentTypesToCheck.push('mcq')
    if (contentType === 'mcq') contentTypesToCheck.push('board-mcq')
    if (contentType === 'board-cq') contentTypesToCheck.push('cq')
    if (contentType === 'cq') contentTypesToCheck.push('board-cq')

    const approvedPayment = await db.payment.findFirst({
      where: {
        userId,
        contentType: { in: contentTypesToCheck },
        contentId,
        status: 'approved',
        isActive: true,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    const pendingPayment = await db.payment.findFirst({
      where: {
        userId,
        contentType: { in: contentTypesToCheck },
        contentId,
        status: 'pending',
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    // ===== Check if a BUNDLE containing this content has been purchased =====
    // If user bought a bundle, they should have access to all items inside it
    if (['mcq', 'cq', 'board-mcq', 'board-cq', 'lecture', 'suggestion', 'exam'].includes(contentType) && !approvedPayment) {
      // Find which bundles contain this content (with cross-type matching)
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
        // Check if user has an approved payment for any of those bundles
        const approvedBundlePayment = await db.payment.findFirst({
          where: {
            userId,
            contentType: 'bundle',
            contentId: { in: bundleIds },
            status: 'approved',
            isActive: true,
          },
          select: {
            id: true,
            contentId: true,
            contentTitle: true,
          },
        })

        if (approvedBundlePayment) {
          return NextResponse.json({
            success: true,
            data: {
              purchased: true,
              reason: 'bundle_purchase',
              bundleTitle: approvedBundlePayment.contentTitle,
              pendingPayment: false,
            },
          })
        }

        // Also check for pending bundle payment
        const pendingBundlePayment = await db.payment.findFirst({
          where: {
            userId,
            contentType: 'bundle',
            contentId: { in: bundleIds },
            status: 'pending',
          },
          select: { id: true },
        })

        if (pendingBundlePayment && !pendingPayment) {
          return NextResponse.json({
            success: true,
            data: {
              purchased: false,
              reason: null,
              pendingPayment: true,
              pendingReason: 'bundle_payment_pending',
            },
          })
        }
      }
    }

    // For bundles, also check if individual items are purchased
    if (contentType === 'bundle') {
      const bundle = await db.contentBundle.findUnique({
        where: { id: contentId },
        include: { items: true },
      })
      if (bundle && bundle.items.length > 0) {
        const itemChecks = await Promise.all(
          bundle.items.map(async (bundleItem) => {
            const itemApproved = await db.payment.findFirst({
              where: {
                userId,
                contentType: bundleItem.contentType,
                contentId: bundleItem.contentId,
                status: 'approved',
                isActive: true,
              },
            })
            return !!itemApproved
          })
        )
        const allItemsPurchased = itemChecks.every(Boolean)
        if (allItemsPurchased && !approvedPayment) {
          return NextResponse.json({
            success: true,
            data: {
              purchased: true,
              reason: 'all_bundle_items_purchased',
              pendingPayment: !!pendingPayment,
            },
          })
        }
      }
    }

    // For packages, check if user has an active subscription for this package + classLevel
    if (contentType === 'package') {
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
          return NextResponse.json({
            success: true,
            data: { purchased: true, reason: 'active_subscription', pendingPayment: !!pendingPayment },
          })
        }
      }
    }

    // For MCQ exam packages, check MCQExamPackagePurchase table
    if (contentType === 'mcq-exam-package') {
      const examPkgPurchase = await db.mCQExamPackagePurchase.findFirst({
        where: {
          userId,
          packageId: contentId,
          isActive: true,
        },
      })
      if (examPkgPurchase) {
        return NextResponse.json({
          success: true,
          data: { purchased: true, reason: 'exam_package_purchase', pendingPayment: !!pendingPayment },
        })
      }
    }

    // For CQ exam packages, check CQExamPackagePurchase table
    if (contentType === 'cq-exam-package') {
      const examPkgPurchase = await db.cQExamPackagePurchase.findFirst({
        where: {
          userId,
          packageId: contentId,
          isActive: true,
        },
      })
      if (examPkgPurchase) {
        return NextResponse.json({
          success: true,
          data: { purchased: true, reason: 'exam_package_purchase', pendingPayment: !!pendingPayment },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        purchased: !!approvedPayment,
        reason: approvedPayment ? 'content_payment' : null,
        pendingPayment: !!pendingPayment,
      },
    })
  } catch (error) {
    console.error('Payment check error:', error)
    return NextResponse.json(
      { success: false, error: 'পেমেন্ট যাচাই করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
