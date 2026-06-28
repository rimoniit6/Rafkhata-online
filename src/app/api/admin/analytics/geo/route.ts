import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { GeoAnalytics } from '@/types/analytics'

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

    const [sessionCountries, divisionGroups, districtGroups, sessionTimezones] = await Promise.all([
      db.analyticsSession.groupBy({
        by: ['country'],
        where: { startTime: { gte: fromDate, lte: toDate }, country: { not: null } },
        _count: true,
      }),
      db.analyticsEvent.groupBy({
        by: ['division'],
        where: { createdAt: { gte: fromDate, lte: toDate }, division: { not: null } },
        _count: true,
        orderBy: { _count: { division: 'desc' } },
      }),
      db.analyticsEvent.groupBy({
        by: ['district'],
        where: { createdAt: { gte: fromDate, lte: toDate }, district: { not: null } },
        _count: true,
        orderBy: { _count: { district: 'desc' } },
      }),
      db.analyticsEvent.groupBy({
        by: ['timezone'],
        where: { createdAt: { gte: fromDate, lte: toDate }, timezone: { not: null } },
        _count: true,
        orderBy: { _count: { timezone: 'desc' } },
      }),
    ])

    const totalCountries = sessionCountries.reduce((s, g) => s + g._count, 0) || 1
    const countries = sessionCountries.map((g) => ({
      country: g.country || 'Unknown',
      count: g._count,
      percentage: Math.round((g._count / totalCountries) * 100 * 100) / 100,
    }))

    const totalDivisions = divisionGroups.reduce((s, g) => s + g._count, 0) || 1
    const divisions = divisionGroups.map((g) => ({
      division: g.division || 'Unknown',
      count: g._count,
      percentage: Math.round((g._count / totalDivisions) * 100 * 100) / 100,
    }))

    const totalDistricts = districtGroups.reduce((s, g) => s + g._count, 0) || 1
    const districts = districtGroups.map((g) => ({
      district: g.district || 'Unknown',
      count: g._count,
      percentage: Math.round((g._count / totalDistricts) * 100 * 100) / 100,
    }))

    const timezones = sessionTimezones.map((g) => ({
      timezone: g.timezone || 'Unknown',
      count: g._count,
    }))

    return apiResponse({
      countries,
      divisions,
      districts,
      timezones,
    } satisfies GeoAnalytics)
  } catch (error) {
    return handleApiError(error, 'Geo Analytics')
  }
}
