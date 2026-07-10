import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { DropOffData } from '@/types/analytics'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0]
    const prevFrom = searchParams.get('prevFrom') || new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
    const prevTo = searchParams.get('prevTo') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

    const fromDate = new Date(from)
    const toDate = new Date(to + 'T23:59:59.999Z')

    const [
      allStudents,
      lectureUserIds,
      mcqUserIds,
      approvedUserIds,
      pendingRejectedIds,
      examUserIds,
      enrolledNotCompIds,
    ] = await Promise.all([
      db.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, createdAt: true },
      }),
      db.progress.groupBy({
        by: ['userId'],
        where: { contentType: 'lecture' },
      }).then(r => new Set(r.map(x => x.userId))),
      db.progress.groupBy({
        by: ['userId'],
        where: { contentType: 'mcq' },
      }).then(r => new Set(r.map(x => x.userId))),
      db.payment.groupBy({
        by: ['userId'],
        where: { status: 'APPROVED' },
      }).then(r => new Set(r.map(x => x.userId))),
      db.payment.groupBy({
        by: ['userId'],
        where: { status: { in: ['PENDING', 'REJECTED'] } },
      }).then(r => new Set(r.map(x => x.userId))),
      db.examResult.groupBy({
        by: ['userId'],
      }).then(r => new Set(r.map(x => x.userId))),
      db.courseEnrollment.groupBy({
        by: ['userId'],
        where: { completedAt: null },
      }).then(r => new Set(r.map(x => x.userId))),
    ])

    const totalStudents = allStudents.length
    const studentSet = new Set(allStudents.map(u => u.id))
    const enrolledAny = new Set([...enrolledNotCompIds])

    // exitAfterLogin: registered but never viewed a lecture
    const exitLoginSet = new Set(studentSet)
    lectureUserIds.forEach(id => exitLoginSet.delete(id))
    const exitLoginCount = exitLoginSet.size
    const exitLoginUsers = allStudents.filter(u => exitLoginSet.has(u.id))

    // exitAfterLecture: viewed lectures but never did MCQ
    const exitLectureSet = new Set(lectureUserIds)
    mcqUserIds.forEach(id => exitLectureSet.delete(id))
    const exitLectureCount = exitLectureSet.size

    // exitBeforePurchase: did MCQ but never paid
    const exitPurchaseSet = new Set(mcqUserIds)
    approvedUserIds.forEach(id => exitPurchaseSet.delete(id))
    const exitPurchaseCount = exitPurchaseSet.size

    // exitDuringPayment: have pending/rejected payments (but no approved ones)
    const exitPaymentSet = new Set(pendingRejectedIds)
    approvedUserIds.forEach(id => exitPaymentSet.delete(id))
    const exitPaymentCount = exitPaymentSet.size

    // exitDuringExam: paid but never attempted exam
    const exitExamSet = new Set(approvedUserIds)
    examUserIds.forEach(id => exitExamSet.delete(id))
    const exitExamCount = exitExamSet.size

    // exitBeforeCompletion: enrolled but never completed
    const exitCompletionSet = new Set(enrolledNotCompIds)
    const exitCompletionCount = exitCompletionSet.size

    const divide = (n: number) => (totalStudents > 0 ? Math.round((n / totalStudents) * 10000) / 100 : 0)

    const exitAfterLogin = {
      rate: divide(exitLoginCount),
      avgTime:
        exitLoginUsers.length > 0
          ? Math.round(
              exitLoginUsers.reduce((sum, u) => sum + (toDate.getTime() - u.createdAt.getTime()), 0) /
                exitLoginUsers.length /
                3600000 *
                100
            ) / 100
          : 0,
    }

    return apiResponse({
      exitAfterLogin,
      exitAfterLecture: {
        rate: divide(exitLectureCount),
        avgTime: 0,
      },
      exitBeforePurchase: {
        rate: divide(exitPurchaseCount),
        avgTime: 0,
      },
      exitDuringPayment: {
        rate: divide(exitPaymentCount),
        avgTime: 0,
      },
      exitDuringExam: {
        rate: divide(exitExamCount),
        avgTime: 0,
      },
      exitBeforeCompletion: {
        rate: divide(exitCompletionCount),
        avgTime: 0,
      },
      suggestions: [
        {
          stage: 'After Login',
          reason: `${divide(exitLoginCount)}% of students register but never start a lecture`,
          improvement: 'Add guided onboarding tour and personalized lecture recommendations',
        },
        ...(exitLectureCount > 0
          ? [
              {
                stage: 'After Lecture',
                reason: `${divide(exitLectureCount)}% read lectures but never attempt MCQs`,
                improvement: 'Embed inline MCQ prompts after each lecture section',
              },
            ]
          : []),
        ...(exitPurchaseCount > 0
          ? [
              {
                stage: 'Before Purchase',
                reason: `${divide(exitPurchaseCount)}% attempt MCQs but never make a purchase`,
                improvement: 'Offer time-limited discounts after MCQ completion streaks',
              },
            ]
          : []),
        ...(exitPaymentCount > 0
          ? [
              {
                stage: 'During Payment',
                reason: `${divide(exitPaymentCount)}% have pending or rejected payments`,
                improvement: 'Simplify payment flow and send payment reminder notifications',
              },
            ]
          : []),
        ...(exitExamCount > 0
          ? [
              {
                stage: 'During Exam',
                reason: `${divide(exitExamCount)}% purchase but never attempt an exam`,
                improvement: 'Send push notifications about upcoming exam schedules',
              },
            ]
          : []),
        ...(exitCompletionCount > 0
          ? [
              {
                stage: 'Before Completion',
                reason: `${divide(exitCompletionCount)}% enroll in courses but never complete them`,
                improvement: 'Add progress milestones with achievement badges',
              },
            ]
          : []),
      ],
    } satisfies DropOffData)
  } catch (error) {
    return handleApiError(error, 'DropOff Analytics')
  }
}
