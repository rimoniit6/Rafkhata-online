import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { apiError, withCsrf } from '@/lib/api-utils'

const DEFAULT_CONTENT_TYPES = [
  {
    key: 'lecture',
    labelBn: 'লেকচার',
    labelEn: 'Lecture',
    description: 'ভিডিও ও লিখিত লেকচার',
    icon: 'PlayCircle',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    route: 'lecture-list',
    paramKey: 'chapterId',
    buttonLabel: 'লেকচার দেখুন',
    showInChapterDetail: true,
    order: 1,
  },
  {
    key: 'knowledge',
    labelBn: 'জ্ঞানমূলক',
    labelEn: 'Knowledge',
    description: 'সৃজনশীল প্রশ্নের ক (জ্ঞানমূলক)',
    icon: 'Brain',
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    route: '',
    paramKey: 'chapterId',
    buttonLabel: 'জ্ঞানমূলক দেখুন',
    showInChapterDetail: true,
    order: 2,
  },
  {
    key: 'short-questions',
    labelBn: 'সংক্ষিপ্ত প্রশ্ন',
    labelEn: 'Short Questions',
    description: 'জ্ঞানমূলক ও বোধমূলক সংক্ষিপ্ত প্রশ্ন ও উত্তর',
    icon: 'FileText',
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    route: 'short-questions',
    paramKey: 'chapterId',
    buttonLabel: 'সংক্ষিপ্ত প্রশ্ন দেখুন',
    showInChapterDetail: true,
    order: 3,
  },
  {
    key: 'understanding',
    labelBn: 'অনুধাবন',
    labelEn: 'Understanding',
    description: 'সৃজনশীল প্রশ্নের ক ও খ (অনুধাবন)',
    icon: 'BookOpenCheck',
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    route: '',
    paramKey: 'chapterId',
    buttonLabel: 'অনুধাবন দেখুন',
    showInChapterDetail: true,
    order: 5,
  },
  {
    key: 'cq',
    labelBn: 'সৃজনশীল প্রশ্ন',
    labelEn: 'Creative Question',
    description: 'রচনামূলক প্রশ্ন (ক, খ, গ, ঘ)',
    icon: 'ClipboardList',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    route: 'cq-list',
    paramKey: 'chapterId',
    buttonLabel: 'সৃজনশীল প্রশ্ন দেখুন',
    showInChapterDetail: true,
    order: 6,
  },
  {
    key: 'mcq',
    labelBn: 'MCQ প্র্যাকটিস',
    labelEn: 'MCQ Practice',
    description: 'বহুনির্বাচনি প্রশ্ন অনুশীলন',
    icon: 'FileQuestion',
    color: 'bg-teal-500',
    lightColor: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    route: 'mcq-practice',
    paramKey: 'chapterId',
    buttonLabel: 'MCQ প্র্যাকটিস',
    showInChapterDetail: true,
    order: 7,
  },
  {
    key: 'suggestion',
    labelBn: 'সাজেশন',
    labelEn: 'Suggestion',
    description: 'পরীক্ষার সাজেশন ও গাইড',
    icon: 'Lightbulb',
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 dark:bg-violet-950/30',
    textColor: 'text-violet-600 dark:text-violet-400',
    route: 'suggestions',
    paramKey: '',
    buttonLabel: 'সাজেশন দেখুন',
    showInChapterDetail: true,
    order: 8,
  },
  {
    key: 'exam',
    labelBn: 'পরীক্ষা',
    labelEn: 'Exam',
    description: 'মডেল টেস্ট ও পরীক্ষা',
    icon: 'Award',
    color: 'bg-sky-500',
    lightColor: 'bg-sky-50 dark:bg-sky-950/30',
    textColor: 'text-sky-600 dark:text-sky-400',
    route: 'exam-center',
    paramKey: '',
    buttonLabel: 'পরীক্ষা দিন',
    showInChapterDetail: true,
    order: 9,
  },
  {
    key: 'board',
    labelBn: 'বোর্ড প্রশ্ন',
    labelEn: 'Board Questions',
    description: 'বোর্ড পরীক্ষার প্রশ্ন (MCQ ও সৃজনশীল)',
    icon: 'GraduationCap',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50 dark:bg-rose-950/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    route: '',
    paramKey: '',
    buttonLabel: 'বোর্ড প্রশ্ন দেখুন',
    showInChapterDetail: false,
    order: 10,
  },
  {
    key: 'bundle',
    labelBn: 'বান্ডেল',
    labelEn: 'Bundle',
    description: 'কন্টেন্ট বান্ডেল প্যাকেজ',
    icon: 'Package',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    route: '',
    paramKey: '',
    buttonLabel: 'বান্ডেল দেখুন',
    showInChapterDetail: false,
    order: 11,
  },
  {
    key: 'package',
    labelBn: 'প্যাকেজ',
    labelEn: 'Package',
    description: 'সাবস্ক্রিপশন প্যাকেজ',
    icon: 'Crown',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    route: '',
    paramKey: '',
    buttonLabel: 'প্যাকেজ দেখুন',
    showInChapterDetail: false,
    order: 12,
  },
  {
    key: 'board-mcq',
    labelBn: 'বোর্ড MCQ',
    labelEn: 'Board MCQ',
    description: 'বোর্ড পরীক্ষার MCQ প্রশ্ন',
    icon: 'CircleDot',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50 dark:bg-rose-950/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    route: '',
    paramKey: '',
    buttonLabel: 'বোর্ড MCQ দেখুন',
    showInChapterDetail: false,
    order: 13,
  },
  {
    key: 'board-cq',
    labelBn: 'বোর্ড সৃজনশীল প্রশ্ন',
    labelEn: 'Board CQ',
    description: 'বোর্ড পরীক্ষার সৃজনশীল প্রশ্ন',
    icon: 'FileText',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50 dark:bg-pink-950/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    route: '',
    paramKey: '',
    buttonLabel: 'বোর্ড সৃজনশীল প্রশ্ন দেখুন',
    showInChapterDetail: false,
    order: 14,
  },
  {
    key: 'mcq-exam-package',
    labelBn: 'MCQ এক্সাম প্যাকেজ',
    labelEn: 'MCQ Exam Package',
    description: 'MCQ এক্সাম প্যাকেজ ও মডেল টেস্ট',
    icon: 'ClipboardCheck',
    color: 'bg-sky-500',
    lightColor: 'bg-sky-50 dark:bg-sky-950/30',
    textColor: 'text-sky-600 dark:text-sky-400',
    route: 'mcq-exam-package-list',
    paramKey: '',
    buttonLabel: 'এক্সাম প্যাকেজ দেখুন',
    showInChapterDetail: false,
    order: 15,
  },
  {
    key: 'cq-exam-package',
    labelBn: 'CQ এক্সাম প্যাকেজ',
    labelEn: 'CQ Exam Package',
    description: 'CQ এক্সাম প্যাকেজ ও মডেল টেস্ট',
    icon: 'ClipboardCheck',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    route: 'cq-exam-package-list',
    paramKey: '',
    buttonLabel: 'এক্সাম প্যাকেজ দেখুন',
    showInChapterDetail: false,
    order: 16,
  },
]

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    // Require super_admin auth for seeding content types
    const auth = await verifyAuth(request)
    if (!auth || !auth.user || auth.user.role !== 'SUPER_ADMIN') {
      return apiError('কন্টেন্ট টাইপ seed করার অনুমতি নেই', 403)
    }

    let created = 0
    let updated = 0
    let skipped = 0

    for (const ct of DEFAULT_CONTENT_TYPES) {
      const existing = await db.contentType.findUnique({ where: { key: ct.key } })
      if (existing) {
        // Update any fields that differ from the default
        const fieldsToUpdate: Record<string, unknown> = {}
        const updatableFields = ['labelBn', 'labelEn', 'description', 'icon', 'color', 'lightColor', 'textColor', 'route', 'paramKey', 'buttonLabel', 'showInChapterDetail', 'order'] as const
        for (const field of updatableFields) {
          if (existing[field] !== ct[field]) {
            fieldsToUpdate[field] = ct[field]
          }
        }
        if (Object.keys(fieldsToUpdate).length > 0) {
          await db.contentType.update({
            where: { key: ct.key },
            data: fieldsToUpdate,
          })
          updated++
        } else {
          skipped++
        }
        continue
      }
      await db.contentType.create({ data: ct })
      created++
    }

    return NextResponse.json({
      success: true,
      message: `${created}টি তৈরি, ${updated}টি আপডেট, ${skipped}টি আগে থেকেই আছে`,
      created,
      updated,
      skipped,
    })
  } catch (error) {
    console.error('Seed content types error:', error)
    return apiError('কন্টেন্ট টাইপ seed করতে সমস্যা হয়েছে', 500)
  }
}
