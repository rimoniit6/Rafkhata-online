import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { reviewPaymentSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const contentType = searchParams.get('contentType')
    const q = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (method) where.method = method
    if (contentType) where.contentType = contentType
    if (q) {
      where.OR = [
        { transactionId: { contains: q } },
        { paymentNumber: { contains: q } },
        { contentTitle: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isPremium: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ])

    return apiResponse({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Payments')
  }
}

export async function PATCH(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const validation = validateBody(reviewPaymentSchema, body)
    if ('error' in validation) return validation.error
    const { id, status, adminNote } = validation.data

    if (status === 'rejected' && !adminNote?.trim()) {
      return apiError('প্রত্যাখ্যানের কারণ লিখুন', 400)
    }

    const existing = await db.payment.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existing) return apiError('পেমেন্ট খুঁজে পাওয়া যায়নি', 404)
    if (existing.status !== 'pending') return apiError('এই পেমেন্ট ইতিমধ্যে রিভিউ করা হয়েছে', 400)

    const updated = await db.payment.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote?.trim() || null,
        reviewedBy: auth.user.email || auth.user.id,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, isPremium: true } },
      },
    })

    // Create a notification
    try {
      const notificationTitle = status === 'approved' ? 'পেমেন্ট অনুমোদিত' : 'পেমেন্ট প্রত্যাখ্যাত'
      let notificationMessage = ''
      if (status === 'approved') {
        const contentLabel = existing.contentTitle || existing.contentType || 'কন্টেন্ট'
        notificationMessage = `আপনার "${contentLabel}" ক্রয়ের ৳${existing.amount} পেমেন্ট অনুমোদিত হয়েছে।`
      } else {
        notificationMessage = `আপনার ৳${existing.amount} পেমেন্ট প্রত্যাখ্যাত হয়েছে।${adminNote ? ` কারণ: ${adminNote}` : ''}`
      }

      await db.notification.create({
        data: {
          userId: existing.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: status === 'approved' ? 'success' : 'error',
        },
      })
    } catch { /* ignore */ }

    // Create UserSubscription if approved
    if (status === 'approved' && existing.contentType === 'package' && existing.contentId) {
      try {
        const pkg = await db.contentPackage.findUnique({
          where: { id: existing.contentId },
          select: { duration: true },
        })

        if (pkg && existing.classLevel) {
          const startDate = new Date()
          const endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + pkg.duration)

          const existingSub = await db.userSubscription.findFirst({
            where: { userId: existing.userId, packageId: existing.contentId, classLevel: existing.classLevel },
          })

          if (!existingSub) {
            await db.userSubscription.create({
              data: { userId: existing.userId, packageId: existing.contentId, classLevel: existing.classLevel, startDate, endDate, isActive: true, paymentId: existing.id },
            })
          } else {
            const currentEnd = new Date(existingSub.endDate)
            const newEnd = currentEnd > startDate ? currentEnd : startDate
            newEnd.setDate(newEnd.getDate() + pkg.duration)
            await db.userSubscription.update({ where: { id: existingSub.id }, data: { endDate: newEnd, isActive: true, paymentId: existing.id } })
          }
        }
      } catch (subError) { console.error('Subscription error:', subError) }
    }

    // MCQ Exam Package purchase
    if (status === 'approved' && existing.contentType === 'mcq-exam-package' && existing.contentId) {
      try {
        const existingPurchase = await db.mCQExamPackagePurchase.findFirst({
          where: { userId: existing.userId, packageId: existing.contentId },
        })

        if (!existingPurchase) {
          await db.mCQExamPackagePurchase.create({
            data: { userId: existing.userId, packageId: existing.contentId, paymentId: existing.id, isActive: true },
          })
        } else {
          await db.mCQExamPackagePurchase.update({ where: { id: existingPurchase.id }, data: { isActive: true, paymentId: existing.id } })
        }
      } catch (e) { console.error('MCQ purchase error:', e) }
    }

    // CQ Exam Package purchase
    if (status === 'approved' && existing.contentType === 'cq-exam-package' && existing.contentId) {
      try {
        const existingPurchase = await db.cQExamPackagePurchase.findFirst({
          where: { userId: existing.userId, packageId: existing.contentId },
        })

        if (!existingPurchase) {
          await db.cQExamPackagePurchase.create({
            data: { userId: existing.userId, packageId: existing.contentId, paymentId: existing.id, isActive: true },
          })
        } else {
          await db.cQExamPackagePurchase.update({ where: { id: existingPurchase.id }, data: { isActive: true, paymentId: existing.id } })
        }
      } catch (e) { console.error('CQ purchase error:', e) }
    }

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Payment')
  }
}
