import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface ImportError {
  row: number
  message: string
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null
    const classId = formData.get('classId') as string | null
    const subjectId = formData.get('subjectId') as string | null
    const chapterId = formData.get('chapterId') as string | null
    const board = formData.get('board') as string | null
    const year = formData.get('year') as string | null
    const difficulty = formData.get('difficulty') as string | null

    if (!file) {
      return NextResponse.json({ error: 'ফাইল আপলোড করুন' }, { status: 400 })
    }
    if (!type || !['mcq', 'cq', 'board-mcq', 'board-cq'].includes(type)) {
      return NextResponse.json({ error: 'সঠিক টাইপ নির্বাচন করুন' }, { status: 400 })
    }
    if (!classId || !subjectId || !chapterId) {
      return NextResponse.json({ error: 'ক্লাস, বিষয় ও অধ্যায় আবশ্যক' }, { status: 400 })
    }

    // Resolve classLevel (slug) from classId
    const classObj = await db.classCategory.findUnique({ where: { id: classId } })
    if (!classObj) {
      return NextResponse.json({ error: 'ক্লাস খুঁজে পাওয়া যায়নি' }, { status: 400 })
    }
    const classLevel = classObj.slug

    // Read file into buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse with xlsx
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ error: 'ফাইলে কোনো শীট নেই' }, { status: 400 })
    }
    const worksheet = workbook.Sheets[sheetName]
    const rows: Record<string, string | number | boolean | undefined>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'ফাইলে কোনো ডেটা নেই' }, { status: 400 })
    }

    const errors: ImportError[] = []
    let success = 0

    const isBoard = type.startsWith('board-')
    const actualType = isBoard ? type.replace('board-', '') : type

    // For board questions, board and year are required
    if (isBoard) {
      if (!board) {
        return NextResponse.json({ error: 'বোর্ড প্রশ্নের জন্য বোর্ড আবশ্যক' }, { status: 400 })
      }
      if (!year) {
        return NextResponse.json({ error: 'বোর্ড প্রশ্নের জন্য সাল আবশ্যক' }, { status: 400 })
      }
    }

    const defaultDifficulty = difficulty || 'medium'

    if (actualType === 'mcq') {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNum = i + 2 // Excel row (1-indexed + header)

        try {
          const question = String(row['question'] ?? row['প্রশ্ন'] ?? '').trim()
          const optionA = String(row['optionA'] ?? row['অপশনক'] ?? row['অপশন A'] ?? row['optionA'] ?? '').trim()
          const optionB = String(row['optionB'] ?? row['অপশনখ'] ?? row['অপশন B'] ?? row['optionB'] ?? '').trim()
          const optionC = String(row['optionC'] ?? row['অপশনগ'] ?? row['অপশন C'] ?? row['optionC'] ?? '').trim()
          const optionD = String(row['optionD'] ?? row['অপশনঘ'] ?? row['অপশন D'] ?? row['optionD'] ?? '').trim()
          let correctAnswer = String(row['correctAnswer'] ?? row['সঠিকউত্তর'] ?? row['সঠিক উত্তর'] ?? '').trim().toUpperCase()
          const explanation = String(row['explanation'] ?? row['ব্যাখ্যা'] ?? '').trim()
          const topic = String(row['topic'] ?? row['টপিক'] ?? '').trim()
          const isPremiumRaw = String(row['isPremium'] ?? row['প্রিমিয়াম'] ?? 'false').trim().toLowerCase()
          const isPremium = isPremiumRaw === 'true' || isPremiumRaw === '1'
          const priceVal = parseFloat(String(row['price'] ?? row['মূল্য'] ?? '0')) || 0

          // Validate required fields
          if (!question) {
            errors.push({ row: rowNum, message: 'প্রশ্ন ফাঁকা' })
            continue
          }
          if (!optionA || !optionB || !optionC || !optionD) {
            errors.push({ row: rowNum, message: 'সব অপশন পূরণ করুন' })
            continue
          }

          // Normalize correctAnswer: map Bengali to English
          const answerMap: Record<string, string> = {
            'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D',
            'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D',
            '১': 'A', '২': 'B', '৩': 'C', '৪': 'D',
          }
          if (!answerMap[correctAnswer]) {
            errors.push({ row: rowNum, message: `সঠিক উত্তর অবৈধ: "${correctAnswer}". A/B/C/D বা ক/খ/গ/ঘ ব্যবহার করুন` })
            continue
          }
          correctAnswer = answerMap[correctAnswer]

          await db.mCQ.create({
            data: {
              question,
              optionA,
              optionB,
              optionC,
              optionD,
              correctAnswer,
              explanation: explanation || null,
              chapterId,
              classLevel,
              subjectId,
              board: isBoard ? board : (board || null),
              year: isBoard ? year : (year || null),
              topic: topic || null,
              difficulty: defaultDifficulty,
              isPremium,
              price: isPremium ? priceVal : 0,
              isActive: true,
            },
          })
          success++
        } catch (err) {
          errors.push({ row: rowNum, message: `সংরক্ষণ ত্রুটি: ${(err as Error).message}` })
        }
      }
    } else if (actualType === 'cq') {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNum = i + 2

        try {
          const uddeepok = String(row['uddeepok'] ?? row['উদ্দীপক'] ?? '').trim()
          const question1 = String(row['question1'] ?? row['প্রশ্ন১'] ?? row['প্রশ্ন ১'] ?? '').trim()
          const answer1 = String(row['answer1'] ?? row['উত্তর১'] ?? row['উত্তর ১'] ?? '').trim()
          const question2 = String(row['question2'] ?? row['প্রশ্ন২'] ?? row['প্রশ্ন ২'] ?? '').trim()
          const answer2 = String(row['answer2'] ?? row['উত্তর২'] ?? row['উত্তর ২'] ?? '').trim()
          const question3 = String(row['question3'] ?? row['প্রশ্ন৩'] ?? row['প্রশ্ন ৩'] ?? '').trim()
          const answer3 = String(row['answer3'] ?? row['উত্তর৩'] ?? row['উত্তর ৩'] ?? '').trim()
          const question4 = String(row['question4'] ?? row['প্রশ্ন৪'] ?? row['প্রশ্ন ৪'] ?? '').trim()
          const answer4 = String(row['answer4'] ?? row['উত্তর৪'] ?? row['উত্তর ৪'] ?? '').trim()
          const topic = String(row['topic'] ?? row['টপিক'] ?? '').trim()
          const isPremiumRaw = String(row['isPremium'] ?? row['প্রিমিয়াম'] ?? 'false').trim().toLowerCase()
          const isPremium = isPremiumRaw === 'true' || isPremiumRaw === '1'
          const priceVal = parseFloat(String(row['price'] ?? row['মূল্য'] ?? '0')) || 0

          // Validate required fields
          if (!uddeepok) {
            errors.push({ row: rowNum, message: 'উদ্দীপক ফাঁকা' })
            continue
          }
          if (!question1 || !answer1) {
            errors.push({ row: rowNum, message: 'প্রশ্ন ১ ও উত্তর ১ আবশ্যক' })
            continue
          }

          await db.cQ.create({
            data: {
              uddeepok,
              question1,
              question2: question2 || '',
              question3: question3 || '',
              question4: question4 || '',
              answer1,
              answer2: answer2 || '',
              answer3: answer3 || '',
              answer4: answer4 || '',
              chapterId,
              classLevel,
              subjectId,
              board: isBoard ? board : (board || null),
              year: isBoard ? year : (year || null),
              topic: topic || null,
              difficulty: defaultDifficulty,
              isPremium,
              price: isPremium ? priceVal : 0,
              isActive: true,
            },
          })
          success++
        } catch (err) {
          errors.push({ row: rowNum, message: `সংরক্ষণ ত্রুটি: ${(err as Error).message}` })
        }
      }
    }

    return NextResponse.json({
      success,
      errors,
      total: rows.length,
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'বাল্ক ইম্পোর্ট করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
