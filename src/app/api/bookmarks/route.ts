import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiResponse, apiError, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

const VALID_CONTENT_TYPES = ['mcq', 'cq', 'lecture']

async function getContentTitle(contentId: string, contentType: string): Promise<string | null> {
  try {
    if (contentType === 'mcq') {
      const mcq = await db.mCQ.findUnique({ where: { id: contentId }, select: { question: true } })
      if (mcq) return mcq.question.length > 80 ? mcq.question.substring(0, 80) + '...' : mcq.question
    } else if (contentType === 'cq') {
      const cq = await db.cQ.findUnique({ where: { id: contentId }, select: { uddeepok: true } })
      if (cq) return cq.uddeepok.length > 80 ? cq.uddeepok.substring(0, 80) + '...' : cq.uddeepok
    } else if (contentType === 'lecture') {
      const lecture = await db.lecture.findUnique({ where: { id: contentId }, select: { title: true } })
      if (lecture) return lecture.title
    }
  } catch { /* */ }
  return null
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

    const enrichedBookmarks = await Promise.all(
      bookmarks.map(async (bookmark) => ({
        id: bookmark.id,
        contentId: bookmark.contentId,
        contentType: bookmark.contentType,
        title: (await getContentTitle(bookmark.contentId, bookmark.contentType)) || 'অজানা কন্টেন্ট',
        createdAt: bookmark.createdAt,
      }))
    )

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
