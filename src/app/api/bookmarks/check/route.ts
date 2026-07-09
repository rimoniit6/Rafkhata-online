import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

// GET: Check if specific content is bookmarked
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const contentType = searchParams.get('contentType')

    if (!contentId || !contentType) {
      return apiError('contentId এবং contentType আবশ্যক', 400)
    }

    const validContentTypes = ['mcq', 'cq', 'lecture']
    if (!validContentTypes.includes(contentType)) {
      return apiError('contentType অবশ্যই mcq, cq, বা lecture হতে হবে', 400)
    }

    const bookmark = await db.bookmark.findUnique({
      where: {
        userId_contentId_contentType: {
          userId,
          contentId,
          contentType,
        },
      },
      select: { id: true },
    })

    return NextResponse.json({
      success: true,
      data: { isBookmarked: !!bookmark },
    })
  } catch (error) {
    console.error('Check bookmark error:', error)
    return apiError('বুকমার্ক যাচাই করতে সমস্যা হয়েছে', 500)
  }
}
