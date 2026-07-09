import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await props.params

    const pkg = await db.contentPackage.findUnique({ where: { id } })

    if (!pkg) {
      return apiResponse(null, 'প্যাকেজ পাওয়া যায়নি', 404)
    }

    // Count premium content for the target class
    const targetClass = pkg.classLevel || ''
    const mcqCount = targetClass
      ? await db.mCQ.count({ where: { isActive: true, isPremium: true, classLevel: targetClass } })
      : 0
    const cqCount = targetClass
      ? await db.cQ.count({ where: { isActive: true, isPremium: true, classLevel: targetClass } })
      : 0

    // Count lectures for this class
    let lectureCount = 0
    if (targetClass) {
      const classCats = await db.classCategory.findMany({
        where: { slug: targetClass },
        select: { id: true },
      })
      if (classCats.length > 0) {
        lectureCount = await db.lecture.count({
          where: {
            isActive: true,
            isPremium: true,
            chapter: {
              subject: {
                classId: { in: classCats.map(c => c.id) },
              },
            },
          },
        })
      }
    }

    const totalContent = mcqCount + cqCount + lectureCount

    // Count active subscriptions
    const subscriberCount = await db.userSubscription.count({
      where: {
        packageId: pkg.id,
        isActive: true,
        endDate: { gte: new Date() },
      },
    })

    return apiResponse({
      package: pkg,
      mcqCount,
      cqCount,
      lectureCount,
      totalContent,
      subscriberCount,
    })
  } catch (error) {
    return handleApiError(error, 'Get package error')
  }
}
