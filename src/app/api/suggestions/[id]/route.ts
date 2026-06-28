import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { checkContentAccess } from '@/lib/access-control'

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

    // Access control — use checkContentAccess instead of manual isPremium check
    const auth = await verifyAuth(request)

    if (!suggestion.isPremium) {
      // Non-premium suggestion — full access for everyone
      return NextResponse.json({ success: true, ...base, content: suggestion.content })
    }

    // Premium suggestion — check access via unified system
    if (auth) {
      const access = await checkContentAccess({
        userId: auth.user.id,
        contentType: 'suggestion',
        contentId: suggestion.id,
      })

      if (access.hasAccess) {
        return NextResponse.json({ success: true, ...base, content: suggestion.content, purchased: access.reason === 'content_payment' })
      }
    }

    // No access — return basic info without content
    return NextResponse.json({ success: true, ...base, content: null })
  } catch (error) {
    console.error('Get Suggestion detail error:', error)
    return apiError('সাজেশনের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}
