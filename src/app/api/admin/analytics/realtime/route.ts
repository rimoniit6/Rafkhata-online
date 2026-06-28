import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const now = new Date()
    const fiveMinAgo = new Date(now.getTime() - 5 * 60000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      onlineUsers,
      todayPayments,
      todayRegistrations,
      todayApprovedPayments,
      todayEnrollments,
      todayExamResults,
    ] = await Promise.all([
      db.analyticsSession.count({
        where: { isActive: true, startTime: { gte: fiveMinAgo } },
      }),
      db.payment.count({
        where: { createdAt: { gte: todayStart } },
      }),
      db.user.count({
        where: { role: 'STUDENT', createdAt: { gte: todayStart } },
      }),
      db.payment.count({
        where: { status: 'approved', createdAt: { gte: todayStart } },
      }),
      db.courseEnrollment.count({
        where: { enrolledAt: { gte: todayStart } },
      }),
      db.examResult.count({
        where: { completedAt: { gte: todayStart } },
      }),
    ])

    const recentEvents = await db.analyticsEvent.findMany({
      where: { createdAt: { gte: fiveMinAgo } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, eventType: true, eventName: true, createdAt: true },
    })

    const recentActivity = recentEvents.map((e) => ({
      id: e.id,
      type: e.eventType,
      message: e.eventName,
      timestamp: e.createdAt.toISOString(),
    }))

    return apiResponse({
      currentlyOnline: onlineUsers,
      livePurchases: todayPayments,
      liveRegistrations: todayRegistrations,
      livePayments: todayApprovedPayments,
      liveEnrollments: todayEnrollments,
      liveExams: todayExamResults,
      recentActivity,
    })
  } catch (error) {
    return handleApiError(error, 'Realtime Analytics')
  }
}
