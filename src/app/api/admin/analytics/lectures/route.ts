import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { parseAnalyticsDateRange } from '@/lib/analytics-date-range'
import type { LectureAnalytics } from '@/types/analytics'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const { fromDate, toDate } = parseAnalyticsDateRange(searchParams)

    const [topViews, lectureProgressAgg, allLectureProgress, bookmarkCount, noteCount, aiChatCount, downloadCount, watchTimeAgg, lecturesWithDuration] =
      await Promise.all([
        db.progress.groupBy({
          by: ['contentId'],
          where: { contentType: 'lecture', lastAccessed: { gte: fromDate, lte: toDate } },
          _count: true,
          orderBy: { _count: { contentId: 'desc' } },
          take: 1,
        }),
        db.progress.aggregate({
          where: { contentType: 'lecture' },
          _count: true,
          _avg: { progress: true },
        }),
        db.progress.findMany({
          where: { contentType: 'lecture' },
          select: { progress: true },
        }),
        db.bookmark.count(),
        db.note.count(),
        db.analyticsEvent.count({
          where: { eventType: { contains: 'ai_chat' }, createdAt: { gte: fromDate, lte: toDate } },
        }),
        db.analyticsEvent.count({
          where: { eventType: { contains: 'download' }, createdAt: { gte: fromDate, lte: toDate } },
        }),
        // Primary source: AnalyticsEvent rows for lecture views that carry a duration.
        db.analyticsEvent.aggregate({
          where: {
            entityType: 'lecture',
            duration: { not: null },
            createdAt: { gte: fromDate, lte: toDate },
          },
          _avg: { duration: true },
        }),
        // Fallback source: lecture durations (seconds) joined with avg completion ratio.
        db.lecture.findMany({
          where: { isActive: true, duration: { gt: 0 } },
          select: { duration: true },
        }),
      ])

    // mostViewed
    const topLectureId = topViews[0]?.contentId
    const topViewCount = topViews[0]?._count || 0
    let mostViewed: { id: string; title: string; views: number }

    if (topLectureId) {
      const lecture = await db.lecture.findUnique({
        where: { id: topLectureId },
        select: { id: true, title: true },
      })
      mostViewed = lecture
        ? { id: lecture.id, title: lecture.title, views: topViewCount }
        : { id: '', title: 'Unknown', views: topViewCount }
    } else {
      mostViewed = { id: '', title: 'No lectures', views: 0 }
    }

    // completionPercent
    const totalLectures = lectureProgressAgg._count || 0
    const completedLectures = allLectureProgress.filter(p => p.progress >= 100).length
    const completionPercent = totalLectures > 0
      ? Math.round((completedLectures / totalLectures) * 10000) / 100
      : 0

    // dropOffTime (incomplete lectures)
    const incomplete = allLectureProgress.filter(p => p.progress < 100)
    const dropOffTime = incomplete.length > 0
      ? Math.round(incomplete.reduce((s, p) => s + p.progress, 0) / incomplete.length * 100) / 100
      : 0

    // averageWatchTime: prefer real per-view durations from AnalyticsEvent; fall back to
    // avg lecture length × avg completion fraction.
    let averageWatchTime: number
    if (watchTimeAgg._avg.duration) {
      averageWatchTime = Math.round(watchTimeAgg._avg.duration)
    } else if (lecturesWithDuration.length > 0 && lectureProgressAgg._avg.progress) {
      const avgLength = lecturesWithDuration.reduce((s, l) => s + l.duration, 0) / lecturesWithDuration.length
      averageWatchTime = Math.round(avgLength * (lectureProgressAgg._avg.progress / 100))
    } else {
      averageWatchTime = 0
    }

    return apiResponse({
      mostViewed,
      averageWatchTime,
      completionPercent,
      dropOffTime,
      totalBookmarks: bookmarkCount,
      totalNotes: noteCount,
      aiChatUsage: aiChatCount,
      totalDownloads: downloadCount,
    } satisfies LectureAnalytics)
  } catch (error) {
    return handleApiError(error, 'Lecture Analytics')
  }
}
