import { db } from '@/lib/db'
import { apiResponse } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const contentTypes = await db.contentType.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return apiResponse(contentTypes)
  } catch (error) {
    return handleApiError(error, 'Get content types error')
  }
}
