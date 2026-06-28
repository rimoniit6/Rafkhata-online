import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { DeviceAnalytics } from '@/types/analytics'

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

    const [deviceGroups, browserGroups, osGroups, screenResEvents] = await Promise.all([
      db.analyticsSession.groupBy({
        by: ['deviceType'],
        where: { startTime: { gte: fromDate, lte: toDate } },
        _count: true,
      }),
      db.analyticsSession.groupBy({
        by: ['browser'],
        where: { startTime: { gte: fromDate, lte: toDate }, browser: { not: null } },
        _count: true,
      }),
      db.analyticsSession.groupBy({
        by: ['os'],
        where: { startTime: { gte: fromDate, lte: toDate }, os: { not: null } },
        _count: true,
      }),
      db.analyticsEvent.groupBy({
        by: ['screenRes'],
        where: { createdAt: { gte: fromDate, lte: toDate }, screenRes: { not: null } },
        _count: true,
        orderBy: { _count: { screenRes: 'desc' } },
      }),
    ])

    const deviceMap = new Map(deviceGroups.map((g) => [g.deviceType, g._count]))
    const desktop = deviceMap.get('desktop') || 0
    const tablet = deviceMap.get('tablet') || 0
    const mobile = deviceMap.get('mobile') || 0

    const totalBrowser = browserGroups.reduce((s, g) => s + g._count, 0) || 1
    const browsers = browserGroups.map((g) => ({
      browser: g.browser || 'Unknown',
      count: g._count,
      percentage: Math.round((g._count / totalBrowser) * 100 * 100) / 100,
    }))

    const totalOs = osGroups.reduce((s, g) => s + g._count, 0) || 1
    const os = osGroups.map((g) => ({
      os: g.os || 'Unknown',
      count: g._count,
      percentage: Math.round((g._count / totalOs) * 100 * 100) / 100,
    }))

    const screenResolutions = screenResEvents.map((g) => ({
      resolution: g.screenRes || 'Unknown',
      count: g._count,
    }))

    return apiResponse({
      desktop,
      tablet,
      mobile,
      browsers,
      os,
      screenResolutions,
    } satisfies DeviceAnalytics)
  } catch (error) {
    return handleApiError(error, 'Device Analytics')
  }
}
