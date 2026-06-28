import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { checkContentAccess } from '@/lib/access-control'

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const lecture = await db.lecture.findUnique({
      where: { id, isActive: true },
      include: {
        chapter: {
          include: {
            subject: {
              include: {
                class: true,
              },
            },
            lectures: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
        },
        resources: {
          where: { isActive: true },
        },
      },
    })

    if (!lecture) {
      return apiError('লেকচার খুঁজে পাওয়া যায়নি', 404)
    }

    const auth = await verifyAuth()
    const userId = auth?.user.id

    let userProgress = 0
    if (userId) {
      const progressRecord = await db.progress.findUnique({
        where: { userId_contentId_contentType: { userId, contentId: id, contentType: 'lecture' } },
        select: { progress: true },
      })
      userProgress = progressRecord?.progress ?? 0
    }

    if (lecture.isPremium) {
      if (!userId) {
        return apiError('এই লেকচারটি দেখতে লগইন করুন', 401, 'PREMIUM_REQUIRES_AUTH')
      }

      const access = await checkContentAccess({
        userId,
        contentType: 'lecture',
        contentId: id,
      })

      if (!access.hasAccess) {
        const siblingLectures = lecture.chapter.lectures.map((lec) => ({
          id: lec.id,
          title: lec.title,
          number: lec.order,
          isCompleted: false,
          isCurrent: lec.id === id,
        }))
        const currentIndex = lecture.chapter.lectures.findIndex(
          (lec) => lec.id === id
        )
        return NextResponse.json({
          success: true,
          data: {
            id: lecture.id,
            title: lecture.title,
            thumbnail: lecture.thumbnail,
            isPremium: true,
            price: lecture.price,
            chapterName: lecture.chapter.name,
            subjectName: lecture.chapter.subject.name,
            className: lecture.chapter.subject.class.name,
            classSlug: lecture.chapter.subject.class.slug,
            subjectId: lecture.chapter.subject.id,
            chapterId: lecture.chapter.id,
            hasAccess: false,
            pendingPayment: access.pendingPayment,
            progress: userProgress,
            lectures: siblingLectures,
            currentIndex: currentIndex >= 0 ? currentIndex : 0,
            resources: [],
          },
        })
      }
    }

    await db.lecture.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    const siblingLectures = lecture.chapter.lectures.map((lec) => ({
      id: lec.id,
      title: lec.title,
      number: lec.order,
      isCompleted: false,
      isCurrent: lec.id === id,
    }))

    const currentIndex = lecture.chapter.lectures.findIndex(
      (lec) => lec.id === id
    )

    const result = {
      id: lecture.id,
      title: lecture.title,
      content: lecture.content,
      thumbnail: lecture.thumbnail,
      videoUrl: lecture.videoUrl,
      audioUrl: lecture.audioUrl,
      pdfUrl: lecture.pdfUrl,
      chapterName: lecture.chapter.name,
      subjectName: lecture.chapter.subject.name,
      className: lecture.chapter.subject.class.name,
      classSlug: lecture.chapter.subject.class.slug,
      subjectId: lecture.chapter.subject.id,
      chapterId: lecture.chapter.id,
      isPremium: lecture.isPremium,
      price: lecture.price,
      progress: userProgress,
      lectures: siblingLectures,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      resources: lecture.resources.map((r) => ({
        name: r.title,
        url: r.url,
        type: r.type,
      })),
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Get lecture detail error:', error)
    return apiError('লেকচারের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}
