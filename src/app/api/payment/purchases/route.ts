import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiLimiter, getClientIdentifier, rateLimitHeaders } from '@/lib/rate-limit'
import { getContentTypeLabels } from '@/lib/content-type-labels'

async function resolveContentTitle(
  contentType: string,
  contentId: string
): Promise<string | null> {
  try {
    switch (contentType) {
      case 'mcq':
      case 'board-mcq': {
        const mcq = await db.mCQ.findUnique({ where: { id: contentId }, select: { question: true } })
        return mcq ? (mcq.question.length > 80 ? mcq.question.substring(0, 80) + '...' : mcq.question) : null
      }
      case 'cq':
      case 'board-cq': {
        const cq = await db.cQ.findUnique({ where: { id: contentId }, select: { uddeepok: true } })
        return cq ? (cq.uddeepok.length > 80 ? cq.uddeepok.substring(0, 80) + '...' : cq.uddeepok) : null
      }
      case 'lecture': {
        const lecture = await db.lecture.findUnique({ where: { id: contentId }, select: { title: true } })
        return lecture ? lecture.title : null
      }
      case 'exam': {
        const exam = await db.exam.findUnique({ where: { id: contentId }, select: { title: true } })
        return exam ? exam.title : null
      }
      case 'suggestion': {
        const suggestion = await db.suggestion.findUnique({ where: { id: contentId }, select: { title: true } })
        return suggestion ? suggestion.title : null
      }
      case 'bundle': {
        const bundle = await db.contentBundle.findUnique({ where: { id: contentId }, select: { title: true } })
        return bundle ? bundle.title : null
      }
      default:
        return null
    }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    // Require authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'প্রমাণীকরণ প্রয়োজন।', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateResult = apiLimiter.limit(identifier)
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'অনেক বেশি অনুরোধ।', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      )
    }

    // Use session userId
    const userId = auth.user.id
    const contentTypeLabels = await getContentTypeLabels()

    // Fetch approved payments as purchases (replaces broken contentPurchase)
    const payments = await db.payment.findMany({
      where: { userId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
    })

    const purchases = await Promise.all(
      payments.map(async (payment) => {
        const contentTitle = payment.contentTitle || await resolveContentTitle(payment.contentType || '', payment.contentId || '')
        return {
          id: payment.id,
          userId: payment.userId,
          contentType: payment.contentType,
          contentId: payment.contentId,
          amount: payment.amount,
          isActive: payment.isActive, // FIX: was hardcoded to true — read actual value
          createdAt: payment.createdAt,
          contentTitle,
          contentTypeLabel: contentTypeLabels[payment.contentType || ''] || payment.contentType,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        purchases,
        total: purchases.length,
        isPremium: auth.user.isPremium,
      },
    })
  } catch (error) {
    console.error('Get purchases error:', error)
    return NextResponse.json(
      { success: false, error: 'ক্রয়ের তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
