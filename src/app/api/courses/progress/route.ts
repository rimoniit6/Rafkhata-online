import { db } from '@/lib/db'
import { apiResponse, apiError, withAuth } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { resolveCourseAccess } from '@/lib/course-access-resolver'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    if (!courseId) return apiError('courseId required', 400)

    const userId = auth.user.id

    const [
      lessons,
      lessonRecords,
      submissionCount,
      lessonExams,
      examSchedules,
    ] = await Promise.all([
      db.courseLesson.findMany({
        where: { courseId },
        select: {
          id: true,
          lessonType: true,
          _count: { select: { assignments: true } },
        },
        orderBy: { displayOrder: 'asc' },
      }),
      db.lessonProgress.findMany({
        where: { userId, courseId },
        select: { lessonId: true, completed: true },
      }),
      db.assignmentSubmission.count({
        where: {
          userId,
          assignment: { lesson: { courseId } },
        },
      }),
      db.lessonExam.findMany({
        where: { lesson: { courseId } },
        select: { packageId: true, examType: true },
      }),
      db.courseExamSchedule.findMany({
        where: { courseId },
        select: { packageId: true, examType: true },
      }),
    ])

    const lessonProgressMap = new Map(lessonRecords.map(r => [r.lessonId, r.completed]))
    const lessonProgress: Record<string, boolean> = {}
    for (const r of lessonRecords) {
      lessonProgress[r.lessonId] = r.completed
    }

    // Per-type lesson breakdown
    let completedLessons = 0
    let completedLive = 0
    let completedRecorded = 0
    let totalLive = 0
    let totalRecorded = 0
    let totalAssignmentCount = 0

    for (const l of lessons) {
      const isComplete = lessonProgressMap.get(l.id) ?? false
      if (l.lessonType === 'LIVE') {
        totalLive++
        if (isComplete) completedLive++
      } else {
        totalRecorded++
        if (isComplete) completedRecorded++
      }
      if (isComplete) completedLessons++
      totalAssignmentCount += l._count.assignments
    }

    // Exam package IDs linked to this course
    const mcqPackageIds = [...new Set([
      ...lessonExams.filter(e => e.examType === 'MCQ').map(e => e.packageId),
      ...examSchedules.filter(e => e.examType === 'MCQ').map(e => e.packageId),
    ])]
    const cqPackageIds = [...new Set([
      ...lessonExams.filter(e => e.examType === 'CQ').map(e => e.packageId),
      ...examSchedules.filter(e => e.examType === 'CQ').map(e => e.packageId),
    ])]

    // Fetch exam sets + completion counts in parallel
    const [mcqSets, cqSets, completedMcqResults, completedCqSubmissions] = await Promise.all([
      mcqPackageIds.length
        ? db.mCQExamSet.findMany({ where: { packageId: { in: mcqPackageIds } }, select: { id: true } })
        : [],
      cqPackageIds.length
        ? db.cQExamSet.findMany({ where: { packageId: { in: cqPackageIds } }, select: { id: true } })
        : [],
      mcqPackageIds.length
        ? db.mCQExamSetResult.count({
            where: {
              userId,
              set: { packageId: { in: mcqPackageIds } },
              status: 'COMPLETED' as const,
            },
          })
        : 0,
      cqPackageIds.length
        ? db.cQExamSubmission.count({
            where: {
              userId,
              set: { packageId: { in: cqPackageIds } },
              status: { in: ['SUBMITTED', 'GRADED', 'PUBLISHED'] },
            },
          })
        : 0,
    ])

    const totalMcqExams = mcqSets.length
    const totalCqExams = cqSets.length

    const breakdown = {
      lessons: { total: lessons.length, completed: completedLessons },
      liveClasses: { total: totalLive, completed: completedLive },
      recordedClasses: { total: totalRecorded, completed: completedRecorded },
      assignments: { total: totalAssignmentCount, completed: submissionCount },
      mcqExams: { total: totalMcqExams, completed: completedMcqResults },
      cqExams: { total: totalCqExams, completed: completedCqSubmissions },
    }

    const totalActivities = lessons.length + totalAssignmentCount + totalMcqExams + totalCqExams
    const completedActivities = completedLessons + submissionCount + completedMcqResults + completedCqSubmissions
    const percent = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0

    return apiResponse({
      lessonProgress,
      overall: { total: totalActivities, completed: completedActivities, percent },
      breakdown,
    })
  } catch (error) {
    return handleApiError(error, 'Course Progress GET')
  }
}

export async function POST(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { courseId, contentId, lessonId, completed } = body
    const lid = lessonId || contentId

    if (!courseId || !lid) return apiError('courseId and lessonId required', 400)

    const access = await resolveCourseAccess(auth.user.id, courseId)
    if (!access.hasAccess) return apiError('Access denied', 403)

    const record = await db.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: auth.user.id, lessonId: lid },
      },
      update: {
        completed: completed ?? true,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId: auth.user.id,
        courseId,
        lessonId: lid,
        completed: completed ?? true,
        completedAt: completed ? new Date() : null,
      },
    })

    return apiResponse({ record })
  } catch (error) {
    return handleApiError(error, 'Course Progress POST')
  }
}
