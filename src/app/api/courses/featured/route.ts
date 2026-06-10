import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get featured content items from the FeaturedContent table
    const featuredItems = await db.featuredContent.findMany({
      where: { section: 'homepage', isActive: true },
      orderBy: { order: 'asc' },
    })

    if (featuredItems.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // Resolve each featured item to actual content
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
      try {
        let resolved: {
          id: string
          contentType: string
          title: string
          subtitle: string | null
          thumbnail: string | null
          isPremium: boolean
          extra: Record<string, unknown>
        } | null = null

        switch (featured.contentType) {
          case 'lecture': {
            const lecture = await db.lecture.findUnique({
              where: { id: featured.contentId },
              include: {
                chapter: {
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
                },
              },
            })
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
            const mcq = await db.mCQ.findUnique({
              where: { id: featured.contentId },
              include: {
                chapter: {
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
                },
              },
            })
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
            const cq = await db.cQ.findUnique({
              where: { id: featured.contentId },
              include: {
                chapter: {
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
                },
              },
            })
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
            const bundle = await db.contentBundle.findUnique({
              where: { id: featured.contentId },
              include: { _count: { select: { items: true } } },
            })
            if (bundle) {
              resolved = {
                id: bundle.id,
                contentType: 'bundle',
                title: featured.title || bundle.title,
                subtitle: featured.subtitle || `${bundle._count.items}টি আইটেম`,
                thumbnail: featured.thumbnail || bundle.thumbnail,
                isPremium: bundle.price > 0,
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
            const pkg = await db.contentPackage.findUnique({
              where: { id: featured.contentId },
            })
            if (pkg) {
              resolved = {
                id: pkg.id,
                contentType: 'package',
                title: featured.title || pkg.title,
                subtitle: featured.subtitle || pkg.durationLabel,
                thumbnail: featured.thumbnail || pkg.thumbnail,
                isPremium: pkg.price > 0,
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
            const suggestion = await db.suggestion.findUnique({
              where: { id: featured.contentId },
            })
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
            const exam = await db.exam.findUnique({
              where: { id: featured.contentId },
            })
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
        }

        if (resolved) {
          items.push(resolved)
        }
      } catch {
        // Skip items that fail to resolve (deleted content, etc.)
      }
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Get featured content error:', error)
    return NextResponse.json(
      { error: 'ফিচার্ড কন্টেন্ট আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
