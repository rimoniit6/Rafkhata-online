import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (!q || q.trim().length === 0) {
      return apiError('সার্চ কোয়েরি আবশ্যক', 400)
    }

    const searchQuery = q.trim()
    const searchType = type || 'all'
    const results: Record<string, unknown[]> = {}

    const chapterInclude = {
      chapter: {
        select: {
          id: true, name: true, subjectId: true,
          subject: { select: { id: true, name: true, classId: true, class: { select: { id: true, name: true, slug: true } } } },
        },
      },
    } as const

    // Build query array and run all in parallel
    const queryPromises: Array<{ key: string; promise: Promise<unknown[]> }> = []

    if (searchType === 'all' || searchType === 'mcq') {
      queryPromises.push({
        key: 'mcqs',
        promise: db.mCQ.findMany({
          where: { isActive: true, question: { contains: searchQuery } },
          include: chapterInclude,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      })
    }

    if (searchType === 'all' || searchType === 'cq') {
      queryPromises.push({
        key: 'cqs',
        promise: db.cQ.findMany({
          where: { isActive: true, uddeepok: { contains: searchQuery } },
          include: chapterInclude,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      })
    }

    if (searchType === 'all' || searchType === 'lecture') {
      queryPromises.push({
        key: 'lectures',
        promise: db.lecture.findMany({
          where: { isActive: true, title: { contains: searchQuery } },
          include: chapterInclude,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      })
    }

    if (searchType === 'all' || searchType === 'suggestion') {
      queryPromises.push({
        key: 'suggestions',
        promise: db.suggestion.findMany({
          where: { isActive: true, title: { contains: searchQuery } },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      })
    }

    if (searchType === 'all' || searchType === 'notice') {
      queryPromises.push({
        key: 'notices',
        promise: db.notice.findMany({
          where: { isActive: true, title: { contains: searchQuery } },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      })
    }

    if (searchType === 'all' || searchType === 'bundle') {
      queryPromises.push({
        key: 'bundles',
        promise: db.contentBundle.findMany({
          where: { isActive: true, title: { contains: searchQuery } },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      })
    }

    // Execute all in parallel
    const settled = await Promise.allSettled(
      queryPromises.map(async (qp) => ({ key: qp.key, data: await qp.promise })),
    )

    let totalResults = 0
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        results[s.value.key] = s.value.data
        totalResults += s.value.data.length
      }
    }

    return NextResponse.json({ query: searchQuery, results, total: totalResults })
  } catch (error) {
    return handleApiError(error, 'Search error')
  }
}
