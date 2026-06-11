import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiResponse, apiError, applyRateLimit } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { apiLimiter } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()

    if (!supabaseUser) {
      return apiError('প্রমাণীকরণ প্রয়োজন।', 401, 'UNAUTHORIZED')
    }

    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get('userId')
    const auth = await verifyAuth(request)
    
    let targetUserId = auth?.user.id
    if (queryUserId && queryUserId !== targetUserId) {
      if (!auth?.isAdmin) {
        return apiError('অন্য ব্যবহারকারীর তথ্য দেখার অনুমতি নেই।', 403, 'FORBIDDEN')
      }
      targetUserId = queryUserId
    }

    if (!targetUserId) {
      return apiError('ব্যবহারকারী খুঁজে পাওয়া যায়নি', 404, 'NOT_FOUND')
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        institute: true,
        classLevel: true,
        board: true,
        isVerified: true,
        isPremium: true,
        premiumExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return apiError('ব্যবহারকারী খুঁজে পাওয়া যায়নি', 404, 'NOT_FOUND')
    }

    return apiResponse({ user })
  } catch (error) {
    return handleApiError(error, 'Get user error')
  }
}
