import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/board-questions?type=mcq&board=dhaka&year=2024&classLevel=ssc&subjectId=xxx&chapterId=xxx
// Returns board questions grouped with boards/years metadata
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // mcq, cq, or both if not specified
    const board = searchParams.get('board')
    const year = searchParams.get('year')
    const classLevel = searchParams.get('classLevel')
    const subjectId = searchParams.get('subjectId')
    const chapterId = searchParams.get('chapterId')

    // Support comma-separated multi-value filters
    const boardList = board ? board.split(',').filter(Boolean) : []
    const yearList = year ? year.split(',').filter(Boolean) : []
    const classLevelList = classLevel ? classLevel.split(',').filter(Boolean) : []
    const subjectIdList = subjectId ? subjectId.split(',').filter(Boolean) : []
    const chapterIdList = chapterId ? chapterId.split(',').filter(Boolean) : []
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '500')

    // Build where clauses for MCQ and CQ — only board questions WITH both board AND year
    // Board questions must have both `board` and `year` fields set
    const baseWhere: Record<string, unknown> = {
      isActive: true,
      board: { not: null },
      year: { not: null },
    }
    if (boardList.length > 0) baseWhere.board = { in: boardList }
    if (yearList.length > 0) baseWhere.year = { in: yearList }
    if (classLevelList.length > 0) baseWhere.classLevel = { in: classLevelList }
    if (subjectIdList.length > 0) baseWhere.subjectId = { in: subjectIdList }
    if (chapterIdList.length > 0) baseWhere.chapterId = { in: chapterIdList }

    // Fetch MCQs if type is mcq or not specified
    const fetchMcqs = !type || type === 'mcq'
    // Fetch CQs if type is cq or not specified
    const fetchCqs = !type || type === 'cq'

    // Get counts for pagination based on type
    const [mcqTotal, cqTotal] = await Promise.all([
      fetchMcqs ? db.mCQ.count({ where: baseWhere }) : Promise.resolve(0),
      fetchCqs ? db.cQ.count({ where: baseWhere }) : Promise.resolve(0),
    ])

    // Parallel queries for data and metadata
    const [mcqs, cqs, boards, mcqYears, cqYears] = await Promise.all([
      fetchMcqs
        ? db.mCQ.findMany({
            where: baseWhere,
            include: {
              chapter: {
                select: { id: true, name: true, slug: true, subject: { select: { id: true, name: true } } },
              },
            },
            orderBy: [{ year: 'desc' }, { board: 'asc' }],
            skip: fetchCqs ? 0 : (page - 1) * limit,
            take: fetchCqs ? undefined : limit,
          })
        : [],
      fetchCqs
        ? db.cQ.findMany({
            where: baseWhere,
            include: {
              chapter: {
                select: { id: true, name: true, slug: true, subject: { select: { id: true, name: true } } },
              },
            },
            orderBy: [{ year: 'desc' }, { board: 'asc' }],
            skip: fetchMcqs ? 0 : (page - 1) * limit,
            take: fetchMcqs ? undefined : limit,
          })
        : [],
      // Get active boards from Board table
      db.board.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, slug: true, color: true },
      }),
      // Get distinct years from MCQs with board
      db.mCQ.findMany({
        where: { isActive: true, board: { not: null }, year: { not: null } },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
      // Get distinct years from CQs with board
      db.cQ.findMany({
        where: { isActive: true, board: { not: null }, year: { not: null } },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
    ])

    // Total counts are computed from the combined data above

    // Transform MCQs to unified format
    const mcqItems = mcqs.map((mcq) => {
      const plainTitle = mcq.question
        .replace(/<[^>]*>/g, '')
        .replace(/\$\$[\s\S]*?\$\$/g, '[গণিত]')
        .replace(/\$[^$]*?\$/g, '[গণিত]')
      return {
      id: mcq.id,
      type: 'mcq' as const,
      board: mcq.board!,
      year: mcq.year || '',
      classLevel: mcq.classLevel,
      subjectId: mcq.subjectId,
      chapterId: mcq.chapterId,
      subjectName: mcq.chapter?.subject?.name || '',
      chapterName: mcq.chapter?.name || '',
      title: plainTitle.length > 80 ? plainTitle.slice(0, 80) + '...' : plainTitle,
      question: mcq.question,
      questionImage: mcq.questionImage,
      isPremium: mcq.isPremium,
      price: mcq.price,
      difficulty: mcq.difficulty,
      questionCount: 1,
    }})

    // Transform CQs to unified format
    const cqItems = cqs.map((cq) => {
      const plainTitle = cq.uddeepok
        .replace(/<[^>]*>/g, '')
        .replace(/\$\$[\s\S]*?\$\$/g, '[গণিত]')
        .replace(/\$[^$]*?\$/g, '[গণিত]')
      return {
      id: cq.id,
      type: 'cq' as const,
      board: cq.board!,
      year: cq.year || '',
      classLevel: cq.classLevel,
      subjectId: cq.subjectId,
      chapterId: cq.chapterId,
      subjectName: cq.chapter?.subject?.name || '',
      chapterName: cq.chapter?.name || '',
      title: plainTitle.length > 80 ? plainTitle.slice(0, 80) + '...' : plainTitle,
      uddeepokImage: cq.uddeepokImage,
      isPremium: cq.isPremium,
      price: cq.price,
      difficulty: cq.difficulty,
      questionCount: 4, // CQs have 4 sub-questions
    }})

    // Combine and sort by year desc, then board asc
    const allData = [...mcqItems, ...cqItems].sort((a, b) => {
      if (a.year !== b.year) return b.year.localeCompare(a.year)
      return a.board.localeCompare(b.board)
    })

    // Apply pagination to combined results
    const total = mcqTotal + cqTotal
    const totalPages = Math.ceil(total / limit)
    const paginatedData = allData.slice((page - 1) * limit, page * limit)

    // Merge available years from both MCQ and CQ tables
    const yearSet = new Set<string>()
    mcqYears.forEach((y) => { if (y.year) yearSet.add(y.year) })
    cqYears.forEach((y) => { if (y.year) yearSet.add(y.year) })
    const availableYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a))

    // Build board color map for quick lookup
    const boardColorMap: Record<string, string> = {}
    for (const b of boards) {
      boardColorMap[b.slug] = b.color || 'rose'
    }

    // Enrich paginated items with board color
    const enrichedData = paginatedData.map(item => ({
      ...item,
      boardColor: boardColorMap[item.board] || 'rose',
    }))

    // Pagination info already computed above

    return NextResponse.json({
      data: enrichedData,
      boards,
      availableYears,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Board questions API error:', error)
    return NextResponse.json(
      { error: 'বোর্ড প্রশ্নের তথ্য আনতে সমস্যা হয়েছে', data: [], boards: [], availableYears: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } },
      { status: 500 }
    )
  }
}
