import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { cacheControlHeader } from '@/lib/analytics-cache'

const MS_PER_DAY = 86_400_000

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    // Retention uses a fixed 3-month lookback regardless of the global filter,
    // so cohort sizing is stable; matches existing behaviour.
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const [users, progressUsers] = await Promise.all([
      db.user.findMany({
        where: { role: 'STUDENT', createdAt: { gte: threeMonthsAgo } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      db.progress.groupBy({
        by: ['userId'],
        where: { lastAccessed: { gte: threeMonthsAgo } },
        _min: { lastAccessed: true },
        _max: { lastAccessed: true },
      }),
    ])

    const lastAccessMap = new Map(progressUsers.map((p) => [p.userId, p._max.lastAccessed]))
    const firstAccessMap = new Map(progressUsers.map((p) => [p.userId, p._min.lastAccessed]))

    const cohorts: Array<{ cohort: string; periods: Array<{ period: string; rate: number }> }> = []
    const cohortGroups = new Map<string, typeof users>()

    users.forEach((u) => {
      const key = u.createdAt.toISOString().slice(0, 7)
      if (!cohortGroups.has(key)) cohortGroups.set(key, [])
      cohortGroups.get(key)!.push(u)
    })

    cohortGroups.forEach((group, cohort) => {
      const periods: Array<{ period: string; rate: number }> = []
      const baseDate = new Date(group[0].createdAt)

      for (let w = 0; w <= 12; w++) {
        const periodStart = new Date(baseDate)
        periodStart.setDate(periodStart.getDate() + w * 7)
        const periodEnd = new Date(periodStart)
        periodEnd.setDate(periodEnd.getDate() + 7)

        const retained = group.filter((u) => {
          const lastAccess = lastAccessMap.get(u.id)
          return lastAccess && lastAccess >= periodStart
        }).length

        periods.push({
          period: `Week ${w}`,
          rate: group.length > 0 ? Math.round((retained / group.length) * 100) : 0,
        })
      }

      cohorts.push({ cohort, periods })
    })

    const retentionHeatmap = cohorts.flatMap((c) =>
      c.periods.map((p) => ({
        cohort: c.cohort,
        period: p.period,
        rate: p.rate,
      }))
    )

    const retained = users.filter((u) => lastAccessMap.has(u.id))
    const churned = users.length - retained.length

    // --- day1/7/14/30/60/90 retention % across the full 3-month cohort ---
    const dayOffsets = [1, 7, 14, 30, 60, 90]
    const retentionByDay = (offsetDays: number): number => {
      if (users.length === 0) return 0
      let count = 0
      users.forEach((u) => {
        const last = lastAccessMap.get(u.id)
        if (!last) return
        const cutoff = new Date(u.createdAt.getTime() + offsetDays * MS_PER_DAY)
        if (last >= cutoff) count++
      })
      return Math.round((count / users.length) * 10000) / 100
    }
    const [day1, day7, day14, day30, day60, day90] = dayOffsets.map(retentionByDay)

    // --- reactivatedUsers: inactive for 7+ days after signup before first access ---
    const reactivatedUsers = users.filter((u) => {
      const first = firstAccessMap.get(u.id)
      if (!first) return false
      return first.getTime() - u.createdAt.getTime() >= 7 * MS_PER_DAY
    }).length

    return apiResponse({
      day1,
      day7,
      day14,
      day30,
      day60,
      day90,
      returnedStudents: retained.length,
      lostStudents: churned,
      churnRate: users.length > 0 ? Math.round((churned / users.length) * 100) : 0,
      reactivatedUsers,
      retentionPercent: users.length > 0 ? Math.round((retained.length / users.length) * 100) : 0,
      cohorts: cohorts.slice(-6),
      retentionHeatmap: retentionHeatmap.slice(-100),
    }, null, undefined, cacheControlHeader(300))
  } catch (error) {
    return handleApiError(error, 'Retention Analytics')
  }
}
