import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { toDecimal } from '@/lib/decimal'

const SECTION_QUERIES: Record<string, (from: Date, to: Date) => Promise<Record<string, unknown>>> = {
  revenue: async (from, to) => {
    const agg = await db.payment.aggregate({
      where: { status: 'APPROVED', createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    })
    const byMethod = await db.payment.groupBy({
      by: ['method'],
      where: { status: 'APPROVED', createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    })
    return {
      totalRevenue: toDecimal(agg._sum.amount || 0),
      totalTransactions: agg._count,
      revenueByMethod: byMethod.map((m) => ({ method: m.method, revenue: toDecimal(m._sum.amount || 0), count: m._count })),
    }
  },
  students: async (from, to) => {
    const total = await db.user.count({ where: { role: 'STUDENT' } })
    const newStudents = await db.user.count({ where: { role: 'STUDENT', createdAt: { gte: from, lte: to } } })
    return { totalStudents: total, newStudents }
  },
  courses: async (from, to) => {
    const enrollments = await db.courseEnrollment.count({ where: { enrolledAt: { gte: from, lte: to } } })
    const completions = await db.courseEnrollment.count({ where: { completedAt: { not: null, gte: from, lte: to } } })
    return { enrollments, completions }
  },
  lectures: async (from, to) => {
    const views = await db.progress.count({ where: { contentType: 'lecture', lastAccessed: { gte: from, lte: to } } })
    const bookmarks = await db.bookmark.count()
    const notes = await db.note.count()
    return { views, bookmarks, notes }
  },
  mcq: async (from, to) => {
    const results = await db.mCQExamSetResult.findMany({
      where: { submittedAt: { gte: from, lte: to } },
      select: { totalCorrect: true, totalWrong: true },
    })
    const correct = results.reduce((s, r) => s + r.totalCorrect, 0)
    const wrong = results.reduce((s, r) => s + r.totalWrong, 0)
    return { attempts: results.length, correct, wrong, accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 10000) / 100 : 0 }
  },
  cq: async (from, to) => {
    const submissions = await db.cQExamSubmission.count({ where: { submittedAt: { gte: from, lte: to } } })
    return { submissions }
  },
  payments: async (from, to) => {
    const pending = await db.payment.count({ where: { status: 'PENDING', createdAt: { gte: from, lte: to } } })
    const approved = await db.payment.count({ where: { status: 'APPROVED', createdAt: { gte: from, lte: to } } })
    const rejected = await db.payment.count({ where: { status: 'REJECTED', createdAt: { gte: from, lte: to } } })
    return { pending, approved, rejected }
  },
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const reportId: string | undefined = body.reportId
    const sectionType: string | undefined = body.type

    let report: {
      id: string
      name: string
      type: string
      format: string
      config: unknown
    }

    if (reportId) {
      const existing = await db.analyticsReport.findUnique({ where: { id: reportId } })
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
      }
      report = existing
    } else if (sectionType) {
      report = {
        id: 'ad-hoc',
        name: `${sectionType} Report`,
        type: sectionType,
        format: 'xlsx',
        config: null,
      }
    } else {
      return NextResponse.json({ success: false, error: 'reportId or type required' }, { status: 400 })
    }

    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = now

    const queryFn = SECTION_QUERIES[report.type]
    if (!queryFn) {
      return NextResponse.json({ success: false, error: `Unknown section type: ${report.type}` }, { status: 400 })
    }

    const data = await queryFn(from, to)

    const lines: string[] = []
    lines.push(`Report: ${report.name}`)
    lines.push(`Type: ${report.type}`)
    lines.push(`Period: ${from.toISOString().split('T')[0]} — ${to.toISOString().split('T')[0]}`)
    lines.push(`Generated: ${now.toISOString()}`)
    lines.push('')
    for (const [key, value] of Object.entries(data)) {
      lines.push(`${key}: ${typeof value === 'number' ? value.toLocaleString('bn-BD') : JSON.stringify(value)}`)
    }

    const csv = lines.join('\n')

    if (reportId) {
      await db.analyticsReport.update({
        where: { id: reportId },
        data: { lastGenerated: now },
      })
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${report.type}-report-${now.toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Generate Report')
  }
}
