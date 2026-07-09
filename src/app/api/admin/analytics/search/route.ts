import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { SearchAnalytics } from '@/types/analytics'

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
    const prevFromDate = new Date(prevFrom)
    const prevToDate = new Date(prevTo + 'T23:59:59.999Z')

    const [queryGroups, noResultGroups, currentQueryCounts, prevQueryCounts] = await Promise.all([
      db.analyticsSearchQuery.groupBy({
        by: ['query'],
        where: { createdAt: { gte: fromDate, lte: toDate } },
        _count: true,
        orderBy: { _count: { query: 'desc' } },
        take: 20,
      }),
      db.analyticsSearchQuery.groupBy({
        by: ['query'],
        where: { resultCount: 0, createdAt: { gte: fromDate, lte: toDate } },
        _count: true,
        orderBy: { _count: { query: 'desc' } },
      }),
      db.analyticsSearchQuery.groupBy({
        by: ['query'],
        where: { createdAt: { gte: fromDate, lte: toDate } },
        _count: true,
      }),
      db.analyticsSearchQuery.groupBy({
        by: ['query'],
        where: { createdAt: { gte: prevFromDate, lte: prevToDate } },
        _count: true,
      }),
    ])

    const mostSearched = queryGroups.map((g) => ({
      query: g.query,
      count: g._count,
    }))

    const noResultSearches = noResultGroups.map((g) => ({
      query: g.query,
      count: g._count,
    }))

    const keywordMap = new Map<string, number>()
    queryGroups.forEach((g) => {
      const words = g.query.split(/\s+/).filter(Boolean)
      words.forEach((w) => {
        const lower = w.toLowerCase()
        keywordMap.set(lower, (keywordMap.get(lower) || 0) + g._count)
      })
    })
    const popularKeywords = Array.from(keywordMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    const prevCountMap = new Map(prevQueryCounts.map((g) => [g.query, g._count]))
    const currentCountMap = new Map(currentQueryCounts.map((g) => [g.query, g._count]))

    const trendingSearches = Array.from(currentCountMap.entries())
      .map(([query, currentCount]) => {
        const prevCount = prevCountMap.get(query) || 0
        const growth = prevCount > 0
          ? Math.round(((currentCount - prevCount) / prevCount) * 100 * 100) / 100
          : currentCount > 0 ? 100 : 0
        return { query, count: currentCount, growth }
      })
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 20)

    return apiResponse({
      mostSearched,
      noResultSearches,
      popularKeywords,
      trendingSearches,
    } satisfies SearchAnalytics)
  } catch (error) {
    return handleApiError(error, 'Search Analytics')
  }
}
