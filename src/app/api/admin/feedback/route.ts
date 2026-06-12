import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { withCsrf } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'অননুমোদিত' }, { status: 403 })
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
      data: filtered,
      pagination: { page, limit, total: q ? filtered.length : total, totalPages: Math.ceil((q ? filtered.length : total) / limit) },
    })
  } catch (error) {
    console.error('Admin Get Feedback error:', error)
    return NextResponse.json({ error: 'ফিডব্যাক তথ্য আনতে সমস্যা হয়েছে' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'অননুমোদিত' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id এবং status আবশ্যক' }, { status: 400 })
    }

    if (!['pending', 'replied', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'অবৈধ স্ট্যাটাস' }, { status: 400 })
    }

    const updated = await db.userFeedback.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Admin Update Feedback error:', error)
    return NextResponse.json({ error: 'ফিডব্যাক আপডেট করতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
