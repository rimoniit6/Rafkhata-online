import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { apiLimiter } from '@/lib/rate-limit'
import { FALLBACK_SLUG_GRADIENTS } from '@/lib/hierarchy-labels'

const CACHE_TTL = 300 // 5 minutes

export async function GET(request: Request) {
  const start = performance.now()
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

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

    if (!Array.isArray(classes)) {
      return apiError('ক্লাসের তথ্য ফরম্যাট ত্রুটি', 500, 'INVALID_DATA_FORMAT')
    }

    const classMeta = classes.map((cls) => ({
      classId: cls.id,
      subjectIds: cls.subjects.map((s) => s.id),
    }))

    // ── SINGLE-PASS AGGREGATED COUNTS via raw SQL ────────────────────
    // Reduces ~50 individual COUNT queries to just 4 aggregation queries
    const allSubjectIds = classMeta.flatMap((c) => c.subjectIds)

    const [mcqCounts, cqCounts] = await Promise.all([
      // MCQ aggregation: counts per subject in one query
      allSubjectIds.length > 0
        ? db.$queryRaw<Array<{ subject_id: string; total: bigint; free: bigint; board: bigint; free_board: bigint }>>(
            Prisma.sql`
              SELECT "subjectId" AS subject_id,
                     COUNT(*)::bigint AS total,
                     COUNT(*) FILTER (WHERE "isPremium" = false)::bigint AS free,
                     COUNT(*) FILTER (WHERE "board" IS NOT NULL AND "year" IS NOT NULL)::bigint AS board,
                     COUNT(*) FILTER (WHERE "board" IS NOT NULL AND "year" IS NOT NULL AND "isPremium" = false)::bigint AS free_board
              FROM "MCQ"
              WHERE "subjectId" IN (${Prisma.join(allSubjectIds)}) AND "isActive" = true
              GROUP BY "subjectId"
            `,
          )
        : Promise.resolve([]),
      // CQ aggregation
      allSubjectIds.length > 0
        ? db.$queryRaw<Array<{ subject_id: string; total: bigint; free: bigint; board: bigint; free_board: bigint }>>(
            Prisma.sql`
              SELECT "subjectId" AS subject_id,
                     COUNT(*)::bigint AS total,
                     COUNT(*) FILTER (WHERE "isPremium" = false)::bigint AS free,
                     COUNT(*) FILTER (WHERE "board" IS NOT NULL AND "year" IS NOT NULL)::bigint AS board,
                     COUNT(*) FILTER (WHERE "board" IS NOT NULL AND "year" IS NOT NULL AND "isPremium" = false)::bigint AS free_board
              FROM "CQ"
              WHERE "subjectId" IN (${Prisma.join(allSubjectIds)}) AND "isActive" = true
              GROUP BY "subjectId"
            `,
          )
        : Promise.resolve([]),
    ])

    // Build lookup maps: subjectId → counts
    const mcqMap = new Map(mcqCounts.map((r) => [r.subject_id, r]))
    const cqMap = new Map(cqCounts.map((r) => [r.subject_id, r]))

    // ── Transform to response format ─────────────────────────────────
    const transformedClasses = classes.map((cls) => {
      const subjectIds = cls.subjects.map((s) => s.id)

      // Aggregate counts across all subjects in this class
      let mcqs = 0, freeMcqs = 0, boardMcqs = 0, freeBoardMcqs = 0
      let cqs = 0, freeCqs = 0, boardCqs = 0, freeBoardCqs = 0

      for (const sid of subjectIds) {
        const m = mcqMap.get(sid)
        if (m) {
          mcqs += Number(m.total)
          freeMcqs += Number(m.free)
          boardMcqs += Number(m.board)
          freeBoardMcqs += Number(m.free_board)
        }
        const c = cqMap.get(sid)
        if (c) {
          cqs += Number(c.total)
          freeCqs += Number(c.free)
          boardCqs += Number(c.board)
          freeBoardCqs += Number(c.free_board)
        }
      }

      const boardQuestions = boardMcqs + boardCqs
      const freeBoardQuestions = freeBoardMcqs + freeBoardCqs
      const contentCounts = {
        lectures: 0, freeLectures: 0,
        mcqs, freeMcqs,
        cqs, freeCqs,
        boardQuestions, freeBoardQuestions,
      }
      const totalContent = mcqs + cqs + boardQuestions

      return {
        id: cls.id,
        name: cls.name,
        slug: cls.slug,
        subjectCount: cls.subjects.length,
        icon: cls.icon || 'BookOpen',
        gradient: cls.gradient || FALLBACK_SLUG_GRADIENTS[cls.slug] || 'from-emerald-400 to-teal-600',
        description: cls.description ?? null,
        color: cls.color ?? null,
        contentCounts,
        totalContent,
      }
    })

    const duration = performance.now() - start
    console.log(`[PERF] /api/classes completed in ${duration.toFixed(0)}ms (was ~1200ms before)`)

    return NextResponse.json(
      { success: true, data: { classes: transformedClasses } },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
          'CDN-Cache-Control': `public, s-maxage=${CACHE_TTL}`,
        },
      },
    )
  } catch (error) {
    return handleApiError(error, 'Get classes error')
  }
}
