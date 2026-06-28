import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { getContentTypeLabels, getValidContentTypes } from '@/lib/content-type-labels'

export async function GET(request: Request) {
  try {
    const contentTypeLabels = await getContentTypeLabels()
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const contentId = searchParams.get('contentId')
    const classLevel = searchParams.get('classLevel') // For package: which class to subscribe

    if (!contentType) {
      return apiError('কন্টেন্ট টাইপ প্রয়োজন', 400)
    }

    const VALID_CONTENT_TYPES = await getValidContentTypes()
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return apiError('সঠিক কন্টেন্ট টাইপ দিন। সমর্থিত: ' + VALID_CONTENT_TYPES.join(', '), 400)
    }

    if (!contentId) {
      return apiError('কন্টেন্ট আইডি প্রয়োজন', 400)
    }

    let title = ''
    let price = 0
    let isPremium = false
    let description: string | undefined = undefined

    switch (contentType) {
      case 'mcq': {
        const mcq = await db.mCQ.findUnique({
          where: { id: contentId },
          select: { question: true, price: true, isPremium: true },
        })
        if (!mcq) {
          return apiError('MCQ প্রশ্ন খুঁজে পাওয়া যায়নি', 404)
        }
        title = mcq.question.length > 80 ? mcq.question.substring(0, 80) + '...' : mcq.question
        description = mcq.question.length > 80 ? mcq.question : undefined
        price = mcq.price
        isPremium = mcq.isPremium
        break
      }

      case 'board-mcq': {
        const mcq = await db.mCQ.findUnique({
          where: { id: contentId },
          select: { question: true, price: true, isPremium: true, board: true, year: true },
        })
        if (!mcq) {
          return apiError('বোর্ড MCQ প্রশ্ন খুঁজে পাওয়া যায়নি', 404)
        }
        const boardLabel = mcq.board ? `${mcq.board} ` : ''
        const yearLabel = mcq.year ? `${mcq.year} ` : ''
        title = `${boardLabel}${yearLabel}- ${mcq.question.length > 60 ? mcq.question.substring(0, 60) + '...' : mcq.question}`
        description = `${boardLabel}${yearLabel}সালের বোর্ড পরীক্ষার বহুনির্বাচনি প্রশ্ন`
        price = mcq.price
        isPremium = mcq.isPremium
        break
      }

      case 'cq': {
        const cq = await db.cQ.findUnique({
          where: { id: contentId },
          select: { uddeepok: true, price: true, isPremium: true },
        })
        if (!cq) {
          return apiError('সৃজনশীল প্রশ্ন খুঁজে পাওয়া যায়নি', 404)
        }
        title = cq.uddeepok.length > 80 ? cq.uddeepok.substring(0, 80) + '...' : cq.uddeepok
        description = cq.uddeepok.length > 80 ? cq.uddeepok : undefined
        price = cq.price
        isPremium = cq.isPremium
        break
      }

      case 'board-cq': {
        const cq = await db.cQ.findUnique({
          where: { id: contentId },
          select: { uddeepok: true, price: true, isPremium: true, board: true, year: true },
        })
        if (!cq) {
          return apiError('বোর্ড সৃজনশীল প্রশ্ন খুঁজে পাওয়া যায়নি', 404)
        }
        const boardLabel = cq.board ? `${cq.board} ` : ''
        const yearLabel = cq.year ? `${cq.year} ` : ''
        title = `${boardLabel}${yearLabel}- ${cq.uddeepok.length > 60 ? cq.uddeepok.substring(0, 60) + '...' : cq.uddeepok}`
        description = `${boardLabel}${yearLabel}সালের বোর্ড পরীক্ষার সৃজনশীল প্রশ্ন`
        price = cq.price
        isPremium = cq.isPremium
        break
      }

      case 'lecture': {
        const lecture = await db.lecture.findUnique({
          where: { id: contentId },
          select: { title: true, price: true, isPremium: true, duration: true },
        })
        if (!lecture) {
          return apiError('লেকচার খুঁজে পাওয়া যায়নি', 404)
        }
        title = lecture.title
        description = lecture.duration > 0 ? `${lecture.duration} মিনিটের প্রিমিয়াম লেকচার` : 'প্রিমিয়াম লেকচার'
        price = lecture.price
        isPremium = lecture.isPremium
        break
      }

      case 'suggestion': {
        const suggestion = await db.suggestion.findUnique({
          where: { id: contentId },
          select: { title: true, price: true, isPremium: true },
        })
        if (!suggestion) {
          return apiError('সাজেশন খুঁজে পাওয়া যায়নি', 404)
        }
        title = suggestion.title
        description = `${suggestion.title} - প্রিমিয়াম সাজেশন`
        price = suggestion.price
        isPremium = suggestion.isPremium
        break
      }

      case 'exam': {
        const exam = await db.exam.findUnique({
          where: { id: contentId },
          select: { title: true, price: true, isPremium: true, description: true },
        })
        if (!exam) {
          return apiError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)
        }
        title = exam.title
        description = exam.description || undefined
        price = exam.price
        isPremium = exam.isPremium
        break
      }

      case 'package': {
        const pkg = await db.contentPackage.findUnique({
          where: { id: contentId },
          select: {
            title: true,
            description: true,
            price: true,
            originalPrice: true,
            classLevel: true,
            duration: true,
            durationLabel: true,
          },
        })
        if (!pkg) {
          return apiError('প্যাকেজ খুঁজে পাওয়া যায়নি', 404)
        }

        // For packages, classLevel must be provided if package.classLevel is null
        const targetClass = classLevel || pkg.classLevel || ''
        title = pkg.title
        description = pkg.description || `${pkg.durationLabel} মেয়াদের সাবস্ক্রিপশন`
        price = pkg.price
        isPremium = true

        // Count premium content for the target class
        const mcqCount = targetClass
          ? await db.mCQ.count({ where: { isActive: true, isPremium: true, classLevel: targetClass } })
          : 0
        const cqCount = targetClass
          ? await db.cQ.count({ where: { isActive: true, isPremium: true, classLevel: targetClass } })
          : 0

        // Count lectures for this class
        let lectureCount = 0
        if (targetClass) {
          const classCats = await db.classCategory.findMany({
            where: { slug: targetClass },
            select: { id: true },
          })
          if (classCats.length > 0) {
            lectureCount = await db.lecture.count({
              where: {
                isActive: true,
                isPremium: true,
                chapter: {
                  subject: {
                    classId: { in: classCats.map(c => c.id) },
                  },
                },
              },
            })
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            title,
            price,
            isPremium,
            contentType,
            contentId,
            contentTypeLabel: contentTypeLabels[contentType] || contentType,
            description,
            originalPrice: pkg.originalPrice,
            duration: pkg.duration,
            durationLabel: pkg.durationLabel,
            classLevel: targetClass,
            mcqCount,
            cqCount,
            lectureCount,
            totalContent: mcqCount + cqCount + lectureCount,
          },
        })
      }

      case 'bundle': {
        const bundle = await db.contentBundle.findUnique({
          where: { id: contentId },
          include: { items: true },
        })
        if (!bundle) {
          return apiError('বান্ডেল খুঁজে পাওয়া যায়নি', 404)
        }
        title = bundle.title
        description = bundle.description || `এই বান্ডেলে ${bundle.items.length}টি প্রিমিয়াম কন্টেন্ট অন্তর্ভুক্ত`
        price = bundle.price
        isPremium = true
        return NextResponse.json({
          success: true,
          data: {
            title,
            price,
            isPremium,
            contentType,
            contentId,
            contentTypeLabel: contentTypeLabels[contentType] || contentType,
            description,
            originalPrice: bundle.originalPrice,
            itemCount: bundle.items.length,
            items: bundle.items.map(item => ({
              id: item.id,
              contentType: item.contentType,
              contentId: item.contentId,
              order: item.order,
            })),
          },
        })
      }

      case 'mcq-exam-package': {
        const pkg = await db.mCQExamPackage.findUnique({
          where: { id: contentId },
          select: { title: true, price: true, originalPrice: true, totalSets: true },
        })
        if (!pkg) {
          return apiError('MCQ এক্সাম প্যাকেজ খুঁজে পাওয়া যায়নি', 404)
        }
        title = pkg.title
        description = `${pkg.totalSets}টি পরীক্ষা সেট সহ MCQ এক্সাম প্যাকেজ`
        price = pkg.price
        isPremium = true
        return NextResponse.json({
          success: true,
          data: {
            title,
            price,
            isPremium,
            contentType,
            contentId,
            contentTypeLabel: contentTypeLabels[contentType] || 'MCQ এক্সাম প্যাকেজ',
            description,
            originalPrice: pkg.originalPrice,
          },
        })
      }

      case 'course': {
        const course = await db.course.findUnique({
          where: { id: contentId },
          select: { title: true, price: true, isPremium: true, description: true, thumbnail: true },
        })
        if (!course) return apiError('কোর্স খুঁজে পাওয়া যায়নি', 404)
        title = course.title
        price = course.price ?? 0
        isPremium = course.isPremium
        description = course.description || undefined
        return NextResponse.json({
          success: true,
          data: {
            title, price, isPremium, contentType, contentId,
            contentTypeLabel: contentTypeLabels[contentType] || 'কোর্স',
            description,
          },
        })
      }

      case 'cq-exam-package': {
        const pkg = await db.cQExamPackage.findUnique({
          where: { id: contentId },
          select: { title: true, price: true, originalPrice: true, totalSets: true },
        })
        if (!pkg) {
          return apiError('CQ এক্সাম প্যাকেজ খুঁজে পাওয়া যায়নি', 404)
        }
        title = pkg.title
        description = `${pkg.totalSets}টি সৃজনশীল পরীক্ষা সেট সহ CQ এক্সাম প্যাকেজ (আলাদা ক্রয়)`
        price = pkg.price
        isPremium = true
        return NextResponse.json({
          success: true,
          data: {
            title,
            price,
            isPremium,
            contentType,
            contentId,
            contentTypeLabel: contentTypeLabels[contentType] || 'CQ এক্সাম প্যাকেজ',
            description,
            originalPrice: pkg.originalPrice,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        title,
        price,
        isPremium,
        contentType,
        contentId,
        contentTypeLabel: contentTypeLabels[contentType] || contentType,
        description,
      },
    })
  } catch (error) {
    console.error('Get content info error:', error)
    return apiError('কন্টেন্টের তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}
