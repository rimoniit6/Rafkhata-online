import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'
import { applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/errors'
import { auditFromRequest } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const auth = await requireSuperAdmin(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'সুপার অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const {
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
    } = await db.$transaction(async (tx) => {
      return {
        users: await tx.user.findMany({ select: { id: true, email: true, name: true, role: true, avatar: true, phone: true, institute: true, classLevel: true, board: true, isVerified: true, isPremium: true, premiumExpiry: true, createdAt: true, updatedAt: true } }),
        classCategories: await tx.classCategory.findMany(),
        subjects: await tx.subject.findMany(),
        chapters: await tx.chapter.findMany(),
        lectures: await tx.lecture.findMany(),
        resources: await tx.resource.findMany(),
        mcqs: await tx.mCQ.findMany(),
        cqs: await tx.cQ.findMany(),
        exams: await tx.exam.findMany(),
        examQuestions: await tx.examQuestion.findMany(),
        examResults: await tx.examResult.findMany(),
        progress: await tx.progress.findMany(),
        bookmarks: await tx.bookmark.findMany(),
        notes: await tx.note.findMany(),
        recentlyViewed: await tx.recentlyViewed.findMany(),
        payments: await tx.payment.findMany(),
        notifications: await tx.notification.findMany(),
        banners: await tx.banner.findMany(),
        faqs: await tx.fAQ.findMany(),
        testimonials: await tx.testimonial.findMany(),
        notices: await tx.notice.findMany(),
        suggestions: await tx.suggestion.findMany(),
        boards: await tx.board.findMany(),
        examYears: await tx.examYear.findMany(),
        siteSettings: await tx.siteSetting.findMany(),
        contentBundles: await tx.contentBundle.findMany(),
        bundleItems: await tx.bundleItem.findMany(),
        contentPackages: await tx.contentPackage.findMany(),
      }
    })

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
    return handleApiError(error, 'Database export error')
  }
}
