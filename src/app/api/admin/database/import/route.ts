import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'

const DELETE_ORDER = [
  'bundleItem', 'contentBundle', 'contentPackage',
  'notification', 'recentlyViewed', 'note', 'bookmark', 'progress',
  'examResult', 'examQuestion', 'exam',
  'payment', 'suggestion', 'notice', 'testimonial', 'faq', 'banner', 'siteSetting',
  'cQ', 'mCQ', 'resource', 'lecture',
  'chapter', 'subject', 'classCategory',
  'board', 'examYear',
  'user',
]

const IMPORT_ORDER = [
  'user', 'board', 'examYear',
  'classCategory', 'subject', 'chapter',
  'lecture', 'resource', 'mCQ', 'cQ',
  'siteSetting', 'banner', 'faq', 'testimonial', 'notice', 'suggestion', 'payment',
  'exam', 'examQuestion', 'examResult',
  'progress', 'bookmark', 'note', 'recentlyViewed', 'notification',
  'contentPackage', 'contentBundle', 'bundleItem',
]

const modelMap: Record<string, any> = {
  user: db.user,
  board: db.board,
  examYear: db.examYear,
  classCategory: db.classCategory,
  subject: db.subject,
  chapter: db.chapter,
  lecture: db.lecture,
  resource: db.resource,
  mCQ: db.mCQ,
  cQ: db.cQ,
  siteSetting: db.siteSetting,
  banner: db.banner,
  faq: db.fAQ,
  testimonial: db.testimonial,
  notice: db.notice,
  suggestion: db.suggestion,
  payment: db.payment,
  exam: db.exam,
  examQuestion: db.examQuestion,
  examResult: db.examResult,
  progress: db.progress,
  bookmark: db.bookmark,
  note: db.note,
  recentlyViewed: db.recentlyViewed,
  notification: db.notification,
  // passwordReset model removed
  contentPackage: db.contentPackage,
  contentBundle: db.contentBundle,
  bundleItem: db.bundleItem,
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin
    const auth = await requireSuperAdmin(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'সুপার অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { data } = body

    if (!data) {
      return NextResponse.json({ success: false, error: 'ইমপোর্ট ডাটা পাওয়া যায়নি' }, { status: 400 })
    }

    // Delete all existing data in reverse dependency order
    for (const modelName of DELETE_ORDER) {
      const model = modelMap[modelName]
      if (model) {
        await model.deleteMany()
      }
    }

    // Import in dependency order
    const results: Record<string, { imported: number; errors: number }> = {}

    for (const modelName of IMPORT_ORDER) {
      const model = modelMap[modelName]
      const records = (data as Record<string, Record<string, unknown>[]>)[modelName]

      if (!model || !records || !Array.isArray(records)) {
        results[modelName] = { imported: 0, errors: 0 }
        continue
      }

      let imported = 0
      let errors = 0

      for (const record of records) {
        try {
          await (model as any).create({ data: record })
          imported++
        } catch (err) {
          console.error(`Import error for ${modelName}:`, err)
          errors++
        }
      }

      results[modelName] = { imported, errors }
    }

    // Ensure super admin from .env exists
    const email = process.env.SUPER_ADMIN_EMAIL
    const password = process.env.SUPER_ADMIN_PASSWORD
    if (email && password) {
      const { hashPassword } = await import('@/lib/password')
      const hashedPassword = hashPassword(password)
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        await db.user.update({
          where: { email },
          data: { role: 'super_admin', password: hashedPassword, isVerified: true },
        })
      } else {
        await db.user.create({
          data: { email, name: 'Super Admin', password: hashedPassword, role: 'super_admin', isVerified: true },
        })
      }
    }

    return NextResponse.json({ success: true, data: { message: 'ডাটাবেজ ইমপোর্ট সম্পন্ন হয়েছে', results } })
  } catch (error) {
    console.error('Database import error:', error)
    return NextResponse.json({ success: false, error: 'ডাটাবেজ ইমপোর্ট করতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
