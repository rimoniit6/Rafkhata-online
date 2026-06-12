import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'
import { validateBody, applyRateLimit, apiError } from '@/lib/api-utils'
import { databaseResetSchema } from '@/lib/validations'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/errors'
import { apiLimiter } from '@/lib/rate-limit'
import { auditFromRequest, AuditActions, EntityTypes } from '@/lib/audit'

const DELETE_ORDER = [
  'bundleItem', 'contentBundle', 'contentPackage',
  'cQExamRetakeRequest', 'cQExamAnswerImage', 'cQExamAnswer', 'cQExamSubmission',
  'cQExamPackagePurchase', 'cQExamSetQuestion', 'cQExamSet', 'cQExamPackage',
  'mCQExamSetQuestion', 'mCQExamSetResult', 'mCQExamSet', 'mCQExamPackagePurchase', 'mCQExamPackage',
  'userSubscription',
  'notification', 'recentlyViewed', 'note', 'bookmark', 'progress',
  'examResult', 'examQuestion', 'exam',
  'payment', 'suggestion', 'notice', 'testimonial', 'faq', 'banner', 'siteSetting',
  'featuredContent', 'contentType',
  'cQ', 'mCQ', 'resource', 'lecture',
  'topic', 'chapter', 'subject', 'classCategory',
  'boardYear', 'board', 'examYear',
  'teacherModerator',
  'user',
]

const modelMap: Record<string, any> = {
  bundleItem: db.bundleItem,
  contentBundle: db.contentBundle,
  contentPackage: db.contentPackage,
  cQExamRetakeRequest: db.cQExamRetakeRequest,
  cQExamAnswerImage: db.cQExamAnswerImage,
  cQExamAnswer: db.cQExamAnswer,
  cQExamSubmission: db.cQExamSubmission,
  cQExamPackagePurchase: db.cQExamPackagePurchase,
  cQExamSetQuestion: db.cQExamSetQuestion,
  cQExamSet: db.cQExamSet,
  cQExamPackage: db.cQExamPackage,
  mCQExamSetQuestion: db.mCQExamSetQuestion,
  mCQExamSetResult: db.mCQExamSetResult,
  mCQExamSet: db.mCQExamSet,
  mCQExamPackagePurchase: db.mCQExamPackagePurchase,
  mCQExamPackage: db.mCQExamPackage,
  userSubscription: db.userSubscription,
  notification: db.notification,
  recentlyViewed: db.recentlyViewed,
  note: db.note,
  bookmark: db.bookmark,
  progress: db.progress,
  examResult: db.examResult,
  examQuestion: db.examQuestion,
  exam: db.exam,
  payment: db.payment,
  suggestion: db.suggestion,
  notice: db.notice,
  testimonial: db.testimonial,
  faq: db.fAQ,
  banner: db.banner,
  siteSetting: db.siteSetting,
  featuredContent: db.featuredContent,
  contentType: db.contentType,
  cQ: db.cQ,
  mCQ: db.mCQ,
  resource: db.resource,
  lecture: db.lecture,
  topic: db.topic,
  chapter: db.chapter,
  subject: db.subject,
  classCategory: db.classCategory,
  boardYear: db.boardYear,
  board: db.board,
  examYear: db.examYear,
  teacherModerator: db.teacherModerator,
  user: db.user,
}

const RESET_COOLDOWN_SECONDS = 60 // 1 minute cooldown between resets
const resetTimestamps = new Map<string, number>()

export async function POST(request: NextRequest) {
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

    // Cooldown check
    const lastReset = resetTimestamps.get(auth.user.id) || 0
    const timeSinceLastReset = (Date.now() - lastReset) / 1000
    if (timeSinceLastReset < RESET_COOLDOWN_SECONDS) {
      return apiError(`অনুগ্রহ করে ${Math.ceil(RESET_COOLDOWN_SECONDS - timeSinceLastReset)} সেকেন্ড অপেক্ষা করুন`, 429, 'COOLDOWN')
    }

    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    const currentSupabaseUserId = supabaseUser?.id || undefined

    const body = await request.json()
    const validation = validateBody(databaseResetSchema, body)
    if ('error' in validation) return validation.error

    // Audit log before reset
    await auditFromRequest(request, auth.user.id, 'database_reset', 'database', 'full_reset', undefined, { timestamp: new Date().toISOString() })

    const deletionCounts: Record<string, number> = {}

    for (const modelName of DELETE_ORDER) {
      const model = modelMap[modelName]
      if (model) {
        const result = await model.deleteMany()
        deletionCounts[modelName] = result.count
      }
    }

    resetTimestamps.set(auth.user.id, Date.now())

    // Preserve the current super admin user
    const adminEmail = await db.user.findUnique({
      where: { supabaseUserId: currentSupabaseUserId },
      select: { email: true, name: true },
    })

    const { hashPassword } = await import('@/lib/password')
    const tempPassword = hashPassword('AdminReset123!')
    if (adminEmail?.email) {
      await db.user.create({
        data: {
          email: adminEmail.email,
          name: adminEmail.name || 'Super Admin',
          password: tempPassword,
          role: 'SUPER_ADMIN',
          supabaseUserId: currentSupabaseUserId,
          isVerified: true,
        },
      })
    }

    // Re-seed content types so the UI works after reset
    const DEFAULT_CONTENT_TYPES = [
      { key: 'lecture', labelBn: 'লেকচার', labelEn: 'Lecture', description: 'ভিডিও ও লিখিত লেকচার', icon: 'PlayCircle', color: 'bg-emerald-500', lightColor: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400', route: 'lecture-list', paramKey: 'chapterId', buttonLabel: 'লেকচার দেখুন', order: 1 },
      { key: 'mcq', labelBn: 'MCQ প্র্যাকটিস', labelEn: 'MCQ Practice', description: 'বহুনির্বাচনি প্রশ্ন অনুশীলন', icon: 'FileQuestion', color: 'bg-teal-500', lightColor: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400', route: 'mcq-practice', paramKey: 'chapterId', buttonLabel: 'MCQ প্র্যাকটিস', order: 2 },
      { key: 'cq', labelBn: 'সৃজনশীল প্রশ্ন', labelEn: 'Creative Question', description: 'রচনামূলক প্রশ্ন সমাধান', icon: 'ClipboardList', color: 'bg-amber-500', lightColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400', route: 'cq-list', paramKey: 'chapterId', buttonLabel: 'সৃজনশীল প্রশ্ন দেখুন', order: 3 },
      { key: 'board', labelBn: 'বোর্ড প্রশ্ন', labelEn: 'Board Questions', description: 'বোর্ড পরীক্ষার প্রশ্ন', icon: 'GraduationCap', color: 'bg-rose-500', lightColor: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400', route: 'board-questions', paramKey: 'boardName', buttonLabel: 'বোর্ড প্রশ্ন দেখুন', order: 4 },
      { key: 'suggestion', labelBn: 'সাজেশন', labelEn: 'Suggestion', description: 'পরীক্ষার সাজেশন ও গাইড', icon: 'Lightbulb', color: 'bg-violet-500', lightColor: 'bg-violet-50 dark:bg-violet-950/30', textColor: 'text-violet-600 dark:text-violet-400', route: 'suggestions', paramKey: '', buttonLabel: 'সাজেশন দেখুন', order: 5 },
      { key: 'exam', labelBn: 'পরীক্ষা', labelEn: 'Exam', description: 'মডেল টেস্ট ও পরীক্ষা', icon: 'Award', color: 'bg-sky-500', lightColor: 'bg-sky-50 dark:bg-sky-950/30', textColor: 'text-sky-600 dark:text-sky-400', route: 'exam', paramKey: '', buttonLabel: 'পরীক্ষা দিন', order: 6 },
      { key: 'bundle', labelBn: 'বান্ডেল', labelEn: 'Bundle', description: 'কন্টেন্ট বান্ডেল প্যাকেজ', icon: 'Package', color: 'bg-orange-500', lightColor: 'bg-orange-50 dark:bg-orange-950/30', textColor: 'text-orange-600 dark:text-orange-400', route: '', paramKey: '', buttonLabel: 'বান্ডেল দেখুন', order: 7 },
      { key: 'package', labelBn: 'প্যাকেজ', labelEn: 'Package', description: 'সাবস্ক্রিপশন প্যাকেজ', icon: 'Crown', color: 'bg-purple-500', lightColor: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-600 dark:text-purple-400', route: '', paramKey: '', buttonLabel: 'প্যাকেজ দেখুন', order: 8 },
    ]
    let contentTypesRestored = 0
    for (const ct of DEFAULT_CONTENT_TYPES) {
      await db.contentType.create({ data: ct })
      contentTypesRestored++
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'সকল ডাটা মুছে ফেলা হয়েছে',
        deletionCounts,
        contentTypesRestored,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Database reset error')
  }
}
