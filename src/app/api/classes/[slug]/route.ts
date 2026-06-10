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
          include: {
            chapters: {
              where: { isActive: true },
              select: { id: true },
            },
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

    // Fetch content counts for each subject in parallel
    const subjectsWithCounts = await Promise.all(
      classCategory.subjects.map(async (subject) => {
        const chapterIds = subject.chapters.map((ch) => ch.id)

        // Batch all count queries for this subject
        const [lectureCount, mcqCount, cqCount, boardMcqCount, boardCqCount] =
          await Promise.all([
            // Lectures: counted through chapters (Lecture has no direct subjectId)
            chapterIds.length > 0
              ? db.lecture.count({
                  where: {
                    chapterId: { in: chapterIds },
                    isActive: true,
                  },
                })
              : Promise.resolve(0),
            // MCQs: directly by subjectId
            db.mCQ.count({
              where: { subjectId: subject.id, isActive: true },
            }),
            // CQs: directly by subjectId
            db.cQ.count({
              where: { subjectId: subject.id, isActive: true },
            }),
            // Board MCQs: subjectId + board IS NOT NULL + year IS NOT NULL
            db.mCQ.count({
              where: {
                subjectId: subject.id,
                isActive: true,
                board: { not: null },
                year: { not: null },
              },
            }),
            // Board CQs: subjectId + board IS NOT NULL + year IS NOT NULL
            db.cQ.count({
              where: {
                subjectId: subject.id,
                isActive: true,
                board: { not: null },
                year: { not: null },
              },
            }),
          ])

        return {
          id: subject.id,
          name: subject.name,
          slug: subject.slug,
          icon: subject.icon || 'book',
          chapterCount: subject.chapters.length,
          color: subject.color || 'bg-emerald-500',
          contentCounts: {
            lectures: lectureCount,
            mcqs: mcqCount,
            cqs: cqCount,
            boardQuestions: boardMcqCount + boardCqCount,
          },
        }
      })
    )

    // Compute content overview totals across all subjects
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
