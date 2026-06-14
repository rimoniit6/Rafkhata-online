import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const chapter = await db.chapter.findUnique({
      where: { id, isActive: true },
      include: {
        subject: {
          include: {
            class: true,
          },
        },
        lectures: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            mcqs: { where: { isActive: true } },
            cqs: { where: { isActive: true } },
          },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: 'অধ্যায় খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    // Total counts
    const lectureCount = chapter.lectures.length
    const mcqCount = chapter._count.mcqs  // ALL active MCQs (including board)
    const cqCount = chapter._count.cqs

    // Count board questions (MCQs + CQs with BOTH board AND year set — subset of total counts)
    const boardMcqCount = await db.mCQ.count({
      where: {
        chapterId: id,
        isActive: true,
        board: { not: null },
        year: { not: null },
      },
    })
    const boardCqCount = await db.cQ.count({
      where: {
        chapterId: id,
        isActive: true,
        board: { not: null },
        year: { not: null },
      },
    })
    const boardQuestionCount = boardMcqCount + boardCqCount

    // Non-board MCQ count (practice-only MCQs, excluding board MCQs)
    const practiceMcqCount = mcqCount - boardMcqCount

    // Count suggestions for this chapter
    const suggestionCount = await db.suggestion.count({
      where: {
        chapterId: id,
        isActive: true,
      },
    })

    // Count exams that include this chapter
    const examCount = await db.exam.count({
      where: {
        isActive: true,
        status: 'published',
        chapterIds: { contains: id },
      },
    })

    // Knowledge & Comprehension questions count (combined as short questions)
    const shortQuestionCount = await db.knowledgeQuestion.count({
      where: { chapterId: id, isActive: true },
    })
    const freeShortQuestionCount = await db.knowledgeQuestion.count({
      where: { chapterId: id, isActive: true, isPremium: false },
    })

    // Free (non-premium) content counts
    const freeLectureCount = await db.lecture.count({
      where: { chapterId: id, isActive: true, isPremium: false },
    })
    const freeMcqCount = await db.mCQ.count({
      where: { chapterId: id, isActive: true, isPremium: false },
    })
    const freeCqCount = await db.cQ.count({
      where: { chapterId: id, isActive: true, isPremium: false },
    })
    const freeBoardMcqCount = await db.mCQ.count({
      where: { chapterId: id, isActive: true, isPremium: false, board: { not: null }, year: { not: null } },
    })
    const freeBoardCqCount = await db.cQ.count({
      where: { chapterId: id, isActive: true, isPremium: false, board: { not: null }, year: { not: null } },
    })
    const freeBoardQuestionCount = freeBoardMcqCount + freeBoardCqCount
    // Free practice MCQs (non-board, non-premium)
    const freePracticeMcqCount = freeMcqCount - freeBoardMcqCount

    const freeSuggestionCount = await db.suggestion.count({
      where: { chapterId: id, isActive: true, isPremium: false },
    })
    const freeExamCount = await db.exam.count({
      where: {
        isActive: true,
        status: 'published',
        isPremium: false,
        chapterIds: { contains: id },
      },
    })

    const result = {
      id: chapter.id,
      name: chapter.name,
      number: chapter.order,
      subjectName: chapter.subject.name,
      className: chapter.subject.class.name,
      classSlug: chapter.subject.class.slug,
      subjectId: chapter.subject.id,
      // Keep individual counts for backward compatibility
      lectureCount,
      mcqCount,
      cqCount,
      boardQuestionCount,
      progress: 0,
      // Generic content counts map keyed by content type key
      // mcq = ALL MCQs (board + non-board) — matches what MCQ Practice page shows
      // board = board MCQs + CQs (a subset) — for board-specific navigation
      // knowledge = same as cq count (all CQs have question1 / ক)
      // understanding = same as cq count (all CQs have question1+question2 / ক+খ)
      // Note: mcq count includes board MCQs, so mcq ≥ board. This is intentional.
      contentCounts: {
        lecture: lectureCount,
        knowledge: cqCount,
        understanding: cqCount,
        mcq: mcqCount,
        cq: cqCount,
        board: boardQuestionCount,
        suggestion: suggestionCount,
        exam: examCount,
        'short-questions': shortQuestionCount,
      } as Record<string, number>,
      freeContentCounts: {
        lecture: freeLectureCount,
        knowledge: freeCqCount,
        understanding: freeCqCount,
        mcq: freeMcqCount,
        cq: freeCqCount,
        board: freeBoardQuestionCount,
        suggestion: freeSuggestionCount,
        exam: freeExamCount,
        'short-questions': freeShortQuestionCount,
      } as Record<string, number>,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get chapter detail error:', error)
    return NextResponse.json(
      { error: 'অধ্যায়ের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
