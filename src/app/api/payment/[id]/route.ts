import { apiError,applyRateLimit,withCsrf } from '@/lib/api-utils'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/errors'
import { apiLimiter } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন।', 401, 'UNAUTHORIZED')
    }

    const { id } = await props.params

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!payment) {
      return apiError('পেমেন্ট খুঁজে পাওয়া যায়নি', 404, 'NOT_FOUND')
    }

    if (!auth.isAdmin && payment.userId !== auth.user.id) {
      return apiError('এই পেমেন্ট দেখার অনুমতি নেই।', 403, 'FORBIDDEN')
    }

    return NextResponse.json({ success: true, data: { payment } })
  } catch (error) {
    return handleApiError(error, 'Get payment detail error')
  }
}

// Payment review/approval consolidated to /api/admin/payments (PATCH)
// Using this endpoint directly is forbidden — use admin/payments endpoint
export async function PATCH(
  request: Request,
  _props: { params: Promise<{ id: string }> }
) {
  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error
  return apiError('পেমেন্ট অনুমোদন/প্রত্যাখ্যানের জন্য /api/admin/payments এন্ডপয়েন্ট ব্যবহার করুন।', 400, 'USE_ADMIN_ENDPOINT')
}

export async function PUT(
  request: Request,
  _props: { params: Promise<{ id: string }> }
) {
  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error
  return apiError('পেমেন্ট অনুমোদন/প্রত্যাখ্যানের জন্য /api/admin/payments এন্ডপয়েন্ট ব্যবহার করুন।', 400, 'USE_ADMIN_ENDPOINT')
}
