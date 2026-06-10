import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const [totalRevenue, pendingCount, approvedCount, contentPurchaseCount, contentSalesTotal] =
      await Promise.all([
        db.payment.aggregate({
          where: { status: 'approved' },
          _sum: { amount: true },
        }),
        db.payment.count({ where: { status: 'pending' } }),
        db.payment.count({ where: { status: 'approved' } }),
        db.payment.count({
          where: { contentType: { not: null } },
        }),
        db.payment.aggregate({
          where: {
            status: 'approved',
            contentType: { not: null },
          },
          _sum: { amount: true },
        }),
      ])

    return apiResponse({
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingCount,
      approvedCount,
      contentPurchaseCount,
      contentSalesTotal: contentSalesTotal._sum.amount || 0,
    })
  } catch (error) {
    return handleApiError(error, 'Admin Payment Stats error')
  }
}
