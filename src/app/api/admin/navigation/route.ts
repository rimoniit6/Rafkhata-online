import { db } from '@/lib/db'
import { apiError, validateBody } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createNavigationSchema = z.object({
  label: z.string().min(1, 'label আবশ্যক'),
  route: z.string().min(1, 'route আবশ্যক'),
  icon: z.string().optional(),
  location: z.string().optional(),
  order: z.number().min(0).optional(),
  isAuthOnly: z.boolean().optional(),
  isAdminOnly: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/admin/navigation — fetch ALL navigation items (including inactive) ordered by location, then order
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return apiError('অনুমতি নেই', 403)
    }

    const items = await db.navigation.findMany({
      orderBy: [{ location: 'asc' }, { order: 'asc' }],
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('[Admin Navigation] GET error:', error)
    return apiError('নেভিগেশন আনতে সমস্যা হয়েছে', 500)
  }
}

// POST /api/admin/navigation — create a new navigation item
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return apiError('অনুমতি নেই', 403)
    }

    const body = await request.json()
    const validation = validateBody(createNavigationSchema, body)
    if ('error' in validation) return validation.error
    const { label, route, icon, location, order, isAuthOnly, isAdminOnly, isActive } = validation.data

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
    return apiError('নেভিগেশন তৈরি করতে সমস্যা হয়েছে', 500)
  }
}

// PUT /api/admin/navigation — update a navigation item by id
export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return apiError('অনুমতি নেই', 403)
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return apiError('id আবশ্যক', 400)
    }

    const item = await db.navigation.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('[Admin Navigation] PUT error:', error)
    return apiError('নেভিগেশন আপডেট করতে সমস্যা হয়েছে', 500)
  }
}

// DELETE /api/admin/navigation — soft delete by setting isActive = false
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return apiError('অনুমতি নেই', 403)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('id আবশ্যক', 400)
    }

    const item = await db.navigation.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, data: item, message: 'নেভিগেশন আইটেম নিষ্ক্রিয় করা হয়েছে' })
  } catch (error) {
    console.error('[Admin Navigation] DELETE error:', error)
    return apiError('নেভিগেশন মুছতে সমস্যা হয়েছে', 500)
  }
}
