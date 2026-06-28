import { db } from '@/lib/db'
import { apiError, withAdmin } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const auth = await withAdmin(request)
    if (auth instanceof Response) return auth
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'lecture'
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    interface ContentItem {
      id: string
      title: string
      subtitle?: string | null
      thumbnail?: string | null
      isPremium?: boolean
      extra?: Record<string, unknown>
    }

    const items: ContentItem[] = []

    switch (type) {
      case 'lecture': {
        const lectures = await db.lecture.findMany({
          where: query ? { title: { contains: query } } : {},
          include: {
            chapter: {
              select: {
                name: true,
                subject: {
                  select: { name: true, slug: true, class: { select: { name: true, slug: true } } },
                },
              },
            },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        for (const l of lectures) {
          items.push({
            id: l.id,
            title: l.title,
            subtitle: `${l.chapter.subject.class.name} › ${l.chapter.subject.name} › ${l.chapter.name}`,
            thumbnail: l.thumbnail,
            isPremium: l.isPremium,
          })
        }
        break
      }

      case 'mcq': {
        const mcqs = await db.mCQ.findMany({
          where: query ? { question: { contains: query } } : {},
          include: {
            chapter: {
              select: {
                name: true,
                subject: {
                  select: { name: true, slug: true, class: { select: { name: true, slug: true } } },
                },
              },
            },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        for (const m of mcqs) {
          items.push({
            id: m.id,
            title: m.question.length > 80 ? m.question.slice(0, 80) + '...' : m.question,
            subtitle: `${m.chapter.subject.class.name} › ${m.chapter.subject.name} › ${m.chapter.name}`,
            isPremium: m.isPremium,
            extra: { difficulty: m.difficulty, classLevel: m.classLevel },
          })
        }
        break
      }

      case 'cq': {
        const cqs = await db.cQ.findMany({
          where: query ? { uddeepok: { contains: query } } : {},
          include: {
            chapter: {
              select: {
                name: true,
                subject: {
                  select: { name: true, slug: true, class: { select: { name: true, slug: true } } },
                },
              },
            },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        for (const c of cqs) {
          items.push({
            id: c.id,
            title: c.uddeepok.length > 80 ? c.uddeepok.slice(0, 80) + '...' : c.uddeepok,
            subtitle: `${c.chapter.subject.class.name} › ${c.chapter.subject.name} › ${c.chapter.name}`,
            isPremium: c.isPremium,
            extra: { difficulty: c.difficulty, classLevel: c.classLevel },
          })
        }
        break
      }

      case 'bundle': {
        const bundles = await db.contentBundle.findMany({
          where: query ? { title: { contains: query } } : {},
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        for (const b of bundles) {
          items.push({
            id: b.id,
            title: b.title,
            subtitle: b.type === 'mixed' ? 'মিক্সড বান্ডেল' : `${b.type.toUpperCase()} বান্ডেল`,
            thumbnail: b.thumbnail,
            isPremium: b.price > 0,
            extra: { price: b.price, originalPrice: b.originalPrice, type: b.type },
          })
        }
        break
      }

      case 'package': {
        const packages = await db.contentPackage.findMany({
          where: query ? { title: { contains: query } } : {},
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        for (const p of packages) {
          items.push({
            id: p.id,
            title: p.title,
            subtitle: p.durationLabel,
            thumbnail: p.thumbnail,
            isPremium: p.price > 0,
            extra: { price: p.price, duration: p.duration, durationLabel: p.durationLabel },
          })
        }
        break
      }

      case 'suggestion': {
        const suggestions = await db.suggestion.findMany({
          where: query ? { title: { contains: query } } : {},
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        for (const s of suggestions) {
          items.push({
            id: s.id,
            title: s.title,
            subtitle: s.classId || '',
            thumbnail: s.thumbnail,
            isPremium: s.isPremium,
            extra: { price: s.price },
          })
        }
        break
      }

      case 'exam': {
        const exams = await db.exam.findMany({
          where: query ? { title: { contains: query } } : {},
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        for (const e of exams) {
          items.push({
            id: e.id,
            title: e.title,
            subtitle: `${e.classLevel} › ${e.type.toUpperCase()} › ${e.duration} মিনিট`,
            isPremium: e.isPremium,
            extra: { type: e.type, duration: e.duration, totalMarks: e.totalMarks },
          })
        }
        break
      }

      case 'course': {
        const courses = await db.course.findMany({
          where: query ? { title: { contains: query } } : {},
          include: {
            classCategory: { select: { name: true } },
            subject: { select: { name: true } },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        for (const c of courses) {
          items.push({
            id: c.id,
            title: c.title,
            subtitle: c.classCategory && c.subject
              ? `${c.classCategory.name} › ${c.subject.name}`
              : c.classCategory?.name || null,
            thumbnail: c.thumbnail,
            isPremium: c.isPremium,
            extra: { price: c.price, originalPrice: c.originalPrice, slug: c.slug },
          })
        }
        break
      }

      default:
        return apiError(`অবৈধ কন্টেন্ট টাইপ: ${type}`, 400)
    }

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Admin Search Content error:', error)
    return apiError('কন্টেন্ট খুঁজতে সমস্যা হয়েছে', 500)
  }
}
