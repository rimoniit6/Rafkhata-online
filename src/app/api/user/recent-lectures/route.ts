import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'প্রমাণীকরণ প্রয়োজন' }, { status: 401 })
    }

    const userId = auth.user.id
    const limit = 10

    const rawItems = await db.recentlyViewed.findMany({
      where: { userId, contentType: 'lecture' },
      orderBy: { viewedAt: 'desc' },
    })

    const seen = new Set<string>()
    const recentItems: typeof rawItems = []
    for (const item of rawItems) {
      if (!seen.has(item.contentId)) {
        seen.add(item.contentId)
        recentItems.push(item)
      }
      if (recentItems.length >= limit) break
    }

    if (recentItems.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const lectureIds = recentItems.map(item => item.contentId)

    const lectures = await db.lecture.findMany({
      where: { id: { in: lectureIds }, isActive: true },
      select: {
        id: true,
        title: true,
        chapter: {
          select: {
            name: true,
            subject: { select: { name: true } },
          },
        },
      },
    })

    const lectureMap = new Map(lectures.map(l => [l.id, l]))

    const progressRecords = await db.progress.findMany({
      where: { userId, contentType: 'lecture', contentId: { in: lectureIds } },
      select: { contentId: true, progress: true },
    })

    const progressMap = new Map(progressRecords.map(p => [p.contentId, p.progress]))

    const result = recentItems.map(item => {
      const lecture = lectureMap.get(item.contentId)
      return {
        id: item.contentId,
        title: item.title || lecture?.title || 'অজানা লেকচার',
        subject: lecture?.chapter?.subject?.name || '',
        chapter: lecture?.chapter?.name || '',
        progress: progressMap.get(item.contentId) ?? 0,
        viewedAt: item.viewedAt,
      }
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Recent lectures error:', error)
    return NextResponse.json({ error: 'তথ্য আনতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
