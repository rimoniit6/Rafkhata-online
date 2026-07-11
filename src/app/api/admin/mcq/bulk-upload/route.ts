import { db } from '@/lib/db'
import { apiError, withAdmin } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { safeParseExcelFromFile, ExcelParseError } from '@/lib/excel-parse'

// Excel column mapping (Bengali headers → DB fields)
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

export async function POST(request: Request) {
  try {
    const auth = await withAdmin(request)
    if (auth instanceof NextResponse) return auth
    const formData = await request.formData()
    const file = formData.get('file') as File
    const classLevel = formData.get('classLevel') as string
    const subjectId = formData.get('subjectId') as string

    if (!file) {
      return apiError('Excel ফাইল আপলোড করুন', 400)
    }

    if (!classLevel) {
      return apiError('ক্লাস নির্বাচন আবশ্যক', 400)
    }

    // Parse Excel file
    const { rows: rawRows } = await safeParseExcelFromFile(file)
    const rows = rawRows as Record<string, string>[]

    if (rows.length === 0) {
      return apiError('Excel ফাইলে কোনো ডাটা নেই', 400)
    }

    // Resolve subjectId — if "all" or not provided, look up from subject name
    let resolvedSubjectId = subjectId
    if (!resolvedSubjectId || resolvedSubjectId === 'all') {
      // Try to find subject from first row's subjectName
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

    // Also build slug-based lookup for fuzzy matching
    const chapterSlugMap = new Map(chapters.map(c => [c.name.replace(/\s+/g, '-').toLowerCase(), c.id]))

    const results = { success: 0, failed: 0, errors: [] as string[], createdIds: [] as string[] }

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
          // Fuzzy match: check if chapter name contains the key or vice versa
          for (const [name, id] of chapterMap) {
            if (name.includes(key) || key.includes(name)) {
              chapterId = id
              break
            }
          }
        }
      }

      if (!chapterId && chapters.length > 0) {
        // Use first chapter as fallback if no chapter specified
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
        const created = await db.mCQ.create({
          data: {
            question: mapped.question,
            optionA: mapped.optionA,
            optionB: mapped.optionB,
            optionC: mapped.optionC,
            optionD: mapped.optionD,
            correctAnswer: correctAnswer as 'A' | 'B' | 'C' | 'D',
            explanation: mapped.explanation || null,
            chapterId,
            classLevel: mapped.classLevel || classLevel,
            subjectId: finalSubjectId || '',
            board: mapped.board || null,
            year: mapped.year || null,
            topic: mapped.topic || null,
            difficulty: (mapped.difficulty || 'MEDIUM').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
            isPremium: mapped.isPremium === 'true' || mapped.isPremium === '1' || mapped.isPremium === 'হ্যাঁ',
            price: 0,
            tags: mapped.tags || null,
            isActive: true,
          },
        })
        results.success++
        results.createdIds.push(created.id)
      } catch (err) {
        results.failed++
        results.errors.push(`সারি ${i + 2}: ডাটাবেস ত্রুটি - ${err instanceof Error ? err.message : 'অজানা'}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `${results.success}টি প্রশ্ন সফলভাবে যোগ হয়েছে${results.failed > 0 ? `, ${results.failed}টি ব্যর্থ` : ''}`,
        ...results,
      },
    })
  } catch (error) {
    if (error instanceof ExcelParseError) {
      return apiError(error.message, 400)
    }
    console.error('Bulk upload error:', error)
    return apiError('Excel ফাইল প্রসেস করতে সমস্যা হয়েছে', 500)
  }
}

// GET: Download demo Excel template
export async function GET(request: Request) {
  try {
    const auth = await withAdmin(request)
    if (auth instanceof NextResponse) return auth
    const headers = [
      'প্রশ্ন',
      'অপশন ক',
      'অপশন খ',
      'অপশন গ',
      'অপশন ঘ',
      'সঠিক উত্তর',
      'ব্যাখ্যা',
      'অধ্যায় নাম',
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

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // প্রশ্ন
      { wch: 15 }, // অপশন ক
      { wch: 15 }, // অপশন খ
      { wch: 15 }, // অপশন গ
      { wch: 15 }, // অপশন ঘ
      { wch: 12 }, // সঠিক উত্তর
      { wch: 25 }, // ব্যাখ্যা
      { wch: 20 }, // অধ্যায় নাম
      { wch: 10 }, // ক্লাস
      { wch: 10 }, // বোর্ড
      { wch: 8 },  // সাল
      { wch: 15 }, // টপিক
      { wch: 10 }, // কঠিনতা
      { wch: 10 }, // প্রিমিয়াম
      { wch: 20 }, // ট্যাগ
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'MCQ প্রশ্ন')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="mcq-demo-template.xlsx"',
      },
    })
  } catch (error) {
    console.error('Template download error:', error)
    return apiError('টেমপ্লেট তৈরি করতে সমস্যা হয়েছে', 500)
  }
}
