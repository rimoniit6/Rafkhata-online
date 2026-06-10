import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { FALLBACK_SLUG_GRADIENTS } from '@/lib/hierarchy-labels'

export async function GET() {
  try {
    // Validate database connection
    if (!db) {
      return apiError('ডাটাবেজ সংযোগ পাওয়া যায়নি', 500, 'DB_CONNECTION_ERROR')
    }

    const classes = await db.classCategory.findMany({
      where: { isActive: true },
      include: {
        subjects: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: { id: true },
        },
      },
      orderBy: { order: 'asc' },
    })

    // Validate that we got data back
    if (!Array.isArray(classes)) {
      return apiError('ক্লাসের তথ্য ফরম্যাট ত্রুটি', 500, 'INVALID_DATA_FORMAT')
    }

    // ── Bulk-fetch all chapters for every class at once ──────────────
    const allSubjectIds = classes.flatMap((cls) => cls.subjects.map((s) => s.id))

    const allChapters = allSubjectIds.length > 0
      ? await db.chapter.findMany({
          where: { subjectId: { in: allSubjectIds }, isActive: true },
          select: { id: true, subjectId: true },
        })
      : []

    // Map: subjectId → chapterIds[]
    const chaptersBySubject = new Map<string, string[]>()
    for (const ch of allChapters) {
      const arr = chaptersBySubject.get(ch.subjectId)
      if (arr) arr.push(ch.id)
      else chaptersBySubject.set(ch.subjectId, [ch.id])
    }

    // ── Bulk counts across all classes ───────────────────────────────
    // Collect per-class subject IDs & chapter IDs up front
    const classMeta = classes.map((cls) => {
      const subjectIds = cls.subjects.map((s) => s.id)
      const chapterIds = subjectIds.flatMap((sid) => chaptersBySubject.get(sid) ?? [])
      return { classId: cls.id, subjectIds, chapterIds }
    })

    // Run all count queries in parallel (one set per class)
    const countResults = await Promise.all(
      classMeta.map(async ({ classId, subjectIds, chapterIds }) => {
        if (subjectIds.length === 0) {
          return {
            classId,
            lectures: 0,
            mcqs: 0,
            cqs: 0,
            boardMcqs: 0,
            boardCqs: 0,
          }
        }

        const [
          lectureCount,
          freeLectureCount,
          mcqCount,
          freeMcqCount,
          cqCount,
          freeCqCount,
          boardMcqCount,
          freeBoardMcqCount,
          boardCqCount,
          freeBoardCqCount,
        ] = await Promise.all([
          chapterIds.length > 0
            ? db.lecture.count({
                where: { chapterId: { in: chapterIds }, isActive: true },
              })
            : Promise.resolve(0),
          chapterIds.length > 0
            ? db.lecture.count({
                where: { chapterId: { in: chapterIds }, isActive: true, isPremium: false },
              })
            : Promise.resolve(0),
          db.mCQ.count({
            where: { subjectId: { in: subjectIds }, isActive: true },
          }),
          db.mCQ.count({
            where: { subjectId: { in: subjectIds }, isActive: true, isPremium: false },
          }),
          db.cQ.count({
            where: { subjectId: { in: subjectIds }, isActive: true },
          }),
          db.cQ.count({
            where: { subjectId: { in: subjectIds }, isActive: true, isPremium: false },
          }),
          db.mCQ.count({
            where: {
              subjectId: { in: subjectIds },
              isActive: true,
              board: { not: null },
              year: { not: null },
            },
          }),
          db.mCQ.count({
            where: {
              subjectId: { in: subjectIds },
              isActive: true,
              board: { not: null },
              year: { not: null },
              isPremium: false,
            },
          }),
          db.cQ.count({
            where: {
              subjectId: { in: subjectIds },
              isActive: true,
              board: { not: null },
              year: { not: null },
            },
          }),
          db.cQ.count({
            where: {
              subjectId: { in: subjectIds },
              isActive: true,
              board: { not: null },
              year: { not: null },
              isPremium: false,
            },
          }),
        ])

        return {
          classId,
          lectures: lectureCount,
          freeLectures: freeLectureCount,
          mcqs: mcqCount,
          freeMcqs: freeMcqCount,
          cqs: cqCount,
          freeCqs: freeCqCount,
          boardMcqs: boardMcqCount,
          freeBoardMcqs: freeBoardMcqCount,
          boardCqs: boardCqCount,
          freeBoardCqs: freeBoardCqCount,
        }
      }),
    )

    // Build a quick lookup: classId → counts
    const countsMap = new Map(countResults.map((c) => [c.classId, c]))

    // ── Transform to response format ─────────────────────────────────
    const transformedClasses = classes.map((cls) => {
      const counts = countsMap.get(cls.id)
      const boardQuestions = (counts?.boardMcqs ?? 0) + (counts?.boardCqs ?? 0)
      const freeBoardQuestions = (counts?.freeBoardMcqs ?? 0) + (counts?.freeBoardCqs ?? 0)
      const contentCounts = {
        lectures: counts?.lectures ?? 0,
        freeLectures: counts?.freeLectures ?? 0,
        mcqs: counts?.mcqs ?? 0,
        freeMcqs: counts?.freeMcqs ?? 0,
        cqs: counts?.cqs ?? 0,
        freeCqs: counts?.freeCqs ?? 0,
        boardQuestions,
        freeBoardQuestions,
      }
      const totalContent =
        contentCounts.lectures +
        contentCounts.mcqs +
        contentCounts.cqs +
        contentCounts.boardQuestions

      return {
        id: cls.id,
        name: cls.name,
        slug: cls.slug,
        subjectCount: cls.subjects.length,
        icon: cls.icon || 'BookOpen',
        gradient: FALLBACK_SLUG_GRADIENTS[cls.slug] || 'from-emerald-400 to-teal-600',
        description: cls.description ?? null,
        color: cls.color ?? null,
        contentCounts,
        totalContent,
      }
    })

    return NextResponse.json({ classes: transformedClasses })
  } catch (error) {
    return handleApiError(error, 'Get classes error')
  }
}
