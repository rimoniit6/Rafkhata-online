import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/admin/bundles/[id] — Get bundle by ID with all items
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const bundle = await db.contentBundle.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!bundle) {
      return NextResponse.json(
        { success: false, error: 'বান্ডল খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: bundle })
  } catch (error) {
    console.error('Admin Get Bundle error:', error)
    return NextResponse.json(
      { success: false, error: 'বান্ডলের তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/bundles/[id] — Update bundle and its items
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const body = await request.json()
    const { items, ...updateData } = body

    const existing = await db.contentBundle.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'বান্ডল খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    // If slug is being updated, check uniqueness
    if (updateData.slug && updateData.slug !== existing.slug) {
      const slugExists = await db.contentBundle.findUnique({
        where: { slug: updateData.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'এই স্লাগটি ইতিমধ্যে ব্যবহৃত হয়েছে' },
          { status: 400 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'slug', 'description', 'thumbnail', 'price',
      'originalPrice', 'classLevel', 'tags', 'isActive', 'order',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    // If price is provided, ensure it's a float
    if (data.price !== undefined) {
      data.price = parseFloat(String(data.price))
    }
    if (data.originalPrice !== undefined) {
      data.originalPrice = parseFloat(String(data.originalPrice))
    }

    // If items array is provided, replace all items (delete + recreate)
    if (items !== undefined) {
      await db.bundleItem.deleteMany({ where: { bundleId: id } })

      if (Array.isArray(items) && items.length > 0) {
        data.items = {
          create: items.map((item: { contentType: string; contentId: string; order?: number }) => ({
            contentType: item.contentType,
            contentId: item.contentId,
            order: item.order || 0,
          })),
        }
      }
    }

    const updated = await db.contentBundle.update({
      where: { id },
      data,
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Admin Update Bundle error:', error)
    return NextResponse.json(
      { success: false, error: 'বান্ডল আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/bundles/[id] — Delete bundle by ID (cascade deletes items)
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const existing = await db.contentBundle.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'বান্ডল খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    // BundleItem will be cascade deleted
    await db.contentBundle.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { id },
      message: 'বান্ডল সফলভাবে মুছে ফেলা হয়েছে',
    })
  } catch (error) {
    console.error('Admin Delete Bundle error:', error)
    return NextResponse.json(
      { success: false, error: 'বান্ডল মুছে ফেলতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
