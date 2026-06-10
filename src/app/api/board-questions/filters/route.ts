import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/board-questions/filters?classLevel=ssc&year=2024
// Returns available filter options filtered by given params
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classLevel = searchParams.get('classLevel')
    const year = searchParams.get('year')

    // Get all active boards
    const allBoards = await db.board.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, color: true },
    })

    // Build where clause for MCQs based on filters
    const mcqWhere: Record<string, unknown> = {
      board: { not: null },
      year: { not: null },
      isActive: true,
    }
    if (classLevel) mcqWhere.classLevel = classLevel
    if (year) mcqWhere.year = year

    const cqWhere: Record<string, unknown> = {
      board: { not: null },
      year: { not: null },
      isActive: true,
    }
    if (classLevel) cqWhere.classLevel = classLevel
    if (year) cqWhere.year = year

    // Get distinct years, boards, classLevels from MCQs
    const mcqMeta = await db.mCQ.findMany({
      where: mcqWhere,
      select: { year: true, board: true, classLevel: true, subjectId: true },
      distinct: ['year', 'board', 'classLevel', 'subjectId'],
    })

    // Also from CQs
    const cqMeta = await db.cQ.findMany({
      where: cqWhere,
      select: { year: true, board: true, classLevel: true },
      distinct: ['year', 'board', 'classLevel'],
    })

    // Extract unique values
    const yearsSet = new Set<string>()
    const classLevelsSet = new Set<string>()
    const subjectIdsSet = new Set<string>()
    const boardsWithData = new Set<string>()

    for (const m of mcqMeta) {
      if (m.year) yearsSet.add(m.year)
      if (m.classLevel) classLevelsSet.add(m.classLevel)
      if (m.subjectId) subjectIdsSet.add(m.subjectId)
      if (m.board) boardsWithData.add(m.board)
    }
    for (const c of cqMeta) {
      if (c.year) yearsSet.add(c.year)
      if (c.classLevel) classLevelsSet.add(c.classLevel)
      if (c.board) boardsWithData.add(c.board)
    }

    const years = Array.from(yearsSet).sort((a, b) => b.localeCompare(a))

    // Get ClassCategory info for proper display
    const classLevelSlugs = Array.from(classLevelsSet)
    const classCategories = classLevelSlugs.length > 0
      ? await db.classCategory.findMany({
          where: { slug: { in: classLevelSlugs }, isActive: true },
          select: { id: true, name: true, slug: true, order: true },
          orderBy: { order: 'asc' },
        })
      : []

    // Get total board question counts per class level for stats
    const classLevelCounts: Record<string, { mcqCount: number; cqCount: number }> = {}
    for (const cls of classLevelSlugs) {
      const [mcqCount, cqCount] = await Promise.all([
        db.mCQ.count({ where: { ...mcqWhere, classLevel: cls } }),
        db.cQ.count({ where: { ...cqWhere, classLevel: cls } }),
      ])
      classLevelCounts[cls] = { mcqCount, cqCount }
    }

    const classLevels = classCategories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      order: c.order,
      mcqCount: classLevelCounts[c.slug]?.mcqCount || 0,
      cqCount: classLevelCounts[c.slug]?.cqCount || 0,
      boardCount: allBoards.filter(b => boardsWithData.has(b.slug)).length,
    }))

    // Filter boards to only show boards that have data for the given filters
    const boards = allBoards
      .filter(b => boardsWithData.has(b.slug))
      .map(b => ({ ...b, hasData: true }))

    // Get subject names
    const uniqueSubjectIds = Array.from(subjectIdsSet)
    const subjects = uniqueSubjectIds.length > 0
      ? await db.subject.findMany({
          where: { id: { in: uniqueSubjectIds }, isActive: true },
          select: { id: true, name: true, slug: true },
          orderBy: { order: 'asc' },
        })
      : []

    return NextResponse.json({
      boards,
      years,
      classLevels,
      subjects,
    })
  } catch (error) {
    console.error('Board questions filters error:', error)
    return NextResponse.json({ error: 'ফিল্টার অপশন লোড করতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
