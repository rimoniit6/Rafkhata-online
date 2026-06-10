import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'প্রমাণীকরণ প্রয়োজন' }, { status: 401 })
    }

    const { id } = await params
    const feedback = await db.userFeedback.findUnique({ where: { id } })

    if (!feedback) {
      return NextResponse.json({ error: 'ফিডব্যাক খুঁজে পাওয়া যায়নি' }, { status: 404 })
    }
    if (feedback.userId !== auth.user.id) {
      return NextResponse.json({ error: 'এই ফিডব্যাক দেখার অনুমতি নেই' }, { status: 403 })
    }

    const messages = await db.feedbackMessage.findMany({
      where: { feedbackId: id },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: { feedback, messages } })
  } catch (error) {
    console.error('Get Feedback Messages error:', error)
    return NextResponse.json({ error: 'বার্তা আনতে সমস্যা হয়েছে' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'প্রমাণীকরণ প্রয়োজন' }, { status: 401 })
    }

    const { id } = await params
    const feedback = await db.userFeedback.findUnique({ where: { id } })

    if (!feedback) {
      return NextResponse.json({ error: 'ফিডব্যাক খুঁজে পাওয়া যায়নি' }, { status: 404 })
    }
    if (feedback.userId !== auth.user.id) {
      return NextResponse.json({ error: 'এই ফিডব্যাকে উত্তর দেওয়ার অনুমতি নেই' }, { status: 403 })
    }

    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'বার্তা আবশ্যক' }, { status: 400 })
    }

    const [msg] = await Promise.all([
      db.feedbackMessage.create({
        data: {
          feedbackId: id,
          senderId: auth.user.id,
          senderRole: 'user',
          message: message.trim(),
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      }),
      db.userFeedback.update({
        where: { id },
        data: { status: 'pending', updatedAt: new Date() },
      }),
    ])

    return NextResponse.json({ data: msg }, { status: 201 })
  } catch (error) {
    console.error('Reply Feedback error:', error)
    return NextResponse.json({ error: 'উত্তর দিতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
