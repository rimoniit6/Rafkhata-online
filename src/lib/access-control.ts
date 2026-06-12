import { db } from '@/lib/db'

export type ContentType = 'mcq' | 'cq' | 'board-mcq' | 'board-cq' | 'lecture' | 'exam' | 'suggestion' | 'bundle' | 'package' | 'mcq-exam-package' | 'cq-exam-package'

export interface AccessCheckParams {
  userId: string
  contentType: ContentType
  contentId: string
  classLevel?: string
}

export interface AccessCheckResult {
  hasAccess: boolean
  reason: 'content_payment' | 'active_subscription' | 'bundle_purchase' | 'all_bundle_items_purchased' | 'exam_package_purchase' | null
  pendingPayment: boolean
  pendingReason?: string
  subscription?: {
    id: string
    packageName: string
    durationLabel: string
    endDate: Date
  }
  bundleTitle?: string
}

export function getRelatedContentTypes(contentType: ContentType): ContentType[] {
  const types = [contentType]
  if (contentType === 'board-mcq') types.push('mcq')
  if (contentType === 'mcq') types.push('board-mcq')
  if (contentType === 'board-cq') types.push('cq')
  if (contentType === 'cq') types.push('board-cq')
  return types
}

export async function resolveContentClassLevel(
  contentType: ContentType,
  contentId: string
): Promise<string | null> {
  if (['mcq', 'board-mcq'].includes(contentType)) {
    const mcq = await db.mCQ.findUnique({
      where: { id: contentId },
      select: { classLevel: true },
    })
    return mcq?.classLevel || null
  }

  if (['cq', 'board-cq'].includes(contentType)) {
    const cq = await db.cQ.findUnique({
      where: { id: contentId },
      select: { classLevel: true },
    })
    return cq?.classLevel || null
  }

  if (contentType === 'lecture') {
    const lecture = await db.lecture.findUnique({
      where: { id: contentId },
      select: {
        chapter: {
          select: { subject: { select: { classId: true } } },
        },
      },
    })
    if (!lecture) return null
    const classCat = await db.classCategory.findUnique({
      where: { id: lecture.chapter.subject.classId },
      select: { slug: true },
    })
    return classCat?.slug || null
  }

  if (contentType === 'exam') {
    const exam = await db.exam.findUnique({
      where: { id: contentId },
      select: { classLevel: true },
    })
    return exam?.classLevel || null
  }

  if (contentType === 'suggestion') {
    const suggestion = await db.suggestion.findUnique({
      where: { id: contentId },
      select: { classId: true },
    })
    if (!suggestion?.classId) return null
    const classCat = await db.classCategory.findUnique({
      where: { id: suggestion.classId },
      select: { slug: true },
    })
    return classCat?.slug || null
  }

  return null
}

export async function resolveContentTitle(
  contentType: ContentType,
  contentId: string
): Promise<string | null> {
  if (['mcq', 'board-mcq'].includes(contentType)) {
    const item = await db.mCQ.findUnique({ where: { id: contentId }, select: { question: true } })
    return item?.question || null
  }
  if (['cq', 'board-cq'].includes(contentType)) {
    const item = await db.cQ.findUnique({ where: { id: contentId }, select: { uddeepok: true } })
    return item?.uddeepok || null
  }
  if (contentType === 'lecture') {
    const item = await db.lecture.findUnique({ where: { id: contentId }, select: { title: true } })
    return item?.title || null
  }
  if (contentType === 'exam') {
    const item = await db.exam.findUnique({ where: { id: contentId }, select: { title: true } })
    return item?.title || null
  }
  if (contentType === 'suggestion') {
    const item = await db.suggestion.findUnique({ where: { id: contentId }, select: { title: true } })
    return item?.title || null
  }
  if (contentType === 'bundle') {
    const bundle = await db.contentBundle.findUnique({ where: { id: contentId }, select: { title: true } })
    return bundle?.title || null
  }
  return null
}

export async function checkContentAccess(params: AccessCheckParams): Promise<AccessCheckResult> {
  const { userId, contentType, contentId, classLevel: explicitClassLevel } = params

  const result: AccessCheckResult = {
    hasAccess: false,
    reason: null,
    pendingPayment: false,
  }

  // 1. Check active subscription for this content's class level
  const contentClassLevel = explicitClassLevel || await resolveContentClassLevel(contentType, contentId)

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
      result.hasAccess = true
      result.reason = 'active_subscription'
      result.subscription = {
        id: activeSubscription.id,
        packageName: activeSubscription.package.title,
        durationLabel: activeSubscription.package.durationLabel,
        endDate: activeSubscription.endDate,
      }
      return result
    }
  }

  // 2. Check direct payment (with cross-type matching)
  const contentTypesToCheck = getRelatedContentTypes(contentType)

  const approvedPayment = await db.payment.findFirst({
    where: {
      userId,
      contentType: { in: contentTypesToCheck },
      contentId,
      status: 'approved',
      isActive: true,
    },
    select: { id: true, createdAt: true },
  })

  const pendingPayment = await db.payment.findFirst({
    where: {
      userId,
      contentType: { in: contentTypesToCheck },
      contentId,
      status: 'pending',
    },
    select: { id: true, createdAt: true },
  })

  result.pendingPayment = !!pendingPayment

  if (approvedPayment) {
    result.hasAccess = true
    result.reason = 'content_payment'
    return result
  }

  // 3. Check bundle purchase
  if (['mcq', 'cq', 'board-mcq', 'board-cq', 'lecture', 'suggestion', 'exam'].includes(contentType)) {
    const bundleResult = await checkBundleAccess(userId, contentType, contentId)
    if (bundleResult.hasAccess) {
      return bundleResult
    }
    if (bundleResult.pendingPayment && !result.pendingPayment) {
      result.pendingPayment = true
      result.pendingReason = 'bundle_payment_pending'
    }
  }

  // 4. For bundles, check if all individual items are purchased
  if (contentType === 'bundle') {
    const bundleItemsResult = await checkBundleItemsAccess(userId, contentId, pendingPayment)
    if (bundleItemsResult.hasAccess) {
      return bundleItemsResult
    }
  }

  // 5. For packages, check active subscription
  if (contentType === 'package') {
    const classLevel = explicitClassLevel
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
        result.hasAccess = true
        result.reason = 'active_subscription'
        return result
      }
    }
  }

  // 6. For MCQ exam packages, check dedicated purchase table
  if (contentType === 'mcq-exam-package') {
    const examPkgPurchase = await db.mCQExamPackagePurchase.findFirst({
      where: { userId, packageId: contentId, isActive: true },
    })
    if (examPkgPurchase) {
      result.hasAccess = true
      result.reason = 'exam_package_purchase'
      return result
    }
  }

  // 7. For CQ exam packages, check dedicated purchase table
  if (contentType === 'cq-exam-package') {
    const examPkgPurchase = await db.cQExamPackagePurchase.findFirst({
      where: { userId, packageId: contentId, isActive: true },
    })
    if (examPkgPurchase) {
      result.hasAccess = true
      result.reason = 'exam_package_purchase'
      return result
    }
  }

  return result
}

async function checkBundleAccess(
  userId: string,
  contentType: ContentType,
  contentId: string
): Promise<AccessCheckResult> {
  const result: AccessCheckResult = { hasAccess: false, reason: null, pendingPayment: false }

  const itemContentTypes = getRelatedContentTypes(contentType)
  const bundleItems = await db.bundleItem.findMany({
    where: { contentType: { in: itemContentTypes }, contentId },
    select: { bundleId: true },
  })

  const bundleIds = [...new Set(bundleItems.map(bi => bi.bundleId))]
  if (bundleIds.length === 0) return result

  const approvedBundlePayment = await db.payment.findFirst({
    where: {
      userId,
      contentType: 'bundle',
      contentId: { in: bundleIds },
      status: 'approved',
      isActive: true,
    },
    select: { id: true, contentId: true, contentTitle: true },
  })

  if (approvedBundlePayment) {
    result.hasAccess = true
    result.reason = 'bundle_purchase'
    result.bundleTitle = approvedBundlePayment.contentTitle || undefined
    return result
  }

  const pendingBundlePayment = await db.payment.findFirst({
    where: {
      userId,
      contentType: 'bundle',
      contentId: { in: bundleIds },
      status: 'pending',
    },
    select: { id: true },
  })

  if (pendingBundlePayment) {
    result.pendingPayment = true
    result.pendingReason = 'bundle_payment_pending'
  }

  return result
}

async function checkBundleItemsAccess(
  userId: string,
  bundleId: string,
  existingPending: { id: string } | null
): Promise<AccessCheckResult> {
  const result: AccessCheckResult = { hasAccess: false, reason: null, pendingPayment: !!existingPending }

  const bundle = await db.contentBundle.findUnique({
    where: { id: bundleId },
    include: { items: true },
  })

  if (!bundle || bundle.items.length === 0) return result

  // Batch query all payments for this user's bundle items in a single query
  const contentIds = bundle.items.map(item => item.contentId)
  const contentTypes = [...new Set(bundle.items.map(item => item.contentType))]

  const approvedPayments = await db.payment.findMany({
    where: {
      userId,
      contentType: { in: contentTypes },
      contentId: { in: contentIds },
      status: 'approved',
      isActive: true,
    },
    select: { contentType: true, contentId: true },
  })

  const paidKeys = new Set(approvedPayments.map(p => `${p.contentType}:${p.contentId}`))

  const allPurchased = bundle.items.every(item =>
    paidKeys.has(`${item.contentType}:${item.contentId}`)
  )

  if (allPurchased) {
    result.hasAccess = true
    result.reason = 'all_bundle_items_purchased'
  }

  return result
}

export interface BatchAccessCheckParams {
  userId: string
  items: Array<{ contentType: ContentType; contentId: string }>
}

export async function batchCheckContentAccess(
  params: BatchAccessCheckParams
): Promise<Map<string, AccessCheckResult>> {
  const { userId, items } = params
  const results = new Map<string, AccessCheckResult>()

  if (items.length === 0) return results

  const contentIds = items.map(i => i.contentId)
  const contentTypes = [...new Set(items.map(i => i.contentType))]

  const contentIdsSet = new Set(contentIds)

  const allPayments = await db.payment.findMany({
    where: {
      userId,
      contentId: { in: contentIds },
      status: { in: ['approved', 'pending'] },
    },
    select: { contentType: true, contentId: true, status: true, isActive: true },
  })

  const approvedSet = new Set<string>()
  const pendingSet = new Set<string>()
  for (const p of allPayments) {
    const key = `${p.contentType}:${p.contentId}`
    if (p.status === 'approved' && p.isActive) approvedSet.add(key)
    else if (p.status === 'pending') pendingSet.add(key)
  }

  const classLevels = await db.userSubscription.findMany({
    where: {
      userId,
      isActive: true,
      endDate: { gte: new Date() },
    },
    include: {
      package: { select: { title: true, durationLabel: true } },
    },
  })

  const subscriptionClassLevels = new Set(classLevels.map(s => s.classLevel))

  const bundleIds = await db.bundleItem.findMany({
    where: { contentId: { in: contentIds } },
    select: { bundleId: true, contentId: true, contentType: true },
  })

  const bundleIdsSet = new Set(bundleIds.map(b => b.bundleId))
  let approvedBundles: Array<{ contentId: string; contentTitle: string | null }> = []
  if (bundleIdsSet.size > 0) {
    const rows = await db.payment.findMany({
      where: {
        userId,
        contentType: 'bundle',
        contentId: { in: [...bundleIdsSet] },
        status: 'approved',
        isActive: true,
      },
      select: { contentId: true, contentTitle: true },
    })
    approvedBundles = rows.map(r => ({
      contentId: r.contentId ?? '',
      contentTitle: r.contentTitle,
    }))
  }

  const approvedBundleIdSet = new Set(approvedBundles.map(b => b.contentId))
  const approvedBundleMap = new Map(approvedBundles.map(b => [b.contentId, b.contentTitle]))

  const contentToBundles = new Map<string, string[]>()
  for (const bi of bundleIds) {
    const existing = contentToBundles.get(bi.contentId) || []
    existing.push(bi.bundleId)
    contentToBundles.set(bi.contentId, existing)
  }

  // ── Batch-resolve class levels (fixes N+1) ──
  // Instead of calling resolveContentClassLevel() per item (N queries),
  // query all content class levels in a single batch per type
  const classLevelCache = new Map<string, string | null>()
  const mcqIds = items.filter(i => i.contentType === 'mcq' || i.contentType === 'board-mcq').map(i => i.contentId)
  const cqIds = items.filter(i => i.contentType === 'cq' || i.contentType === 'board-cq').map(i => i.contentId)
  const lectureIds = items.filter(i => i.contentType === 'lecture').map(i => i.contentId)
  const examIds = items.filter(i => i.contentType === 'exam').map(i => i.contentId)
  const suggestionIds = items.filter(i => i.contentType === 'suggestion').map(i => i.contentId)

  if (mcqIds.length > 0) {
    const mcqs = await db.mCQ.findMany({ where: { id: { in: mcqIds } }, select: { id: true, classLevel: true } })
    for (const m of mcqs) classLevelCache.set(`mcq:${m.id}`, m.classLevel)
  }
  if (cqIds.length > 0) {
    const cqs = await db.cQ.findMany({ where: { id: { in: cqIds } }, select: { id: true, classLevel: true } })
    for (const c of cqs) classLevelCache.set(`cq:${c.id}`, c.classLevel)
  }
  if (lectureIds.length > 0) {
    const lectures = await db.lecture.findMany({
      where: { id: { in: lectureIds } },
      select: { id: true, chapter: { select: { subject: { select: { classId: true } } } } },
    })
    const classIds = [...new Set(lectures.map(l => l.chapter.subject.classId).filter((id): id is string => !!id))]
    if (classIds.length > 0) {
      const classCats = await db.classCategory.findMany({ where: { id: { in: classIds } }, select: { id: true, slug: true } })
      const classSlugMap = new Map(classCats.map(c => [c.id, c.slug]))
      for (const l of lectures) {
        classLevelCache.set(`lecture:${l.id}`, classSlugMap.get(l.chapter.subject.classId) || null)
      }
    }
  }
  if (examIds.length > 0) {
    const exams = await db.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, classLevel: true } })
    for (const e of exams) classLevelCache.set(`exam:${e.id}`, e.classLevel)
  }
  if (suggestionIds.length > 0) {
    const suggestions = await db.suggestion.findMany({ where: { id: { in: suggestionIds } }, select: { id: true, classId: true } })
    const classIds = [...new Set(suggestions.map(s => s.classId).filter((id): id is string => !!id))]
    if (classIds.length > 0) {
      const classCats = await db.classCategory.findMany({ where: { id: { in: classIds } }, select: { id: true, slug: true } })
      const classSlugMap = new Map(classCats.map(c => [c.id, c.slug]))
      for (const s of suggestions) {
        classLevelCache.set(`suggestion:${s.id}`, s.classId ? classSlugMap.get(s.classId) || null : null)
      }
    }
  }

  for (const item of items) {
    const { contentType, contentId } = item
    const directKey = `${contentType}:${contentId}`

    const itemClassLevel = classLevelCache.get(`${contentType}:${contentId}`) ?? await resolveContentClassLevel(contentType, contentId)

    // Check subscription
    if (itemClassLevel && subscriptionClassLevels.has(itemClassLevel)) {
      const sub = classLevels.find(s => s.classLevel === itemClassLevel)
      results.set(contentId, {
        hasAccess: true,
        reason: 'active_subscription',
        pendingPayment: pendingSet.has(directKey),
        subscription: sub ? {
          id: sub.id,
          packageName: sub.package.title,
          durationLabel: sub.package.durationLabel,
          endDate: new Date(),
        } : undefined,
      })
      continue
    }

    // Check direct payment
    const relatedTypes = getRelatedContentTypes(contentType)
    let hasApprovedPayment = false
    let hasPendingPayment = false
    for (const rt of relatedTypes) {
      const key = `${rt}:${contentId}`
      if (approvedSet.has(key)) hasApprovedPayment = true
      if (pendingSet.has(key)) hasPendingPayment = true
    }

    if (hasApprovedPayment) {
      results.set(contentId, {
        hasAccess: true,
        reason: 'content_payment',
        pendingPayment: hasPendingPayment,
      })
      continue
    }

    // Check bundle
    const itemBundles = contentToBundles.get(contentId) || []
    let bundleAccess = false
    let bundleTitle: string | undefined
    for (const bid of itemBundles) {
      if (approvedBundleIdSet.has(bid)) {
        bundleAccess = true
        bundleTitle = approvedBundleMap.get(bid) || undefined
        break
      }
    }

    if (bundleAccess) {
      results.set(contentId, {
        hasAccess: true,
        reason: 'bundle_purchase',
        pendingPayment: hasPendingPayment,
        bundleTitle,
      })
      continue
    }

    results.set(contentId, {
      hasAccess: false,
      reason: null,
      pendingPayment: hasPendingPayment,
    })
  }

  return results
}
