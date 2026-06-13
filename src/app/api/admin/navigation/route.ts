import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET /api/admin/navigation — fetch ALL navigation items (including inactive) ordered by location, then order
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 })
    }

    const items = await db.navigation.findMany({
      orderBy: [{ location: 'asc' }, { order: 'asc' }],
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('[Admin Navigation] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'নেভিগেশন আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

// POST /api/admin/navigation — create a new navigation item
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 })
    }

    const body = await request.json()
    const { label, route, icon, location, order, isAuthOnly, isAdminOnly, isActive } = body

    if (!label || !route) {      return NextResponse.json({ success: false, error: 'label ও route আবশ্যক' },
        { status: 400 }
      )
    }

    const item = await db.navigation.create({
      data: {
        label,
        route,
        icon: icon || 'BookOpen',
        location: location || 'header',
        order: order ?? 0,
        isAuthOnly: isAuthOnly ?? false,
        isAdminOnly: isAdminOnly ?? false,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    console.error('[Admin Navigation] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'নেভিগেশন তৈরি করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/navigation — update a navigation item by id
export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'id আবশ্যক' }, { status: 400 })
    }

    const item = await db.navigation.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('[Admin Navigation] PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'নেভিগেশন আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/navigation — soft delete by setting isActive = false
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'id আবশ্যক' }, { status: 400 })
    }

    const item = await db.navigation.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, data: item, message: 'নেভিগেশন আইটেম নিষ্ক্রিয় করা হয়েছে' })
  } catch (error) {
    console.error('[Admin Navigation] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'নেভিগেশন মুছতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
