import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const classLevel = searchParams.get('classLevel')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (classLevel) where.classLevel = classLevel

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      db.notice.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notice.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Get Notices error')
  }
}
