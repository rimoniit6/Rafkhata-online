import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const data = await db.siteSetting.findMany({
      orderBy: { key: 'asc' },
    })

    // Also return as key-value map for convenience
    const map: Record<string, string> = {}
    for (const setting of data) {
      map[setting.key] = setting.value
    }

    return apiResponse({ data, map })
  } catch (error) {
    return handleApiError(error, 'Admin Get Settings')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { key, value, group, label } = body

    if (!key || value === undefined) {
      return apiError('কী এবং ভ্যালু আবশ্যক', 400)
    }

    const existing = await db.siteSetting.findUnique({ where: { key } })
    if (existing) {
      return apiError('এই কী ইতিমধ্যে বিদ্যমান, আপডেট করতে PUT ব্যবহার করুন', 409)
    }

    const data = await db.siteSetting.create({
      data: { key, value, group: group || null, label: label || null },
    })

    await invalidateContentCache('settings')
    return apiResponse({ data }, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Setting')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { key, value, group, label } = body

    if (!key || value === undefined) {
      return apiError('কী এবং ভ্যালু আবশ্যক', 400)
    }

    const existing = await db.siteSetting.findUnique({ where: { key } })
    if (!existing) {
      return apiError('সেটিং খুঁজে পাওয়া যায়নি, নতুন তৈরি করতে POST ব্যবহার করুন', 404)
    }

    const data = await db.siteSetting.update({
      where: { key },
      data: {
        value,
        ...(group !== undefined ? { group } : {}),
        ...(label !== undefined ? { label } : {}),
      },
    })

    await invalidateContentCache('settings')
    return apiResponse({ data })
  } catch (error) {
    return handleApiError(error, 'Admin Update Setting')
  }
}
