import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

// GET /api/notes/[id] — Get single note by id (must belong to auth user)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      )
    }

    const { id } = await params
    const note = await db.note.findUnique({ where: { id } })

    if (!note) {
      return NextResponse.json(
        { error: 'নোট খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    if (note.userId !== auth.user.id) {
      return NextResponse.json(
        { error: 'এই নোট দেখার অনুমতি নেই' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: note })
  } catch (error) {
    console.error('Get Note error:', error)
    return NextResponse.json(
      { error: 'নোট এর তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

// PUT /api/notes/[id] — Update note (must belong to auth user)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      )
    }

    const { id } = await params
    const note = await db.note.findUnique({ where: { id } })

    if (!note) {
      return NextResponse.json(
        { error: 'নোট খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    if (note.userId !== auth.user.id) {
      return NextResponse.json(
        { error: 'এই নোট সম্পাদনার অনুমতি নেই' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'নোটের বিষয়বস্তু আবশ্যক' },
        { status: 400 }
      )
    }

    const updated = await db.note.update({
      where: { id },
      data: { content: content.trim() },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Update Note error:', error)
    return NextResponse.json(
      { error: 'নোট আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

// DELETE /api/notes/[id] — Delete note (must belong to auth user or admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      )
    }

    const { id } = await params
    const note = await db.note.findUnique({ where: { id } })

    if (!note) {
      return NextResponse.json(
        { error: 'নোট খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    // Owner or admin can delete
    if (note.userId !== auth.user.id && !auth.isAdmin) {
      return NextResponse.json(
        { error: 'এই নোট মুছার অনুমতি নেই' },
        { status: 403 }
      )
    }

    await db.note.delete({ where: { id } })

    return NextResponse.json({ data: { id }, message: 'নোট সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    console.error('Delete Note error:', error)
    return NextResponse.json(
      { error: 'নোট মুছে ফেলতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
