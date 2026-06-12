import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'
import { apiError, withCsrf } from '@/lib/api-utils'

const VALID_CONTENT_TYPES = ['mcq', 'cq', 'lecture']

const batchCheckSchema = z.object({
  items: z.array(z.object({
    contentId: z.string(),
    contentType: z.string(),
  })).max(100, 'সর্বোচ্চ ১০০টি আইটেম চেক করা যাবে'),
})

// POST: Batch check if multiple content items are bookmarked
export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'প্রমাণীকরণ প্রয়োজন' },
        { status: 401 }
      )
    }

    const userId = auth.user.id
    const body = await request.json()
    const validation = batchCheckSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'অবৈধ অনুরোধ', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { items } = validation.data

    // Validate contentTypes
    const invalidTypes = items.filter(
      (item) => !VALID_CONTENT_TYPES.includes(item.contentType)
    )
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'contentType অবশ্যই mcq, cq, বা lecture হতে হবে' },
        { status: 400 }
      )
    }

    // Build OR conditions for a single query
    const orConditions = items.map((item) => ({
      userId,
      contentId: item.contentId,
      contentType: item.contentType,
    }))

    // Fetch all matching bookmarks in one query
    const bookmarks = await db.bookmark.findMany({
      where: {
        OR: orConditions.map((cond) => ({
          contentId: cond.contentId,
          contentType: cond.contentType,
          userId: cond.userId,
        })),
      },
      select: {
        contentId: true,
        contentType: true,
      },
    })

    // Build a Set for O(1) lookup
    const bookmarkSet = new Set(
      bookmarks.map((b) => `${b.contentId}::${b.contentType}`)
    )

    const results = items.map((item) => ({
      contentId: item.contentId,
      contentType: item.contentType,
      isBookmarked: bookmarkSet.has(`${item.contentId}::${item.contentType}`),
    }))

    return NextResponse.json({
      success: true,
      data: { items: results },
    })
  } catch (error) {
    console.error('Batch check bookmarks error:', error)
    return NextResponse.json(
      { success: false, error: 'বুকমার্ক যাচাই করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
