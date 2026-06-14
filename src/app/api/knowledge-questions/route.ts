import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const type = searchParams.get('type')

    if (!chapterId) return apiError('chapterId is required', 400)

    const where: Record<string, unknown> = { chapterId, isActive: true }
    if (type) where.type = type

    const data = await db.knowledgeQuestion.findMany({
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
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Get Knowledge Questions')
  }
}
