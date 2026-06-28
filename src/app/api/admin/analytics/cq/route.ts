import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { CqAnalytics } from '@/types/analytics'

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

    const [submissions, totalCqs] = await Promise.all([
      db.cQExamSubmission.findMany({
        where: { submittedAt: { gte: fromDate, lte: toDate } },
        select: {
          obtainedMarks: true,
          totalMarks: true,
          submittedAt: true,
          gradedAt: true,
          status: true,
        },
      }),
      db.cQ.count({ where: { isActive: true } }),
    ])

    const totalSubmissions = submissions.length

    // averageMarks
    const scoredSubmissions = submissions.filter(s => s.totalMarks > 0)
    const averageMarks = scoredSubmissions.length > 0
      ? Math.round(scoredSubmissions.reduce((sum, s) => sum + s.obtainedMarks, 0) / scoredSubmissions.length * 100) / 100
      : 0

    // teacherReviewTime: avg time between submittedAt and gradedAt (in hours)
    const gradedSubmissions = submissions.filter(s => s.gradedAt && s.submittedAt)
    const teacherReviewTime = gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((sum, s) => sum + (s.gradedAt!.getTime() - s.submittedAt!.getTime()), 0) /
            gradedSubmissions.length /
            3600000 *
            100
        ) / 100
      : 0

    // pendingReview: count where status='submitted' (submitted but not graded)
    const pendingReview = submissions.filter(s => s.status === 'submitted').length

    // passRate / failRate: percentage with obtainedMarks >= 40% of totalMarks
    const meaningful = submissions.filter(s => s.totalMarks > 0)
    const passed = meaningful.filter(s => s.obtainedMarks >= s.totalMarks * 0.4).length
    const failed = meaningful.filter(s => s.obtainedMarks < s.totalMarks * 0.4).length
    const passRate = meaningful.length > 0 ? Math.round((passed / meaningful.length) * 10000) / 100 : 0
    const failRate = meaningful.length > 0 ? Math.round((failed / meaningful.length) * 10000) / 100 : 0

    return apiResponse({
      totalSubmissions,
      averageMarks,
      teacherReviewTime,
      pendingReview,
      passRate,
      failRate,
    } satisfies CqAnalytics)
  } catch (error) {
    return handleApiError(error, 'CQ Analytics')
  }
}
