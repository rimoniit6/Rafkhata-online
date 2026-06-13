import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'
import { apiError, withCsrf } from '@/lib/api-utils'

const batchCheckSchema = z.object({
  items: z.array(z.object({
    contentType: z.string(),
    contentId: z.string(),
  })).max(50, 'সর্বোচ্চ ৫০টি আইটেম চেক করা যাবে'),
})

export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) {
      // For non-logged-in users: return all items as unpurchased (same as logged-in free user)
      // This ensures the client follows the same happy path for both groups
      const body = await request.json()
      const validation = batchCheckSchema.safeParse(body)
      if (!validation.success) {
        return apiError('অবৈধ অনুরোধ', 400, 'VALIDATION_ERROR')
      }
      const { items } = validation.data
      const results = items.map(item => ({
        contentType: item.contentType,
        contentId: item.contentId,
        purchased: false,
        pendingPayment: false,
      }))
      return NextResponse.json({
        success: true,
        data: { items: results },
      })
    }

    const body = await request.json()
    const validation = batchCheckSchema.safeParse(body)
    if (!validation.success) {
      return apiError('অবৈধ অনুরোধ', 400, 'VALIDATION_ERROR')
    }

    const { items } = validation.data
    const userId = auth.user.id

    // NOTE: isPremium flag NO LONGER grants blanket "purchased" status.
    // Access is only granted through: direct payment, bundle purchase, or active subscription.
    // The isPremium flag is kept for UI display purposes only.

    // ===== Step 1: Batch fetch direct payments =====
    // Cross-type: mcq ↔ board-mcq, cq ↔ board-cq — same content, different context
    const orConditions = items.flatMap(item => {
      const conditions: Array<{ contentType: string; contentId: string }> = [
        { contentType: item.contentType, contentId: item.contentId },
      ]
      if (item.contentType === 'mcq') conditions.push({ contentType: 'board-mcq', contentId: item.contentId })
      if (item.contentType === 'board-mcq') conditions.push({ contentType: 'mcq', contentId: item.contentId })
      if (item.contentType === 'cq') conditions.push({ contentType: 'board-cq', contentId: item.contentId })
      if (item.contentType === 'board-cq') conditions.push({ contentType: 'cq', contentId: item.contentId })
      return conditions
    })

    const approvedPayments = await db.payment.findMany({
      where: {
        userId,
        status: 'approved',
        isActive: true, // FIX: was missing — deactivated purchases should not show as purchased
        OR: orConditions,
      },
      select: {
        contentType: true,
        contentId: true,
        id: true,
      },
    })

    // Also check pending payments
    const pendingPayments = await db.payment.findMany({
      where: {
        userId,
        status: 'pending',
        OR: orConditions,
      },
      select: {
        contentType: true,
        contentId: true,
        id: true,
      },
    })

    // Build a set of purchased contentIds for O(1) lookup
    // Use contentId-based lookup since cross-type payments (mcq ↔ board-mcq) share the same contentId
    const purchasedContentIds = new Set(approvedPayments.map(p => p.contentId))
    const pendingContentIds = new Set(pendingPayments.map(p => p.contentId))

    // ===== Step 2: Check active subscriptions (package) =====
    // Find items not yet purchased directly, and check if user has active subscription for their class
    const unpurchasedItems = items.filter(item => !purchasedContentIds.has(item.contentId))

    // Track subscription-purchased content IDs
    const subscriptionPurchasedIds = new Set<string>()

    if (unpurchasedItems.length > 0) {
      // Get all active subscriptions for this user
      const activeSubscriptions = await db.userSubscription.findMany({
        where: {
          userId,
          isActive: true,
          endDate: { gte: new Date() },
        },
        select: {
          classLevel: true,
          package: { select: { title: true } },
        },
      })

      if (activeSubscriptions.length > 0) {
        const subClassLevels = new Set(activeSubscriptions.map(s => s.classLevel))

        // For MCQ/CQ items, check their classLevel
        const mcqItems = unpurchasedItems.filter(i => ['mcq', 'board-mcq'].includes(i.contentType))
        const cqItems = unpurchasedItems.filter(i => ['cq', 'board-cq'].includes(i.contentType))
        const lectureItems = unpurchasedItems.filter(i => i.contentType === 'lecture')
        const examItems = unpurchasedItems.filter(i => i.contentType === 'exam')
        const suggestionItems = unpurchasedItems.filter(i => i.contentType === 'suggestion')

        if (mcqItems.length > 0) {
          const mcqIds = mcqItems.map(i => i.contentId)
          const mcqs = await db.mCQ.findMany({
            where: { id: { in: mcqIds } },
            select: { id: true, classLevel: true },
          })
          for (const mcq of mcqs) {
            if (subClassLevels.has(mcq.classLevel)) {
              subscriptionPurchasedIds.add(mcq.id)
            }
          }
        }

        if (cqItems.length > 0) {
          const cqIds = cqItems.map(i => i.contentId)
          const cqs = await db.cQ.findMany({
            where: { id: { in: cqIds } },
            select: { id: true, classLevel: true },
          })
          for (const cq of cqs) {
            if (subClassLevels.has(cq.classLevel)) {
              subscriptionPurchasedIds.add(cq.id)
            }
          }
        }

        if (lectureItems.length > 0) {
          const lectureIds = lectureItems.map(i => i.contentId)
          const lectures = await db.lecture.findMany({
            where: { id: { in: lectureIds } },
            select: {
              id: true,
              chapter: {
                select: { subject: { select: { classId: true } } },
              },
            },
          })
          if (lectures.length > 0) {
            const classIds = [...new Set(lectures.map(l => l.chapter.subject.classId))]
            const classCats = await db.classCategory.findMany({
              where: { id: { in: classIds } },
              select: { id: true, slug: true },
            })
            const classSlugMap = new Map(classCats.map(c => [c.id, c.slug]))
            for (const lecture of lectures) {
              const slug = classSlugMap.get(lecture.chapter.subject.classId)
              if (slug && subClassLevels.has(slug)) {
                subscriptionPurchasedIds.add(lecture.id)
              }
            }
          }
        }

        if (examItems.length > 0) {
          const examIds = examItems.map(i => i.contentId)
          const exams = await db.exam.findMany({
            where: { id: { in: examIds } },
            select: { id: true, classLevel: true },
          })
          for (const exam of exams) {
            if (subClassLevels.has(exam.classLevel)) {
              subscriptionPurchasedIds.add(exam.id)
            }
          }
        }

        if (suggestionItems.length > 0) {
          const suggestionIds = suggestionItems.map(i => i.contentId)
          const suggestions = await db.suggestion.findMany({
            where: { id: { in: suggestionIds } },
            select: { id: true, classId: true },
          })
          if (suggestions.length > 0) {
            const classIds: string[] = [...new Set(
              suggestions
                .map(s => s.classId)
                .filter((id): id is string => id !== null)
            )]
            const classCats = await db.classCategory.findMany({
              where: { id: { in: classIds } },
              select: { id: true, slug: true },
            })
            const classSlugMap = new Map(classCats.map(c => [c.id, c.slug]))
            for (const suggestion of suggestions) {
              if (suggestion.classId) {
                const slug = classSlugMap.get(suggestion.classId)
                if (slug && subClassLevels.has(slug)) {
                  subscriptionPurchasedIds.add(suggestion.id)
                }
              }
            }
          }
        }
      }
    }

    // ===== Step 3: Check bundle purchases =====
    // For items still not purchased, check if a bundle containing them was purchased
    const stillUnpurchasedItems = unpurchasedItems.filter(
      item => !subscriptionPurchasedIds.has(item.contentId)
    )

    // Track bundle-purchased content IDs
    const bundlePurchasedIds = new Set<string>()
    const bundlePendingIds = new Set<string>()

    if (stillUnpurchasedItems.length > 0) {
      // Find which bundles contain these items (with cross-type matching)
      const bundleItemConditions = stillUnpurchasedItems.flatMap(item => {
        const contentTypes = [item.contentType]
        if (item.contentType === 'mcq') contentTypes.push('board-mcq')
        if (item.contentType === 'board-mcq') contentTypes.push('mcq')
        if (item.contentType === 'cq') contentTypes.push('board-cq')
        if (item.contentType === 'board-cq') contentTypes.push('cq')
        return contentTypes.map(ct => ({ contentType: ct, contentId: item.contentId }))
      })

      const relatedBundleItems = await db.bundleItem.findMany({
        where: {
          OR: bundleItemConditions,
        },
        select: {
          bundleId: true,
          contentType: true,
          contentId: true,
        },
      })

      if (relatedBundleItems.length > 0) {
        const bundleIds = [...new Set(relatedBundleItems.map(bi => bi.bundleId))]

        // Check approved bundle payments — FIX: add isActive: true filter
        const approvedBundlePayments = await db.payment.findMany({
          where: {
            userId,
            contentType: 'bundle',
            contentId: { in: bundleIds },
            status: 'approved',
            isActive: true,
          },
          select: {
            contentId: true,
          },
        })

        const purchasedBundleIds = new Set(approvedBundlePayments.map(p => p.contentId))

        // For each related bundle item, if its bundle is purchased, mark the content as purchased
        for (const bi of relatedBundleItems) {
          if (purchasedBundleIds.has(bi.bundleId)) {
            bundlePurchasedIds.add(bi.contentId)
          }
        }

        // Check pending bundle payments
        const pendingBundlePayments = await db.payment.findMany({
          where: {
            userId,
            contentType: 'bundle',
            contentId: { in: bundleIds },
            status: 'pending',
          },
          select: {
            contentId: true,
          },
        })

        const pendingBundleIds = new Set(pendingBundlePayments.map(p => p.contentId))

        for (const bi of relatedBundleItems) {
          if (pendingBundleIds.has(bi.bundleId)) {
            bundlePendingIds.add(bi.contentId)
          }
        }
      }
    }

    // ===== Step 4: Check MCQ & CQ exam package purchases =====
    const examPackagePurchasedIds = new Set<string>()

    const mcqExamPackageItems = items.filter(i => i.contentType === 'mcq-exam-package')
    if (mcqExamPackageItems.length > 0) {
      const examPackageIds = mcqExamPackageItems.map(i => i.contentId)
      const examPackagePurchases = await db.mCQExamPackagePurchase.findMany({
        where: {
          userId,
          packageId: { in: examPackageIds },
          isActive: true,
        },
        select: {
          packageId: true,
        },
      })
      for (const purchase of examPackagePurchases) {
        examPackagePurchasedIds.add(purchase.packageId)
      }
    }

    const cqExamPackageItems = items.filter(i => i.contentType === 'cq-exam-package')
    if (cqExamPackageItems.length > 0) {
      const examPackageIds = cqExamPackageItems.map(i => i.contentId)
      const examPackagePurchases = await db.cQExamPackagePurchase.findMany({
        where: {
          userId,
          packageId: { in: examPackageIds },
          isActive: true,
        },
        select: {
          packageId: true,
        },
      })
      for (const purchase of examPackagePurchases) {
        examPackagePurchasedIds.add(purchase.packageId)
      }
    }

    // ===== Build final response =====
    const results = items.map(item => ({
      contentType: item.contentType,
      contentId: item.contentId,
      purchased: purchasedContentIds.has(item.contentId) || subscriptionPurchasedIds.has(item.contentId) || bundlePurchasedIds.has(item.contentId) || examPackagePurchasedIds.has(item.contentId),
      pendingPayment: pendingContentIds.has(item.contentId) || bundlePendingIds.has(item.contentId),
    }))

    return NextResponse.json({
      success: true,
      data: {
        items: results,
      },
    })
  } catch (error) {
    console.error('Batch payment check error:', error)
    return apiError('পেমেন্ট যাচাই করতে সমস্যা হয়েছে', 500)
  }
}
