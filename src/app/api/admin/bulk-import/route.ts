import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { safeParseExcelFromFile, ExcelParseError } from '@/lib/excel-parse'
import { withAdmin, applyRateLimit, apiError } from '@/lib/api-utils'
import { uploadLimiter } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/errors'

interface ImportError {
  row: number
  message: string
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const rateCheck = await applyRateLimit(uploadLimiter, request)
  if ('error' in rateCheck) return rateCheck.error

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
      return apiError('ফাইল আপলোড করুন', 400)
    }
    if (!type || !['mcq', 'cq', 'board-mcq', 'board-cq', 'knowledge'].includes(type)) {
      return apiError('সঠিক টাইপ নির্বাচন করুন', 400)
    }
    if (!chapterId) {
      return apiError('অধ্যায় আবশ্যক', 400)
    }
    if (type !== 'knowledge' && (!classId || !subjectId)) {
      return apiError('ক্লাস ও বিষয় আবশ্যক', 400)
    }

    // Parse with safe xlsx wrapper
    const { rows } = await safeParseExcelFromFile(file)

    if (rows.length === 0) {
      return apiError('ফাইলে কোনো ডেটা নেই', 400)
    }

    const errors: ImportError[] = []
    let success = 0

    const isBoard = type.startsWith('board-')
    const actualType = isBoard ? type.replace('board-', '') : type

    // For board questions, board and year are required
    if (isBoard) {
      if (!board) {
        return apiError('বোর্ড প্রশ্নের জন্য বোর্ড আবশ্যক', 400)
      }
      if (!year) {
        return apiError('বোর্ড প্রশ্নের জন্য সাল আবশ্যক', 400)
      }
    }

    const defaultDifficulty = difficulty || 'medium'

    if (actualType === 'mcq') {
      const classObj = await db.classCategory.findUnique({ where: { id: classId! } })
      if (!classObj) {
        return apiError('ক্লাস খুঁজে পাওয়া যায়নি', 400)
      }
      const classLevel = classObj.slug

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
              chapterId: chapterId!,
              classLevel,
              subjectId: subjectId!,
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
      const classObj = await db.classCategory.findUnique({ where: { id: classId! } })
      if (!classObj) {
        return apiError('ক্লাস খুঁজে পাওয়া যায়নি', 400)
      }
      const classLevel = classObj.slug

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
              chapterId: chapterId!,
              classLevel,
              subjectId: subjectId!,
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
    } else if (actualType === 'knowledge') {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNum = i + 2

        try {
          const question = String(row['question'] ?? row['প্রশ্ন'] ?? '').trim()
          const answer = String(row['answer'] ?? row['উত্তর'] ?? '').trim()
          const questionImage = String(row['questionImage'] ?? row['question_image'] ?? row['প্রশ্নচিত্র'] ?? '').trim()
          const answerImage = String(row['answerImage'] ?? row['answer_image'] ?? row['উত্তরচিত্র'] ?? '').trim()
          const isPremiumRaw = String(row['isPremium'] ?? row['প্রিমিয়াম'] ?? 'false').trim().toLowerCase()
          const isPremium = isPremiumRaw === 'true' || isPremiumRaw === '1'
          const priceVal = parseFloat(String(row['price'] ?? row['মূল্য'] ?? '0')) || 0
          const orderVal = parseInt(String(row['order'] ?? row['ক্রম'] ?? '0')) || 0

          if (!question) {
            errors.push({ row: rowNum, message: 'প্রশ্ন ফাঁকা' })
            continue
          }
          if (!answer) {
            errors.push({ row: rowNum, message: 'উত্তর ফাঁকা' })
            continue
          }

          await db.knowledgeQuestion.create({
            data: {
              chapterId,
              type: 'knowledge',
              question,
              answer,
              questionImage: questionImage || null,
              answerImage: answerImage || null,
              isPremium,
              price: isPremium ? priceVal : 0,
              order: orderVal,
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
    if (error instanceof ExcelParseError) {
      return apiError(error.message, 400)
    }
    return handleApiError(error, 'Bulk import error')
  }
}
