import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const board = searchParams.get('board')

    const where: Record<string, unknown> = {}
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'
    if (board) where.board = board

    const data = await db.boardYear.findMany({
      where,
      orderBy: [{ year: 'desc' }, { board: 'asc' }],
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Admin Get BoardYears error:', error)
    return NextResponse.json(
      { success: false, error: 'বোর্ড সাল এর তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { board, year, isActive } = body

    if (!board || !year) {
      return NextResponse.json(
        { success: false, error: 'বোর্ড এবং সাল আবশ্যক' },
        { status: 400 }
      )
    }

    const data = await db.boardYear.create({
      data: {
        board,
        year,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Admin Create BoardYear error:', error)
    return NextResponse.json(
      { success: false, error: 'বোর্ড সাল তৈরি করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'বোর্ড সাল ID আবশ্যক' },
        { status: 400 }
      )
    }

    const existing = await db.boardYear.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'বোর্ড সাল খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}
    const allowedFields = ['board', 'year', 'isActive']

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    const updated = await db.boardYear.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Admin Update BoardYear error:', error)
    return NextResponse.json(
      { success: false, error: 'বোর্ড সাল আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idFromQuery = searchParams.get('id')

    let id = idFromQuery

    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch {
        // No body provided
      }
    }
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'বোর্ড সাল ID আবশ্যক' },
        { status: 400 }
      )
    }

    const existing = await db.boardYear.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'বোর্ড সাল খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    await db.boardYear.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id }, message: 'বোর্ড সাল সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    console.error('Admin Delete BoardYear error:', error)
    return NextResponse.json(
      { success: false, error: 'বোর্ড সাল মুছে ফেলতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
