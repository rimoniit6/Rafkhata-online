import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { parseAnalyticsDateRange } from '@/lib/analytics-date-range'
import type { CourseAnalytics } from '@/types/analytics'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const { fromDate, toDate } = parseAnalyticsDateRange(searchParams)

    const [courses, enrollmentCounts, completionCounts, lessonProgressAgg, allEnrollments, allCompletions, coursePayments] =
      await Promise.all([
        db.course.findMany({
          select: { id: true, title: true },
        }),
        db.courseEnrollment.groupBy({
          by: ['courseId'],
          _count: true,
          where: { enrolledAt: { gte: fromDate, lte: toDate } },
        }),
        db.courseEnrollment.groupBy({
          by: ['courseId'],
          _count: true,
          where: { completedAt: { not: null, gte: fromDate, lte: toDate } },
        }),
        db.lessonProgress.findMany({
          select: { completed: true },
        }).then((results) => ({
          _count: results.length,
          _sum: { completed: results.filter((r) => r.completed).length },
        })),
        db.courseEnrollment.findMany({
          where: { enrolledAt: { gte: fromDate, lte: toDate } },
          select: { enrolledAt: true },
          orderBy: { enrolledAt: 'asc' },
        }),
        db.courseEnrollment.findMany({
          where: { completedAt: { not: null, gte: fromDate, lte: toDate } },
          select: { completedAt: true },
          orderBy: { completedAt: 'asc' },
        }),
        // Course revenue lives on Payment (contentId = courseId for course purchases),
        // NOT on CoursePurchase — that model has no `amount` field.
        db.payment.findMany({
          where: {
            contentType: 'course',
            status: 'approved',
            createdAt: { gte: fromDate, lte: toDate },
          },
          select: { contentId: true, amount: true },
        }),
      ])

    const enrollMap = new Map(enrollmentCounts.map(e => [e.courseId, e._count]))
    const completeMap = new Map(completionCounts.map(c => [c.courseId, c._count]))
    // Group approved course-payment amounts by courseId (contentId) in JS.
    const revenueByCourseMap = new Map<string, number>()
    coursePayments.forEach(p => {
      const key = p.contentId ?? ''
      revenueByCourseMap.set(key, (revenueByCourseMap.get(key) || 0) + p.amount)
    })

    const courseStats = courses.map(c => ({
      id: c.id,
      title: c.title,
      enrollments: enrollMap.get(c.id) || 0,
      completions: completeMap.get(c.id) || 0,
      revenue: revenueByCourseMap.get(c.id) || 0,
    }))

    const withEnrollments = courseStats.filter(c => c.enrollments > 0)

    // mostPopular / leastPopular
    const sortedByEnroll = [...courseStats].sort((a, b) => b.enrollments - a.enrollments)
    const mostPopular = sortedByEnroll.length > 0
      ? { id: sortedByEnroll[0].id, title: sortedByEnroll[0].title, enrollments: sortedByEnroll[0].enrollments }
      : { id: '', title: 'No courses', enrollments: 0 }
    const leastPopular = sortedByEnroll.length > 0
      ? { id: sortedByEnroll[sortedByEnroll.length - 1].id, title: sortedByEnroll[sortedByEnroll.length - 1].title, enrollments: sortedByEnroll[sortedByEnroll.length - 1].enrollments }
      : { id: '', title: 'No courses', enrollments: 0 }

    // highestRevenue
    const sortedByRevenue = [...courseStats].sort((a, b) => b.revenue - a.revenue)
    const highestRevenue = sortedByRevenue.length > 0
      ? { id: sortedByRevenue[0].id, title: sortedByRevenue[0].title, revenue: sortedByRevenue[0].revenue }
      : { id: '', title: 'No courses', revenue: 0 }

    // Completion rates
    const completionRates = withEnrollments.map(c => ({
      id: c.id,
      title: c.title,
      rate: c.enrollments > 0 ? Math.round((c.completions / c.enrollments) * 10000) / 100 : 0,
    })).sort((a, b) => b.rate - a.rate)

    const highestCompletion = completionRates.length > 0
      ? { id: completionRates[0].id, title: completionRates[0].title, rate: completionRates[0].rate }
      : { id: '', title: 'No courses', rate: 0 }

    const lowestCompletion = completionRates.length > 0
      ? { id: completionRates[completionRates.length - 1].id, title: completionRates[completionRates.length - 1].title, rate: completionRates[completionRates.length - 1].rate }
      : { id: '', title: 'No courses', rate: 0 }

    // averageProgress from LessonProgress
    const totalProgressRecords = lessonProgressAgg._count
    const totalCompleted = lessonProgressAgg._sum.completed || 0
    const averageProgress = totalProgressRecords > 0
      ? Math.round((totalCompleted / totalProgressRecords) * 10000) / 100
      : 0

    // enrollmentTrend
    const enrollDayMap = new Map<string, number>()
    allEnrollments.forEach(e => {
      const day = e.enrolledAt.toISOString().split('T')[0]
      enrollDayMap.set(day, (enrollDayMap.get(day) || 0) + 1)
    })
    const enrollmentTrend = Array.from(enrollDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // completionTrend
    const compDayMap = new Map<string, number>()
    allCompletions.forEach(c => {
      const day = c.completedAt!.toISOString().split('T')[0]
      compDayMap.set(day, (compDayMap.get(day) || 0) + 1)
    })
    const completionTrend = Array.from(compDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // revenuePerCourse
    const revenuePerCourse = courses.map(c => ({
      id: c.id,
      title: c.title,
      revenue: revenueByCourseMap.get(c.id) || 0,
      enrollments: enrollMap.get(c.id) || 0,
    }))

    return apiResponse({
      mostPopular,
      leastPopular,
      highestRevenue,
      highestCompletion,
      lowestCompletion,
      averageProgress,
      enrollmentTrend,
      completionTrend,
      // Schema has no rating/review model, so there is no data source for an
      // average rating. 0 is a true "no data" value, not a placeholder.
      averageRating: 0,
      revenuePerCourse,
    } satisfies CourseAnalytics)
  } catch (error) {
    return handleApiError(error, 'Course Analytics')
  }
}
