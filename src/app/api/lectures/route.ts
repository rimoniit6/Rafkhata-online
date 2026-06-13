import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'
import { applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const subjectId = searchParams.get('subjectId')
    const classLevel = searchParams.get('classLevel')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { isActive: true }

    if (chapterId) {
      where.chapterId = chapterId
    }

    const chapterFilter: Record<string, unknown> = {}
    if (subjectId) {
      chapterFilter.subjectId = subjectId
    }
    if (classLevel) {
      chapterFilter.subject = {
        class: {
          slug: classLevel,
        },
      }
    }
    if (Object.keys(chapterFilter).length > 0) {
      where.chapter = chapterFilter
    }

    const [lectures, total] = await Promise.all([
      db.lecture.findMany({
        where,
        orderBy: { order: 'asc' },
        include: {
          chapter: {
            select: {
              id: true,
              name: true,
              slug: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  class: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          resources: {
            where: { isActive: true },
            select: { title: true, url: true, type: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lecture.count({ where }),
    ])

    const transformedLectures = lectures.map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      content: lecture.content,
      thumbnail: lecture.thumbnail,
      videoUrl: lecture.videoUrl,
      audioUrl: lecture.audioUrl,
      pdfUrl: lecture.pdfUrl,
      chapterName: lecture.chapter.name,
      subjectName: lecture.chapter.subject.name,
      className: lecture.chapter.subject.class.name,
      classSlug: lecture.chapter.subject.class.slug,
      subjectId: lecture.chapter.subject.id,
      chapterId: lecture.chapter.id,
      progress: 0,
      order: lecture.order,
      isPremium: lecture.isPremium,
      price: lecture.price,
      duration: lecture.duration,
      resources: lecture.resources.map((r) => ({
        name: r.title,
        url: r.url,
        type: r.type,
      })),
    }))

    return NextResponse.json({
      success: true,
      data: { lectures: transformedLectures },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Get lectures error')
  }
}
