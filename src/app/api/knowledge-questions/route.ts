import { db } from '@/lib/db'
import { apiResponse, apiError, applyRateLimit } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { verifyAuth } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const type = searchParams.get('type')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

    if (!chapterId) return apiError('chapterId is required', 400)

    const where: Record<string, unknown> = { chapterId, isActive: true }
    if (type) where.type = type

    const [data, total] = await Promise.all([
      db.knowledgeQuestion.findMany({
        where,
        select: {
          id: true,
          type: true,
          question: true,
          answer: true,
          questionImage: true,
          answerImage: true,
          isPremium: true,
          price: true,
          order: true,
        },
        orderBy: [{ type: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.knowledgeQuestion.count({ where }),
    ])

    // Access control — strip answers for unauthenticated/unsubscribed users
    const auth = await verifyAuth(request)
    let premiumIds = new Set<string>()

    if (auth) {
      // Resolve chapter's class level for subscription check
      const chapter = await db.chapter.findUnique({
        where: { id: chapterId },
        select: { subject: { select: { classId: true } } },
      })
      if (chapter) {
        const classCat = await db.classCategory.findUnique({
          where: { id: chapter.subject.classId },
          select: { slug: true },
        })
        if (classCat) {
          const sub = await db.userSubscription.findFirst({
            where: {
              userId: auth.user.id,
              classLevel: classCat.slug,
              isActive: true,
              endDate: { gte: new Date() },
            },
            select: { id: true },
          })
          if (!sub) {
            // No subscription — mark all premium items as locked
            premiumIds = new Set(data.filter(d => d.isPremium).map(d => d.id))
          }
        } else {
          premiumIds = new Set(data.filter(d => d.isPremium).map(d => d.id))
        }
      } else {
        premiumIds = new Set(data.filter(d => d.isPremium).map(d => d.id))
      }
    } else {
      // Not authenticated — all premium items locked
      premiumIds = new Set(data.filter(d => d.isPremium).map(d => d.id))
    }

    const result = data.map(item => {
      if (premiumIds.has(item.id)) {
        return { ...item, answer: null, answerImage: null }
      }
      return item
    })

    return apiResponse({ data: result, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return handleApiError(error, 'Get Knowledge Questions')
  }
}
