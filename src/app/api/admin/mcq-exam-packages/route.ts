import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { toBengaliNumerals } from '@/lib/utils'
import { NextResponse } from 'next/server'

// Helper: recalculate totalQuestions and totalMarks for an exam set
async function recalculateSetTotals(setId: string) {
  const questions = await db.mCQExamSetQuestion.findMany({
    where: { setId },
  })

  const totalQuestions = questions.length
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  await db.mCQExamSet.update({
    where: { id: setId },
    data: { totalQuestions, totalMarks },
  })

  return { totalQuestions, totalMarks }
}

// Helper: recalculate totalSets for a package
async function recalculatePackageTotalSets(packageId: string) {
  const count = await db.mCQExamSet.count({
    where: { packageId },
  })

  await db.mCQExamPackage.update({
    where: { id: packageId },
    data: { totalSets: count },
  })

  return count
}

// ============================================================
// GET handler
// ============================================================
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      // 1. List packages with pagination
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
          db.mCQExamPackage.findMany({
            where,
            include: {
              class: { select: { id: true, name: true, slug: true } },
              _count: { select: { examSets: true, purchases: true } },
            },
            orderBy: { order: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.mCQExamPackage.count({ where }),
        ])

        return apiResponse({
          packages,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      }

      // 2. Get single package detail
      case 'detail': {
        const id = searchParams.get('id')
        if (!id) return apiError('Package ID is required', 400)

        const pkg = await db.mCQExamPackage.findUnique({
          where: { id },
          include: {
            class: { select: { id: true, name: true, slug: true } },
            examSets: {
              orderBy: { scheduledDate: 'asc' },
              include: {
                _count: { select: { questions: true, results: true } },
              },
            },
            _count: { select: { purchases: true } },
          },
        })

        if (!pkg) return apiError('Package not found', 404)
        return apiResponse({ package: pkg })
      }

      // 3. Get single exam set detail with questions
      case 'set-detail': {
        const setId = searchParams.get('setId')
        if (!setId) return apiError('Set ID is required', 400)

        const examSet = await db.mCQExamSet.findUnique({
          where: { id: setId },
          include: {
            package: { select: { id: true, title: true } },
            questions: {
              orderBy: { order: 'asc' },
              include: {
                mcq: {
                  select: {
                    id: true,
                    question: true,
                    optionA: true,
                    optionB: true,
                    optionC: true,
                    optionD: true,
                    correctAnswer: true,
                    questionImage: true,
                    optionAImage: true,
                    optionBImage: true,
                    optionCImage: true,
                    optionDImage: true,
                    explanation: true,
                    difficulty: true,
                    classLevel: true,
                    subjectId: true,
                    chapterId: true,
                  },
                },
              },
            },
            _count: { select: { results: true } },
          },
        })

        if (!examSet) return apiError('Exam set not found', 404)
        return apiResponse({ set: examSet })
      }

      // 4. Get results for an exam set
      case 'results': {
        const setId = searchParams.get('setId')
        if (!setId) return apiError('Set ID is required', 400)

        const results = await db.mCQExamSetResult.findMany({
          where: { setId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                classLevel: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        })

        return apiResponse({ results })
      }

      // 5. Search MCQs for adding to a set
      case 'search-mcqs': {
        const classLevel = searchParams.get('classLevel') || ''
        const subjectId = searchParams.get('subjectId') || ''
        const chapterId = searchParams.get('chapterId') || ''
        const search = searchParams.get('search') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: any = {
          isActive: true,
        }

        if (classLevel) where.classLevel = classLevel
        if (subjectId) where.subjectId = subjectId
        if (chapterId) where.chapterId = chapterId
        if (search) {
          where.OR = [
            { question: { contains: search } },
            { explanation: { contains: search } },
            { tags: { contains: search } },
          ]
        }

        const [mcqs, total] = await Promise.all([
          db.mCQ.findMany({
            where,
            include: {
              chapter: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.mCQ.count({ where }),
        ])

        // Enrich with subject names
        const uniqueSubjectIds = [...new Set(mcqs.map(m => m.subjectId))]
        const subjects = await db.subject.findMany({
          where: { id: { in: uniqueSubjectIds } },
          select: { id: true, name: true },
        })
        const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s.name]))

        const enrichedMcqs = mcqs.map(m => ({
          ...m,
          subjectName: subjectMap[m.subjectId] || null,
        }))

        return apiResponse({
          mcqs: enrichedMcqs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      }

      // 6. Leaderboard for a specific exam set
      case 'leaderboard': {
        const setId = searchParams.get('setId')
        if (!setId) return apiError('Set ID is required', 400)

        // Validate set exists
        const setExists = await db.mCQExamSet.findUnique({ where: { id: setId } })
        if (!setExists) return apiError('Exam set not found', 404)

        const results = await db.mCQExamSetResult.findMany({
          where: { setId, status: 'completed' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                classLevel: true,
              },
            },
          },
          orderBy: { marksObtained: 'desc' },
        })

        return apiResponse({ leaderboard: results })
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    return handleApiError(error, 'Admin MCQ Exam Package GET')
  }
}

// ============================================================
// POST handler
// ============================================================
export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      // 6. Create a new package
      case 'create-package': {
        const {
          title,
          description,
          classId,
          subjectIds,
          price,
          originalPrice,
          isPremium,
          thumbnail,
          isActive,
          order,
        } = body

        if (!title || !classId) return apiError('Title and classId are required', 400)

        // Validate class exists
        const classExists = await db.classCategory.findUnique({ where: { id: classId } })
        if (!classExists) return apiError('Class not found', 400)

        const pkg = await db.mCQExamPackage.create({
          data: {
            title,
            description: description || null,
            classId,
            subjectIds: subjectIds ? JSON.stringify(subjectIds) : '[]',
            price: price ?? 0,
            originalPrice: originalPrice ?? 0,
            isPremium: isPremium ?? true,
            thumbnail: thumbnail || null,
            isActive: isActive ?? true,
            order: order ?? 0,
          },
          include: {
            class: { select: { id: true, name: true, slug: true } },
            _count: { select: { examSets: true, purchases: true } },
          },
        })

        return apiResponse({ package: pkg }, 201)
      }

      // 9. Create an exam set within a package
      case 'create-set': {
        const {
          packageId,
          title,
          description,
          scheduledDate,
          startTime,
          endTime,
          duration,
          marksPerQ,
          negativeMarks,
          instructions,
          allowRetake,
          order,
        } = body

        if (!packageId || !title || !scheduledDate) return apiError('PackageId, title, and scheduledDate are required', 400)

        // Validate package exists
        const pkgExists = await db.mCQExamPackage.findUnique({ where: { id: packageId } })
        if (!pkgExists) return apiError('Package not found', 404)

        const examSet = await db.mCQExamSet.create({
          data: {
            packageId,
            title,
            description: description || null,
            scheduledDate: new Date(scheduledDate),
            startTime: startTime || '00:00',
            endTime: endTime || '23:59',
            duration: duration ?? 30,
            marksPerQ: marksPerQ ?? 1,
            negativeMarks: negativeMarks ?? 0,
            totalMarks: 0,
            totalQuestions: 0,
            instructions: instructions || null,
            allowRetake: allowRetake ?? false,
            order: order ?? 0,
          },
          include: {
            _count: { select: { questions: true, results: true } },
          },
        })

        // Update package totalSets
        await recalculatePackageTotalSets(packageId)

        return apiResponse({ set: examSet }, 201)
      }

      // 12. Add MCQs to an exam set
      case 'add-questions': {
        const { setId, mcqIds } = body

        if (!setId || !mcqIds || !Array.isArray(mcqIds) || mcqIds.length === 0) return apiError('SetId and mcqIds required', 400)

        const examSet = await db.mCQExamSet.findUnique({ where: { id: setId } })
        if (!examSet) return apiError('Exam set not found', 404)

        const mcqs = await db.mCQ.findMany({
          where: { id: { in: mcqIds } },
          select: { id: true },
        })
        const foundMcqIds = new Set(mcqs.map(m => m.id))
        const notFoundIds = mcqIds.filter((id: string) => !foundMcqIds.has(id))
        if (notFoundIds.length > 0) return apiError(`MCQs not found: ${notFoundIds.join(', ')}`, 400)

        const existingQuestions = await db.mCQExamSetQuestion.findMany({
          where: { setId },
          select: { mcqId: true },
        })
        const existingMcqIds = new Set(existingQuestions.map(q => q.mcqId))
        const newMcqIds = mcqIds.filter((id: string) => !existingMcqIds.has(id))

        if (newMcqIds.length === 0) return apiError('All provided MCQs already exist', 400)

        const maxOrderResult = await db.mCQExamSetQuestion.findFirst({
          where: { setId },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
        const startOrder = (maxOrderResult?.order ?? -1) + 1

        await db.mCQExamSetQuestion.createMany({
          data: newMcqIds.map((mcqId: string, index: number) => ({
            setId,
            mcqId,
            marks: examSet.marksPerQ,
            order: startOrder + index,
          })),
        })

        await recalculateSetTotals(setId)

        const updatedSet = await db.mCQExamSet.findUnique({
          where: { id: setId },
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                mcq: {
                  select: {
                    id: true,
                    question: true,
                    optionA: true,
                    optionB: true,
                    optionC: true,
                    optionD: true,
                    correctAnswer: true,
                  },
                },
              },
            },
          },
        })

        return apiResponse({ set: updatedSet })
      }

      case 'bulk-create-sets': {
        const {
          packageId,
          prefix,
          startDate,
          intervalDays,
          count,
          duration,
          marksPerQ,
          negativeMarks,
          startTime,
          endTime,
        } = body

        if (!packageId || !prefix || !startDate) return apiError('PackageId, prefix, and startDate required', 400)

        const pkgExists = await db.mCQExamPackage.findUnique({ where: { id: packageId } })
        if (!pkgExists) return apiError('Package not found', 404)

        const setCount = count ?? 10
        const interval = intervalDays ?? 7
        const setDuration = duration ?? 30
        const setMarksPerQ = marksPerQ ?? 1
        const setNegativeMarks = negativeMarks ?? 0
        const setStartTime = startTime ?? '00:00'
        const setEndTime = endTime ?? '23:59'

        const maxOrderResult = await db.mCQExamSet.findFirst({
          where: { packageId },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
        const startOrder = (maxOrderResult?.order ?? -1) + 1

        const baseDate = new Date(startDate)
        const createdSets: any[] = []

        for (let i = 0; i < setCount; i++) {
          const scheduledDate = new Date(baseDate)
          scheduledDate.setDate(scheduledDate.getDate() + i * interval)
          const title = `${prefix} ${toBengaliNumerals(i + 1)}`

          const examSet = await db.mCQExamSet.create({
            data: {
              packageId,
              title,
              scheduledDate,
              startTime: setStartTime,
              endTime: setEndTime,
              duration: setDuration,
              marksPerQ: setMarksPerQ,
              negativeMarks: setNegativeMarks,
              totalMarks: 0,
              totalQuestions: 0,
              order: startOrder + i,
            },
          })
          createdSets.push(examSet)
        }

        await recalculatePackageTotalSets(packageId)
        return apiResponse({ sets: createdSets, count: createdSets.length }, 201)
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    return handleApiError(error, 'Admin MCQ Exam Package POST')
  }
}

// ============================================================
// PUT handler
// ============================================================
export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'update-package': {
        const { id, ...updateData } = body
        if (!id) return apiError('Package ID is required', 400)

        const existing = await db.mCQExamPackage.findUnique({ where: { id } })
        if (!existing) return apiError('Package not found', 404)

        const data: Record<string, unknown> = {}
        const allowedFields = [
          'title', 'description', 'classId', 'price', 'originalPrice',
          'isPremium', 'thumbnail', 'totalSets', 'status', 'isActive', 'order',
        ]

        for (const field of allowedFields) {
          if (updateData[field] !== undefined) data[field] = updateData[field]
        }

        if (updateData.subjectIds !== undefined) data.subjectIds = JSON.stringify(updateData.subjectIds)

        const updated = await db.mCQExamPackage.update({
          where: { id },
          data,
          include: {
            class: { select: { id: true, name: true, slug: true } },
            _count: { select: { examSets: true, purchases: true } },
          },
        })
        return apiResponse({ package: updated })
      }

      case 'update-set': {
        const { id, ...updateData } = body
        if (!id) return apiError('Set ID is required', 400)

        const existing = await db.mCQExamSet.findUnique({ where: { id } })
        if (!existing) return apiError('Exam set not found', 404)

        const data: Record<string, unknown> = {}
        const allowedFields = [
          'title', 'description', 'startTime', 'endTime',
          'duration', 'marksPerQ', 'negativeMarks', 'instructions',
          'status', 'order', 'allowRetake',
        ]

        for (const field of allowedFields) {
          if (updateData[field] !== undefined) data[field] = updateData[field]
        }

        if (updateData.scheduledDate !== undefined) data.scheduledDate = new Date(updateData.scheduledDate)

        if (updateData.marksPerQ !== undefined) {
          await db.mCQExamSetQuestion.updateMany({
            where: { setId: id },
            data: { marks: updateData.marksPerQ },
          })
        }

        await db.mCQExamSet.update({ where: { id }, data })
        await recalculateSetTotals(id)

        const refreshedSet = await db.mCQExamSet.findUnique({
          where: { id },
          include: { _count: { select: { questions: true, results: true } } },
        })
        return apiResponse({ set: refreshedSet })
      }

      case 'reorder-questions': {
        const { setId, questionOrders } = body
        if (!setId || !questionOrders || !Array.isArray(questionOrders)) return apiError('SetId and questionOrders array required', 400)

        await db.$transaction(
          questionOrders.map((item: { id: string; order: number }) =>
            db.mCQExamSetQuestion.update({
              where: { id: item.id },
              data: { order: item.order },
            })
          )
        )
        return apiResponse({ message: 'Questions reordered' })
      }

      case 'update-total-sets': {
        const { packageId } = body
        if (!packageId) return apiError('PackageId is required', 400)
        const count = await recalculatePackageTotalSets(packageId)
        return apiResponse({ totalSets: count })
      }

      // Allow retake for a specific user's result (toggle)
      case 'allow-retake': {
        const { resultId } = body
        if (!resultId) return apiError('Result ID is required', 400)

        const result = await db.mCQExamSetResult.findUnique({
          where: { id: resultId },
          select: { canRetake: true, userId: true, setId: true },
        })
        if (!result) return apiError('Result not found', 404)

        const updated = await db.mCQExamSetResult.update({
          where: { id: resultId },
          data: { canRetake: !result.canRetake },
        })

        return apiResponse({ canRetake: updated.canRetake })
      }

      // List retake requests for a set
      case 'list-retake-requests': {
        const { setId } = body
        if (!setId) return apiError('Set ID is required', 400)

        const requests = await db.mCQExamRetakeRequest.findMany({
          where: { setId },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, classLevel: true } },
            set: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        return apiResponse({ requests })
      }

      // Approve or reject retake request
      case 'approve-retake-request': {
        const { requestId, approve } = body
        if (!requestId) return apiError('Request ID is required', 400)

        const existing = await db.mCQExamRetakeRequest.findUnique({
          where: { id: requestId },
        })
        if (!existing) return apiError('Request not found', 404)

        const newStatus = approve ? 'approved' : 'rejected'

        await db.mCQExamRetakeRequest.update({
          where: { id: requestId },
          data: {
            status: newStatus,
            reviewedBy: auth?.user?.id || null,
            reviewedAt: new Date(),
          },
        })

        // If approved, set canRetake on the user's result
        if (approve) {
          const result = await db.mCQExamSetResult.findUnique({
            where: { userId_setId: { userId: existing.userId, setId: existing.setId } },
          })
          if (result) {
            await db.mCQExamSetResult.update({
              where: { id: result.id },
              data: { canRetake: true },
            })
          }

          // Notify the student
          const setInfo = await db.mCQExamSet.findUnique({
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
          const setInfo = await db.mCQExamSet.findUnique({
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

        return apiResponse({ success: true, status: newStatus })
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    return handleApiError(error, 'Admin MCQ Exam Package PUT')
  }
}

// ============================================================
// DELETE handler
// ============================================================
export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'delete-package': {
        const id = searchParams.get('id')
        if (!id) return apiError('Package ID required', 400)
        await db.mCQExamPackage.delete({ where: { id } })
        return apiResponse({ message: 'Package deleted' })
      }

      case 'delete-set': {
        const id = searchParams.get('id')
        if (!id) return apiError('Set ID required', 400)
        const existing = await db.mCQExamSet.findUnique({ where: { id } })
        if (!existing) return apiError('Set not found', 404)

        const packageId = existing.packageId
        await db.mCQExamSet.delete({ where: { id } })
        await recalculatePackageTotalSets(packageId)
        return apiResponse({ message: 'Set deleted' })
      }

      case 'remove-question': {
        const setId = searchParams.get('setId')
        const mcqId = searchParams.get('mcqId')
        if (!setId || !mcqId) return apiError('SetId and mcqId required', 400)

        const question = await db.mCQExamSetQuestion.findUnique({
          where: { setId_mcqId: { setId, mcqId } },
        })
        if (!question) return apiError('Question not found in set', 404)

        await db.mCQExamSetQuestion.delete({ where: { id: question.id } })
        await recalculateSetTotals(setId)
        return apiResponse({ message: 'Question removed' })
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    return handleApiError(error, 'Admin MCQ Exam Package DELETE')
  }
}
