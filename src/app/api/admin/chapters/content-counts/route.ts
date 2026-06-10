import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const classLevel = searchParams.get('classLevel')
    const subjectId = searchParams.get('subjectId')

    // Build chapter filter through subject → class hierarchy
    const chapterWhere: Record<string, unknown> = {}
    const subjectFilter: Record<string, unknown> = {}

    if (subjectId) {
      chapterWhere.subjectId = subjectId
    }

    if (classLevel) {
      subjectFilter.class = { slug: classLevel }
    }

    if (Object.keys(subjectFilter).length > 0) {
      chapterWhere.subject = subjectFilter
    }

    // 1. Fetch all matching chapters with subject info
    const chapters = await db.chapter.findMany({
      where: chapterWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    if (chapters.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const chapterIds = chapters.map((c) => c.id)

    // 2. Build MCQ where clause
    const mcqWhere: Record<string, unknown> = {
      isActive: true,
      chapterId: { in: chapterIds },
    }
    if (classLevel) {
      mcqWhere.classLevel = classLevel
    }

    // 3. Group MCQs by chapterId + isPremium
    const mcqGroups = await db.mCQ.groupBy({
      by: ['chapterId', 'isPremium'],
      _count: true,
      where: mcqWhere,
    })

    // 4. Build CQ where clause
    const cqWhere: Record<string, unknown> = {
      isActive: true,
      chapterId: { in: chapterIds },
    }
    if (classLevel) {
      cqWhere.classLevel = classLevel
    }

    // 5. Group CQs by chapterId + isPremium
    const cqGroups = await db.cQ.groupBy({
      by: ['chapterId', 'isPremium'],
      _count: true,
      where: cqWhere,
    })

    // 6. Build lookup maps for quick merging
    // Key format: "chapterId-isPremium" → count
    const mcqMap = new Map<string, number>()
    for (const g of mcqGroups) {
      const key = `${g.chapterId}-${g.isPremium}`
      mcqMap.set(key, g._count)
    }

    const cqMap = new Map<string, number>()
    for (const g of cqGroups) {
      const key = `${g.chapterId}-${g.isPremium}`
      cqMap.set(key, g._count)
    }

    // 7. Merge into final response
    const data = chapters.map((chapter) => {
      const mcqPremium = mcqMap.get(`${chapter.id}-true`) || 0
      const mcqFree = mcqMap.get(`${chapter.id}-false`) || 0
      const cqPremium = cqMap.get(`${chapter.id}-true`) || 0
      const cqFree = cqMap.get(`${chapter.id}-false`) || 0

      return {
        chapterId: chapter.id,
        chapterName: chapter.name,
        chapterSlug: chapter.slug,
        subjectId: chapter.subject.id,
        subjectName: chapter.subject.name,
        mcqTotal: mcqPremium + mcqFree,
        mcqPremium,
        mcqFree,
        cqTotal: cqPremium + cqFree,
        cqPremium,
        cqFree,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Admin Chapters Content Counts error:', error)
    return NextResponse.json(
      { error: 'অধ্যায়ের কন্টেন্ট সংখ্যা আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
