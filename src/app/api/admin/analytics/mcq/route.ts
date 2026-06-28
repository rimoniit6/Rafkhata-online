import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import type { McqAnalytics } from '@/types/analytics'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0]
    const prevFrom = searchParams.get('prevFrom') || new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
    const prevTo = searchParams.get('prevTo') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

    const fromDate = new Date(from)
    const toDate = new Date(to + 'T23:59:59.999Z')

    const [
      mcqProgress,
      examResults,
      setQuestions,
      easyMcqs,
      hardMcqs,
    ] = await Promise.all([
      db.progress.findMany({
        where: { contentType: 'mcq' },
        select: { contentId: true, progress: true },
      }),
      db.mCQExamSetResult.findMany({
        where: { submittedAt: { gte: fromDate, lte: toDate } },
        select: {
          totalCorrect: true,
          totalWrong: true,
          totalSkipped: true,
          marksObtained: true,
          totalMarks: true,
          setId: true,
        },
      }),
      db.mCQExamSetQuestion.findMany({
        select: { setId: true, mcqId: true },
      }),
      db.mCQ.findMany({
        where: { isActive: true },
        select: { id: true, question: true },
        take: 1,
        orderBy: { id: 'asc' },
      }),
      db.mCQ.findMany({
        where: { isActive: true },
        select: { id: true, question: true },
        take: 1,
        orderBy: { id: 'desc' },
      }),
    ])

    // questionsSolved: distinct MCQs accessed
    const distinctMcqIds = new Set(mcqProgress.map(p => p.contentId))
    const questionsSolved = distinctMcqIds.size

    // Exam result aggregates
    const totalCorrect = examResults.reduce((s, r) => s + r.totalCorrect, 0)
    const totalWrong = examResults.reduce((s, r) => s + r.totalWrong, 0)
    const totalSkipped = examResults.reduce((s, r) => s + r.totalSkipped, 0)
    const totalAnswered = totalCorrect + totalWrong + totalSkipped

    // accuracy
    const accuracy = totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 10000) / 100
      : 0

    // correctPercent / wrongPercent / skippedPercent
    const correctPercent = totalAnswered > 0
      ? Math.round((totalCorrect / totalAnswered) * 10000) / 100
      : 0
    const wrongPercent = totalAnswered > 0
      ? Math.round((totalWrong / totalAnswered) * 10000) / 100
      : 0
    const skippedPercent = totalAnswered > 0
      ? Math.round((totalSkipped / totalAnswered) * 10000) / 100
      : 0

    // averageScore: avg marksObtained percentage per exam
    const scoredExams = examResults.filter(r => r.totalMarks > 0)
    const averageScore = scoredExams.length > 0
      ? Math.round(scoredExams.reduce((s, r) => s + (r.marksObtained / r.totalMarks) * 100, 0) / scoredExams.length * 100) / 100
      : 0

    // mostDifficult / mostEasy
    const setToMcq = new Map<string, string[]>()
    for (const sq of setQuestions) {
      const list = setToMcq.get(sq.setId) || []
      list.push(sq.mcqId)
      setToMcq.set(sq.setId, list)
    }

    const setScores = new Map<string, { correct: number; wrong: number }>()
    for (const r of examResults) {
      const existing = setScores.get(r.setId) || { correct: 0, wrong: 0 }
      existing.correct += r.totalCorrect
      existing.wrong += r.totalWrong
      setScores.set(r.setId, existing)
    }

    let worstMcq = { id: '', question: 'N/A', wrongRate: 0 }
    let bestMcq = { id: '', question: 'N/A', correctRate: 0 }

    if (setScores.size > 0 && setToMcq.size > 0) {
      let worstRate = -1
      let bestRate = -1

      for (const [setId, score] of setScores) {
        const total = score.correct + score.wrong
        if (total === 0) continue
        const wRate = score.wrong / total
        const cRate = score.correct / total
        const mcqs = setToMcq.get(setId) || []

        if (wRate > worstRate && mcqs.length > 0) {
          worstRate = wRate
          const mcqData = await db.mCQ.findUnique({
            where: { id: mcqs[0] },
            select: { id: true, question: true },
          })
          if (mcqData) {
            worstMcq = { id: mcqData.id, question: mcqData.question.substring(0, 100), wrongRate: Math.round(wRate * 10000) / 100 }
          }
        }
        if (cRate > bestRate && mcqs.length > 0) {
          bestRate = cRate
          const mcqData = await db.mCQ.findUnique({
            where: { id: mcqs[0] },
            select: { id: true, question: true },
          })
          if (mcqData) {
            bestMcq = { id: mcqData.id, question: mcqData.question.substring(0, 100), correctRate: Math.round(cRate * 10000) / 100 }
          }
        }
      }
    }

    return apiResponse({
      questionsSolved,
      accuracy,
      correctPercent,
      wrongPercent,
      skippedPercent,
      mostDifficult: worstMcq,
      mostEasy: bestMcq,
      averageScore,
    } satisfies McqAnalytics)
  } catch (error) {
    return handleApiError(error, 'MCQ Analytics')
  }
}
