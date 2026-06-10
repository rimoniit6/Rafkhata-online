import { db } from '@/lib/db'
import { apiResponse, withAuth } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { getContentTypeLabels } from '@/lib/content-type-labels'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const userId = auth.user.id
    const contentTypeLabels = await getContentTypeLabels()

    const payments = await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        if (payment.contentTitle) {
          return {
            id: payment.id,
            contentType: payment.contentType || 'unknown',
            contentId: payment.contentId || '',
            contentTitle: payment.contentTitle,
            amount: payment.amount,
            method: payment.method,
            transactionId: payment.transactionId,
            status: payment.status,
            adminNote: payment.adminNote || null,
            createdAt: payment.createdAt,
            reviewedAt: payment.reviewedAt,
          }
        }

        let contentTitle = ''

        if (payment.contentType && payment.contentId) {
          try {
            switch (payment.contentType) {
              case 'mcq':
              case 'board-mcq': {
                const mcq = await db.mCQ.findUnique({
                  where: { id: payment.contentId },
                  select: { question: true },
                })
                contentTitle = mcq?.question?.slice(0, 80) || contentTypeLabels['mcq'] || 'MCQ প্রশ্ন'
                break
              }
              case 'cq':
              case 'board-cq': {
                const cq = await db.cQ.findUnique({
                  where: { id: payment.contentId },
                  select: { uddeepok: true },
                })
                contentTitle = cq?.uddeepok?.slice(0, 80) || contentTypeLabels['cq'] || 'সৃজনশীল প্রশ্ন'
                break
              }
              case 'lecture': {
                const lecture = await db.lecture.findUnique({
                  where: { id: payment.contentId },
                  select: { title: true },
                })
                contentTitle = lecture?.title || contentTypeLabels['lecture'] || 'লেকচার'
                break
              }
              case 'suggestion': {
                const suggestion = await db.suggestion.findUnique({
                  where: { id: payment.contentId },
                  select: { title: true },
                })
                contentTitle = suggestion?.title || contentTypeLabels['suggestion'] || 'সাজেশন'
                break
              }
              case 'exam': {
                const exam = await db.exam.findUnique({
                  where: { id: payment.contentId },
                  select: { title: true },
                })
                contentTitle = exam?.title || contentTypeLabels['exam'] || 'পরীক্ষা'
                break
              }
              case 'bundle': {
                const bundle = await db.contentBundle.findUnique({
                  where: { id: payment.contentId },
                  select: { title: true },
                })
                contentTitle = bundle?.title || contentTypeLabels['bundle'] || 'বান্ডেল'
                break
              }
            }
          } catch {
            contentTitle = payment.contentType
          }
        }

        if (contentTitle && payment.id) {
          try {
            await db.payment.update({
              where: { id: payment.id },
              data: { contentTitle },
            })
          } catch { /* ignore */ }
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
    )

    return apiResponse(enrichedPayments)
  } catch (error) {
    return handleApiError(error, 'Get user payments')
  }
}
