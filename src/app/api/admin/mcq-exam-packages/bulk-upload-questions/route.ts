import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// Excel column mapping (Bengali + English headers → DB fields)
const COLUMN_MAP: Record<string, string> = {
  'প্রশ্ন': 'question',
  'অপশন ক': 'optionA',
  'অপশন খ': 'optionB',
  'অপশন গ': 'optionC',
  'অপশন ঘ': 'optionD',
  'সঠিক উত্তর': 'correctAnswer',
  'ব্যাখ্যা': 'explanation',
  'অধ্যায় নাম': 'chapterName',
  'বিষয় নাম': 'subjectName',
  'ক্লাস': 'classLevel',
  'বোর্ড': 'board',
  'সাল': 'year',
  'টপিক': 'topic',
  'কঠিনতা': 'difficulty',
  'প্রিমিয়াম': 'isPremium',
  'ট্যাগ': 'tags',
  // English fallback
  'Question': 'question',
  'Option A': 'optionA',
  'Option B': 'optionB',
  'Option C': 'optionC',
  'Option D': 'optionD',
  'Correct Answer': 'correctAnswer',
  'Explanation': 'explanation',
  'Chapter Name': 'chapterName',
  'Subject Name': 'subjectName',
  'Class': 'classLevel',
  'Board': 'board',
  'Year': 'year',
  'Topic': 'topic',
  'Difficulty': 'difficulty',
  'Premium': 'isPremium',
  'Tags': 'tags',
}

// Helper: recalculate totalQuestions and totalMarks for an exam set
async function recalculateSetTotals(setId: string) {
  const questions = await db.mCQExamSetQuestion.findMany({
    where: { setId },
  })
  const totalQuestions = questions.length
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  await db.mCQExamSet.update({
    where: { id: setId },
    data: { totalQuestions, totalMarks },
  })
  return { totalQuestions, totalMarks }
}

// POST: Bulk upload MCQs from Excel and add them to an exam set
export async function POST(request: Request) {
  try {
    // Auth check
    const auth = await requireAdmin(request)
    if (!auth) {
      return apiError('Unauthorized. Admin access required.', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const setId = formData.get('setId') as string | null
    const defaultClassLevel = formData.get('classLevel') as string | null
    const defaultSubjectId = formData.get('subjectId') as string | null



    // Validate required fields
    if (!file) {
      return apiError('Excel ফাইল আপলোড করুন', 400)
    }
    if (!setId) {
      return apiError('এক্সাম সেট ID আবশ্যক', 400)
    }

    // Validate exam set exists and get marksPerQ
    const examSet = await db.mCQExamSet.findUnique({
      where: { id: setId },
      include: {
        package: { select: { id: true, classId: true, class: { select: { slug: true } } } },
      },
    })
    if (!examSet) {
      return apiError('এক্সাম সেট পাওয়া যায়নি', 404)
    }

    // Parse Excel file
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

    if (rows.length === 0) {
      return apiError('Excel ফাইলে কোনো ডাটা নেই', 400)
    }

    if (rows.length > 500) {
      return apiError('একবারে সর্বোচ্চ ৫০০টি প্রশ্ন আপলোড করা যাবে', 400)
    }

    // Resolve subjectId
    let resolvedSubjectId = defaultSubjectId
    if (!resolvedSubjectId || resolvedSubjectId === 'all') {
      const firstSubjectName = rows[0][Object.keys(rows[0]).find(k => COLUMN_MAP[k] === 'subjectName') || '']
      if (firstSubjectName) {
        const subject = await db.subject.findFirst({
          where: { name: { contains: firstSubjectName }, isActive: true },
        })
        if (subject) resolvedSubjectId = subject.id
      }
    }

    // Build chapter name → id lookup
    const chapters = await db.chapter.findMany({
      where: { subjectId: resolvedSubjectId || undefined, isActive: true },
      select: { id: true, name: true },
    })
    const chapterMap = new Map(chapters.map(c => [c.name.trim().toLowerCase(), c.id]))
    const chapterSlugMap = new Map(chapters.map(c => [c.name.replace(/\s+/g, '-').toLowerCase(), c.id]))

    // Get existing questions in the set (to avoid duplicates)
    const existingQuestions = await db.mCQExamSetQuestion.findMany({
      where: { setId },
      select: { mcqId: true },
    })
    const existingMcqIds = new Set(existingQuestions.map(q => q.mcqId))

    // Get the max order in current set
    const maxOrderResult = await db.mCQExamSetQuestion.findFirst({
      where: { setId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    let nextOrder = (maxOrderResult?.order ?? -1) + 1

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    const createdMcqIds: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Map columns using the column map
      const mapped: Record<string, string> = {}
      for (const [header, value] of Object.entries(row)) {
        const dbField = COLUMN_MAP[header]
        if (dbField) {
          mapped[dbField] = String(value).trim()
        }
      }

      // Validate required fields
      if (!mapped.question || !mapped.optionA || !mapped.optionB || !mapped.optionC || !mapped.optionD || !mapped.correctAnswer) {
        results.failed++
        results.errors.push(`সারি ${i + 2}: প্রয়োজনীয় ফিল্ড অনুপস্থিত (প্রশ্ন, ৪টি অপশন, সঠিক উত্তর)`)
        continue
      }

      // Normalize correct answer
      const correctAnswer = mapped.correctAnswer.toUpperCase().trim()
      if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        results.failed++
        results.errors.push(`সারি ${i + 2}: সঠিক উত্তর A/B/C/D হতে হবে (পাওয়া গেছে: "${mapped.correctAnswer}")`)
        continue
      }

      // Resolve chapterId
      let chapterId: string | undefined
      if (mapped.chapterName) {
        const key = mapped.chapterName.trim().toLowerCase()
        chapterId = chapterMap.get(key) || chapterSlugMap.get(key.replace(/\s+/g, '-'))
        if (!chapterId) {
          for (const [name, id] of chapterMap) {
            if (name.includes(key) || key.includes(name)) {
              chapterId = id
              break
            }
          }
        }
      }

      if (!chapterId && chapters.length > 0) {
        chapterId = chapters[0].id
      }

      if (!chapterId) {
        results.failed++
        results.errors.push(`সারি ${i + 2}: অধ্যায় পাওয়া যায়নি "${mapped.chapterName || '(নেই)'}"`)
        continue
      }

      // Resolve subjectId from chapter
      const chapter = await db.chapter.findUnique({ where: { id: chapterId }, select: { subjectId: true } })
      const finalSubjectId = chapter?.subjectId || resolvedSubjectId

      try {
        // Create the MCQ
        const mcq = await db.mCQ.create({
          data: {
            question: mapped.question,
            optionA: mapped.optionA,
            optionB: mapped.optionB,
            optionC: mapped.optionC,
            optionD: mapped.optionD,
            correctAnswer,
            explanation: mapped.explanation || null,
            chapterId,
            classLevel: mapped.classLevel || defaultClassLevel || examSet.package?.class?.slug || '',
            subjectId: finalSubjectId || '',
            board: mapped.board || null,
            year: mapped.year || null,
            topic: mapped.topic || null,
            difficulty: mapped.difficulty || 'medium',
            isPremium: mapped.isPremium === 'true' || mapped.isPremium === '1' || mapped.isPremium === 'হ্যাঁ',
            price: 0,
            tags: mapped.tags || null,
            isActive: true,
          },
        })

        createdMcqIds.push(mcq.id)
        results.success++
      } catch (err) {
        results.failed++
        results.errors.push(`সারি ${i + 2}: ডাটাবেস ত্রুটি - ${err instanceof Error ? err.message : 'অজানা'}`)
      }
    }

    // Now add all created MCQs to the exam set
    const setQuestionData = createdMcqIds.map((mcqId, index) => ({
      setId,
      mcqId,
      marks: examSet.marksPerQ,
      order: nextOrder + index,
    }))

    if (setQuestionData.length > 0) {
      await db.mCQExamSetQuestion.createMany({
        data: setQuestionData,
      })
    }

    // Recalculate set totals
    await recalculateSetTotals(setId)

    return NextResponse.json({
      success: true,
      data: {
        message: `${results.success}টি প্রশ্ন সফলভাবে আপলোড ও সেটে যোগ হয়েছে${results.failed > 0 ? `, ${results.failed}টি ব্যর্থ` : ''}`,
        ...results,
        totalInSet: (await db.mCQExamSetQuestion.count({ where: { setId } })),
      },
    })
  } catch (error) {
    console.error('Bulk upload questions error:', error)
    return apiError('Excel ফাইল প্রসেস করতে সমস্যা হয়েছে', 500)
  }
}

// GET: Download Excel template for bulk upload
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) {
      return apiError('Unauthorized. Admin access required.', 401)
    }

    const headers = [
      'প্রশ্ন',
      'অপশন ক',
      'অপশন খ',
      'অপশন গ',
      'অপশন ঘ',
      'সঠিক উত্তর',
      'ব্যাখ্যা',
      'অধ্যায় নাম',
      'বিষয় নাম',
      'ক্লাস',
      'বোর্ড',
      'সাল',
      'টপিক',
      'কঠিনতা',
      'প্রিমিয়াম',
      'ট্যাগ',
    ]

    const demoRows = [
      [
        'বাংলাদেশের রাজধানী কোনটি?',
        'চট্টগ্রাম',
        'ঢাকা',
        'রাজশাহী',
        'খুলনা',
        'B',
        'বাংলাদেশের রাজধানী ঢাকা',
        'প্রাকৃতিক সংখ্যা',
        'বাংলা',
        'class-6',
        'dhaka',
        '2025',
        'ভূগোল',
        'easy',
        'false',
        'ভূগোল;বাংলাদেশ',
      ],
      [
        '2 + 2 = ?',
        '3',
        '4',
        '5',
        '6',
        'B',
        'প্রাথমিক যোগ',
        'ভগ্নাংশ ও দশমিক',
        'গণিত',
        'class-6',
        '',
        '',
        'গণিত',
        'easy',
        'false',
        'গণিত;যোগ',
      ],
      [
        'পানির রাসায়নিক সংকেত কী?',
        'CO₂',
        'H₂O',
        'NaCl',
        'O₂',
        'B',
        'পানির রাসায়নিক সংকেত H₂O',
        'পদার্থের বৈশিষ্ট্য',
        'বিজ্ঞান',
        'class-6',
        '',
        '',
        'রসায়ন',
        'medium',
        'false',
        'রসায়ন;পানি',
      ],
    ]

    const ws = XLSX.utils.aoa_to_sheet([headers, ...demoRows])

    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
      { wch: 10 }, { wch: 8 },  { wch: 15 }, { wch: 10 }, { wch: 10 },
      { wch: 20 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'MCQ প্রশ্ন')

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="mcq-exam-set-template.xlsx"',
      },
    })
  } catch (error) {
    console.error('Template download error:', error)
    return apiError('টেমপ্লেট তৈরি করতে সমস্যা হয়েছে', 500)
  }
}
