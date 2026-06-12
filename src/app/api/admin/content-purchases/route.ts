import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getContentTypeLabels } from '@/lib/content-type-labels'

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const isActiveParam = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Build where clause — only approved payments (these are "purchases")
    const where: Record<string, unknown> = {
      status: 'approved',
      contentType: { not: null }, // Only payments that have a content type
    }

    if (contentType) where.contentType = contentType
    if (isActiveParam !== null && isActiveParam !== '') where.isActive = isActiveParam === 'true'
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { id: { contains: search } } },
        { contentTitle: { contains: search } },
        { transactionId: { contains: search } },
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ])

    // Compute stats (filtered)
    const [totalPurchases, activePurchases, inactivePurchases] = await Promise.all([
      db.payment.count({ where }),
      db.payment.count({ where: { ...where, isActive: true } }),
      db.payment.count({ where: { ...where, isActive: false } }),
    ])

    // Get dynamic content types from DB for filters
    const contentTypeLabels = await getContentTypeLabels()

    // Get per-type purchase counts for stats
    const allApprovedPayments = await db.payment.findMany({
      where: {
        status: 'approved',
        contentType: { not: null },
        ...(isActiveParam !== null && isActiveParam !== '' ? { isActive: isActiveParam === 'true' } : {}),
        ...(contentType ? { contentType } : {}),
      },
      select: { contentType: true, isActive: true },
    })

    const typeStats: Record<string, { total: number; active: number; inactive: number }> = {}
    for (const p of allApprovedPayments) {
      const ct = p.contentType || 'unknown'
      if (!typeStats[ct]) typeStats[ct] = { total: 0, active: 0, inactive: 0 }
      typeStats[ct].total++
      if (p.isActive) typeStats[ct].active++
      else typeStats[ct].inactive++
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalPurchases,
        activePurchases,
        inactivePurchases,
      },
      contentTypeLabels,
      typeStats,
    })
  } catch (error) {
    console.error('Admin Content Purchases GET error:', error)
    return NextResponse.json(
      { success: false, error: 'কন্টেন্ট ক্রয়ের তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, isActive, reason } = body

    if (!id || isActive === undefined) {
      return NextResponse.json(
        { success: false, error: 'আইডি এবং isActive প্রয়োজন' },
        { status: 400 }
      )
    }

    const existing = await db.payment.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'পেমেন্ট খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    if (existing.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'শুধুমাত্র অনুমোদিত পেমেন্টের অ্যাক্সেস পরিবর্তন করা যায়' },
        { status: 400 }
      )
    }

    // Update Payment.isActive
    const updated = await db.payment.update({
      where: { id },
      data: {
        isActive,
        adminNote: reason ? `${existing.adminNote ? existing.adminNote + ' | ' : ''}অ্যাক্সেস ${isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}: ${reason}` : existing.adminNote,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Cascade: MCQ Exam Package — also toggle MCQExamPackagePurchase.isActive
    if (existing.contentType === 'mcq-exam-package' && existing.contentId) {
      try {
        const purchase = await db.mCQExamPackagePurchase.findFirst({
          where: {
            userId: existing.userId,
            packageId: existing.contentId,
          },
        })
        if (purchase) {
          await db.mCQExamPackagePurchase.update({
            where: { id: purchase.id },
            data: { isActive },
          })
        }
      } catch (e) {
        console.error('Failed to update MCQExamPackagePurchase:', e)
      }
    }

    // Cascade: CQ Exam Package — also toggle CQExamPackagePurchase.isActive
    if (existing.contentType === 'cq-exam-package' && existing.contentId) {
      try {
        const purchase = await db.cQExamPackagePurchase.findFirst({
          where: {
            userId: existing.userId,
            packageId: existing.contentId,
          },
        })
        if (purchase) {
          await db.cQExamPackagePurchase.update({
            where: { id: purchase.id },
            data: { isActive },
          })
        }
      } catch (e) {
        console.error('Failed to update CQExamPackagePurchase:', e)
      }
    }

    // Cascade: Package — also toggle UserSubscription.isActive
    if (existing.contentType === 'package' && existing.contentId) {
      try {
        const subscription = await db.userSubscription.findFirst({
          where: {
            userId: existing.userId,
            packageId: existing.contentId,
            classLevel: existing.classLevel || undefined,
          },
        })
        if (subscription) {
          await db.userSubscription.update({
            where: { id: subscription.id },
            data: { isActive },
          })
        }
      } catch (e) {
        console.error('Failed to update UserSubscription:', e)
      }
    }

    // Create notification for user
    try {
      const actionLabel = isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'
      const contentLabel = existing.contentTitle || existing.contentType || 'কন্টেন্ট'
      await db.notification.create({
        data: {
          userId: existing.userId,
          title: `কন্টেন্ট অ্যাক্সেস ${actionLabel}`,
          message: `আপনার "${contentLabel}" কন্টেন্টের অ্যাক্সেস ${actionLabel} করা হয়েছে।${reason ? ` কারণ: ${reason}` : ''}`,
          type: isActive ? 'success' : 'warning',
        },
      })
    } catch {
      // Don't block main flow
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: isActive ? 'ক্রয় সক্রিয় করা হয়েছে' : 'ক্রয় নিষ্ক্রিয় করা হয়েছে',
    })
  } catch (error) {
    console.error('Admin Content Purchases PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'কন্টেন্ট ক্রয় আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
