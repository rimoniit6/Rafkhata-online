import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { AcquisitionData } from '@/types/analytics'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0]
    const prevFrom = searchParams.get('prevFrom') || new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
    const prevTo = searchParams.get('prevTo') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

    const fromDate = new Date(from)
    const toDate = new Date(to + 'T23:59:59.999Z')

    const [users, referralEvents, campaignEvents] = await Promise.all([
      db.user.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        select: { supabaseUserId: true, password: true },
      }),
      db.analyticsEvent.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          OR: [
            { eventType: { contains: 'referral' } },
            { eventName: { contains: 'referral' } },
          ],
        },
      }),
      db.analyticsEvent.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          OR: [
            { eventType: { contains: 'campaign' } },
            { eventName: { contains: 'campaign' } },
          ],
        },
      }),
    ])

    let googleCount = 0
    let emailCount = 0
    let organicCount = 0

    users.forEach((u) => {
      if (u.supabaseUserId) {
        googleCount++
      } else if (u.password) {
        emailCount++
      } else {
        organicCount++
      }
    })

    const total = users.length || 1
    const toPercent = (v: number) => Math.round((v / total) * 100 * 100) / 100

    const signupSource = [
      { source: 'google', count: googleCount, percentage: toPercent(googleCount) },
      { source: 'email', count: emailCount, percentage: toPercent(emailCount) },
      { source: 'organic', count: organicCount, percentage: toPercent(organicCount) },
    ]

    return apiResponse({
      signupSource,
      googleLogin: googleCount,
      emailSignup: emailCount,
      referral: referralEvents,
      organic: organicCount,
      campaign: campaignEvents,
    } satisfies AcquisitionData)
  } catch (error) {
    return handleApiError(error, 'Acquisition Analytics')
  }
}
