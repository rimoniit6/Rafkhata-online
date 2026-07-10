import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { parseAnalyticsDateRange } from '@/lib/analytics-date-range'
import { toDecimal } from '@/lib/decimal'
import { cacheControlHeader } from '@/lib/analytics-cache'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const { fromDate, toDate, prevFromDate, prevToDate } = parseAnalyticsDateRange(searchParams)

    const [
      totalStudents,
      newStudents,
      prevNewStudents,
      allUsers,
      progressRecords,
      lectures,
      views,
      totalRevenueAgg,
      sessionAgg,
      lectureProgressForChapters,
    ] = await Promise.all([
      db.user.count({ where: { role: 'STUDENT' } }),
      db.user.count({ where: { role: 'STUDENT', createdAt: { gte: fromDate, lte: toDate } } }),
      db.user.count({ where: { role: 'STUDENT', createdAt: { gte: prevFromDate, lte: prevToDate } } }),
      db.user.findMany({
        where: { role: 'STUDENT', createdAt: { gte: fromDate, lte: toDate } },
        select: { id: true, createdAt: true, classLevel: true },
        orderBy: { createdAt: 'asc' },
      }),
      db.progress.findMany({
        where: { lastAccessed: { gte: fromDate, lte: toDate } },
        select: { userId: true, contentType: true, lastAccessed: true },
      }),
      db.lecture.findMany({ where: { isActive: true }, select: { id: true, chapterId: true } }),
      db.progress.findMany({
        where: { lastAccessed: { gte: fromDate, lte: toDate }, contentType: 'lecture' },
        select: { userId: true, lastAccessed: true },
      }),
      // Student lifetime value = total approved revenue / total students.
      db.payment.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      // Average session duration from AnalyticsSession.
      db.analyticsSession.aggregate({
        where: { duration: { not: null } },
        _avg: { duration: true },
      }),
      // For most-active chapter/subject/class: lecture progress joined to chapter hierarchy.
      db.progress.findMany({
        where: { contentType: 'lecture', lastAccessed: { gte: fromDate, lte: toDate } },
        select: { contentId: true },
      }),
    ])

    const studentGrowthRate = prevNewStudents > 0 ? Math.round(((newStudents - prevNewStudents) / prevNewStudents) * 100 * 100) / 100 : 0

    const activeUsers = new Set(progressRecords.map((p) => p.userId))
    const returningStudents = activeUsers.size
    const newStudentIds = new Set(allUsers.map((u) => u.id))
    const exclusivelyNew = new Set([...newStudentIds].filter((id) => !activeUsers.has(id) || progressRecords.filter((p) => p.userId === id).length <= 1))

    const dauMap = new Map<string, Set<string>>()
    const wauMap = new Map<string, Set<string>>()
    const mauMap = new Map<string, Set<string>>()

    progressRecords.forEach((p) => {
      const d = new Date(p.lastAccessed)
      const dayKey = d.toISOString().split('T')[0]
      const weekKey = getWeekKey(d)
      const monthKey = d.toISOString().slice(0, 7)

      if (!dauMap.has(dayKey)) dauMap.set(dayKey, new Set())
      dauMap.get(dayKey)!.add(p.userId)

      if (!wauMap.has(weekKey)) wauMap.set(weekKey, new Set())
      wauMap.get(weekKey)!.add(p.userId)

      if (!mauMap.has(monthKey)) mauMap.set(monthKey, new Set())
      mauMap.get(monthKey)!.add(p.userId)
    })

    const dau = Array.from(dauMap.entries())
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const wau = Array.from(wauMap.entries())
      .map(([week, users]) => ({ week, count: users.size }))
      .sort((a, b) => a.week.localeCompare(b.week))

    const mau = Array.from(mauMap.entries())
      .map(([month, users]) => ({ month, count: users.size }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const monthlySignups = Array.from(
      allUsers.reduce((map, u) => {
        const key = u.createdAt.toISOString().slice(0, 7)
        map.set(key, (map.get(key) || 0) + 1)
        return map
      }, new Map<string, number>())
    )
      .map(([month, students]) => ({ month, students, newStudents: students }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const totalStudySeconds = progressRecords.reduce((sum, p) => sum + (p.contentType === 'lecture' ? 1 : 0), 0) * 300
    const averageStudyTime = activeUsers.size > 0 ? Math.round(totalStudySeconds / activeUsers.size) : 0

    // Average session duration (seconds) from AnalyticsSession.duration where recorded.
    const averageSessionDuration = sessionAgg._avg.duration
      ? Math.round(sessionAgg._avg.duration)
      : 0

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourCounts = hours.map((h) => ({
      hour: h,
      count: views.filter((v) => new Date(v.lastAccessed).getHours() === h).length,
    }))
    const mostActiveTime = `${hourCounts.sort((a, b) => b.count - a.count)[0]?.hour || 0}:00`

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayCounts = days.map((day) => ({
      day,
      count: views.filter((v) => days[new Date(v.lastAccessed).getDay()] === day).length,
    }))
    const mostActiveDay = dayCounts.sort((a, b) => b.count - a.count)[0]?.day || 'Sun'

    // --- mostActiveChapter / Subject / Class ---
    // Map lectureId → chapterId, then resolve chapter → subject → class.
    const lectureToChapter = new Map(lectures.map((l) => [l.id, l.chapterId]))
    const accessedChapterIds = new Set<string>()
    lectureProgressForChapters.forEach((p) => {
      const chapterId = lectureToChapter.get(p.contentId)
      if (chapterId) accessedChapterIds.add(chapterId)
    })

    let mostActiveChapter = ''
    let mostActiveSubject = ''
    let mostActiveClass = ''

    if (accessedChapterIds.size > 0) {
      const chapters = await db.chapter.findMany({
        where: { id: { in: Array.from(accessedChapterIds) } },
        select: {
          id: true,
          name: true,
          subject: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
        },
      })
      // Count accesses per chapter (via lecture progress → chapter mapping).
      const chapterAccessCount = new Map<string, number>()
      lectureProgressForChapters.forEach((p) => {
        const chapterId = lectureToChapter.get(p.contentId)
        if (chapterId) chapterAccessCount.set(chapterId, (chapterAccessCount.get(chapterId) || 0) + 1)
      })
      const subjectAccessCount = new Map<string, number>()
      const classAccessCount = new Map<string, number>()
      const chapterById = new Map(chapters.map((c) => [c.id, c]))
      chapterAccessCount.forEach((count, chapterId) => {
        const ch = chapterById.get(chapterId)
        if (!ch) return
        subjectAccessCount.set(ch.subject.id, (subjectAccessCount.get(ch.subject.id) || 0) + count)
        classAccessCount.set(ch.subject.class.id, (classAccessCount.get(ch.subject.class.id) || 0) + count)
      })
      const topChapter = Array.from(chapterAccessCount.entries()).sort((a, b) => b[1] - a[1])[0]
      const topSubject = Array.from(subjectAccessCount.entries()).sort((a, b) => b[1] - a[1])[0]
      const topClass = Array.from(classAccessCount.entries()).sort((a, b) => b[1] - a[1])[0]
      mostActiveChapter = topChapter ? chapterById.get(topChapter[0])?.name ?? '' : ''
      mostActiveSubject = topSubject ? chapters.find((c) => c.subject.id === topSubject[0])?.subject.name ?? '' : ''
      mostActiveClass = topClass ? chapters.find((c) => c.subject.class.id === topClass[0])?.subject.class.name ?? '' : ''
    }

    // --- studentLifetimeValue ---
    const studentLifetimeValue = totalStudents > 0
      ? Math.round(((toDecimal(totalRevenueAgg._sum.amount || 0)) / totalStudents) * 100) / 100
      : 0

    // --- retentionCurve: day1/7/14/30/60/90 retention for the cohort signed up in-window ---
    const retentionCurve = computeRetentionCurve(allUsers, progressRecords)

    return apiResponse({
      totalStudents,
      newStudents,
      returningStudents: returningStudents - exclusivelyNew.size,
      dailyActiveUsers: dau.length > 0 ? dau[dau.length - 1].count : 0,
      weeklyActiveUsers: wau.length > 0 ? wau[wau.length - 1].count : 0,
      monthlyActiveUsers: mau.length > 0 ? mau[mau.length - 1].count : 0,
      averageStudyTime,
      averageSessionDuration,
      mostActiveTime,
      mostActiveDay,
      mostActiveClass,
      mostActiveSubject,
      mostActiveChapter,
      studentGrowthRate,
      studentLifetimeValue,
      engagementScore: activeUsers.size > 0 ? Math.round((returningStudents / totalStudents) * 100) : 0,
      dau,
      wau,
      mau,
      retentionCurve,
      growth: monthlySignups,
    }, null, undefined, cacheControlHeader(120))
  } catch (error) {
    return handleApiError(error, 'Student Analytics')
  }
}

/**
 * Retention curve for the cohort of users who signed up within the window.
 * For each offset day (1,7,14,30,60,90), the % of the cohort that still had
 * activity (a Progress row) at or after signup+offset.
 */
function computeRetentionCurve(
  users: Array<{ id: string; createdAt: Date }>,
  progressRecords: Array<{ userId: string; lastAccessed: Date }>,
): Array<{ day: number; rate: number }> {
  const offsets = [1, 7, 14, 30, 60, 90]
  if (users.length === 0) return offsets.map((day) => ({ day, rate: 0 }))

  // lastAccessed per user across ALL time (not windowed) for a true retention read.
  const lastAccessByUser = new Map<string, Date>()
  progressRecords.forEach((p) => {
    const prev = lastAccessByUser.get(p.userId)
    if (!prev || p.lastAccessed > prev) lastAccessByUser.set(p.userId, p.lastAccessed)
  })

  return offsets.map((day) => {
    let retained = 0
    users.forEach((u) => {
      const last = lastAccessByUser.get(u.id)
      if (!last) return
      const cutoff = new Date(u.createdAt.getTime() + day * 86_400_000)
      if (last >= cutoff) retained++
    })
    return { day, rate: Math.round((retained / users.length) * 10000) / 100 }
  })
}

function getWeekKey(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
