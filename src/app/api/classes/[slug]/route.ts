import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params

    const classCategory = await db.classCategory.findUnique({
      where: { slug, isActive: true },
      include: {
        subjects: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
            _count: { select: { chapters: true } },
          },
        },
      },
    })

    if (!classCategory) {
      return NextResponse.json(
        { error: 'ক্লাস খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    const subjects = classCategory.subjects
    const subjectIds = subjects.map((s) => s.id)

    // Early return when no subjects exist
    if (subjectIds.length === 0) {
      const result = {
        id: classCategory.id,
        name: classCategory.name,
        slug: classCategory.slug,
        description: classCategory.description ?? null,
        subjects: [],
        contentOverview: {
          totalLectures: 0,
          totalMcqs: 0,
          totalCqs: 0,
          totalBoardQuestions: 0,
        },
      }
      return NextResponse.json(result)
    }

    // ── Aggregated batch queries (3 total vs N×5 previously) ──
    const [lectureRows, mcqRows, cqRows] = await Promise.all([
      db.$queryRaw<Array<{ subject_id: string; count: bigint }>>(Prisma.sql`
        SELECT ch."subjectId" AS subject_id, COUNT(l.id)::bigint AS count
        FROM "Lecture" l
        INNER JOIN "Chapter" ch ON ch.id = l."chapterId"
        WHERE ch."subjectId" IN (${Prisma.join(subjectIds)})
          AND l."isActive" = true
          AND ch."isActive" = true
        GROUP BY ch."subjectId"
      `),
      db.$queryRaw<Array<{ subject_id: string; total: bigint; board: bigint }>>(Prisma.sql`
        SELECT "subjectId" AS subject_id,
               COUNT(*)::bigint AS total,
               COUNT(*) FILTER (WHERE "board" IS NOT NULL AND "year" IS NOT NULL)::bigint AS board
        FROM "MCQ"
        WHERE "subjectId" IN (${Prisma.join(subjectIds)}) AND "isActive" = true
        GROUP BY "subjectId"
      `),
      db.$queryRaw<Array<{ subject_id: string; total: bigint; board: bigint }>>(Prisma.sql`
        SELECT "subjectId" AS subject_id,
               COUNT(*)::bigint AS total,
               COUNT(*) FILTER (WHERE "board" IS NOT NULL AND "year" IS NOT NULL)::bigint AS board
        FROM "CQ"
        WHERE "subjectId" IN (${Prisma.join(subjectIds)}) AND "isActive" = true
        GROUP BY "subjectId"
      `),
    ])

    // Build lookup maps
    const lectureMap = new Map(lectureRows.map((r) => [r.subject_id, Number(r.count)]))
    const mcqMap = new Map(mcqRows.map((r) => [r.subject_id, Number(r.total)]))
    const mcqBoardMap = new Map(mcqRows.map((r) => [r.subject_id, Number(r.board)]))
    const cqMap = new Map(cqRows.map((r) => [r.subject_id, Number(r.total)]))
    const cqBoardMap = new Map(cqRows.map((r) => [r.subject_id, Number(r.board)]))

    const subjectsWithCounts = subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      icon: subject.icon || 'book',
      chapterCount: subject._count.chapters,
      color: subject.color || 'bg-emerald-500',
      contentCounts: {
        lectures: lectureMap.get(subject.id) ?? 0,
        mcqs: mcqMap.get(subject.id) ?? 0,
        cqs: cqMap.get(subject.id) ?? 0,
        boardQuestions: (mcqBoardMap.get(subject.id) ?? 0) + (cqBoardMap.get(subject.id) ?? 0),
      },
    }))

    const contentOverview = subjectsWithCounts.reduce(
      (acc, subject) => ({
        totalLectures: acc.totalLectures + subject.contentCounts.lectures,
        totalMcqs: acc.totalMcqs + subject.contentCounts.mcqs,
        totalCqs: acc.totalCqs + subject.contentCounts.cqs,
        totalBoardQuestions:
          acc.totalBoardQuestions + subject.contentCounts.boardQuestions,
      }),
      { totalLectures: 0, totalMcqs: 0, totalCqs: 0, totalBoardQuestions: 0 }
    )

    const result = {
      id: classCategory.id,
      name: classCategory.name,
      slug: classCategory.slug,
      description: classCategory.description ?? null,
      subjects: subjectsWithCounts,
      contentOverview,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get class detail error:', error)
    return NextResponse.json(
      { error: 'ক্লাসের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
