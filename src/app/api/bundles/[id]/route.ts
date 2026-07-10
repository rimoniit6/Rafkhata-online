import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { toDecimal } from '@/lib/decimal'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const bundle = await db.contentBundle.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!bundle || !bundle.isActive) {
      return NextResponse.json(
        { error: 'বান্ডেল খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    // Enrich items with content details
    const mcqIds = bundle.items.filter((i) => i.contentType === 'MCQ').map((i) => i.contentId)
    const cqIds = bundle.items.filter((i) => i.contentType === 'CQ').map((i) => i.contentId)
    const lectureIds = bundle.items.filter((i) => i.contentType === 'lecture').map((i) => i.contentId)
    const suggestionIds = bundle.items.filter((i) => i.contentType === 'suggestion').map((i) => i.contentId)
    const examIds = bundle.items.filter((i) => i.contentType === 'exam').map((i) => i.contentId)

    const [mcqs, cqs, lectures, suggestions, exams] = await Promise.all([
      mcqIds.length > 0
        ? db.mCQ.findMany({ where: { id: { in: mcqIds } }, select: { id: true, question: true, price: true, classLevel: true, difficulty: true } })
        : [],
      cqIds.length > 0
        ? db.cQ.findMany({ where: { id: { in: cqIds } }, select: { id: true, uddeepok: true, price: true, classLevel: true, difficulty: true } })
        : [],
      lectureIds.length > 0
        ? db.lecture.findMany({ where: { id: { in: lectureIds } }, select: { id: true, title: true, price: true, thumbnail: true, duration: true, isPremium: true } })
        : [],
      suggestionIds.length > 0
        ? db.suggestion.findMany({ where: { id: { in: suggestionIds } }, select: { id: true, title: true, price: true, thumbnail: true, isPremium: true } })
        : [],
      examIds.length > 0
        ? db.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, title: true, price: true, duration: true, totalMarks: true, type: true } })
        : [],
    ])

    const contentMap = new Map<
      string,
      { title: string; price: number; thumbnail?: string | null; meta?: Record<string, unknown> }
    >()
    mcqs.forEach((m) =>
      contentMap.set(m.id, { title: m.question.slice(0, 80), price: Number(m.price), meta: { classLevel: m.classLevel, difficulty: m.difficulty } })
    )
    cqs.forEach((c) =>
      contentMap.set(c.id, { title: c.uddeepok.slice(0, 80), price: Number(c.price), meta: { classLevel: c.classLevel, difficulty: c.difficulty } })
    )
    lectures.forEach((l) =>
      contentMap.set(l.id, { title: l.title, price: Number(l.price), thumbnail: l.thumbnail, meta: { duration: l.duration, isPremium: l.isPremium } })
    )
    suggestions.forEach((s) =>
      contentMap.set(s.id, { title: s.title, price: Number(s.price), thumbnail: s.thumbnail, meta: { isPremium: s.isPremium } })
    )
    exams.forEach((e) =>
      contentMap.set(e.id, { title: e.title, price: Number(e.price), meta: { duration: e.duration, totalMarks: e.totalMarks, type: e.type } })
    )

    const enrichedItems = bundle.items.map((item) => ({
      ...item,
      contentTitle: contentMap.get(item.contentId)?.title || null,
      contentPrice: contentMap.get(item.contentId)?.price || 0,
      contentThumbnail: contentMap.get(item.contentId)?.thumbnail || null,
      contentMeta: contentMap.get(item.contentId)?.meta || null,
    }))

    const discount =
      toDecimal(bundle.originalPrice) > 0
        ? Math.round(((toDecimal(bundle.originalPrice) - toDecimal(bundle.price)) / toDecimal(bundle.originalPrice)) * 100)
        : 0

    return NextResponse.json({
      data: {
        id: bundle.id,
        title: bundle.title,
        slug: bundle.slug,
        description: bundle.description,
        thumbnail: bundle.thumbnail,
        price: bundle.price,
        originalPrice: bundle.originalPrice,
        isPremium: toDecimal(bundle.price) > 0 || toDecimal(bundle.originalPrice) > 0,
        discount,
        classLevel: bundle.classLevel,
        board: bundle.board,
        year: bundle.year,
        type: bundle.type,
        itemCount: bundle.items.length,
        items: enrichedItems,
        order: bundle.order,
        createdAt: bundle.createdAt,
      },
    })
  } catch (error) {
    console.error('Get Bundle Detail error:', error)
    return NextResponse.json(
      { error: 'বান্ডেল এর তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
