import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'প্রমাণীকরণ প্রয়োজন' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const where: Record<string, unknown> = { userId: auth.user.id }
    if (status) where.status = status

    const [data, total] = await Promise.all([
      db.userFeedback.findMany({
        where,
        include: {
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

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Get User Feedback error:', error)
    return NextResponse.json({ error: 'ফিডব্যাক তথ্য আনতে সমস্যা হয়েছে' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'প্রমাণীকরণ প্রয়োজন' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, message } = body

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'বিষয় এবং বার্তা আবশ্যক' }, { status: 400 })
    }

    const feedback = await db.userFeedback.create({
      data: {
        userId: auth.user.id,
        subject: subject.trim(),
        status: 'pending',
        messages: {
          create: {
            senderId: auth.user.id,
            senderRole: 'user',
            message: message.trim(),
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ data: feedback }, { status: 201 })
  } catch (error) {
    console.error('Create Feedback error:', error)
    return NextResponse.json({ error: 'ফিডব্যাক তৈরি করতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
