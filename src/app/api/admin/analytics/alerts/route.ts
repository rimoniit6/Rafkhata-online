import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { toDecimal } from '@/lib/decimal'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const alerts: Array<{
      id: string
      name: string
      metric: string
      severity: 'critical' | 'warning' | 'info'
      message: string
      value: number
      threshold: number
      triggeredAt: string
      enabled: boolean
    }> = []

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const pendingPayments = await db.payment.count({
      where: { status: 'PENDING' },
    })
    if (pendingPayments > 20) {
      alerts.push({
        id: 'pending-payments',
        name: 'Pending Payments',
        metric: 'pending_payments',
        severity: 'warning',
        message: `${pendingPayments} payments are pending review.`,
        value: pendingPayments,
        threshold: 20,
        triggeredAt: today.toISOString(),
        enabled: true,
      })
    }

    const failedPayments = await db.payment.count({
      where: { status: 'REJECTED', createdAt: { gte: todayStart } },
    })
    if (failedPayments > 5) {
      alerts.push({
        id: 'payment-failures',
        name: 'Payment Failures',
        metric: 'payment_failures',
        severity: 'critical',
        message: `${failedPayments} payments were rejected today.`,
        value: failedPayments,
        threshold: 5,
        triggeredAt: today.toISOString(),
        enabled: true,
      })
    }

    const newStudents = await db.user.count({
      where: { role: 'STUDENT', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    })
    if (newStudents < 10) {
      alerts.push({
        id: 'low-signups',
        name: 'Low Signups',
        metric: 'signups',
        severity: 'info',
        message: `Only ${newStudents} new students signed up in the last 7 days.`,
        value: newStudents,
        threshold: 10,
        triggeredAt: today.toISOString(),
        enabled: true,
      })
    }

    const lastWeekRevenue = await db.payment.aggregate({
      where: { status: 'APPROVED', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      _sum: { amount: true },
    })
    if (toDecimal(lastWeekRevenue._sum.amount || 0) < 1000) {
      alerts.push({
        id: 'low-revenue',
        name: 'Revenue Drop',
        metric: 'revenue',
        severity: 'warning',
        message: `Last week revenue was ৳${toDecimal(lastWeekRevenue._sum.amount || 0).toLocaleString('bn-BD')}.`,
        value: toDecimal(lastWeekRevenue._sum.amount || 0),
        threshold: 1000,
        triggeredAt: today.toISOString(),
        enabled: true,
      })
    }

    return apiResponse(alerts)
  } catch (error) {
    return handleApiError(error, 'Analytics Alerts')
  }
}
