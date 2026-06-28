import { apiError,apiResponse,withCsrf } from '@/lib/api-utils'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { handleApiError,logError } from '@/lib/errors'

const VALID_CONTENT_TYPES = ['lecture', 'mcq', 'cq']

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
  } catch (error) { logError(error, 'getContentTitle') }
  return null
}

// GET: Get progress for the authenticated user
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return apiError('প্রমাণীকরণ প্রয়োজন', 401, 'UNAUTHORIZED')

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const contentId = searchParams.get('contentId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const where: { userId: string; contentType?: string; contentId?: string } = { userId }
    if (contentType && VALID_CONTENT_TYPES.includes(contentType)) where.contentType = contentType
    if (contentId) where.contentId = contentId

    const [progressRecords, total] = await Promise.all([
      db.progress.findMany({ where, orderBy: { lastAccessed: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.progress.count({ where }),
    ])

    // Batch-resolve titles
    const byType: Record<string, string[]> = {}
    for (const r of progressRecords) {
      if (!byType[r.contentType]) byType[r.contentType] = []
      byType[r.contentType].push(r.contentId)
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

    const enrichedProgress = progressRecords.map((record) => ({
      id: record.id,
      contentId: record.contentId,
      contentType: record.contentType,
      progress: record.progress,
      lastAccessed: record.lastAccessed,
      title: titleMap.get(record.contentId) || 'অজানা কন্টেন্ট',
    }))

    return apiResponse({
      progress: enrichedProgress,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, 'Get progress error')
  }
}

// POST / PUT: Update progress for a content item
export async function POST(request: Request) {
  return handleProgressUpdate(request)
}

export async function PUT(request: Request) {
  return handleProgressUpdate(request)
}

async function handleProgressUpdate(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) return apiError('প্রমাণীকরণ প্রয়োজন', 401, 'UNAUTHORIZED')

    const userId = auth.user.id
    const body = await request.json()
    const { contentId, contentType, progress: progressValue } = body

    if (!contentId || !contentType) return apiError('contentId এবং contentType আবশ্যক', 400)
    if (!VALID_CONTENT_TYPES.includes(contentType)) return apiError('contentType অবশ্যই lecture, mcq, বা cq হতে হবে', 400)
    if (typeof progressValue !== 'number' || progressValue < 0 || progressValue > 100) return apiError('progress অবশ্যই ০ থেকে ১০০ এর মধ্যে হতে হবে', 400)

    const updatedProgress = await db.$transaction(async (tx) => {
      const progress = await tx.progress.upsert({
        where: { userId_contentId_contentType: { userId, contentId, contentType } },
        update: { progress: progressValue, lastAccessed: new Date() },
        create: { userId, contentId, contentType, progress: progressValue, lastAccessed: new Date() },
      })

      // Update RecentlyViewed
      const title = await getContentTitle(contentId, contentType)
      const recentlyViewedTitle = title || `${contentType} - ${contentId}`

      const existingRecent = await tx.recentlyViewed.findFirst({ where: { userId, contentId, contentType } })
      if (existingRecent) {
        await tx.recentlyViewed.update({ where: { id: existingRecent.id }, data: { viewedAt: new Date(), title: recentlyViewedTitle } })
      } else {
        await tx.recentlyViewed.create({ data: { userId, contentId, contentType, title: recentlyViewedTitle, viewedAt: new Date() } })
      }

      return progress
    })

    return apiResponse({ progress: updatedProgress.progress })
  } catch (error) {
    return handleApiError(error, 'Update progress error')
  }
}
