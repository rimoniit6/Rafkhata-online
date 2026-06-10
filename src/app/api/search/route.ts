import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!q || q.trim().length === 0) {
      return apiError('সার্চ কোয়েরি আবশ্যক', 400)
    }

    const searchQuery = q.trim()
    const results: Record<string, unknown[]> = {}
    const searchType = type || 'all'

    // MCQ Search
    if (searchType === 'all' || searchType === 'mcq') {
      results.mcqs = await db.mCQ.findMany({
        where: {
          isActive: true,
          OR: [
            { question: { contains: searchQuery } },
            { explanation: { contains: searchQuery } },
            { tags: { contains: searchQuery } },
            { topic: { contains: searchQuery } },
          ],
        },
        include: {
          chapter: {
            select: { id: true, name: true, subjectId: true, subject: { select: { id: true, name: true, classId: true, class: { select: { id: true, name: true, slug: true } } } } },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    // CQ Search
    if (searchType === 'all' || searchType === 'cq') {
      results.cqs = await db.cQ.findMany({
        where: {
          isActive: true,
          OR: [
            { uddeepok: { contains: searchQuery } },
            { question1: { contains: searchQuery } },
            { question2: { contains: searchQuery } },
            { question3: { contains: searchQuery } },
            { question4: { contains: searchQuery } },
            { tags: { contains: searchQuery } },
            { topic: { contains: searchQuery } },
          ],
        },
        include: {
          chapter: {
            select: { id: true, name: true, subjectId: true, subject: { select: { id: true, name: true, classId: true, class: { select: { id: true, name: true, slug: true } } } } },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    // Lecture Search
    if (searchType === 'all' || searchType === 'lecture') {
      results.lectures = await db.lecture.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchQuery } },
            { content: { contains: searchQuery } },
          ],
        },
        include: {
          chapter: {
            select: { id: true, name: true, subjectId: true, subject: { select: { id: true, name: true, classId: true, class: { select: { id: true, name: true, slug: true } } } } },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    // Suggestion Search
    if (searchType === 'all' || searchType === 'suggestion') {
      results.suggestions = await db.suggestion.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchQuery } },
            { content: { contains: searchQuery } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    // Notice Search
    if (searchType === 'all' || searchType === 'notice') {
      results.notices = await db.notice.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchQuery } },
            { content: { contains: searchQuery } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    // Bundle Search
    if (searchType === 'all' || searchType === 'bundle') {
      results.bundles = await db.contentBundle.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: searchQuery } },
            { description: { contains: searchQuery } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    )

    return NextResponse.json({
      query: searchQuery,
      results,
      total: totalResults,
    })
  } catch (error) {
    return handleApiError(error, 'Search error')
  }
}
