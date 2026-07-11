import { db } from '@/lib/db'
import { apiResponse, withAuth, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^(01[3-9]\d{8})$/, 'বৈধ ফোন নম্বর দিন').optional(),
  institute: z.string().max(200).optional(),
  classLevel: z.string().max(50).optional(),
  board: z.string().max(100).optional(),
  avatar: z.string().url().max(500).optional(),
})

export async function GET(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const userId = auth.user.id

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        institute: true,
        classLevel: true,
        board: true,
        role: true,
        isPremium: true,
        avatar: true,
      },
    })

    return apiResponse({ user })
  } catch (error) {
    return handleApiError(error, 'Profile GET')
  }
}

export async function PUT(request: Request) {
  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'ভুল ডাটা' },
        { status: 400 }
      )
    }

    const { name, phone, institute, classLevel, board, avatar } = parsed.data
    const userId = auth.user.id

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (institute !== undefined) updateData.institute = institute
    if (classLevel !== undefined) updateData.classLevel = classLevel
    if (board !== undefined) updateData.board = board
    if (avatar !== undefined) updateData.avatar = avatar

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        institute: true,
        classLevel: true,
        board: true,
        role: true,
        isPremium: true,
        avatar: true,
      },
    })

    return apiResponse({ user: updatedUser })
  } catch (error) {
    return handleApiError(error, 'Profile PUT')
  }
}

export async function PATCH(request: Request) {
  return PUT(request)
}
