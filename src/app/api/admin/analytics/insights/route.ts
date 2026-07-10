import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { toDecimal } from '@/lib/decimal'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'revenue'
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const prevFrom = searchParams.get('prevFrom') || ''
    const prevTo = searchParams.get('prevTo') || ''

    const insights: Array<{
      id: string
      type: 'positive' | 'negative' | 'neutral' | 'warning'
      title: string
      description: string
      metric: string
      change: number
      action?: string
    }> = []

    if (section === 'revenue' || section === 'all') {
      const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000)
      const toDate = to ? new Date(to + 'T23:59:59.999Z') : new Date()
      const prevFromDate = prevFrom ? new Date(prevFrom) : new Date(Date.now() - 60 * 86400000)
      const prevToDate = prevTo ? new Date(prevTo + 'T23:59:59.999Z') : new Date(Date.now() - 30 * 86400000)

      const [currentRev, prevRev, topContent] = await Promise.all([
        db.payment.aggregate({
          where: { status: 'APPROVED', createdAt: { gte: fromDate, lte: toDate } },
          _sum: { amount: true },
          _count: true,
        }),
        db.payment.aggregate({
          where: { status: 'APPROVED', createdAt: { gte: prevFromDate, lte: prevToDate } },
          _sum: { amount: true },
        }),
        db.payment.groupBy({
          by: ['contentType'],
          where: { status: 'APPROVED', createdAt: { gte: fromDate, lte: toDate }, contentType: { not: null } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 1,
        }),
      ])

      const currRev = toDecimal(currentRev._sum.amount || 0)
      const prevRevAmt = toDecimal(prevRev._sum.amount || 0)
      const change = prevRevAmt > 0 ? Math.round(((currRev - prevRevAmt) / prevRevAmt) * 100) : 0

      if (change > 0) {
        insights.push({
          id: 'rev-growth',
          type: 'positive',
          title: 'Revenue Increased',
          description: `Revenue increased by ${change}% compared to the previous period. Total revenue: ৳${currRev.toLocaleString('bn-BD')}.`,
          metric: 'revenue',
          change,
          action: 'Continue current growth strategies.',
        })
      } else if (change < 0) {
        insights.push({
          id: 'rev-decline',
          type: 'negative',
          title: 'Revenue Declined',
          description: `Revenue decreased by ${Math.abs(change)}% compared to the previous period.`,
          metric: 'revenue',
          change,
          action: 'Review pricing and marketing strategies.',
        })
      }

      if (topContent.length > 0) {
        const top = topContent[0]
        const contentTypeLabels: Record<string, string> = {
          lecture: 'Lectures',
          bundle: 'Bundles',
          exam: 'Exams',
          suggestion: 'Suggestions',
          course: 'Courses',
          package: 'Packages',
        }
        insights.push({
          id: 'top-source',
          type: 'neutral',
          title: 'Top Revenue Source',
          description: `${contentTypeLabels[top.contentType || ''] || top.contentType} generated ৳${toDecimal(top._sum.amount || 0).toLocaleString('bn-BD')} in revenue.`,
          metric: 'top_source',
          change: 0,
        })
      }
    }

    if (section === 'students' || section === 'all') {
      const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000)
      const toDate = to ? new Date(to + 'T23:59:59.999Z') : new Date()

      const [totalStudents, newStudents] = await Promise.all([
        db.user.count({ where: { role: 'STUDENT' } }),
        db.user.count({ where: { role: 'STUDENT', createdAt: { gte: fromDate, lte: toDate } } }),
      ])

      if (newStudents > 0) {
        insights.push({
          id: 'new-students',
          type: 'positive',
          title: 'New Student Signups',
          description: `${newStudents} new students joined in this period. Total student base: ${totalStudents}.`,
          metric: 'students',
          change: Math.round((newStudents / totalStudents) * 100),
          action: 'Engage new students with onboarding content.',
        })
      }
    }

    if (section === 'payments' || section === 'all') {
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const pendingCount = await db.payment.count({
        where: { status: 'PENDING', createdAt: { gte: todayStart } },
      })

      if (pendingCount > 5) {
        insights.push({
          id: 'pending-payments',
          type: 'warning',
          title: 'Pending Payments Piling Up',
          description: `${pendingCount} payments are pending review today. Review and process them promptly.`,
          metric: 'pending_payments',
          change: pendingCount,
          action: 'Go to Payments page to review pending transactions.',
        })
      }
    }

    if (insights.length === 0) {
      insights.push({
        id: 'no-insights',
        type: 'neutral',
        title: 'No notable changes',
        description: 'All metrics are within normal ranges for this period.',
        metric: 'general',
        change: 0,
      })
    }

    return apiResponse(insights)
  } catch (error) {
    return handleApiError(error, 'Analytics Insights')
  }
}
