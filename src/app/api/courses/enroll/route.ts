import { db } from '@/lib/db'
import { apiResponse, apiError, withAuth } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { courseId } = body
    if (!courseId) return apiError('courseId required', 400)

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, isPremium: true, price: true, status: true },
    })
    if (!course) return apiError('Course not found', 404)
    if (course.status !== 'PUBLISHED') return apiError('Course is not published', 400)

    const existing = await db.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: auth.user.id, courseId } },
    })
    if (existing) {
      return apiResponse({ enrollment: existing, alreadyEnrolled: true })
    }

    let enrollment
    if (course.isPremium) {
      const purchase = await db.coursePurchase.findFirst({
        where: { userId: auth.user.id, courseId, isActive: true },
      })
      if (!purchase) return apiError('Purchase required for premium course', 402)
      enrollment = await db.courseEnrollment.create({
        data: { userId: auth.user.id, courseId, type: 'PAID', status: 'ACTIVE' },
      })
    } else {
      enrollment = await db.courseEnrollment.create({
        data: { userId: auth.user.id, courseId, type: 'FREE', status: 'ACTIVE' },
      })
    }

    return apiResponse({ enrollment }, 201)
  } catch (error) {
    return handleApiError(error, 'Course Enroll')
  }
}
