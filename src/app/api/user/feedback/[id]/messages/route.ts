import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiError, withCsrf } from '@/lib/api-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const { id } = await params
    const feedback = await db.userFeedback.findUnique({ where: { id } })

    if (!feedback) {
      return apiError('ফিডব্যাক খুঁজে পাওয়া যায়নি', 404)
    }
    if (feedback.userId !== auth.user.id) {
      return apiError('এই ফিডব্যাক দেখার অনুমতি নেই', 403)
    }

    const messages = await db.feedbackMessage.findMany({
      where: { feedbackId: id },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: { feedback, messages } })
  } catch (error) {
    console.error('Get Feedback Messages error:', error)
    return apiError('বার্তা আনতে সমস্যা হয়েছে', 500)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const { id } = await params
    const feedback = await db.userFeedback.findUnique({ where: { id } })

    if (!feedback) {
      return apiError('ফিডব্যাক খুঁজে পাওয়া যায়নি', 404)
    }
    if (feedback.userId !== auth.user.id) {
      return apiError('এই ফিডব্যাকে উত্তর দেওয়ার অনুমতি নেই', 403)
    }

    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return apiError('বার্তা আবশ্যক', 400)
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

    return NextResponse.json({ success: true, data: msg }, { status: 201 })
  } catch (error) {
    console.error('Reply Feedback error:', error)
    return apiError('উত্তর দিতে সমস্যা হয়েছে', 500)
  }
}
