import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    if (!courseId) return apiError('courseId required', 400)

    const lessons = await db.courseLesson.findMany({
      where: { courseId },
      orderBy: { displayOrder: 'asc' },
      include: {
        assignments: { orderBy: { displayOrder: 'asc' } },
        schedules: true,
        notes: { orderBy: { displayOrder: 'asc' } },
        resources: { orderBy: { displayOrder: 'asc' } },
      },
    })

    return apiResponse({ lessons })
  } catch (error) {
    return handleApiError(error, 'Lessons GET')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { courseId, title, description, lessonType, meetingLink, meetingId, platform, password, videoUrl, previewVideo, duration, displayOrder, notes, resources } = body
        if (!courseId || !title || !lessonType) return apiError('courseId, title, lessonType required', 400)

        const maxOrder = await db.courseLesson.aggregate({ where: { courseId }, _max: { displayOrder: true } })
        const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1

        const lesson = await db.courseLesson.create({
          data: {
            courseId,
            title,
            description: description || null,
            lessonType,
            meetingLink: meetingLink || null,
            meetingId: meetingId || null,
            platform: platform || null,
            password: password || null,
            videoUrl: videoUrl || null,
            previewVideo: previewVideo || null,
            duration: duration || null,
            displayOrder: displayOrder ?? nextOrder,
            notes: notes?.length ? {
              create: notes.map((n: any, i: number) => ({
                title: n.title,
                type: n.type || 'link',
                content: n.content || null,
                fileUrl: n.fileUrl || null,
                link: n.link || null,
                displayOrder: n.displayOrder ?? i,
              })),
            } : undefined,
            resources: resources?.length ? {
              create: resources.map((r: any, i: number) => ({
                title: r.title,
                type: r.type || 'link',
                fileUrl: r.fileUrl || null,
                link: r.link || null,
                displayOrder: r.displayOrder ?? i,
              })),
            } : undefined,
          },
          include: {
            assignments: true,
            schedules: true,
            notes: true,
            resources: true,
          },
        })
        return apiResponse({ lesson }, 201)
      }

      case 'update': {
        const { id, ...data } = body
        if (!id) return apiError('Lesson ID required', 400)

        const existing = await db.courseLesson.findUnique({ where: { id } })
        if (!existing) return apiError('Lesson not found', 404)

        const allowed = ['title', 'description', 'lessonType', 'meetingLink', 'meetingId', 'platform', 'password', 'videoUrl', 'previewVideo', 'duration', 'displayOrder']
        const updateData: Record<string, unknown> = {}
        for (const f of allowed) { if (data[f] !== undefined) updateData[f] = data[f] }

        const lesson = await db.courseLesson.update({
          where: { id },
          data: updateData,
          include: {
            assignments: true,
            schedules: true,
            notes: true,
            resources: true,
          },
        })
        return apiResponse({ lesson })
      }

      case 'delete': {
        const { id } = body
        if (!id) return apiError('Lesson ID required', 400)
        await db.courseLesson.delete({ where: { id } })
        return apiResponse({ success: true })
      }

      case 'reorder': {
        const { courseId, lessonIds } = body
        if (!courseId || !lessonIds?.length) return apiError('courseId and lessonIds required', 400)
        await db.$transaction(lessonIds.map((id: string, i: number) =>
          db.courseLesson.update({ where: { id }, data: { displayOrder: i } })
        ))
        return apiResponse({ success: true })
      }

      case 'duplicate': {
        const { id } = body
        if (!id) return apiError('Lesson ID required', 400)
        const source = await db.courseLesson.findUnique({
          where: { id },
          include: { notes: true, resources: true, assignments: true, schedules: true },
        })
        if (!source) return apiError('Lesson not found', 404)

        const maxOrder = await db.courseLesson.aggregate({ where: { courseId: source.courseId }, _max: { displayOrder: true } })
        const lesson = await db.courseLesson.create({
          data: {
            courseId: source.courseId,
            title: `${source.title} (কপি)`,
            description: source.description,
            lessonType: source.lessonType,
            meetingLink: source.meetingLink,
            meetingId: source.meetingId,
            platform: source.platform,
            password: source.password,
            videoUrl: source.videoUrl,
            previewVideo: source.previewVideo,
            duration: source.duration,
            displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
            assignments: { create: source.assignments.map(a => ({ title: a.title, description: a.description, deadline: a.deadline, attachment: a.attachment, displayOrder: a.displayOrder })) },
            schedules: source.schedules.length ? { create: source.schedules.map(s => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })) } : undefined,
            notes: { create: source.notes.map(n => ({ title: n.title, type: n.type, content: n.content, fileUrl: n.fileUrl, link: n.link, displayOrder: n.displayOrder })) },
            resources: { create: source.resources.map(r => ({ title: r.title, type: r.type, fileUrl: r.fileUrl, link: r.link, displayOrder: r.displayOrder })) },
          },
          include: { assignments: true, schedules: true, notes: true, resources: true },
        })
        return apiResponse({ lesson }, 201)
      }

      case 'add-assignment': {
        const { lessonId, title, description, deadline, attachment } = body
        if (!lessonId || !title) return apiError('lessonId, title required', 400)
        const max = await db.lessonAssignment.aggregate({ where: { lessonId }, _max: { displayOrder: true } })
        const assignment = await db.lessonAssignment.create({
          data: {
            lessonId, title, description: description || null,
            deadline: deadline ? new Date(deadline).toISOString() : null, attachment: attachment || null,
            displayOrder: (max._max.displayOrder ?? -1) + 1,
          },
        })
        return apiResponse({ assignment }, 201)
      }

      case 'remove-assignment': {
        const { id } = body
        if (!id) return apiError('Assignment ID required', 400)
        await db.lessonAssignment.delete({ where: { id } })
        return apiResponse({ success: true })
      }

      case 'add-note': {
        const { lessonId, title, type, content, fileUrl, link } = body
        if (!lessonId || !title) return apiError('lessonId, title required', 400)
        const max = await db.lessonNote.aggregate({ where: { lessonId }, _max: { displayOrder: true } })
        const note = await db.lessonNote.create({
          data: {
            lessonId, title, type: type || 'link',
            content: content || null, fileUrl: fileUrl || null, link: link || null,
            displayOrder: (max._max.displayOrder ?? -1) + 1,
          },
        })
        return apiResponse({ note }, 201)
      }

      case 'remove-note': {
        const { id } = body
        if (!id) return apiError('Note ID required', 400)
        await db.lessonNote.delete({ where: { id } })
        return apiResponse({ success: true })
      }

      case 'add-resource': {
        const { lessonId, title, type, fileUrl, link } = body
        if (!lessonId || !title) return apiError('lessonId, title required', 400)
        const max = await db.lessonResource.aggregate({ where: { lessonId }, _max: { displayOrder: true } })
        const resource = await db.lessonResource.create({
          data: {
            lessonId, title, type: type || 'link',
            fileUrl: fileUrl || null, link: link || null,
            displayOrder: (max._max.displayOrder ?? -1) + 1,
          },
        })
        return apiResponse({ resource }, 201)
      }

      case 'remove-resource': {
        const { id } = body
        if (!id) return apiError('Resource ID required', 400)
        await db.lessonResource.delete({ where: { id } })
        return apiResponse({ success: true })
      }

      case 'add-schedule': {
        const { lessonId, date, startTime, endTime } = body
        if (!lessonId) return apiError('lessonId required', 400)
        const dateIso = date ? new Date(date).toISOString() : null
        const existing = await db.lessonSchedule.findUnique({ where: { lessonId } })
        if (existing) {
          const schedule = await db.lessonSchedule.update({
            where: { lessonId },
            data: { date: dateIso, startTime: startTime || null, endTime: endTime || null },
          })
          return apiResponse({ schedule })
        }
        const schedule = await db.lessonSchedule.create({
          data: { lessonId, date: dateIso, startTime: startTime || null, endTime: endTime || null },
        })
        return apiResponse({ schedule }, 201)
      }

      case 'remove-schedule': {
        const { lessonId } = body
        if (!lessonId) return apiError('lessonId required', 400)
        await db.lessonSchedule.deleteMany({ where: { lessonId } })
        return apiResponse({ success: true })
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    return handleApiError(error, 'Lessons POST')
  }
}
