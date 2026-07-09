import { db } from '@/lib/db'
import { apiResponse, withAuth } from '@/lib/api-utils'
import { handleApiError, logError } from '@/lib/errors'
import { getContentTypeLabels } from '@/lib/content-type-labels'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const contentTypeLabels = await getContentTypeLabels()

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where: { userId } }),
    ])

    const contentIdsByType: Record<string, string[]> = {}
    const needResolve: typeof payments = []

    for (const p of payments) {
      if (p.contentTitle) continue
      if (p.contentType && p.contentId) {
        if (!contentIdsByType[p.contentType]) contentIdsByType[p.contentType] = []
        contentIdsByType[p.contentType].push(p.contentId)
        needResolve.push(p)
      }
    }

    const titleMap: Record<string, string> = {}

    for (const [type, ids] of Object.entries(contentIdsByType)) {
      try {
        switch (type) {
          case 'mcq':
          case 'board-mcq': {
            const items = await db.mCQ.findMany({
              where: { id: { in: ids } },
              select: { id: true, question: true },
            })
            for (const item of items) {
              titleMap[`${type}:${item.id}`] = item.question?.slice(0, 80) || contentTypeLabels['mcq'] || 'MCQ প্রশ্ন'
            }
            break
          }
          case 'cq':
          case 'board-cq': {
            const items = await db.cQ.findMany({
              where: { id: { in: ids } },
              select: { id: true, uddeepok: true },
            })
            for (const item of items) {
              titleMap[`${type}:${item.id}`] = item.uddeepok?.slice(0, 80) || contentTypeLabels['cq'] || 'সৃজনশীল প্রশ্ন'
            }
            break
          }
          case 'lecture': {
            const items = await db.lecture.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true },
            })
            for (const item of items) {
              titleMap[`lecture:${item.id}`] = item.title || contentTypeLabels['lecture'] || 'লেকচার'
            }
            break
          }
          case 'suggestion': {
            const items = await db.suggestion.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true },
            })
            for (const item of items) {
              titleMap[`suggestion:${item.id}`] = item.title || contentTypeLabels['suggestion'] || 'সাজেশন'
            }
            break
          }
          case 'exam': {
            const items = await db.exam.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true },
            })
            for (const item of items) {
              titleMap[`exam:${item.id}`] = item.title || contentTypeLabels['exam'] || 'পরীক্ষা'
            }
            break
          }
          case 'bundle': {
            const items = await db.contentBundle.findMany({
              where: { id: { in: ids } },
              select: { id: true, title: true },
            })
            for (const item of items) {
              titleMap[`bundle:${item.id}`] = item.title || contentTypeLabels['bundle'] || 'বান্ডেল'
            }
            break
          }
        }
      } catch {
        // type not batchable, skip
      }
    }

    const enrichedPayments = payments.map((payment) => {
      let contentTitle = payment.contentTitle || ''

      if (!contentTitle && payment.contentType && payment.contentId) {
        contentTitle = titleMap[`${payment.contentType}:${payment.contentId}`] || ''
      }

      if (contentTitle && !payment.contentTitle && payment.id) {
        try {
          db.payment.update({
            where: { id: payment.id },
            data: { contentTitle },
          }).catch((error) => logError(error, 'User payments update contentTitle'))
        } catch (error) { logError(error, 'User payments update contentTitle') }
      }

      return {
        id: payment.id,
        contentType: payment.contentType || 'unknown',
        contentId: payment.contentId || '',
        contentTitle: contentTitle || contentTypeLabels[payment.contentType || ''] || `${payment.contentType || 'কন্টেন্ট'}`,
        amount: payment.amount,
        method: payment.method,
        transactionId: payment.transactionId,
        status: payment.status,
        adminNote: payment.adminNote || null,
        createdAt: payment.createdAt,
        reviewedAt: payment.reviewedAt,
      }
    })

    return apiResponse({
      payments: enrichedPayments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, 'Get user payments')
  }
}
