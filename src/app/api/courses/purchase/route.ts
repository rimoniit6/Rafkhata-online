import { db } from '@/lib/db'
import { apiResponse, apiError, withAuth } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { courseId, paymentId } = body

    if (!courseId) return apiError('Course ID required', 400)

    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) return apiError('Course not found', 404)
    if (!course.isPremium) return apiError('This course is free', 400)

    // For premium courses, require a valid payment ID
    if (!paymentId) return apiError('Payment ID required for premium courses', 400)

    // Verify the payment exists, belongs to this user, and is approved
    const payment = await db.payment.findUnique({ where: { id: paymentId } })
    if (!payment) return apiError('Payment not found', 404)
    if (payment.userId !== auth.user.id) return apiError('Unauthorized', 403)
    if (payment.status !== 'APPROVED') return apiError('Payment not approved', 400)
    if (payment.contentType !== 'course' || payment.contentId !== courseId) {
      return apiError('Payment does not match this course', 400)
    }

    const existing = await db.coursePurchase.findUnique({
      where: { userId_courseId: { userId: auth.user.id, courseId } },
    })
    if (existing?.isActive) return apiError('Already purchased', 409)

    const purchase = await db.coursePurchase.upsert({
      where: { userId_courseId: { userId: auth.user.id, courseId } },
      create: { userId: auth.user.id, courseId, paymentId: paymentId || null },
      update: { paymentId: paymentId || undefined },
    })

    return apiResponse({ purchase }, 201)
  } catch (error) {
    return handleApiError(error, 'Course Purchase POST')
  }
}

export async function GET(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (courseId) {
      const purchase = await db.coursePurchase.findUnique({
        where: { userId_courseId: { userId: auth.user.id, courseId } },
      })
      return apiResponse({ isPurchased: !!purchase?.isActive, purchase })
    }

    const purchases = await db.coursePurchase.findMany({
      where: { userId: auth.user.id, isActive: true },
      include: {
        course: {
          include: {
            subject: { select: { id: true, name: true, slug: true, color: true, icon: true } },
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    })

    return apiResponse({ purchases })
  } catch (error) {
    return handleApiError(error, 'Course Purchase GET')
  }
}
