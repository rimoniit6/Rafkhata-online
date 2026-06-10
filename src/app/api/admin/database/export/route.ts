import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // Require super admin
    const auth = await requireSuperAdmin(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'সুপার অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

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
      passwordResets,
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
      db.passwordReset.findMany({ select: { id: true, userId: true, used: true, expiresAt: true, createdAt: true } }), // Exclude token
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
      passwordResets,
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

    const models = Object.keys(data)
    const counts: Record<string, number> = {}
    for (const key of models) {
      counts[key] = (data as Record<string, unknown[]>)[key].length
    }

    return NextResponse.json({
      success: true,
      data: {
        _meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          models,
          counts,
        },
        data,
      },
    })
  } catch (error) {
    console.error('Database export error:', error)
    return NextResponse.json({ success: false, error: 'ডাটাবেজ এক্সপোর্ট করতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
