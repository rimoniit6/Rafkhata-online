import { apiError,apiResponse,withCsrf,applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/errors'

const VALID_CONTENT_TYPES = ['mcq', 'cq', 'lecture']

async function batchResolveTitles(items: { contentId: string; contentType: string }[]): Promise<Map<string, string>> {
  const titleMap = new Map<string, string>()
  const byType: Record<string, string[]> = {}
  for (const item of items) {
    if (!byType[item.contentType]) byType[item.contentType] = []
    byType[item.contentType].push(item.contentId)
  }
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
  return titleMap
}

// GET: List bookmarks for the authenticated user
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return apiError('প্রমাণীকরণ প্রয়োজন', 401, 'UNAUTHORIZED')

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const where: { userId: string; contentType?: string } = { userId }
    if (contentType && VALID_CONTENT_TYPES.includes(contentType)) where.contentType = contentType

    const [bookmarks, total] = await Promise.all([
      db.bookmark.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      db.bookmark.count({ where }),
    ])

    const titleMap = await batchResolveTitles(bookmarks)
    const enrichedBookmarks = bookmarks.map((bookmark) => ({
      id: bookmark.id,
      contentId: bookmark.contentId,
      contentType: bookmark.contentType,
      title: titleMap.get(bookmark.contentId) || 'অজানা কন্টেন্ট',
      createdAt: bookmark.createdAt,
    }))

    return apiResponse({
      bookmarks: enrichedBookmarks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error, 'Get bookmarks error')
  }
}

// POST: Add a bookmark
export async function POST(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) return apiError('প্রমাণীকরণ প্রয়োজন', 401, 'UNAUTHORIZED')

    const userId = auth.user.id
    const body = await request.json()
    const { contentId, contentType } = body

    if (!contentId || !contentType) return apiError('contentId এবং contentType আবশ্যক', 400)
    if (!VALID_CONTENT_TYPES.includes(contentType)) return apiError('contentType অবশ্যই mcq, cq, বা lecture হতে হবে', 400)

    await db.bookmark.upsert({
      where: { userId_contentId_contentType: { userId, contentId, contentType } },
      update: {},
      create: { userId, contentId, contentType },
    })

    return apiResponse({ bookmarked: true })
  } catch (error) {
    return handleApiError(error, 'Add bookmark error')
  }
}

// DELETE: Remove a bookmark
export async function DELETE(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) return apiError('প্রমাণীকরণ প্রয়োজন', 401, 'UNAUTHORIZED')

    const userId = auth.user.id
    const body = await request.json()
    const { contentId, contentType } = body

    if (!contentId || !contentType) return apiError('contentId এবং contentType আবশ্যক', 400)
    if (!VALID_CONTENT_TYPES.includes(contentType)) return apiError('contentType অবশ্যই mcq, cq, বা lecture হতে হবে', 400)

    await db.bookmark.deleteMany({ where: { userId, contentId, contentType } })

    return apiResponse({ bookmarked: false })
  } catch (error) {
    return handleApiError(error, 'Remove bookmark error')
  }
}
