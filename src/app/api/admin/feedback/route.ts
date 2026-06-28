import { db } from '@/lib/db'
import { apiError, validateBody } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAuth } from '@/lib/auth'

const updateFeedbackSchema = z.object({
  id: z.string().min(1, 'id আবশ্যক'),
  status: z.enum(['pending', 'replied', 'closed'], { message: 'অবৈধ স্ট্যাটাস' }),
})

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || !auth.isAdmin) {
      return apiError('অননুমোদিত', 403)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [data, total] = await Promise.all([
      db.userFeedback.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.userFeedback.count({ where }),
    ])

    // Optional text search in subject (client-side for SQLite simplicity)
    let filtered = data
    if (q?.trim()) {
      const query = q.trim().toLowerCase()
      filtered = data.filter(
        f => f.subject.toLowerCase().includes(query) || f.user.name?.toLowerCase().includes(query)
      )
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      pagination: { page, limit, total: q ? filtered.length : total, totalPages: Math.ceil((q ? filtered.length : total) / limit) },
    })
  } catch (error) {
    console.error('Admin Get Feedback error:', error)
    return apiError('ফিডব্যাক তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || !auth.isAdmin) {
      return apiError('অননুমোদিত', 403)
    }

    const body = await request.json()
    const validation = validateBody(updateFeedbackSchema, body)
    if ('error' in validation) return validation.error
    const { id, status } = validation.data

    const updated = await db.userFeedback.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Admin Update Feedback error:', error)
    return apiError('ফিডব্যাক আপডেট করতে সমস্যা হয়েছে', 500)
  }
}
