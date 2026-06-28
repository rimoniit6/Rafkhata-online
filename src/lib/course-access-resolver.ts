import { db } from './db'

// ====================================================================
// Types
// ====================================================================

export interface AccessResult {
  hasAccess: boolean
  source: 'free' | 'purchase' | 'enrollment' | null
}

export interface AccessMapEnrollment {
  id: string; status: string; type: string; enrolledAt: Date; completedAt: Date | null
}

export interface AccessMapPurchase {
  id: string; isActive: boolean; purchasedAt: Date
}

export interface CourseAccessMap {
  courseAccess: boolean
  source: string | null
  enrollment: AccessMapEnrollment | null
  purchase: AccessMapPurchase | null
  grantedContentIds: string[]
}

// ====================================================================
// Main resolver — single source of truth for ALL course access decisions
// ====================================================================

/**
 * Resolve whether a user has access to a course (and optionally a
 * specific content item within it).
 *
 * Priority order:
 *   1. Free course → ALLOW
 *   2. Active CoursePurchase → ALLOW
 *   3. Active CourseEnrollment → ALLOW
 *   4. Default → DENY
 *
 * This function is the ONLY place in the entire system where course
 * access rules are evaluated. All API routes and UI hooks must go
 * through this resolver.
 */
export async function resolveCourseAccess(
  userId: string,
  courseId: string,
): Promise<AccessResult> {
  // ── 1. Fetch course once ─────────────────────────────────────
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, isPremium: true, status: true },
  })
  if (!course || course.status !== 'published') {
    return { hasAccess: false, source: null }
  }

  // ── 2. Free course → check enrollment first ──────────────────
  if (!course.isPremium) {
    const freeEnrollment = await db.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    })
    if (freeEnrollment?.status === 'ACTIVE') {
      return { hasAccess: true, source: 'enrollment' }
    }
    // Authenticated users can self-enroll in free courses; allow access
    // so the UI can show the "enroll" button. The client checks hasAccess
    // to decide whether to lock content.
    return { hasAccess: false, source: null }
  }

  // ── 3. Active purchase → access granted ──────────────────────
  const purchase = await db.coursePurchase.findFirst({
    where: { userId, courseId, isActive: true },
    select: { id: true },
  })
  if (purchase) {
    return { hasAccess: true, source: 'purchase' }
  }

  // ── 4. Active enrollment → access granted ────────────────────
  const enrollment = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { status: true },
  })
  if (enrollment?.status === 'ACTIVE') {
    return { hasAccess: true, source: 'enrollment' }
  }

  // ── 5. Default deny ──────────────────────────────────────────
  return { hasAccess: false, source: null }
}

// ====================================================================
// Full access map — returns everything in one shot
// ====================================================================

/**
 * Return a complete access map for a user + course combination.
 * Minimises DB round-trips by fetching everything in parallel.
 */
export async function getUserCourseAccessMap(
  userId: string,
  courseId: string,
): Promise<CourseAccessMap> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, isPremium: true, status: true },
  })
  if (!course || course.status !== 'published') {
    return { courseAccess: false, source: null, enrollment: null, purchase: null, grantedContentIds: [] }
  }

  // Free course → require enrollment
  if (!course.isPremium) {
    const freeEnrollment = await db.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true, type: true, enrolledAt: true, completedAt: true },
    })
    if (freeEnrollment?.status === 'ACTIVE') {
      return { courseAccess: true, source: 'enrollment', enrollment: freeEnrollment, purchase: null, grantedContentIds: [] }
    }
    return { courseAccess: false, source: null, enrollment: null, purchase: null, grantedContentIds: [] }
  }

  // Fetch purchase, enrollment, and course-granted content in parallel
  const [purchase, enrollment] = await Promise.all([
    db.coursePurchase.findFirst({
      where: { userId, courseId, isActive: true },
      select: { id: true, isActive: true, purchasedAt: true },
    }),
    db.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true, type: true, enrolledAt: true, completedAt: true },
    }),
  ])

  const enrollmentActive = enrollment?.status === 'ACTIVE'
  const hasPurchase = !!purchase

  if (hasPurchase) {
    return {
      courseAccess: true, source: 'purchase',
      enrollment: enrollment ?? null,
      purchase,
      grantedContentIds: [],
    }
  }

  if (enrollmentActive) {
    return {
      courseAccess: true, source: 'enrollment',
      enrollment,
      purchase: null,
      grantedContentIds: [],
    }
  }

  return { courseAccess: false, source: null, enrollment: null, purchase: null, grantedContentIds: [] }
}

// ====================================================================
// Standalone helpers
// ====================================================================

/** Check if user has an ACTIVE enrollment for a course. */
export async function hasActiveEnrollment(userId: string, courseId: string): Promise<boolean> {
  const enrollment = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { status: true },
  })
  return enrollment?.status === 'ACTIVE'
}

/** Check if user has an active purchase for a course. */
export async function hasCoursePurchase(userId: string, courseId: string): Promise<boolean> {
  const purchase = await db.coursePurchase.findFirst({
    where: { userId, courseId, isActive: true },
    select: { id: true },
  })
  return !!purchase
}

export async function mapPaymentContentType(paymentType: string): Promise<string | null> {
  const mapping: Record<string, string> = {
    'mcq-exam-package': 'MCQ',
    'cq-exam-package': 'CQ',
  }
  return mapping[paymentType] || null
}

/**
 * Get all package IDs (MCQ/CQ) that the user can access via course purchase.
 * Looks through CourseExamSchedule for all purchased courses.
 */
export async function getCourseGrantedContentIds(
  userId: string,
  types: string[] = []
): Promise<Map<string, string>> {
  const result = new Map<string, string>()

  let examTypes = types.length > 0 ? types : ['MCQ', 'CQ']

  const purchases = await db.coursePurchase.findMany({
    where: { userId, isActive: true, course: { status: 'published' } },
    select: { courseId: true },
  })

  if (purchases.length === 0) return result

  const courseIds = purchases.map(p => p.courseId)

  const exams = await db.courseExamSchedule.findMany({
    where: {
      courseId: { in: courseIds },
      examType: { in: examTypes },
    },
    select: { packageId: true, examType: true },
  })

  for (const e of exams) {
    result.set(e.packageId, e.examType)
  }

  // Fallback: check LessonExam for backward compat with existing data
  if (result.size === 0) {
    const legacyExams = await db.lessonExam.findMany({
      where: {
        lesson: { courseId: { in: courseIds } },
        examType: { in: examTypes },
      },
      select: { packageId: true, examType: true },
    })
    for (const e of legacyExams) {
      result.set(e.packageId, e.examType)
    }
  }

  return result
}

export async function hasCourseGrantedAccess(
  userId: string,
  contentType: string,
  contentId: string
): Promise<boolean> {
  const mapped = await getCourseGrantedContentIds(userId, [contentType])
  return mapped.has(contentId)
}

export async function resolveCourseLayerAccess(
  userId: string,
  paymentContentType: string,
  contentId: string
): Promise<{ hasAccess: boolean; source: string | null }> {
  const courseContentType = await mapPaymentContentType(paymentContentType)
  if (!courseContentType) return { hasAccess: false, source: null }

  const hasAccess = await hasCourseGrantedAccess(userId, courseContentType, contentId)
  if (hasAccess) {
    return { hasAccess: true, source: 'course_purchase' }
  }

  return { hasAccess: false, source: null }
}
