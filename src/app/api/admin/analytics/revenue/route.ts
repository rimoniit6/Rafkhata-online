import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { parseAnalyticsDateRange } from '@/lib/analytics-date-range'
import { analyticsCache, cacheControlHeader } from '@/lib/analytics-cache'
import { toDecimal } from '@/lib/decimal'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const { fromDate, toDate, prevFromDate, prevToDate } = parseAnalyticsDateRange(searchParams)

    const cacheKey = `revenue-${fromDate.toISOString()}-${toDate.toISOString()}`

    const [
      currentRevenue,
      previousRevenue,
      currentRevenueByMethod,
      currentRevenueByContent,
      currentPayments,
      dailyPayments,
      pendingAgg,
      rejectedAgg,
      approvedAgg,
      studentCount,
      purchaseCount,
      allContentPayments,
    ] = await analyticsCache.getOrCompute(cacheKey, 300_000, () =>
      Promise.all([
      // Current period approved revenue
      db.payment.aggregate({
        where: { status: 'APPROVED', createdAt: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
        _count: true,
      }),
      // Previous period approved revenue (for growth)
      db.payment.aggregate({
        where: { status: 'APPROVED', createdAt: { gte: prevFromDate, lte: prevToDate } },
        _sum: { amount: true },
        _count: true,
      }),
      // Revenue by payment method
      db.payment.groupBy({
        by: ['method'],
        where: { status: 'APPROVED', createdAt: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
        _count: true,
      }),
      // Revenue by content type
      db.payment.groupBy({
        by: ['contentType'],
        where: {
          status: 'APPROVED',
          createdAt: { gte: fromDate, lte: toDate },
          contentType: { not: null },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // All current period approved payments
      db.payment.findMany({
        where: { status: 'APPROVED', createdAt: { gte: fromDate, lte: toDate } },
        select: { amount: true, contentType: true, contentId: true, contentTitle: true, method: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      // Daily revenue
      db.payment.findMany({
        where: { status: 'APPROVED', createdAt: { gte: fromDate, lte: toDate } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      // Pending revenue
      db.payment.aggregate({
        where: { status: 'PENDING', createdAt: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
        _count: true,
      }),
      // Rejected payments
      db.payment.aggregate({
        where: { status: 'REJECTED', createdAt: { gte: fromDate, lte: toDate } },
        _sum: { amount: true },
        _count: true,
      }),
      // Approved count
      db.payment.count({
        where: { status: 'APPROVED', createdAt: { gte: fromDate, lte: toDate } },
      }),
      // Active students in period
      db.user.count({
        where: { role: 'STUDENT' },
      }),
      // Total purchase count
      db.payment.count({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: { not: 'REJECTED' } },
      }),
      // All content payments for breakdown
      db.payment.findMany({
        where: {
          status: 'APPROVED',
          createdAt: { gte: fromDate, lte: toDate },
          contentType: { in: ['lecture', 'bundle', 'exam', 'suggestion', 'course', 'package'] },
          contentId: { not: null },
        },
        select: { amount: true, contentType: true, contentId: true, contentTitle: true },
      }),
    ])
    )

    const totalRevenue = toDecimal(currentRevenue._sum.amount || 0)
    const prevRevenue = toDecimal(previousRevenue._sum.amount || 0)
    const revenueGrowth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100 * 100) / 100 : 0

    // Revenue today
    const todayStr = new Date().toISOString().split('T')[0]
    const todayRevenue = currentPayments
      .filter((p) => new Date(p.createdAt).toISOString().split('T')[0] === todayStr)
      .reduce((sum, p) => sum + toDecimal(p.amount), 0)

    // Revenue yesterday
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const yesterdayRevenue = currentPayments
      .filter((p) => new Date(p.createdAt).toISOString().split('T')[0] === yesterdayStr)
      .reduce((sum, p) => sum + toDecimal(p.amount), 0)

    // Revenue this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthRevenue = currentPayments
      .filter((p) => new Date(p.createdAt) >= monthStart)
      .reduce((sum, p) => sum + toDecimal(p.amount), 0)

    // Revenue last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const lastMonthRevenue = currentPayments
      .filter((p) => {
        const d = new Date(p.createdAt)
        return d >= lastMonthStart && d <= lastMonthEnd
      })
      .reduce((sum, p) => sum + toDecimal(p.amount), 0)

    // Average order value
    const totalCount = currentRevenue._count
    const averageOrderValue = totalCount > 0 ? totalRevenue / totalCount : 0

    // Revenue per student
    const revenuePerStudent = studentCount > 0 ? totalRevenue / studentCount : 0

    // Revenue by method
    const revenueByMethod = currentRevenueByMethod.map((r) => ({
      method: r.method,
      revenue: toDecimal(r._sum.amount || 0),
      count: r._count,
    }))

    // Revenue by content type (with names)
    const contentTypeNames: Record<string, string> = {
      lecture: 'Lecture',
      bundle: 'Bundle',
      exam: 'Exam',
      suggestion: 'Suggestion',
      course: 'Course',
      package: 'Package',
      'mcq': 'MCQ',
      'cq': 'CQ',
      'board-mcq': 'Board MCQ',
      'board-cq': 'Board CQ',
    }

    const revenueByContent = currentRevenueByContent.map((r) => ({
      source: r.contentType || 'unknown',
      revenue: toDecimal(r._sum.amount || 0),
      count: r._count,
      percentage: totalRevenue > 0 ? Math.round(((toDecimal(r._sum.amount || 0) / totalRevenue) * 100 * 100) / 100) : 0,
    }))

    // Daily revenue aggregation
    const dailyMap = new Map<string, number>()
    dailyPayments.forEach((p) => {
      const day = new Date(p.createdAt).toISOString().split('T')[0]
      dailyMap.set(day, (dailyMap.get(day) || 0) + toDecimal(p.amount))
    })
    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Monthly revenue aggregation
    const monthlyMap = new Map<string, number>()
    dailyPayments.forEach((p) => {
      const month = new Date(p.createdAt).toISOString().slice(0, 7)
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + toDecimal(p.amount))
    })
    const monthlyRevenue = Array.from(monthlyMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Revenue trend with moving average
    const revenueTrend = dailyRevenue.map((d, i, arr) => {
      const window = Math.min(7, i + 1)
      const movingAvg = arr.slice(Math.max(0, i - window + 1), i + 1).reduce((s, x) => s + x.revenue, 0) / window
      return { date: d.date, revenue: d.revenue, movingAvg: Math.round(movingAvg * 100) / 100 }
    })

    // Simple forecast using linear regression
    const forecast = generateForecast(monthlyRevenue)

    // Revenue by content type breakdown (by fetching names separately)
    const lectureIds = allContentPayments.filter((p) => p.contentType === 'lecture').map((p) => p.contentId).filter(Boolean) as string[]
    const bundleIds = allContentPayments.filter((p) => p.contentType === 'bundle').map((p) => p.contentId).filter(Boolean) as string[]
    const examIds = allContentPayments.filter((p) => p.contentType === 'exam').map((p) => p.contentId).filter(Boolean) as string[]
    const suggestionIds = allContentPayments.filter((p) => p.contentType === 'suggestion').map((p) => p.contentId).filter(Boolean) as string[]
    const courseIds = allContentPayments.filter((p) => p.contentType === 'course').map((p) => p.contentId).filter(Boolean) as string[]

    const [lectures, bundles, exams, suggestions, courses] = await Promise.all([
      lectureIds.length ? db.lecture.findMany({ where: { id: { in: lectureIds } }, select: { id: true, title: true } }) : [],
      bundleIds.length ? db.contentBundle.findMany({ where: { id: { in: bundleIds } }, select: { id: true, title: true } }) : [],
      examIds.length ? db.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, title: true } }) : [],
      suggestionIds.length ? db.suggestion.findMany({ where: { id: { in: suggestionIds } }, select: { id: true, title: true } }) : [],
      courseIds.length ? db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true } }) : [],
    ])

    const lectureMap = new Map(lectures.map((l) => [l.id, l.title]))
    const bundleMap = new Map(bundles.map((b) => [b.id, b.title]))
    const examMap = new Map(exams.map((e) => [e.id, e.title]))
    const suggestionMap = new Map(suggestions.map((s) => [s.id, s.title]))
    const courseMap = new Map(courses.map((c) => [c.id, c.title]))

    const aggregateByName = (items: typeof allContentPayments, nameMap: Map<string, string>, type: string) => {
      const map = new Map<string, { title: string; revenue: number; count: number }>()
      items
        .filter((p) => p.contentType === type)
        .forEach((p) => {
          const title = nameMap.get(p.contentId || '') || p.contentTitle || 'Unknown'
          const existing = map.get(title) || { title, revenue: 0, count: 0 }
          existing.revenue += toDecimal(p.amount)
          existing.count += 1
          map.set(title, existing)
        })
      return Array.from(map.values())
        .map((item) => ({
          ...item,
          id: items.find((p) => (nameMap.get(p.contentId || '') || p.contentTitle) === item.title)?.contentId || '',
        }))
        .sort((a, b) => b.revenue - a.revenue)
    }

    const revenueByLecture = aggregateByName(allContentPayments, lectureMap, 'lecture')
    const revenueByBundle = aggregateByName(allContentPayments, bundleMap, 'bundle')
    const revenueByExam = aggregateByName(allContentPayments, examMap, 'exam')
    const revenueBySuggestion = aggregateByName(allContentPayments, suggestionMap, 'suggestion')
    const revenueByCourse = aggregateByName(allContentPayments, courseMap, 'course')

    return apiResponse({
      totalRevenue,
      revenueToday: todayRevenue,
      revenueYesterday: yesterdayRevenue,
      revenueThisMonth: thisMonthRevenue,
      revenueLastMonth: lastMonthRevenue,
      revenueGrowth,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      revenuePerStudent: Math.round(revenuePerStudent * 100) / 100,
      revenueByCourse,
      revenueByLecture,
      revenueByBundle,
      revenueByExam,
      revenueBySuggestion,
      revenueByMethod,
      pendingRevenue: toDecimal(pendingAgg._sum.amount || 0),
      approvedRevenue: totalRevenue,
      rejectedAmount: toDecimal(rejectedAgg._sum.amount || 0),
      refunds: toDecimal(rejectedAgg._sum.amount || 0),
      dailyRevenue,
      monthlyRevenue,
      revenueTrend,
      revenueForecast: forecast,
      topSources: revenueByContent
        .map((r) => ({ source: contentTypeNames[r.source] || r.source, revenue: r.revenue, percentage: r.percentage }))
        .sort((a, b) => b.revenue - a.revenue),
      heatmap: generateRevenueHeatmap(dailyPayments.map(p => ({ ...p, amount: Number(p.amount) }))),
    }, null, undefined, cacheControlHeader(120))
  } catch (error) {
    return handleApiError(error, 'Revenue Analytics')
  }
}

function generateForecast(monthlyData: Array<{ month: string; revenue: number }>): Array<{ month: string; predicted: number; lower: number; upper: number }> {
  if (monthlyData.length < 2) return []

  const points = monthlyData.map((d, i) => ({ x: i, y: d.revenue }))
  const n = points.length
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const forecast: Array<{ month: string; predicted: number; lower: number; upper: number }> = []

  for (let i = 1; i <= 3; i++) {
    const x = n - 1 + i
    const predicted = slope * x + intercept
    const monthDate = new Date(monthlyData[monthlyData.length - 1].month + '-01')
    monthDate.setMonth(monthDate.getMonth() + i)
    const monthStr = monthDate.toISOString().slice(0, 7)
    const stdErr = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0) / (n - 2)
    const margin = 1.96 * Math.sqrt(stdErr * (1 + 1 / n + Math.pow(x - sumX / n, 2) / (sumX2 - sumX * sumX / n)))

    forecast.push({
      month: monthStr,
      predicted: Math.max(0, Math.round(predicted * 100) / 100),
      lower: Math.max(0, Math.round((predicted - margin) * 100) / 100),
      upper: Math.round((predicted + margin) * 100) / 100,
    })
  }

  return forecast
}

function generateRevenueHeatmap(payments: Array<{ amount: number | string | null; createdAt: Date }>) {
  const heatmap = new Map<string, number>()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  payments.forEach((p) => {
    const d = new Date(p.createdAt)
    const day = days[d.getDay()]
    const hour = d.getHours()
    const key = `${day}-${hour}`
    heatmap.set(key, (heatmap.get(key) || 0) + toDecimal(p.amount || 0))
  })

  const result: Array<{ day: string; hour: number; revenue: number }> = []
  days.forEach((day) => {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`
      result.push({ day, hour, revenue: heatmap.get(key) || 0 })
    }
  })

  return result
}
