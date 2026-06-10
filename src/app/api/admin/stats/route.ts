import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const [
      totalUsers,
      totalStudents,
      totalPremiumUsers,
      totalMcqs,
      totalCqs,
      totalLectures,
      totalClasses,
      totalSubjects,
      totalChapters,
      pendingPayments,
      totalPayments,
      approvedPayments,
      totalRevenue,
      todayUsers,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'student' } }),
      db.user.count({ where: { isPremium: true } }),
      db.mCQ.count({ where: { isActive: true } }),
      db.cQ.count({ where: { isActive: true } }),
      db.lecture.count({ where: { isActive: true } }),
      db.classCategory.count({ where: { isActive: true } }),
      db.subject.count({ where: { isActive: true } }),
      db.chapter.count({ where: { isActive: true } }),
      db.payment.count({ where: { status: 'pending' } }),
      db.payment.count(),
      db.payment.count({ where: { status: 'approved' } }),
      db.payment.aggregate({
        where: { status: 'approved' },
        _sum: { amount: true },
      }),
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    // Get recent payments
    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Get monthly revenue for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const payments = await db.payment.findMany({
      where: {
        status: 'approved',
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    })

    const monthlyRevenue: Record<string, number> = {}
    payments.forEach((payment) => {
      const monthKey = payment.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + payment.amount
    })

    return apiResponse({
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          premium: totalPremiumUsers,
          today: todayUsers,
        },
        content: {
          mcqs: totalMcqs,
          cqs: totalCqs,
          lectures: totalLectures,
          classes: totalClasses,
          subjects: totalSubjects,
          chapters: totalChapters,
        },
        payments: {
          total: totalPayments,
          pending: pendingPayments,
          approved: approvedPayments,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        recentPayments,
        monthlyRevenue,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Get admin stats')
  }
}
