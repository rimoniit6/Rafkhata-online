import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const { searchParams } = new URL(request.url)
    const classSlug = searchParams.get('classSlug') || ''

    if (!classSlug) {
      return apiError('classSlug প্রয়োজন', 400)
    }

    const subscription = await db.userSubscription.findFirst({
      where: {
        userId: auth.user.id,
        classLevel: classSlug,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        package: { select: { title: true, durationLabel: true } },
      },
    })

    const packages = await db.contentPackage.findMany({
      where: {
        isActive: true,
        OR: [{ classLevel: classSlug }, { classLevel: null }],
      },
      orderBy: [{ order: 'asc' }, { price: 'asc' }],
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        originalPrice: true,
        duration: true,
        durationLabel: true,
        description: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        hasAccess: !!subscription,
        classSlug,
        subscription: subscription
          ? {
              id: subscription.id,
              packageName: subscription.package.title,
              durationLabel: subscription.package.durationLabel,
              endDate: subscription.endDate,
            }
          : null,
        packages,
      },
    })
  } catch (error) {
    console.error('Check access error:', error)
    return apiError('সাবস্ক্রিপশন চেক করতে সমস্যা হয়েছে', 500)
  }
}
