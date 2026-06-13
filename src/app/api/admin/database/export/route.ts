import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/errors'
import { auditFromRequest } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const auth = await requireSuperAdmin(request)
    if (!auth) {
      return apiError('সুপার অ্যাডমিন অনুমতি প্রয়োজন।', 403, 'FORBIDDEN')
    }

    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const [
      users,
      classCategories,
      subjects,
      chapters,
      lectures,
      resources,
      mcqs,
      cqs,
      exams,
      examQuestions,
      examResults,
      progress,
      bookmarks,
      notes,
      recentlyViewed,
      payments,
      notifications,
      banners,
      faqs,
      testimonials,
      notices,
      suggestions,
      boards,
      examYears,
      siteSettings,
      contentBundles,
      bundleItems,
      contentPackages,
    ] = await Promise.all([
      db.user.findMany({ select: { id: true, email: true, name: true, role: true, avatar: true, phone: true, institute: true, classLevel: true, board: true, isVerified: true, isPremium: true, premiumExpiry: true, createdAt: true, updatedAt: true } }),
      db.classCategory.findMany(),
      db.subject.findMany(),
      db.chapter.findMany(),
      db.lecture.findMany(),
      db.resource.findMany(),
      db.mCQ.findMany(),
      db.cQ.findMany(),
      db.exam.findMany(),
      db.examQuestion.findMany(),
      db.examResult.findMany(),
      db.progress.findMany(),
      db.bookmark.findMany(),
      db.note.findMany(),
      db.recentlyViewed.findMany(),
      db.payment.findMany(),
      db.notification.findMany(),
      db.banner.findMany(),
      db.fAQ.findMany(),
      db.testimonial.findMany(),
      db.notice.findMany(),
      db.suggestion.findMany(),
      db.board.findMany(),
      db.examYear.findMany(),
      db.siteSetting.findMany(),
      db.contentBundle.findMany(),
      db.bundleItem.findMany(),
      db.contentPackage.findMany(),
    ])

    const data = {
      users,
      classCategories,
      subjects,
      chapters,
      lectures,
      resources,
      mcqs,
      cqs,
      exams,
      examQuestions,
      examResults,
      progress,
      bookmarks,
      notes,
      recentlyViewed,
      payments,
      notifications,
      banners,
      faqs,
      testimonials,
      notices,
      suggestions,
      boards,
      examYears,
      siteSettings,
      contentBundles,
      bundleItems,
      contentPackages,
    }

    const counts: Record<string, number> = {}
    for (const [key, value] of Object.entries(data)) {
      counts[key] = (value as unknown[]).length
    }

    await auditFromRequest(request, auth.user.id, 'database_export', 'database', 'full_export', undefined, { counts })

    return NextResponse.json({
      success: true,
      data: {
        _meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          models: Object.keys(data),
          counts,
        },
        data,
      },
    })
  } catch (error) {
    console.error('[DB Export] Error details:', error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error)
    return handleApiError(error, 'Database export error')
  }
}
