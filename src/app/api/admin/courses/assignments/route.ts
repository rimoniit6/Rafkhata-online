import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const assignmentId = searchParams.get('assignmentId')
    const lessonId = searchParams.get('lessonId')

    if (action === 'submissions' && assignmentId) {
      const submissions = await db.assignmentSubmission.findMany({
        where: { assignmentId },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          assignment: { select: { id: true, title: true, lessonId: true } },
        },
        orderBy: { submittedAt: 'desc' },
      })
      return apiResponse({ submissions })
    }

    if (action === 'lesson-submissions' && lessonId) {
      const assignments = await db.lessonAssignment.findMany({
        where: { lessonId },
        include: {
          submissions: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
            orderBy: { submittedAt: 'desc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      })
      return apiResponse({ assignments })
    }

    if (action === 'course-list') {
      const courseId = searchParams.get('courseId')
      if (!courseId) return apiError('courseId required', 400)

      const rows = await db.$queryRawUnsafe<
        Array<{
          lesson_id: string; lesson_title: string;
          id: string | null; lessonId: string | null;
          title: string | null; description: string | null;
          deadline: Date | null; attachment: string | null;
          displayOrder: number | null;
        }>
      >(
        `SELECT cl.id AS lesson_id, cl.title AS lesson_title,
                la.id, la."lessonId", la.title, la.description,
                la.deadline, la.attachment, la."displayOrder"
         FROM "CourseLesson" cl
         LEFT JOIN "LessonAssignment" la ON la."lessonId" = cl.id
         WHERE cl."courseId" = $1
         ORDER BY cl."displayOrder" ASC, la."displayOrder" ASC`,
        courseId,
      )

      const lessonMap = new Map<string, string>()
      for (const r of rows) lessonMap.set(r.lesson_id, r.lesson_title)

      const rawAssignments = rows.filter(r => r.id !== null) as Array<
        Omit<typeof rows[number], 'id'> & { id: string; lessonId: string; title: string }
      >
      const assignmentIds = rawAssignments.map(a => a.id)

      let submissions: Array<Record<string, unknown>> = []
      if (assignmentIds.length > 0) {
        const placeholders = assignmentIds.map((_, i) => `$${i + 1}`).join(',')
        const subResult = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(
          `SELECT asub.id, asub."assignmentId", asub."userId",
                  asub.content, asub."fileUrls", asub.status,
                  asub.marks, asub.feedback, asub."gradedBy",
                  asub."gradedAt", asub."submittedAt",
                  u.id AS user_id, u.name AS user_name, u.email AS user_email
           FROM "AssignmentSubmission" asub
           LEFT JOIN "User" u ON u.id = asub."userId"
           WHERE asub."assignmentId" IN (${placeholders})
           ORDER BY asub."submittedAt" DESC`,
          ...assignmentIds,
        )
        submissions = subResult.map((s: Record<string, unknown>) => ({
          id: s.id,
          assignmentId: s.assignmentId,
          userId: s.userId,
          content: s.content,
          fileUrls: s.fileUrls,
          status: s.status,
          marks: s.marks,
          feedback: s.feedback,
          gradedBy: s.gradedBy,
          gradedAt: s.gradedAt,
          submittedAt: s.submittedAt,
          user: {
            id: s.user_id,
            name: s.user_name,
            email: s.user_email,
            avatar: null,
          },
        }))
      }

      const subsByAssignmentId: Record<string, unknown[]> = {}
      for (const s of submissions) {
        const sid = s.assignmentId as string
        if (!subsByAssignmentId[sid]) subsByAssignmentId[sid] = []
        subsByAssignmentId[sid].push(s)
      }

      const result = rawAssignments.map(a => ({
        id: a.id, lessonId: a.lessonId, title: a.title,
        description: a.description, deadline: a.deadline,
        attachment: a.attachment, displayOrder: a.displayOrder,
        lesson: { title: lessonMap.get(a.lesson_id) || '' },
        submissions: (subsByAssignmentId[a.id] || []).map((s: any) => ({
          ...s,
          assignment: { id: a.id, title: a.title, lessonId: a.lessonId },
        })),
      }))

      return apiResponse({ assignments: result })
    }

    return apiError('assignmentId or lessonId required', 400)
  } catch (error) {
    return handleApiError(error, 'Admin Assignments GET')
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
        const { lessonId, title, description, deadline, attachment } = body
        if (!lessonId || !title) return apiError('lessonId and title required', 400)
        const max = await db.lessonAssignment.aggregate({ where: { lessonId }, _max: { displayOrder: true } })
        const assignment = await db.lessonAssignment.create({
          data: {
            lessonId, title, description: description || null,
            deadline: deadline ? new Date(deadline).toISOString() : null, attachment: attachment || null,
            displayOrder: (max._max.displayOrder ?? -1) + 1,
          },
          include: { lesson: { select: { title: true } } },
        })
        return apiResponse({ assignment }, 201)
      }

      case 'update': {
        const { id, title, description, deadline, attachment } = body
        if (!id) return apiError('Assignment ID required', 400)
        const data: Record<string, unknown> = {}
        if (title !== undefined) data.title = title
        if (description !== undefined) data.description = description || null
        if (deadline !== undefined) data.deadline = deadline ? new Date(deadline).toISOString() : null
        if (attachment !== undefined) data.attachment = attachment || null
        const assignment = await db.lessonAssignment.update({
          where: { id },
          data,
          include: { lesson: { select: { title: true } } },
        })
        return apiResponse({ assignment })
      }

      case 'delete': {
        const { id } = body
        if (!id) return apiError('Assignment ID required', 400)
        await db.lessonAssignment.delete({ where: { id } })
        return apiResponse({ success: true })
      }

      case 'grade': {
        const { submissionId, marks, feedback } = body
        if (!submissionId || marks === undefined) return apiError('submissionId and marks required', 400)

        const submission = await db.assignmentSubmission.findUnique({ where: { id: submissionId } })
        if (!submission) return apiError('Submission not found', 404)

        const updated = await db.assignmentSubmission.update({
          where: { id: submissionId },
          data: {
            marks,
            feedback: feedback || null,
            status: 'graded',
            gradedBy: auth.user.id,
            gradedAt: new Date(),
          },
        })
        return apiResponse({ submission: updated })
      }

      case 'bulk-grade': {
        const { assignmentId, defaultMarks } = body
        if (!assignmentId || defaultMarks === undefined) return apiError('assignmentId and defaultMarks required', 400)

        const result = await db.assignmentSubmission.updateMany({
          where: { assignmentId, status: 'submitted' },
          data: {
            marks: defaultMarks,
            status: 'graded',
            gradedBy: auth.user.id,
            gradedAt: new Date(),
          },
        })
        return apiResponse({ count: result.count })
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    return handleApiError(error, 'Admin Assignments POST')
  }
}
