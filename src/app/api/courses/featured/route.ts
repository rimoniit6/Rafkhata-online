import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { toDecimal } from '@/lib/decimal'

export async function GET() {
  try {
    // Get featured content items from the FeaturedContent table
    const featuredItems = await db.featuredContent.findMany({
      where: { section: 'homepage', isActive: true },
      orderBy: { order: 'asc' },
    })

    if (featuredItems.length === 0) {
      return NextResponse.json({ success: true, data: { items: [] } })
    }

    // Group featured items by content type for batch fetching
    const byType = new Map<string, Array<{ contentId: string; title: string | null; subtitle: string | null; thumbnail: string | null }>>()
    for (const f of featuredItems) {
      const list = byType.get(f.contentType) || []
      list.push({ contentId: f.contentId, title: f.title, subtitle: f.subtitle, thumbnail: f.thumbnail })
      byType.set(f.contentType, list)
    }

    // Batch-fetch all content types in parallel
    const chapterInclude = {
      select: {
        id: true,
        name: true,
        subjectId: true,
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
            class: { select: { name: true, slug: true } },
          },
        },
      },
    }

    const lectureIds = byType.get('lecture')?.map(i => i.contentId) || []
    const mcqIds = byType.get('mcq')?.map(i => i.contentId) || []
    const cqIds = byType.get('cq')?.map(i => i.contentId) || []
    const bundleIds = byType.get('bundle')?.map(i => i.contentId) || []
    const packageIds = byType.get('package')?.map(i => i.contentId) || []
    const suggestionIds = byType.get('suggestion')?.map(i => i.contentId) || []
    const examIds = byType.get('exam')?.map(i => i.contentId) || []
    const courseIds = byType.get('course')?.map(i => i.contentId) || []

    const [lectures, mcqs, cqs, bundles, packages, suggestions, exams, courses] = await Promise.all([
      (lectureIds.length ? db.lecture.findMany({ where: { id: { in: lectureIds } }, include: { chapter: chapterInclude } }) : []),
      (mcqIds.length ? db.mCQ.findMany({ where: { id: { in: mcqIds } }, include: { chapter: chapterInclude } }) : []),
      (cqIds.length ? db.cQ.findMany({ where: { id: { in: cqIds } }, include: { chapter: chapterInclude } }) : []),
      (bundleIds.length ? db.contentBundle.findMany({ where: { id: { in: bundleIds } }, include: { _count: { select: { items: true } } } }) : []),
      (packageIds.length ? db.contentPackage.findMany({ where: { id: { in: packageIds } } }) : []),
      (suggestionIds.length ? db.suggestion.findMany({ where: { id: { in: suggestionIds } } }) : []),
      (examIds.length ? db.exam.findMany({ where: { id: { in: examIds } } }) : []),
      (courseIds.length ? db.course.findMany({ where: { id: { in: courseIds } }, include: { classCategory: { select: { name: true, slug: true } }, subject: { select: { id: true, name: true, slug: true } } } }) : []),
    ])

    // Build lookup maps by id
    const lectureMap = new Map(lectures.map((l: any) => [l.id, l]))
    const mcqMap = new Map(mcqs.map((m: any) => [m.id, m]))
    const cqMap = new Map(cqs.map((c: any) => [c.id, c]))
    const bundleMap = new Map(bundles.map((b: any) => [b.id, b]))
    const packageMap = new Map(packages.map((p: any) => [p.id, p]))
    const suggestionMap = new Map(suggestions.map((s: any) => [s.id, s]))
    const examMap = new Map(exams.map((e: any) => [e.id, e]))
    const courseMap = new Map(courses.map((c: any) => [c.id, c]))

    // Resolve items from maps
    const items: Array<{
      id: string
      contentType: string
      title: string
      subtitle: string | null
      thumbnail: string | null
      isPremium: boolean
      extra: Record<string, unknown>
    }> = []

    for (const featured of featuredItems) {
      const f = byType.get(featured.contentType)?.find(i => i.contentId === featured.contentId)
      if (!f) continue

      let resolved: typeof items[number] | null = null

      switch (featured.contentType) {
        case 'lecture': {
          const lecture = lectureMap.get(featured.contentId) as any
          if (lecture) {
            resolved = {
              id: lecture.id,
              contentType: 'lecture',
              title: featured.title || lecture.title,
              subtitle: featured.subtitle || `${lecture.chapter.subject.class.name} › ${lecture.chapter.subject.name}`,
              thumbnail: featured.thumbnail || lecture.thumbnail,
              isPremium: lecture.isPremium,
              extra: {
                lectureId: lecture.id,
                chapterId: lecture.chapter.id,
                subjectId: lecture.chapter.subject.id,
                classSlug: lecture.chapter.subject.class.slug,
                subjectSlug: lecture.chapter.subject.slug,
                chapterName: lecture.chapter.name,
              },
            }
          }
          break
        }

        case 'mcq': {
          const mcq = mcqMap.get(featured.contentId) as any
          if (mcq) {
            resolved = {
              id: mcq.id,
              contentType: 'mcq',
              title: featured.title || (mcq.question.length > 60 ? mcq.question.slice(0, 60) + '...' : mcq.question),
              subtitle: featured.subtitle || `${mcq.chapter.subject.class.name} › ${mcq.chapter.subject.name}`,
              thumbnail: featured.thumbnail || null,
              isPremium: mcq.isPremium,
              extra: {
                chapterId: mcq.chapter.id,
                subjectId: mcq.chapter.subject.id,
                classLevel: mcq.classLevel,
                subjectSlug: mcq.chapter.subject.slug,
                classSlug: mcq.chapter.subject.class.slug,
                difficulty: mcq.difficulty,
              },
            }
          }
          break
        }

        case 'cq': {
          const cq = cqMap.get(featured.contentId) as any
          if (cq) {
            resolved = {
              id: cq.id,
              contentType: 'cq',
              title: featured.title || (cq.uddeepok.length > 60 ? cq.uddeepok.slice(0, 60) + '...' : cq.uddeepok),
              subtitle: featured.subtitle || `${cq.chapter.subject.class.name} › ${cq.chapter.subject.name}`,
              thumbnail: featured.thumbnail || null,
              isPremium: cq.isPremium,
              extra: {
                cqId: cq.id,
                chapterId: cq.chapter.id,
                subjectId: cq.chapter.subject.id,
                classLevel: cq.classLevel,
                subjectSlug: cq.chapter.subject.slug,
                classSlug: cq.chapter.subject.class.slug,
                difficulty: cq.difficulty,
              },
            }
          }
          break
        }

        case 'bundle': {
          const bundle = bundleMap.get(featured.contentId) as any
          if (bundle) {
            resolved = {
              id: bundle.id,
              contentType: 'bundle',
              title: featured.title || bundle.title,
              subtitle: featured.subtitle || `${bundle._count.items}টি আইটেম`,
              thumbnail: featured.thumbnail || bundle.thumbnail,
              isPremium: toDecimal(bundle.price) > 0,
              extra: {
                price: bundle.price,
                originalPrice: bundle.originalPrice,
                type: bundle.type,
                slug: bundle.slug,
              },
            }
          }
          break
        }

        case 'package': {
          const pkg = packageMap.get(featured.contentId) as any
          if (pkg) {
            resolved = {
              id: pkg.id,
              contentType: 'package',
              title: featured.title || pkg.title,
              subtitle: featured.subtitle || pkg.durationLabel,
              thumbnail: featured.thumbnail || pkg.thumbnail,
              isPremium: toDecimal(pkg.price) > 0,
              extra: {
                price: pkg.price,
                originalPrice: pkg.originalPrice,
                duration: pkg.duration,
                durationLabel: pkg.durationLabel,
                slug: pkg.slug,
              },
            }
          }
          break
        }

        case 'suggestion': {
          const suggestion = suggestionMap.get(featured.contentId) as any
          if (suggestion) {
            resolved = {
              id: suggestion.id,
              contentType: 'suggestion',
              title: featured.title || suggestion.title,
              subtitle: featured.subtitle || null,
              thumbnail: featured.thumbnail || suggestion.thumbnail,
              isPremium: suggestion.isPremium,
              extra: {
                price: suggestion.price,
                slug: suggestion.slug,
              },
            }
          }
          break
        }

        case 'exam': {
          const exam = examMap.get(featured.contentId) as any
          if (exam) {
            resolved = {
              id: exam.id,
              contentType: 'exam',
              title: featured.title || exam.title,
              subtitle: featured.subtitle || `${exam.classLevel} › ${exam.type.toUpperCase()} › ${exam.duration} মিনিট`,
              thumbnail: featured.thumbnail || null,
              isPremium: exam.isPremium,
              extra: {
                type: exam.type,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                classLevel: exam.classLevel,
              },
            }
          }
          break
        }

        case 'course': {
          const course = courseMap.get(featured.contentId) as any
          if (course) {
            resolved = {
              id: course.id,
              contentType: 'course',
              title: featured.title || course.title,
              subtitle: featured.subtitle || (
                course.classCategory && course.subject
                  ? `${course.classCategory.name} › ${course.subject.name}`
                  : course.classCategory?.name || null
              ),
              thumbnail: featured.thumbnail || course.thumbnail,
              isPremium: course.isPremium,
              extra: {
                courseSlug: course.slug,
                price: course.price,
                originalPrice: course.originalPrice,
                classSlug: course.classCategory?.slug,
                subjectId: course.subject?.id,
                subjectSlug: course.subject?.slug,
                teacherName: course.teacherName,
                difficulty: course.difficulty,
              },
            }
          }
          break
        }
      }

      if (resolved) {
        items.push(resolved)
      }
    }

    return NextResponse.json({ success: true, data: { items } })
  } catch (error) {
    console.error('Get featured content error:', error)
    return NextResponse.json(
      { error: 'ফিচার্ড কন্টেন্ট আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
