import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { ConversionFunnel } from '@/types/analytics'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0]

    const fromDate = new Date(from)
    const toDate = new Date(to + 'T23:59:59.999Z')

    const [
      visitors,
      signups,
      verified,
      lectureUsers,
      mcqUsers,
      purchaseUsers,
      completedUsers,
      certUsers,
    ] = await Promise.all([
      db.analyticsEvent.groupBy({
        by: ['userId'],
        where: { userId: { not: null }, createdAt: { gte: fromDate, lte: toDate } },
      }).then(r => r.length),
      db.user.count({
        where: { role: 'STUDENT', createdAt: { gte: fromDate, lte: toDate } },
      }),
      db.user.count({
        where: { role: 'STUDENT', isVerified: true, createdAt: { gte: fromDate, lte: toDate } },
      }),
      db.progress.groupBy({
        by: ['userId'],
        where: { contentType: 'lecture', lastAccessed: { gte: fromDate, lte: toDate } },
      }).then(r => r.length),
      db.progress.groupBy({
        by: ['userId'],
        where: { contentType: 'mcq', lastAccessed: { gte: fromDate, lte: toDate } },
      }).then(r => r.length),
      db.payment.groupBy({
        by: ['userId'],
        where: { status: 'APPROVED', createdAt: { gte: fromDate, lte: toDate } },
      }).then(r => r.length),
      db.courseEnrollment.groupBy({
        by: ['userId'],
        where: { completedAt: { not: null, gte: fromDate, lte: toDate } },
      }).then(r => r.length),
      db.courseEnrollment.groupBy({
        by: ['userId'],
        where: {
          completedAt: { not: null, gte: fromDate, lte: toDate },
          course: { hasCertificate: true },
        },
      }).then(r => r.length),
    ])

    const totalFirstLogin = signups

    const rawSteps = [
      { name: 'Visitors', count: visitors },
      { name: 'Signups', count: signups },
      { name: 'Verified', count: verified },
      { name: 'First Login', count: totalFirstLogin },
      { name: 'First Lecture', count: lectureUsers },
      { name: 'First MCQ', count: mcqUsers },
      { name: 'First Purchase', count: purchaseUsers },
      { name: 'Course Completed', count: completedUsers },
      { name: 'Certificates', count: certUsers },
    ]

    const steps = rawSteps.map((step, i) => ({
      name: step.name,
      count: step.count,
      conversionRate: visitors > 0 ? Math.round((step.count / visitors) * 10000) / 100 : 0,
      dropRate:
        i > 0 && rawSteps[i - 1].count > 0
          ? Math.round(((rawSteps[i - 1].count - step.count) / rawSteps[i - 1].count) * 10000) / 100
          : 0,
    }))

    return apiResponse({
      steps,
      totalVisitors: visitors,
      totalSignups: signups,
      totalVerified: verified,
      totalFirstLogin,
      totalFirstLecture: lectureUsers,
      totalFirstMcq: mcqUsers,
      totalFirstPurchase: purchaseUsers,
      totalCourseCompleted: completedUsers,
      totalCertificates: certUsers,
    } satisfies ConversionFunnel)
  } catch (error) {
    return handleApiError(error, 'Conversion Analytics')
  }
}
