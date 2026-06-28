import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { PaymentAnalytics } from '@/types/analytics'

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
      payments,
      pendingCount,
      approvedCount,
      rejectedCount,
      avgPurchase,
      methodGroups,
      totalApproved,
      totalRejected,
    ] = await Promise.all([
      db.payment.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        select: { amount: true, createdAt: true, method: true },
        orderBy: { createdAt: 'asc' },
      }),
      db.payment.count({
        where: { status: 'pending', createdAt: { gte: fromDate, lte: toDate } },
      }),
      db.payment.count({
        where: { status: 'approved', createdAt: { gte: fromDate, lte: toDate } },
      }),
      db.payment.count({
        where: { status: 'rejected', createdAt: { gte: fromDate, lte: toDate } },
      }),
      db.payment.aggregate({
        where: { status: 'approved', createdAt: { gte: fromDate, lte: toDate } },
        _avg: { amount: true },
      }),
      db.payment.groupBy({
        by: ['method'],
        where: { createdAt: { gte: fromDate, lte: toDate } },
        _count: true,
      }),
      db.payment.count({
        where: { status: 'approved', createdAt: { gte: fromDate, lte: toDate } },
      }),
      db.payment.count({
        where: { status: 'rejected', createdAt: { gte: fromDate, lte: toDate } },
      }),
    ])

    const dailyMap = new Map<string, { count: number; revenue: number }>()
    payments.forEach((p) => {
      const day = new Date(p.createdAt).toISOString().split('T')[0]
      const existing = dailyMap.get(day) || { count: 0, revenue: 0 }
      existing.count += 1
      existing.revenue += p.amount
      dailyMap.set(day, existing)
    })
    const dailyPurchases = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, count: data.count, revenue: data.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    let popularPaymentMethod = ''
    let maxCount = 0
    methodGroups.forEach((g) => {
      if (g._count > maxCount) {
        maxCount = g._count
        popularPaymentMethod = g.method
      }
    })

    const conversionRate =
      totalApproved + totalRejected > 0
        ? Math.round((totalApproved / (totalApproved + totalRejected)) * 100 * 100) / 100
        : 0

    return apiResponse({
      dailyPurchases,
      pendingPayments: pendingCount,
      approvedPayments: approvedCount,
      rejectedPayments: rejectedCount,
      averagePurchase: avgPurchase._avg.amount || 0,
      popularPaymentMethod,
      conversionRate,
    } satisfies PaymentAnalytics)
  } catch (error) {
    return handleApiError(error, 'Payment Analytics')
  }
}
