import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiError, withCsrf } from '@/lib/api-utils'

const VALID_CONTENT_TYPES = ['lecture', 'mcq', 'cq']

// GET: Get recently viewed items for the authenticated user
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    // Build where clause
    const where: { userId: string; contentType?: string } = { userId }
    if (contentType && VALID_CONTENT_TYPES.includes(contentType)) {
      where.contentType = contentType
    }

    const recentlyViewedItems = await db.recentlyViewed.findMany({
      where,
      orderBy: { viewedAt: 'desc' },
      take: limit,
    })

    // Batch-resolve content titles to avoid N+1 queries
    const byType: Record<string, string[]> = {}
    for (const item of recentlyViewedItems) {
      if (!byType[item.contentType]) byType[item.contentType] = []
      byType[item.contentType].push(item.contentId)
    }
    const titleMap = new Map<string, string>()
    const queries = Object.entries(byType).map(async ([type, ids]) => {
      if (type === 'mcq') {
        const mcqs = await db.mCQ.findMany({ where: { id: { in: ids } }, select: { id: true, question: true } })
        for (const m of mcqs) titleMap.set(m.id, m.question.length > 80 ? m.question.substring(0, 80) + '...' : m.question)
      } else if (type === 'cq') {
        const cqs = await db.cQ.findMany({ where: { id: { in: ids } }, select: { id: true, uddeepok: true } })
        for (const c of cqs) titleMap.set(c.id, c.uddeepok.length > 80 ? c.uddeepok.substring(0, 80) + '...' : c.uddeepok)
      } else if (type === 'lecture') {
        const lectures = await db.lecture.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
        for (const l of lectures) titleMap.set(l.id, l.title)
      }
    })
    await Promise.all(queries)

    const enrichedItems = recentlyViewedItems.map((item) => ({
      id: item.id,
      contentId: item.contentId,
      contentType: item.contentType,
      title: titleMap.get(item.contentId) || item.title || 'অজানা কন্টেন্ট',
      viewedAt: item.viewedAt,
    }))

    return NextResponse.json({
      success: true,
      data: { items: enrichedItems },
    })
  } catch (error) {
    console.error('Get recently viewed error:', error)
    return apiError('সাম্প্রতিক দেখা আইটেম আনতে সমস্যা হয়েছে', 500)
  }
}

// POST: Record a recently viewed item
export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const userId = auth.user.id
    const body = await request.json()
    const { contentId, contentType, title } = body

    if (!contentId || !contentType) {
      return apiError('contentId এবং contentType আবশ্যক', 400)
    }

    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return apiError('contentType অবশ্যই lecture, mcq, বা cq হতে হবে', 400)
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return apiError('title আবশ্যক', 400)
    }

    // Upsert: if already exists, update viewedAt timestamp
    const existing = await db.recentlyViewed.findFirst({
      where: {
        userId,
        contentId,
        contentType,
      },
    })

    if (existing) {
      await db.recentlyViewed.update({
        where: { id: existing.id },
        data: {
          viewedAt: new Date(),
          title: title.trim(),
        },
      })
    } else {
      await db.recentlyViewed.create({
        data: {
          userId,
          contentId,
          contentType,
          title: title.trim(),
          viewedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Record recently viewed error:', error)
    return apiError('সাম্প্রতিক দেখা রেকর্ড করতে সমস্যা হয়েছে', 500)
  }
}
