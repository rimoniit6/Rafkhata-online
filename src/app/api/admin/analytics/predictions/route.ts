import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { cacheControlHeader } from '@/lib/analytics-cache'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [monthlyPayments, monthlySignups, topCourseSales, totalStudents] = await Promise.all([
      db.payment.findMany({
        where: { status: 'APPROVED', createdAt: { gte: sixMonthsAgo } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      db.user.findMany({
        where: { role: 'STUDENT', createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      db.coursePurchase.groupBy({
        by: ['courseId'],
        where: { isActive: true },
        _count: { courseId: true },
        orderBy: { _count: { courseId: 'desc' } },
        take: 1,
      }),
      db.user.count({ where: { role: 'STUDENT' } }),
    ])

    const monthlyRevenue = aggregateMonthly(monthlyPayments.map((p) => ({ date: p.createdAt, value: Number(p.amount) })))
    const monthlyStudents = aggregateMonthly(monthlySignups.map((u) => ({ date: u.createdAt, value: 1 })))

    const forecastRev = simpleForecast(monthlyRevenue)
    const forecastStudents = simpleForecast(monthlyStudents)

    let topCourse = { id: '', title: 'N/A', score: 0 }
    if (topCourseSales.length > 0) {
      const course = await db.course.findUnique({
        where: { id: topCourseSales[0].courseId },
        select: { id: true, title: true },
      })
      if (course) {
        topCourse = { ...course, score: topCourseSales[0]._count.courseId }
      }
    }

    return apiResponse({
      nextMonthRevenue: {
        predicted: forecastRev.predicted,
        lower: forecastRev.lower,
        upper: forecastRev.upper,
        confidence: forecastRev.confidence,
      },
      expectedPurchases: forecastStudents.predicted > 50 ? Math.round(forecastStudents.predicted * 0.3) : 0,
      expectedSignups: Math.round(forecastStudents.predicted),
      expectedChurn: Math.round(totalStudents * 0.05),
      topFutureCourse: topCourse,
    }, null, undefined, cacheControlHeader(300))
  } catch (error) {
    return handleApiError(error, 'Prediction Analytics')
  }
}

function aggregateMonthly(data: Array<{ date: Date; value: number }>) {
  const map = new Map<string, number>()
  data.forEach((d) => {
    const key = d.date.toISOString().slice(0, 7)
    map.set(key, (map.get(key) || 0) + d.value)
  })
  return Array.from(map.entries())
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function simpleForecast(monthlyData: Array<{ month: string; value: number }>) {
  if (monthlyData.length < 2) {
    return { predicted: 0, lower: 0, upper: 0, confidence: 0 }
  }

  const n = monthlyData.length
  const points = monthlyData.map((d, i) => ({ x: i, y: d.value }))
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  const nextX = n

  const predicted = Math.max(0, slope * nextX + intercept)
  const residuals = points.map((p) => Math.abs(p.y - (slope * p.x + intercept)))
  const mae = residuals.reduce((s, r) => s + r, 0) / n

  return {
    predicted: Math.round(predicted * 100) / 100,
    lower: Math.max(0, Math.round((predicted - mae * 1.5) * 100) / 100),
    upper: Math.round((predicted + mae * 1.5) * 100) / 100,
    confidence: Math.min(95, Math.round((1 - mae / (predicted || 1)) * 100)),
  }
}
