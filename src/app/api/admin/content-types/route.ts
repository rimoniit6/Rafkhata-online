import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withSuperAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const contentTypes = await db.contentType.findMany({
      orderBy: { order: 'asc' },
    })
    return apiResponse(contentTypes)
  } catch (error) {
    return handleApiError(error, 'Admin Get Content Types')
  }
}

export async function POST(request: Request) {
  const auth = await withSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const { key, labelBn, labelEn, description, icon, color, lightColor, textColor, route, paramKey, buttonLabel, showInChapterDetail, order, isActive } = body

    if (!key || !labelBn || !labelEn || !icon || !color) {
      return apiError('key, labelBn, labelEn, icon ও color আবশ্যক', 400)
    }

    const contentType = await db.contentType.create({
      data: {
        key, labelBn, labelEn, description, icon, color, lightColor, textColor,
        route, paramKey, buttonLabel,
        showInChapterDetail: showInChapterDetail ?? true,
        order: order ?? 0, isActive: isActive ?? true,
      },
    })

    return apiResponse(contentType, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Content Type')
  }
}

export async function PUT(request: Request) {
  const auth = await withSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return apiError('id আবশ্যক', 400)
    }

    const contentType = await db.contentType.update({
      where: { id },
      data: updates,
    })

    return apiResponse(contentType)
  } catch (error) {
    return handleApiError(error, 'Admin Update Content Type')
  }
}

export async function DELETE(request: Request) {
  const auth = await withSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('id আবশ্যক', 400)
    }

    await db.contentType.delete({ where: { id } })
    return apiResponse({ id }, 'কন্টেন্ট টাইপ মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Content Type')
  }
}
