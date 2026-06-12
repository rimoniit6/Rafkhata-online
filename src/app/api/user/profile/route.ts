import { db } from '@/lib/db'
import { apiResponse, withAuth, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

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
    const { name, phone, institute, classLevel, board, avatar } = body
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
