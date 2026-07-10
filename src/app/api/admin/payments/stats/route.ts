import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { toDecimal } from '@/lib/decimal'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const [totalRevenue, pendingCount, approvedCount, contentPurchaseCount, contentSalesTotal] =
      await Promise.all([
        db.payment.aggregate({
          where: { status: 'APPROVED' },
          _sum: { amount: true },
        }),
        db.payment.count({ where: { status: 'PENDING' } }),
        db.payment.count({ where: { status: 'APPROVED' } }),
        db.payment.count({
          where: { contentType: { not: null } },
        }),
        db.payment.aggregate({
          where: {
            status: 'APPROVED',
            contentType: { not: null },
          },
          _sum: { amount: true },
        }),
      ])

    return apiResponse({
      totalRevenue: toDecimal(totalRevenue._sum.amount || 0),
      pendingCount,
      approvedCount,
      contentPurchaseCount,
      contentSalesTotal: toDecimal(contentSalesTotal._sum.amount || 0),
    })
  } catch (error) {
    return handleApiError(error, 'Admin Payment Stats error')
  }
}
