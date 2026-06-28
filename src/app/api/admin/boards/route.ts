import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { invalidateContentCache } from '@/lib/cache-invalidate'

const createBoardSchema = z.object({
  name: z.string().min(1, 'বোর্ডের নাম আবশ্যক'),
  slug: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const boards = await db.board.findMany({
      orderBy: { order: 'asc' },
    })
    return apiResponse(boards)
  } catch (error) {
    return handleApiError(error, 'Admin Get Boards')
  }
}

export async function POST(req: NextRequest) {
  const auth = await withAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const validation = validateBody(createBoardSchema, body)
    if ('error' in validation) return validation.error
    const { name, slug, isActive, order } = validation.data

    const boardSlug = slug || name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

    const existing = await db.board.findFirst({
      where: { OR: [{ slug: boardSlug }, { name: name.trim() }] },
    })
    if (existing) {
      return apiError('এই বোর্ড ইতিমধ্যে আছে', 400)
    }

    const board = await db.board.create({
      data: {
        name: name.trim(),
        slug: boardSlug,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    })

    await auditFromRequest(req, auth.user.id, AuditActions.CONTENT_CREATE, 'board', board.id, body)
    await invalidateContentCache('board')
    return apiResponse(board, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Board')
  }
}

export async function PUT(req: NextRequest) {
  const auth = await withAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { id, name, slug, isActive, order } = body

    if (!id) {
      return apiError('বোর্ড ID আবশ্যক', 400)
    }

    const existing = await db.board.findUnique({ where: { id } })
    if (!existing) {
      return apiError('বোর্ড খুঁজে পাওয়া যায়নি', 404)
    }

    if (slug !== undefined && slug !== existing.slug) {
      const slugExists = await db.board.findFirst({ where: { slug, NOT: { id } } })
      if (slugExists) {
        return apiError('এই স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে।', 409)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (slug !== undefined) updateData.slug = slug
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order

    const board = await db.board.update({
      where: { id },
      data: updateData,
    })

    await auditFromRequest(req, auth.user.id, AuditActions.CONTENT_UPDATE, 'board', existing.id, { ...existing }, updateData)
    await invalidateContentCache('board')
    return apiResponse(board)
  } catch (error) {
    return handleApiError(error, 'Admin Update Board')
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await withAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('বোর্ড ID আবশ্যক', 400)
    }

    const existing = await db.board.findUnique({ where: { id } })
    if (!existing) {
      return apiError('বোর্ড খুঁজে পাওয়া যায়নি', 404)
    }

    await db.board.delete({ where: { id } })
    await auditFromRequest(req, auth.user.id, AuditActions.CONTENT_DELETE, 'board', id)
    await invalidateContentCache('board')
    return apiResponse({ id }, 'বোর্ড সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Board')
  }
}
