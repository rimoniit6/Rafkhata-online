import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const subject = await db.subject.findUnique({
      where: { id, isActive: true },
      include: {
        class: true,
        chapters: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: {
                lectures: { where: { isActive: true } },
                mcqs: { where: { isActive: true } },
                cqs: { where: { isActive: true } },
              },
            },
          },
        },
      },
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'বিষয় খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    // Get board questions info from MCQs that have board/year set
    const mcqsWithBoard = await db.mCQ.findMany({
      where: {
        subjectId: id,
        isActive: true,
        board: { not: null },
        year: { not: null },
      },
      select: {
        board: true,
        year: true,
      },
    })

    // Aggregate board questions by board+year
    const boardQuestionMap = new Map<string, { board: string; year: string; count: number }>()
    for (const mcq of mcqsWithBoard) {
      if (mcq.board && mcq.year) {
        const key = `${mcq.board}-${mcq.year}`
        const existing = boardQuestionMap.get(key)
        if (existing) {
          existing.count++
        } else {
          boardQuestionMap.set(key, { board: mcq.board, year: mcq.year, count: 1 })
        }
      }
    }

    const boardQuestions = Array.from(boardQuestionMap.values())

    // Total MCQ practice count
    const mcqPracticeCount = subject.chapters.reduce(
      (sum, ch) => sum + ch._count.mcqs,
      0
    )

    // Total CQ count
    const cqCount = subject.chapters.reduce(
      (sum, ch) => sum + ch._count.cqs,
      0
    )

    // Total Lecture count
    const lectureCount = subject.chapters.reduce(
      (sum, ch) => sum + ch._count.lectures,
      0
    )

    // Count suggestions for this subject
    const suggestionCount = await db.suggestion.count({
      where: {
        subjectId: id,
        isActive: true,
      },
    })

    // Count exams for this subject
    const examCount = await db.exam.count({
      where: {
        subjectId: id,
        isActive: true,
        status: 'published',
      },
    })

    // Board question count (MCQs + CQs with BOTH board AND year set)
    const boardMcqCount = await db.mCQ.count({
      where: {
        subjectId: id,
        isActive: true,
        board: { not: null },
        year: { not: null },
      },
    })
    const boardCqCount = await db.cQ.count({
      where: {
        subjectId: id,
        isActive: true,
        board: { not: null },
        year: { not: null },
      },
    })
    const boardQuestionCount = boardMcqCount + boardCqCount

    // Practice-only MCQ count (excludes board MCQs to avoid double-counting)
    const practiceMcqCount = mcqPracticeCount - boardMcqCount

    // Free (non-premium) content counts (subject-level)
    // Note: Lecture model has no subjectId — must filter via chapter relation
    const freeLectureCount = await db.lecture.count({
      where: { chapter: { subjectId: id }, isActive: true, isPremium: false },
    })
    const freeMcqCount = await db.mCQ.count({
      where: { subjectId: id, isActive: true, isPremium: false },
    })
    const freeCqCount = await db.cQ.count({
      where: { subjectId: id, isActive: true, isPremium: false },
    })
    const freeBoardMcqCount = await db.mCQ.count({
      where: { subjectId: id, isActive: true, isPremium: false, board: { not: null }, year: { not: null } },
    })
    const freeBoardCqCount = await db.cQ.count({
      where: { subjectId: id, isActive: true, isPremium: false, board: { not: null }, year: { not: null } },
    })
    const freeBoardQuestionCount = freeBoardMcqCount + freeBoardCqCount
    // Free practice MCQs (non-board, non-premium)
    const freePracticeMcqCount = freeMcqCount - freeBoardMcqCount
    const freeSuggestionCount = await db.suggestion.count({
      where: { subjectId: id, isActive: true, isPremium: false },
    })
    const freeExamCount = await db.exam.count({
      where: { subjectId: id, isActive: true, status: 'published', isPremium: false },
    })

    // Per-chapter free counts + suggestion/exam counts
    const chapterFreeCounts = await Promise.all(
      subject.chapters.map(async (chapter) => {
        const freeLectures = await db.lecture.count({
          where: { chapterId: chapter.id, isActive: true, isPremium: false },
        })
        const freeMcqs = await db.mCQ.count({
          where: { chapterId: chapter.id, isActive: true, isPremium: false },
        })
        const freeCqs = await db.cQ.count({
          where: { chapterId: chapter.id, isActive: true, isPremium: false },
        })
        const suggestionCount = await db.suggestion.count({
          where: { chapterId: chapter.id, isActive: true },
        })
        const examCount = await db.exam.count({
          where: { chapterIds: { contains: chapter.id }, isActive: true, status: 'published' },
        })
        return { chapterId: chapter.id, freeLectures, freeMcqs, freeCqs, suggestionCount, examCount }
      })
    )
    const chapterFreeMap = new Map(chapterFreeCounts.map(c => [c.chapterId, c]))

    // Transform to match SubjectDetailPage expected format
    const result = {
      id: subject.id,
      name: subject.name,
      className: subject.class.name,
      classSlug: subject.class.slug,
      chapters: subject.chapters.map((chapter) => {
        const freeCounts = chapterFreeMap.get(chapter.id)
        return {
          id: chapter.id,
          name: chapter.name,
          number: chapter.order,
          lectureCount: chapter._count.lectures,
          mcqCount: chapter._count.mcqs,
          cqCount: chapter._count.cqs,
          freeLectureCount: freeCounts?.freeLectures ?? 0,
          freeMcqCount: freeCounts?.freeMcqs ?? 0,
          freeCqCount: freeCounts?.freeCqs ?? 0,
          suggestionCount: freeCounts?.suggestionCount ?? 0,
          examCount: freeCounts?.examCount ?? 0,
          progress: 0,
        }
      }),
      boardQuestions,
      mcqPracticeCount,
      // Generic content counts for subject-level tabs
      // mcq = ALL MCQs (board + non-board) — matches what MCQ Practice page shows
      // board = board MCQs + CQs (a subset) — for board-specific navigation
      // knowledge = same as cq count (all CQs have question1 / ক)
      // understanding = same as cq count (all CQs have question1+question2 / ক+খ)
      // Note: mcq count includes board MCQs, so mcq ≥ board. This is intentional.
      contentCounts: {
        lecture: lectureCount,
        knowledge: cqCount,       // জ্ঞানমূলক = CQ ক (same count as all CQs)
        understanding: cqCount,   // অনুধাবন = CQ ক+খ (same count as all CQs)
        mcq: mcqPracticeCount,
        cq: cqCount,
        board: boardQuestionCount,
        suggestion: suggestionCount,
        exam: examCount,
      } as Record<string, number>,
      // Free (non-premium) content counts
      freeContentCounts: {
        lecture: freeLectureCount,
        knowledge: freeCqCount,       // জ্ঞানমূলক free = CQ free count
        understanding: freeCqCount,   // অনুধাবন free = CQ free count
        mcq: freeMcqCount,
        cq: freeCqCount,
        board: freeBoardQuestionCount,
        suggestion: freeSuggestionCount,
        exam: freeExamCount,
      } as Record<string, number>,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get subject detail error:', error)
    return NextResponse.json(
      { error: 'বিষয়ের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
