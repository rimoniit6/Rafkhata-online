import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { createAuditLog, AuditActions, EntityTypes, getClientIP } from '@/lib/audit'

async function recalculateSetTotals(setId: string) {
  const result = await db.cQExamSetQuestion.aggregate({
    where: { setId },
    _count: { id: true },
    _sum: { marks: true },
  })
  const totalQuestions = result._count.id
  const totalMarks = result._sum.marks || 0
  await db.cQExamSet.update({
    where: { id: setId },
    data: { totalQuestions, totalMarks },
  })
  return { totalQuestions, totalMarks }
}

async function recalculatePackageTotalSets(packageId: string) {
  const count = await db.cQExamSet.count({
    where: { packageId },
  })
  await db.cQExamPackage.update({
    where: { id: packageId },
    data: { totalSets: count },
  })
  return count
}

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      // List packages
      case 'list': {
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''
        const classId = searchParams.get('classId') || ''
        const status = searchParams.get('status') || ''

        const where: Record<string, unknown> = {}
        if (search) {
          where.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
          ]
        }
        if (classId) where.classId = classId
        if (status) where.status = status

        const [packages, total] = await Promise.all([
          db.cQExamPackage.findMany({
            where,
            include: {
              class: { select: { id: true, name: true, slug: true } },
              _count: { select: { examSets: true, purchases: true } },
            },
            orderBy: { order: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.cQExamPackage.count({ where }),
        ])

        return apiResponse({
          packages,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      }

      // Package detail
      case 'detail': {
        const id = searchParams.get('id')
        if (!id) return apiError('Package ID is required', 400)

        const pkg = await db.cQExamPackage.findUnique({
          where: { id },
          include: {
            class: { select: { id: true, name: true, slug: true } },
            _count: { select: { examSets: true, purchases: true } },
          },
        })
        if (!pkg) return apiError('Package not found', 404)

        const examSets = await db.cQExamSet.findMany({
          where: { packageId: id },
          include: {
            _count: { select: { questions: true, submissions: true } },
          },
          orderBy: { order: 'asc' },
        })

        return apiResponse({ package: pkg, examSets })
      }

      // Set detail
      case 'set-detail': {
        const setId = searchParams.get('setId')
        if (!setId) return apiError('Set ID is required', 400)

        const set = await db.cQExamSet.findUnique({
          where: { id: setId },
          include: {
            _count: { select: { questions: true, submissions: true } },
            questions: {
              orderBy: { order: 'asc' },
              include: {
                cq: {
                  include: { chapter: { select: { id: true, name: true } } },
                },
              },
            },
          },
        })
        if (!set) return apiError('Set not found', 404)

        return apiResponse({ set })
      }

      // Search CQ questions
      case 'search-cqs': {
        const classLevel = searchParams.get('classLevel') || ''
        const subjectId = searchParams.get('subjectId') || ''
        const chapterId = searchParams.get('chapterId') || ''
        const q = searchParams.get('q') || ''
        const cqPage = parseInt(searchParams.get('page') || '1')
        const cqLimit = parseInt(searchParams.get('limit') || '20')

        const where: Record<string, unknown> = { isActive: true }
        if (classLevel) where.classLevel = classLevel
        if (subjectId) where.subjectId = subjectId
        if (chapterId) where.chapterId = chapterId
        if (q) where.uddeepok = { contains: q }

        const [cqs, total] = await Promise.all([
          db.cQ.findMany({
            where,
            include: {
              chapter: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (cqPage - 1) * cqLimit,
            take: cqLimit,
          }),
          db.cQ.count({ where }),
        ])

        return apiResponse({
          cqs,
          pagination: { page: cqPage, limit: cqLimit, total, totalPages: Math.ceil(total / cqLimit) },
        })
      }

      // List submissions for a set (with pagination)
      case 'submissions': {
        const subSetId = searchParams.get('setId')
        if (!subSetId) return apiError('Set ID is required', 400)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
        const status = searchParams.get('status') || ''

        const where: Record<string, unknown> = { setId: subSetId }
        if (status) where.status = status

        const [subs, total] = await Promise.all([
          db.cQExamSubmission.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true, classLevel: true } },
              answers: {
                include: { images: { orderBy: { order: 'asc' } } },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.cQExamSubmission.count({ where }),
        ])

        return apiResponse({
          submissions: subs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      }

      // Bulk grading by question — all submissions with answer for a specific question (with pagination)
      case 'bulk-grade-by-question': {
        const bgSetId = searchParams.get('setId')
        const questionId = searchParams.get('questionId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        if (!bgSetId || !questionId) return apiError('Set ID and Question ID are required', 400)

        const where = { setId: bgSetId, status: { in: ['submitted', 'graded', 'published'] } }

        const [bulkSubs, total] = await Promise.all([
          db.cQExamSubmission.findMany({
            where,
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true, classLevel: true } },
              answers: {
                where: { questionId },
                include: { images: { orderBy: { order: 'asc' } } },
                orderBy: { subIndex: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.cQExamSubmission.count({ where }),
        ])

        return apiResponse({
          submissions: bulkSubs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      }

      // Get single submission for grading
      case 'submission-detail': {
        const subId = searchParams.get('submissionId')
        if (!subId) return apiError('Submission ID is required', 400)

        const submission = await db.cQExamSubmission.findUnique({
          where: { id: subId },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, classLevel: true } },
            set: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: {
                    cq: {
                      include: { chapter: { select: { id: true, name: true } } },
                    },
                  },
                },
              },
            },
            answers: {
              include: { images: { orderBy: { order: 'asc' } } },
              orderBy: { createdAt: 'asc' },
            },
          },
        })
        if (!submission) return apiError('Submission not found', 404)

        return apiResponse({ submission })
      }

      default:
        return apiError('Unknown action', 400)
    }
  } catch (error) {
    return handleApiError(error, 'Admin CQ Exam error')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      // Create package
      case 'create-package': {
        const { title, description, classId, subjectIds, price, originalPrice, thumbnail, isPremium, isActive, order, status } = body
        if (!title || !classId) return apiError('Title and class are required', 400)

        const pkg = await db.cQExamPackage.create({
          data: {
            title, description, classId,
            subjectIds: subjectIds ? JSON.stringify(subjectIds) : '[]',
            price: price || 0, originalPrice: originalPrice || 0,
            thumbnail: thumbnail || null,
            isPremium: isPremium ?? true,
            isActive: isActive ?? true,
            order: order ?? 0, status: status || 'draft',
          },
        })
        return apiResponse({ package: pkg }, 201)
      }

      // Create set
      case 'create-set': {
        const { packageId, title, description, scheduledDate, startTime, endTime, duration, marksPerQ, instructions, allowRetake, order, status, answerMode, showAnnotatedImages, autoPublishResults, maxImagesPerAnswer, gradingDeadline, passMarks, showCorrectAnswers, enablePartialGrading } = body
        if (!packageId || !title || !scheduledDate) return apiError('Package, title, and date are required', 400)

        const set = await db.cQExamSet.create({
          data: {
            packageId, title, description: description || null,
            scheduledDate: new Date(scheduledDate),
            startTime: startTime || '00:00', endTime: endTime || '23:59',
            duration: duration || 30, marksPerQ: marksPerQ || 1,
            instructions: instructions || null,
            allowRetake: allowRetake ?? false,
            answerMode: answerMode || 'flexible',
            showAnnotatedImages: showAnnotatedImages ?? true,
            autoPublishResults: autoPublishResults ?? false,
            maxImagesPerAnswer: maxImagesPerAnswer ?? 5,
            gradingDeadline: gradingDeadline ? new Date(gradingDeadline) : null,
            passMarks: passMarks ?? 0,
            showCorrectAnswers: showCorrectAnswers ?? false,
            enablePartialGrading: enablePartialGrading ?? true,
            order: order ?? 0, status: status || 'draft',
          },
        })
        await recalculatePackageTotalSets(packageId)
        return apiResponse({ set }, 201)
      }

      // Add questions to set (batched)
      case 'add-questions': {
        const { setId, cqIds } = body
        if (!setId || !cqIds?.length) return apiError('Set ID and CQ IDs are required', 400)

        // Get existing question count for ordering
        const existingCount = await db.cQExamSetQuestion.count({ where: { setId } })

        // Batch check existing questions
        const existingQuestions = await db.cQExamSetQuestion.findMany({
          where: { setId, cqId: { in: cqIds } },
          select: { cqId: true },
        })
        const existingCqIds = new Set(existingQuestions.map(q => q.cqId))

        // Filter to only new CQ IDs
        const newCqIds = (cqIds as string[]).filter((id: string) => !existingCqIds.has(id))
        const defaultSubMarks = [1, 2, 3, 4]
        const totalMarks = defaultSubMarks.reduce((a, b) => a + b, 0)

        if (newCqIds.length > 0) {
          // Batch create new questions
          const data = newCqIds.map((cqId, i) => ({
            setId,
            cqId,
            marks: totalMarks,
            subMarks: JSON.stringify(defaultSubMarks),
            order: existingCount + cqIds.indexOf(cqId),
          }))
          await db.cQExamSetQuestion.createMany({ data })
        }

        // Return created questions
        const created = await db.cQExamSetQuestion.findMany({
          where: { setId, cqId: { in: newCqIds } },
          orderBy: { order: 'asc' },
        })
        await recalculateSetTotals(setId)
        return apiResponse({ created })
      }

      // Create typed question (inline typing, no CQ reference)
      case 'create-typed-question': {
        const { setId, typedUddeepok, typedUddeepokImage, typedQuestion1, typedQuestion1Image, typedQuestion2, typedQuestion2Image, typedQuestion3, typedQuestion3Image, typedQuestion4, typedQuestion4Image, subMarks } = body
        if (!setId || !typedQuestion1) return apiError('Set ID and question 1 are required', 400)

        const existingCount = await db.cQExamSetQuestion.count({ where: { setId } })

        const marksArr: number[] = Array.isArray(subMarks) && subMarks.length === 4
          ? subMarks
          : [1, 2, 3, 4]
        const totalMarks = marksArr.reduce((a, b) => a + b, 0)

        const question = await db.cQExamSetQuestion.create({
          data: {
            setId,
            marks: totalMarks,
            order: existingCount,
            type: 'typed',
            subMarks: JSON.stringify(marksArr),
            typedUddeepok: typedUddeepok || null,
            typedUddeepokImage: typedUddeepokImage || null,
            typedQuestion1,
            typedQuestion1Image: typedQuestion1Image || null,
            typedQuestion2: typedQuestion2 || null,
            typedQuestion2Image: typedQuestion2Image || null,
            typedQuestion3: typedQuestion3 || null,
            typedQuestion3Image: typedQuestion3Image || null,
            typedQuestion4: typedQuestion4 || null,
            typedQuestion4Image: typedQuestion4Image || null,
          },
        })
        await recalculateSetTotals(setId)
        return apiResponse({ question }, 201)
      }

      // Create non-CQ question (mcq-single, mcq-multiple, fill-blanks, written)
      case 'create-non-cq-question': {
        const { setId, questionType, stem, stemImage, config, marks } = body
        if (!setId || !questionType) return apiError('Set ID and question type required', 400)
        if (!['mcq-single', 'mcq-multiple', 'fill-blanks', 'written'].includes(questionType)) {
          return apiError('Invalid question type', 400)
        }

        const existingCount = await db.cQExamSetQuestion.count({ where: { setId } })

        const question = await db.cQExamSetQuestion.create({
          data: {
            setId,
            type: questionType,
            marks: marks || 1,
            order: existingCount,
            stem: stem || null,
            stemImage: stemImage || null,
            config: config || '{}',
          },
        })
        await recalculateSetTotals(setId)
        return apiResponse({ question }, 201)
      }

      default:
        return apiError('Unknown action', 400)
    }
  } catch (error) {
    return handleApiError(error, 'Admin CQ Exam POST error')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      // Update package
      case 'update-package': {
        const { id, ...data } = body
        if (!id) return apiError('Package ID is required', 400)

        const allowed = ['title', 'description', 'classId', 'subjectIds', 'price', 'originalPrice', 'thumbnail', 'isPremium', 'isActive', 'order', 'status']
        const updateData: Record<string, unknown> = {}
        for (const key of allowed) {
          if (data[key] !== undefined) updateData[key] = data[key]
        }
        if (updateData.subjectIds && typeof updateData.subjectIds !== 'string') {
          updateData.subjectIds = JSON.stringify(updateData.subjectIds)
        }

        const pkg = await db.cQExamPackage.update({ where: { id }, data: updateData })
        return apiResponse({ package: pkg })
      }

      // Update set
      case 'update-set': {
        const setId = body.id
        if (!setId) return apiError('Set ID is required', 400)

        const allowed = ['title', 'description', 'scheduledDate', 'startTime', 'endTime', 'duration', 'marksPerQ', 'instructions', 'allowRetake', 'order', 'status', 'answerMode', 'showAnnotatedImages', 'autoPublishResults', 'maxImagesPerAnswer', 'gradingDeadline', 'passMarks', 'showCorrectAnswers', 'enablePartialGrading']
        const updateData: Record<string, unknown> = {}
        for (const key of allowed) {
          if (body[key] !== undefined) updateData[key] = body[key]
        }
        if (updateData.scheduledDate) updateData.scheduledDate = new Date(updateData.scheduledDate as string)
        if (updateData.gradingDeadline) updateData.gradingDeadline = new Date(updateData.gradingDeadline as string)
        if (updateData.gradingDeadline === null) updateData.gradingDeadline = null

        const set = await db.cQExamSet.update({ where: { id: setId }, data: updateData })
        return apiResponse({ set })
      }

      // Remove question from set
      case 'remove-question': {
        const { setId, cqId, questionId } = body
        if (!setId || (!cqId && !questionId)) return apiError('Set ID and question/CQ ID are required', 400)
        if (questionId) {
          await db.cQExamSetQuestion.delete({ where: { id: questionId } })
        } else {
          await db.cQExamSetQuestion.delete({ where: { setId_cqId: { setId, cqId } } })
        }
        await recalculateSetTotals(setId)
        return apiResponse({ success: true })
      }

      // Reorder questions
      case 'reorder-questions': {
        const { setId, questionOrders } = body
        if (!setId || !questionOrders) return apiError('Set ID and orders are required', 400)
        for (const qo of questionOrders) {
          await db.cQExamSetQuestion.update({
            where: { id: qo.id },
            data: { order: qo.order },
          })
        }
        return apiResponse({ success: true })
      }

      // Grade submission
      case 'grade-submission': {
        const { submissionId, answers } = body
        if (!submissionId || !answers?.length) return apiError('Submission ID and answers required', 400)

        // Fetch submission to get setId
        const submission = await db.cQExamSubmission.findUnique({
          where: { id: submissionId },
          select: { setId: true, userId: true },
        })
        if (!submission) return apiError('Submission not found', 404)

        let totalObtained = 0
        for (const ans of answers) {
          if (ans.id) {
            const updateData: Record<string, unknown> = {
              obtainedMarks: ans.obtainedMarks ?? 0,
              feedback: ans.feedback || null,
              gradedAt: new Date(),
            }
            await db.cQExamAnswer.update({ where: { id: ans.id }, data: updateData })
            totalObtained += ans.obtainedMarks ?? 0
          }
        }

        // Check if autoPublishResults is enabled for the set
        const examSet = await db.cQExamSet.findUnique({
          where: { id: submission.setId },
          select: { autoPublishResults: true, id: true },
        })

        let newStatus: string = 'graded'
        if (examSet?.autoPublishResults) {
          // Check if ALL submissions for this set are now graded
          const pendingCount = await db.cQExamSubmission.count({
            where: { setId: submission.setId, status: 'submitted' },
          })
          if (pendingCount === 0) {
            // All submissions are graded — auto-publish all graded submissions for this set
            await db.cQExamSubmission.updateMany({
              where: { setId: submission.setId, status: 'graded' },
              data: { status: 'published' },
            })
            newStatus = 'published'
          }
        }

        const updatedSubmission = await db.cQExamSubmission.update({
          where: { id: submissionId },
          data: {
            obtainedMarks: totalObtained,
            status: newStatus,
            gradedAt: new Date(),
            gradedBy: auth?.user?.id || null,
          },
        })

        // Audit log
        await createAuditLog({
          adminId: auth.user.id,
          action: AuditActions.GRADE_UPDATE,
          entityType: EntityTypes.SUBMISSION,
          entityId: submissionId,
          oldData: { obtainedMarks: 0, status: 'submitted' },
          newData: { obtainedMarks: totalObtained, status: newStatus },
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        })

        return apiResponse({ submission: updatedSubmission })
      }

      // Bulk grade all pending submissions for a set (batched)
      case 'bulk-grade': {
        const { setId, defaultMarks } = body
        if (!setId) return apiError('Set ID is required', 400)

        const marks = typeof defaultMarks === 'number' && !isNaN(defaultMarks)
          ? Math.max(0, defaultMarks)
          : 0

        // Find all pending (submitted) submissions for this set with their answers
        const pendingSubmissions = await db.cQExamSubmission.findMany({
          where: { setId, status: 'submitted' },
          include: { answers: true },
        })

        if (pendingSubmissions.length === 0) {
          return apiResponse({ gradedCount: 0, defaultMarks: marks })
        }

        // Collect all answer IDs and compute obtained marks per submission
        const answerUpdates: Array<{ id: string; obtainedMarks: number }> = []
        const submissionUpdates: Array<{ id: string; obtainedMarks: number }> = []

        for (const sub of pendingSubmissions) {
          let totalObtained = 0
          for (const ans of sub.answers) {
            const answerMarks = Math.min(marks, ans.maxMarks || 0)
            answerUpdates.push({ id: ans.id, obtainedMarks: answerMarks })
            totalObtained += answerMarks
          }
          submissionUpdates.push({ id: sub.id, obtainedMarks: totalObtained })
        }

        // Batch update all answers
        await Promise.all(
          answerUpdates.map(({ id, obtainedMarks }) =>
            db.cQExamAnswer.update({
              where: { id },
              data: { obtainedMarks, gradedAt: new Date() },
            })
          )
        )

        // Batch update all submissions
        await Promise.all(
          submissionUpdates.map(({ id, obtainedMarks }) =>
            db.cQExamSubmission.update({
              where: { id },
              data: {
                obtainedMarks,
                status: 'graded',
                gradedAt: new Date(),
                gradedBy: auth?.user?.id || null,
              },
            })
          )
        )

        // Check if autoPublishResults is enabled for the set
        const bulkExamSet = await db.cQExamSet.findUnique({
          where: { id: setId },
          select: { autoPublishResults: true },
        })
        if (bulkExamSet?.autoPublishResults) {
          // Check if ALL submissions for this set are now graded (no more 'submitted' left)
          const remainingPending = await db.cQExamSubmission.count({
            where: { setId, status: 'submitted' },
          })
          if (remainingPending === 0) {
            // All submissions are graded — auto-publish all graded submissions for this set
            await db.cQExamSubmission.updateMany({
              where: { setId, status: 'graded' },
              data: { status: 'published' },
            })
          }
        }

        return apiResponse({ gradedCount: pendingSubmissions.length, defaultMarks: marks })
      }

      // Save bulk grades by question — saves marks for all submissions' answers for one question (batched, transactional)
      case 'save-bulk-grades-by-question': {
        const { submissions: gradeUpdates } = body
        if (!gradeUpdates?.length) return apiError('Submissions data required', 400)

        // Collect all answer updates and submission totals
        const answerUpdates: Array<{ id: string; obtainedMarks: number }> = []
        const submissionTotals = new Map<string, number>()

        for (const item of gradeUpdates) {
          const { submissionId, answers } = item
          if (!submissionId || !answers?.length) continue

          let totalForSubmission = 0
          for (const ans of answers) {
            if (ans.id) {
              const obtainedMarks = ans.obtainedMarks ?? 0
              answerUpdates.push({ id: ans.id, obtainedMarks })
              totalForSubmission += obtainedMarks
            }
          }
          // Add to existing total from other questions (will be merged with current answers)
          const existingTotal = submissionTotals.get(submissionId) || 0
          submissionTotals.set(submissionId, existingTotal + totalForSubmission)
        }

        // Execute all updates in a single transaction for atomicity
        await db.$transaction(async (tx) => {
          // Batch update all answers
          if (answerUpdates.length > 0) {
            await Promise.all(
              answerUpdates.map(({ id, obtainedMarks }) =>
                tx.cQExamAnswer.update({
                  where: { id },
                  data: { obtainedMarks, gradedAt: new Date() },
                })
              )
            )
          }

          // Batch update all submissions
          await Promise.all(
            Array.from(submissionTotals.entries()).map(([submissionId, obtainedMarks]) =>
              tx.cQExamSubmission.update({
                where: { id: submissionId },
                data: {
                  obtainedMarks,
                  status: 'graded',
                  gradedAt: new Date(),
                  gradedBy: auth?.user?.id || null,
                },
              })
            )
          )
        })

        const updatedCount = submissionTotals.size

        // Check auto-publish for the set of the first submission (all items are for the same set)
        let firstSubSetId: string | null = null
        if (gradeUpdates.length > 0 && gradeUpdates[0].submissionId) {
          const firstSub = await db.cQExamSubmission.findUnique({
            where: { id: gradeUpdates[0].submissionId },
            select: { setId: true },
          })
          if (firstSub) {
            firstSubSetId = firstSub.setId
            const bulkQExamSet = await db.cQExamSet.findUnique({
              where: { id: firstSub.setId },
              select: { autoPublishResults: true },
            })
            if (bulkQExamSet?.autoPublishResults) {
              const remainingPending = await db.cQExamSubmission.count({
                where: { setId: firstSub.setId, status: 'submitted' },
              })
              if (remainingPending === 0) {
                await db.cQExamSubmission.updateMany({
                  where: { setId: firstSub.setId, status: 'graded' },
                  data: { status: 'published' },
                })
              }
            }
          }
        }

        // Audit log for bulk grading
        await createAuditLog({
          adminId: auth.user.id,
          action: AuditActions.GRADE_BULK,
          entityType: EntityTypes.SUBMISSION,
          entityId: firstSubSetId || 'bulk',
          oldData: { count: gradeUpdates.length },
          newData: { updatedCount },
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        })

        return apiResponse({ updatedCount })
      }

      // Publish results
      case 'publish-results': {
        const { setId } = body
        if (!setId) return apiError('Set ID is required', 400)

        // Get set title for notification message
        const cqSet = await db.cQExamSet.findUnique({
          where: { id: setId },
          select: { title: true },
        })

        // Update all graded submissions to published
        await db.cQExamSubmission.updateMany({
          where: { setId, status: 'graded' },
          data: { status: 'published' },
        })

        // Find all affected users to notify them
        const publishedSubmissions = await db.cQExamSubmission.findMany({
          where: { setId, status: 'published' },
          select: { userId: true },
        })

        // Create notifications for each student
        const userIds = [...new Set(publishedSubmissions.map(s => s.userId))]
        if (userIds.length > 0) {
          await db.notification.createMany({
            data: userIds.map(uid => ({
              userId: uid,
              title: 'ফলাফল প্রকাশিত',
              message: `"${cqSet?.title || ''}" পরীক্ষার ফলাফল প্রকাশিত হয়েছে। এখন আপনার প্রাপ্ত নম্বর ও উত্তর দেখতে পারেন।`,
              type: 'success',
              link: null,
            })),
          })
        }

        // Audit log
        await createAuditLog({
          adminId: auth.user.id,
          action: 'publish_results',
          entityType: EntityTypes.SUBMISSION,
          entityId: setId,
          oldData: { status: 'graded' },
          newData: { status: 'published', notifiedCount: userIds.length },
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        })

        return apiResponse({ success: true, notifiedCount: userIds.length })
      }

      // Grant individual retake permission
      case 'allow-retake': {
        const { submissionId } = body
        if (!submissionId) return apiError('Submission ID is required', 400)

        const submission = await db.cQExamSubmission.findUnique({
          where: { id: submissionId },
          select: { canRetake: true },
        })
        if (!submission) return apiError('Submission not found', 404)

        const oldCanRetake = submission.canRetake
        const newCanRetake = !submission.canRetake
        await db.cQExamSubmission.update({
          where: { id: submissionId },
          data: { canRetake: newCanRetake },
        })

        // Audit log
        await createAuditLog({
          adminId: auth.user.id,
          action: newCanRetake ? AuditActions.RETAKE_APPROVE : AuditActions.RETAKE_REJECT,
          entityType: EntityTypes.SUBMISSION,
          entityId: submissionId,
          oldData: { canRetake: oldCanRetake },
          newData: { canRetake: newCanRetake },
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        })

        return apiResponse({ canRetake: newCanRetake })
      }

      // List retake requests for a set
      case 'list-retake-requests': {
        const { setId } = body
        if (!setId) return apiError('Set ID is required', 400)

        const requests = await db.cQExamRetakeRequest.findMany({
          where: { setId },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, classLevel: true } },
            set: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        return apiResponse({ requests })
      }

      // Approve or reject a retake request
      case 'approve-retake-request': {
        const { requestId, approve } = body
        // approve = true → approved, approve = false → rejected
        if (!requestId) return apiError('Request ID is required', 400)

        const existing = await db.cQExamRetakeRequest.findUnique({
          where: { id: requestId },
        })
        if (!existing) return apiError('Request not found', 404)

        const newStatus = approve ? 'approved' : 'rejected'

        await db.cQExamRetakeRequest.update({
          where: { id: requestId },
          data: {
            status: newStatus,
            reviewedBy: auth?.user?.id || null,
            reviewedAt: new Date(),
          },
        })

        // If approved, set canRetake on the user's submission and notify
        if (approve) {
          const submission = await db.cQExamSubmission.findUnique({
            where: { userId_setId: { userId: existing.userId, setId: existing.setId } },
          })
          if (submission) {
            await db.cQExamSubmission.update({
              where: { id: submission.id },
              data: { canRetake: true },
            })
          }

          // Notify the student
          const setInfo = await db.cQExamSet.findUnique({
            where: { id: existing.setId },
            select: { title: true },
          })
          await db.notification.create({
            data: {
              userId: existing.userId,
              title: 'পুনরায় পরীক্ষার অনুমতি',
              message: `"${setInfo?.title || ''}" পরীক্ষাটি পুনরায় দেওয়ার অনুমতি দেওয়া হয়েছে। আপনি এখন আবার পরীক্ষা দিতে পারবেন।`,
              type: 'success',
              link: null,
            },
          })
        } else {
          // Notify the student about rejection
          const setInfo = await db.cQExamSet.findUnique({
            where: { id: existing.setId },
            select: { title: true },
          })
          await db.notification.create({
            data: {
              userId: existing.userId,
              title: 'পুনরায় পরীক্ষার অনুরোধ প্রত্যাখ্যান',
              message: `"${setInfo?.title || ''}" পরীক্ষাটি পুনরায় দেওয়ার অনুরোধ প্রত্যাখ্যান করা হয়েছে।`,
              type: 'error',
              link: null,
            },
          })
        }

        // Audit log
        await createAuditLog({
          adminId: auth.user.id,
          action: approve ? AuditActions.RETAKE_APPROVE : AuditActions.RETAKE_REJECT,
          entityType: 'retake_request',
          entityId: requestId,
          oldData: { status: existing.status },
          newData: { status: newStatus },
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
        })

        return apiResponse({ success: true, status: newStatus })
      }

      // Update non-CQ question (mcq-single, mcq-multiple, fill-blanks, written)
      case 'update-non-cq-question': {
        const { questionId, stem, stemImage, config, marks } = body
        if (!questionId) return apiError('Question ID required', 400)

        const updateData: Record<string, unknown> = {}
        if (stem !== undefined) updateData.stem = stem || null
        if (stemImage !== undefined) updateData.stemImage = stemImage || null
        if (config !== undefined) updateData.config = config || '{}'
        if (marks !== undefined) updateData.marks = parseFloat(marks) || 0

        const question = await db.cQExamSetQuestion.update({
          where: { id: questionId },
          data: updateData,
        })

        const setQ = await db.cQExamSetQuestion.findFirst({ where: { id: questionId } })
        if (setQ) await recalculateSetTotals(setQ.setId)

        return apiResponse({ question })
      }

      // Update a typed question's content
      case 'update-typed-question': {
        const { questionId, typedUddeepok, typedUddeepokImage, typedQuestion1, typedQuestion1Image, typedQuestion2, typedQuestion2Image, typedQuestion3, typedQuestion3Image, typedQuestion4, typedQuestion4Image, subMarks } = body
        if (!questionId || !typedQuestion1) return apiError('Question ID and question 1 are required', 400)

        const marksArr: number[] = Array.isArray(subMarks) && subMarks.length === 4
          ? subMarks
          : [1, 2, 3, 4]
        const totalMarks = marksArr.reduce((a, b) => a + b, 0)

        const question = await db.cQExamSetQuestion.update({
          where: { id: questionId },
          data: {
            marks: totalMarks,
            subMarks: JSON.stringify(marksArr),
            typedUddeepok: typedUddeepok || null,
            typedUddeepokImage: typedUddeepokImage || null,
            typedQuestion1,
            typedQuestion1Image: typedQuestion1Image || null,
            typedQuestion2: typedQuestion2 || null,
            typedQuestion2Image: typedQuestion2Image || null,
            typedQuestion3: typedQuestion3 || null,
            typedQuestion3Image: typedQuestion3Image || null,
            typedQuestion4: typedQuestion4 || null,
            typedQuestion4Image: typedQuestion4Image || null,
          },
        })

        // Recalculate set totals
        const setQ = await db.cQExamSetQuestion.findFirst({ where: { id: questionId } })
        if (setQ) await recalculateSetTotals(setQ.setId)

        return apiResponse({ question })
      }

      // Update marks for a question (works for both typed and CQ-bank questions)
      case 'update-question-marks': {
        const { questionId, marks } = body
        if (!questionId || marks === undefined) return apiError('Question ID and marks are required', 400)

        const question = await db.cQExamSetQuestion.update({
          where: { id: questionId },
          data: { marks: parseFloat(marks) || 0 },
        })

        const setQ = await db.cQExamSetQuestion.findFirst({ where: { id: questionId } })
        if (setQ) await recalculateSetTotals(setQ.setId)

        return apiResponse({ question })
      }

      // Reopen grading — revert a graded submission back to submitted for re-editing
      case 'reopen-grading': {
        const { submissionId } = body
        if (!submissionId) return apiError('Submission ID is required', 400)

        await db.cQExamSubmission.update({
          where: { id: submissionId },
          data: { status: 'submitted', gradedAt: null, gradedBy: null },
        })

        // Also clear obtainedMarks and feedback on answers so they can be re-graded
        const answers = await db.cQExamAnswer.findMany({
          where: { submissionId },
          select: { id: true },
        })
        if (answers.length > 0) {
          await Promise.all(
            answers.map(ans =>
              db.cQExamAnswer.update({
                where: { id: ans.id },
                data: { obtainedMarks: 0, feedback: null, gradedAt: null },
              })
            )
          )
        }

        return apiResponse({ success: true })
      }

      // Save annotation on image
      case 'save-annotation': {
        const { imageId, annotations } = body
        if (!imageId) return apiError('Image ID is required', 400)
        await db.cQExamAnswerImage.update({
          where: { id: imageId },
          data: { annotations: annotations || null },
        })
        return apiResponse({ success: true })
      }

      default:
        return apiError('Unknown action', 400)
    }
  } catch (error) {
    return handleApiError(error, 'Admin CQ Exam PUT error')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'delete-package': {
        const id = searchParams.get('id')
        if (!id) return apiError('Package ID is required', 400)
        await db.cQExamPackage.delete({ where: { id } })
        return apiResponse({ success: true })
      }

      case 'delete-set': {
        const id = searchParams.get('id')
        const packageId = searchParams.get('packageId')
        if (!id) return apiError('Set ID is required', 400)
        await db.cQExamSet.delete({ where: { id } })
        if (packageId) await recalculatePackageTotalSets(packageId)
        return apiResponse({ success: true })
      }

      default: {
        // Try body-based delete (legacy)
        let id: string | null = null
        try {
          const body = await request.json()
          id = body.id
        } catch { /* no body */ }
        if (!id) return apiError('ID is required', 400)
        await db.cQExamPackage.delete({ where: { id } })
        return apiResponse({ success: true })
      }
    }
  } catch (error) {
    return handleApiError(error, 'Admin CQ Exam DELETE error')
  }
}
