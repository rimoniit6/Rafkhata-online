import { db } from '@/lib/db'
import { apiResponse, apiError, withAuth } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const assignmentId = searchParams.get('assignmentId')
    const courseId = searchParams.get('courseId')

    const auth = await withAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.user.id

    if (action === 'list') {
      if (!courseId) return apiError('courseId required', 400)
      const lessons = await db.courseLesson.findMany({
        where: { courseId },
        include: {
          assignments: {
            include: {
              submissions: {
                where: { userId },
                select: { id: true, status: true, marks: true, submittedAt: true, feedback: true },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      })
      const assignments = lessons.flatMap(l =>
        l.assignments.map(a => ({
          ...a,
          lessonTitle: l.title,
          lessonId: l.id,
          submission: a.submissions[0] || null,
        }))
      )
      return apiResponse({ assignments })
    }

    if (action === 'detail' && assignmentId) {
      const submission = await db.assignmentSubmission.findUnique({
        where: { id: assignmentId },
        include: { assignment: true },
      })
      if (!submission) return apiError('Submission not found', 404)
      if (submission.userId !== userId) return apiError('Unauthorized', 403)
      return apiResponse({ submission })
    }

    return apiError('Unknown action', 400)
  } catch (error) {
    return handleApiError(error, 'Assignments GET')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    const auth = await withAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.user.id

    switch (action) {
      case 'submit': {
        const { assignmentId, content, fileUrls } = body
        if (!assignmentId) return apiError('assignmentId required', 400)

        const assignment = await db.lessonAssignment.findUnique({ where: { id: assignmentId } })
        if (!assignment) return apiError('Assignment not found', 404)

        const existing = await db.assignmentSubmission.findUnique({
          where: { assignmentId_userId: { assignmentId, userId } },
        })
        if (existing) return apiError('Already submitted', 400)

        const submission = await db.assignmentSubmission.create({
          data: { assignmentId, userId, content: content || null, fileUrls: fileUrls || null },
        })
        return apiResponse({ submission }, 201)
      }

      case 'update-submission': {
        const { assignmentId, content, fileUrls } = body
        if (!assignmentId) return apiError('assignmentId required', 400)

        const submission = await db.assignmentSubmission.findUnique({
          where: { assignmentId_userId: { assignmentId, userId } },
        })
        if (!submission) return apiError('Submission not found', 404)
        if (submission.status === 'graded') return apiError('Cannot update graded submission', 400)

        const updated = await db.assignmentSubmission.update({
          where: { id: submission.id },
          data: {
            content: content !== undefined ? content : submission.content,
            fileUrls: fileUrls !== undefined ? fileUrls : submission.fileUrls,
          },
        })
        return apiResponse({ submission: updated })
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    return handleApiError(error, 'Assignments POST')
  }
}
