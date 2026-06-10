import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * GET /api/hierarchy/metadata
 *
 * Central metadata source for the entire app.
 * Returns all metadata needed across MCQ, CQ, Exam, and other forms:
 * - classes (with subjects count)
 * - boards (active only)
 * - years (active ExamYear records)
 * - board-years mapping (active only)
 */
export async function GET() {
  try {
    // Validate database connection
    if (!db) {
      console.error('[/api/hierarchy/metadata] Database client is not available')
      return NextResponse.json(
        { success: false, error: 'ডাটাবেজ সংযোগ পাওয়া যায়নি' },
        { status: 500 }
      )
    }

    // Fetch all data in parallel
    const [classes, boards, examYears, boardYears] = await Promise.all([
      db.classCategory.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          order: true,
          icon: true,
          color: true,
          gradient: true,
          description: true,
          _count: { select: { subjects: true } },
        },
        orderBy: { order: 'asc' },
      }),
      db.board.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      }),
      db.examYear.findMany({
        where: { isActive: true },
        select: {
          id: true,
          year: true,
          order: true,
        },
        orderBy: { order: 'desc' },
      }),
      db.boardYear.findMany({
        where: { isActive: true },
        select: {
          id: true,
          board: true,
          year: true,
        },
        orderBy: [{ year: 'desc' }, { board: 'asc' }],
      }),
    ])

    // Also fetch subjects grouped by class for full hierarchy
    const subjects = await db.subject.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        classId: true,
        order: true,
        icon: true,
        color: true,
        _count: { select: { chapters: true } },
      },
      orderBy: [{ classId: 'asc' }, { order: 'asc' }],
    })

    // Also fetch chapters for full hierarchy
    const chapters = await db.chapter.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        subjectId: true,
        order: true,
      },
      orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: {
        classes,
        subjects,
        chapters,
        boards,
        years: examYears,
        boardYears,
      },
    })
  } catch (error) {
    // Log full error details for server-side debugging
    console.error('[/api/hierarchy/metadata] Error fetching metadata:', error)

    // Determine if this is a database connection error
    const isDbError = error instanceof Error && (
      error.message.includes('connect') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('P1001') ||
      error.message.includes('P1002')
    )

    const errorMessage = isDbError
      ? 'ডাটাবেজ সংযোগে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন'
      : 'মেটাডাটা লোড করতে সমস্যা হয়েছে'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
