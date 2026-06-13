import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const suggestion = await db.suggestion.findUnique({
      where: { id, isActive: true },
    })

    if (!suggestion) {
      return apiError('সাজেশন খুঁজে পাওয়া যায়নি', 404)
    }

    // Increment view count
    await db.suggestion.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    // Look up related entity names
    const [classData, subjectData, chapterData] = await Promise.all([
      suggestion.classId
        ? db.classCategory.findUnique({ where: { id: suggestion.classId }, select: { id: true, name: true, slug: true } })
        : null,
      suggestion.subjectId
        ? db.subject.findUnique({ where: { id: suggestion.subjectId }, select: { id: true, name: true, slug: true } })
        : null,
      suggestion.chapterId
        ? db.chapter.findUnique({ where: { id: suggestion.chapterId }, select: { id: true, name: true, slug: true } })
        : null,
    ])

    const base = {
      id: suggestion.id,
      title: suggestion.title,
      slug: suggestion.slug,
      classId: suggestion.classId,
      subjectId: suggestion.subjectId,
      chapterId: suggestion.chapterId,
      className: classData?.name || null,
      subjectName: subjectData?.name || null,
      chapterName: chapterData?.name || null,
      thumbnail: suggestion.thumbnail,
      pdfUrl: suggestion.pdfUrl,
      isPremium: suggestion.isPremium,
      price: suggestion.price,
      viewCount: suggestion.viewCount + 1,
      order: suggestion.order,
      isActive: suggestion.isActive,
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt,
    }

    // If premium, check if user is premium or has purchased this content
    if (suggestion.isPremium) {
      // Use JWT auth instead of x-user-id header
      const auth = await verifyAuth(request)
      const userId = auth?.user.id

      if (userId) {
        // Check if user has premium override (admin-assigned)
        const isUserPremium = auth!.user.isPremium

        if (isUserPremium) {
          return NextResponse.json({ success: true, ...base, content: suggestion.content })
        }

        // Check if user has an approved payment for this content
        const approvedPayment = await db.payment.findFirst({
          where: {
            userId,
            contentType: 'suggestion',
            contentId: suggestion.id,
            status: 'approved',
          },
          select: { id: true },
        })

        if (approvedPayment) {
          return NextResponse.json({ success: true, ...base, content: suggestion.content, purchased: true })
        }
      }

      // Not premium user and hasn't purchased - return basic info without content
      return NextResponse.json({ success: true, ...base, content: null })
    }

    // Non-premium suggestion - return full content
    return NextResponse.json({ success: true, ...base, content: suggestion.content })
  } catch (error) {
    console.error('Get Suggestion detail error:', error)
    return apiError('সাজেশনের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}
