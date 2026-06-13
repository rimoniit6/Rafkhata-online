import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiError, withCsrf } from '@/lib/api-utils'

// GET /api/notes — List notes for authenticated user
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const contentId = searchParams.get('contentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const where: Record<string, unknown> = { userId: auth.user.id }
    if (contentType) where.contentType = contentType
    if (contentId) where.contentId = contentId

    const [data, total] = await Promise.all([
      db.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.note.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get Notes error:', error)
    return NextResponse.json(
      { error: 'নোট এর তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

// POST /api/notes — Create a note
export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'প্রমাণীকরণ প্রয়োজন। অনুগ্রহ করে লগইন করুন।' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contentId, contentType, content } = body

    if (!contentId || !contentType || !content) {
      return NextResponse.json(
        { error: 'contentId, contentType এবং content আবশ্যক' },
        { status: 400 }
      )
    }

    // Check for existing note on same content by same user — upsert
    const existing = await db.note.findFirst({
      where: {
        userId: auth.user.id,
        contentId,
        contentType,
      },
    })

    if (existing) {
      // Update existing note
      const updated = await db.note.update({
        where: { id: existing.id },
        data: { content },
      })
      return NextResponse.json({ success: true, data: updated })
    }

    // Create new note
    const data = await db.note.create({
      data: {
        userId: auth.user.id,
        contentId,
        contentType,
        content,
      },
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Create Note error:', error)
    return NextResponse.json(
      { error: 'নোট তৈরি করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
