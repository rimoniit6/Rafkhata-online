import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const chapterId = searchParams.get('chapterId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { isActive: true }

    if (classId) where.classId = classId
    if (subjectId) where.subjectId = subjectId
    if (chapterId) where.chapterId = chapterId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const [suggestions, total] = await Promise.all([
      db.suggestion.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          classId: true,
          subjectId: true,
          chapterId: true,
          thumbnail: true,
          pdfUrl: true,
          isPremium: true,
          price: true,
          viewCount: true,
          order: true,
          createdAt: true,
          content: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.suggestion.count({ where }),
    ])

    const classIds = [...new Set(suggestions.map((s) => s.classId).filter(Boolean) as string[])]
    const subjectIds = [...new Set(suggestions.map((s) => s.subjectId).filter(Boolean) as string[])]
    const chapterIds = [...new Set(suggestions.map((s) => s.chapterId).filter(Boolean) as string[])]

    const [classes, subjects, chapters] = await Promise.all([
      classIds.length > 0
        ? db.classCategory.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } })
        : [],
      subjectIds.length > 0
        ? db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
        : [],
      chapterIds.length > 0
        ? db.chapter.findMany({ where: { id: { in: chapterIds } }, select: { id: true, name: true } })
        : [],
    ])

    const classMap = new Map<string, string>(classes.map((c) => [c.id, c.name] as [string, string]))
    const subjectMap = new Map<string, string>(subjects.map((s) => [s.id, s.name] as [string, string]))
    const chapterMap = new Map<string, string>(chapters.map((c) => [c.id, c.name] as [string, string]))

    const transformed = suggestions.map((s) => {
      const base = {
        id: s.id,
        title: s.title,
        slug: s.slug,
        classId: s.classId,
        subjectId: s.subjectId,
        chapterId: s.chapterId,
        className: s.classId ? classMap.get(s.classId) || null : null,
        subjectName: s.subjectId ? subjectMap.get(s.subjectId) || null : null,
        chapterName: s.chapterId ? chapterMap.get(s.chapterId) || null : null,
        thumbnail: s.thumbnail,
        pdfUrl: s.pdfUrl,
        isPremium: s.isPremium,
        price: s.price,
        viewCount: s.viewCount,
        order: s.order,
        createdAt: s.createdAt,
      }

      if (s.isPremium) {
        return { ...base, content: null }
      }

      return { ...base, content: s.content }
    })

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Get Suggestions error')
  }
}
