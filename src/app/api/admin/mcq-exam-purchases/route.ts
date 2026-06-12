import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { withCsrf } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get('packageId') || ''
    const userId = searchParams.get('userId') || ''
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (packageId) where.packageId = packageId
    if (userId) where.userId = userId
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [purchases, total] = await Promise.all([
      db.mCQExamPackagePurchase.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          package: {
            select: { id: true, title: true, price: true, isPremium: true },
          },
        },
        orderBy: { purchasedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.mCQExamPackagePurchase.count({ where }),
    ])

    // Stats
    const totalPurchases = await db.mCQExamPackagePurchase.count()
    const activePurchases = await db.mCQExamPackagePurchase.count({ where: { isActive: true } })
    const inactivePurchases = totalPurchases - activePurchases

    return NextResponse.json({
      data: purchases,
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
    })
  } catch (error) {
    console.error('Admin Get MCQ Exam Purchases error:', error)
    return NextResponse.json(
      { error: 'MCQ এক্সাম প্যাকেজ ক্রয়ের তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ক্রয়ের ID প্রদান করুন' }, { status: 400 })
    }

    const existing = await db.mCQExamPackagePurchase.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'ক্রয়ের তথ্য পাওয়া যায়নি' }, { status: 404 })
    }

    // Deactivate instead of delete
    await db.mCQExamPackagePurchase.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'ক্রয় নিষ্ক্রিয় করা হয়েছে' })
  } catch (error) {
    console.error('Admin Deactivate MCQ Exam Purchase error:', error)
    return NextResponse.json(
      { error: 'ক্রয় নিষ্ক্রিয় করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
