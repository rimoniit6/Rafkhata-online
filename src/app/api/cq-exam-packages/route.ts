import { db } from '@/lib/db'
import { apiError, withCsrf } from '@/lib/api-utils'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    
    // Get authenticated user (optional for public endpoints)
    const auth = await verifyAuth(request)
    const userId = auth?.user?.id

    // List available packages (public) - with pagination
    if (action === 'list') {
      const classSlug = searchParams.get('classSlug') || ''
      const search = searchParams.get('search') || ''
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

      const where: Record<string, unknown> = { status: 'published', isActive: true }
      if (classSlug) {
        where.class = { slug: classSlug }
      }
      if (search) {
        where.title = { contains: search }
      }

      const [packages, total] = await Promise.all([
        db.cQExamPackage.findMany({
          where,
          include: {
            class: { select: { id: true, name: true, slug: true } },
            _count: { select: { examSets: true } },
          },
          orderBy: { order: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.cQExamPackage.count({ where }),
      ])

      return NextResponse.json({ success: true, data: { packages }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }

    // Package detail with sets
    if (action === 'detail') {
      const id = searchParams.get('id')
      if (!id) return apiError('Package ID required', 400)

      const pkg = await db.cQExamPackage.findUnique({
        where: { id },
        include: {
          class: { select: { id: true, name: true, slug: true } },
          examSets: {
            where: { status: 'published' },
            include: { _count: { select: { questions: true, submissions: true } } },
            orderBy: { order: 'asc' },
          },
          _count: { select: { purchases: true } },
        },
      })
      if (!pkg) return apiError('Package not found', 404)

      // Check if user has purchased - use authenticated user only
      let hasPurchased = false
      let hasPendingPayment = false
      if (userId) {
        const purchase = await db.cQExamPackagePurchase.findUnique({
          where: { userId_packageId: { userId, packageId: id } },
        })
        hasPurchased = !!purchase?.isActive

        // Check for pending payment if not purchased
        if (!hasPurchased) {
          const pendingPay = await db.payment.findFirst({
            where: {
              userId,
              contentType: 'cq-exam-package',
              contentId: id,
              status: 'pending',
            },
            select: { id: true },
          })
          hasPendingPayment = !!pendingPay
        }
      }

      // Get user's submissions for this package
      let submissions: unknown[] = []
      if (userId && hasPurchased) {
        submissions = await db.cQExamSubmission.findMany({
          where: {
            userId,
            set: { packageId: id },
          },
          select: {
            id: true,
            setId: true,
            totalMarks: true,
            obtainedMarks: true,
            timeTaken: true,
            status: true,
            canRetake: true,
            set: { select: { id: true, title: true, totalQuestions: true, totalMarks: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
      }

      return NextResponse.json({ success: true, data: { package: pkg, hasPurchased, hasPendingPayment, submissions } })
    }

    // Check purchase status for a user - requires auth
    if (action === 'check-purchase') {
      const packageId = searchParams.get('packageId')
      if (!packageId) {
        return apiError('Package ID required', 400)
      }

      if (!userId) {
        return apiError('ক্রয় অবস্থা দেখতে লগইন করুন', 401, 'UNAUTHORIZED')
      }

      const purchaseRecord = await db.cQExamPackagePurchase.findUnique({
        where: {
          userId_packageId: {
            userId,
            packageId,
          },
        },
      })

      const purchased = !!(purchaseRecord && purchaseRecord.isActive)

      // Check for pending payment
      let pendingPayment = false
      if (!purchased) {
        const pendingPay = await db.payment.findFirst({
          where: {
            userId,
            contentType: 'cq-exam-package',
            contentId: packageId,
            status: 'pending',
          },
          select: { id: true },
        })
        pendingPayment = !!pendingPay
      }

      return NextResponse.json({
        success: true,
        data: {
          purchased,
          pendingPayment,
          purchase: purchased ? purchaseRecord : null,
        },
      })
    }

    // User's retake requests for a package - requires auth
    if (action === 'my-retake-requests') {
      const packageId = searchParams.get('packageId')
      if (!userId || !packageId) return apiError('Package ID required', 400)

      const requests = await db.cQExamRetakeRequest.findMany({
        where: {
          userId,
          set: { packageId },
        },
        include: {
          set: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ success: true, data: { requests } })
    }

    // Get submission detail for user - requires auth
    if (action === 'my-submission') {
      const submissionId = searchParams.get('submissionId')
      if (!submissionId) return apiError('Submission ID required', 400)

      if (!userId) return apiError('লগইন প্রয়োজন', 401, 'UNAUTHORIZED')

      const submission = await db.cQExamSubmission.findUnique({
        where: { id: submissionId },
        include: {
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

      // Verify submission belongs to authenticated user
      if (submission.userId !== userId) {
        return apiError('Unauthorized', 403)
      }

      // If showAnnotatedImages is false, strip annotations from answer images
      const showAnnotated = submission.set.showAnnotatedImages
      if (!showAnnotated) {
        const serialized = JSON.parse(JSON.stringify(submission))
        for (const answer of serialized.answers) {
          for (const image of answer.images) {
            delete image.annotations
          }
        }
        return NextResponse.json({ success: true, data: { submission: serialized } })
      }

      return NextResponse.json({ success: true, data: { submission } })
    }

    // Get set detail for user (requires auth + purchase for premium packages)
    if (action === 'set-detail') {
      const setId = searchParams.get('setId')
      if (!setId) return apiError('Set ID required', 400)

      if (!userId) {
        return apiError('লগইন প্রয়োজন', 401, 'UNAUTHORIZED')
      }

      const set = await db.cQExamSet.findUnique({
        where: { id: setId },
        include: {
          package: { select: { id: true, isPremium: true } },
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

      if (set.package.isPremium) {
        const purchase = await db.cQExamPackagePurchase.findUnique({
          where: { userId_packageId: { userId, packageId: set.package.id } },
        })
        if (!purchase?.isActive) {
          return apiError('আপনি এই প্যাকেজটি কিনেননি। প্রথমে প্যাকেজটি কিনুন।', 403, 'NOT_PURCHASED')
        }
      }

      return NextResponse.json({ success: true, data: { set } })
    }

    return apiError('Unknown action', 400)
  } catch (error) {
    console.error('CQ Exam API error:', error)
    return apiError('Internal server error', 500)
  }
}

export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('লগইন প্রয়োজন', 401, 'UNAUTHORIZED')
    }
    const userId = auth.user.id

    const body = await request.json()
    const { action } = body

    // Start exam attempt
    if (action === 'start-exam') {
      const { setId } = body
      if (!setId) return apiError('Set ID required', 400)

      // Get set details with package info
      const set = await db.cQExamSet.findUnique({
        where: { id: setId },
        include: {
          questions: true,
          package: { select: { id: true, isPremium: true, price: true } },
        },
      })
      if (!set) return apiError('Set not found', 404)

      // Check purchase for premium packages
      if (set.package.isPremium) {
        const purchase = await db.cQExamPackagePurchase.findUnique({
          where: { userId_packageId: { userId, packageId: set.package.id } },
        })
        if (!purchase?.isActive) {
          return apiError('আপনি এই প্যাকেজটি কিনেননি। প্রথমে প্যাকেজটি কিনুন।', 403)
        }
      }

      // Helper to create answer slots per question based on type
      const createAnswersForQuestions = (questions: typeof set.questions) => questions.flatMap((q) => {
        const qType = q.type || 'cq'
        if (qType === 'cq' || qType === 'typed') {
          let subMarks: number[] = []
          if (q.subMarks && Array.isArray(q.subMarks)) {
            subMarks = q.subMarks as number[]
          }
          const ans = Array.from({ length: 4 }, (_, si) => ({
            questionId: q.id,
            subIndex: si,
            maxMarks: subMarks[si] ?? q.marks / 4,
            answerText: null,
            obtainedMarks: 0,
          }))
          ans.push({ questionId: q.id, subIndex: 4, maxMarks: 0, answerText: null, obtainedMarks: 0 })
          return ans
        }
        if (qType === 'fill-blanks') {
          let blanks: { id: string; marks: number }[] = []
          const cfg = q.config || {}; blanks = (cfg as any).blanks || []
          return blanks.map((blank, si) => ({
            questionId: q.id,
            subIndex: si,
            maxMarks: blank.marks || q.marks / (blanks.length || 1),
            answerText: null,
            obtainedMarks: 0,
          }))
        }
        if (qType === 'written') {
          return [
            { questionId: q.id, subIndex: 0, maxMarks: q.marks, answerText: null, obtainedMarks: 0 },
            { questionId: q.id, subIndex: 1, maxMarks: 0, answerText: null, obtainedMarks: 0 },
          ]
        }
        // mcq-single, mcq-multiple: 1 slot
        return [
          { questionId: q.id, subIndex: 0, maxMarks: q.marks, answerText: null, obtainedMarks: 0 },
        ]
      })

      // Check if already started
      const existing = await db.cQExamSubmission.findUnique({
        where: { userId_setId: { userId, setId } },
      })

      // If submitted and retake is allowed (set-level or admin-granted individual), delete old submission and start fresh
      const hadCanRetake = existing?.canRetake ?? false
      if (existing && (set.allowRetake || existing.canRetake)) {
        await db.cQExamSubmission.delete({ where: { id: existing.id } })
        const submission = await db.cQExamSubmission.create({
          data: {
            userId,
            setId,
            totalMarks: set.totalMarks,
            canRetake: hadCanRetake,
            status: 'in-progress',
            startedAt: new Date(),
            answers: { create: createAnswersForQuestions(set.questions) },
          },
          include: {
            answers: {
              include: { images: true },
              orderBy: [{ questionId: 'asc' }, { subIndex: 'asc' }],
            },
          },
        })
        return NextResponse.json({ success: true, data: { submission, status: 'new' } }, { status: 201 })
      }

      // Return existing in-progress submission (with answers and images for image upload to work)
      if (existing && (existing.status === 'in-progress')) {
        const submission = await db.cQExamSubmission.findUnique({
          where: { id: existing.id },
          include: {
            answers: {
              include: { images: true },
              orderBy: [{ questionId: 'asc' }, { subIndex: 'asc' }],
            },
          },
        })
        return NextResponse.json({ success: true, data: { submission, status: 'in-progress' } })
      }

      // Return already-submitted submission — let client redirect
      if (existing && existing.status === 'submitted') {
        const submission = await db.cQExamSubmission.findUnique({
          where: { id: existing.id },
          include: {
            answers: {
              include: { images: true },
              orderBy: [{ questionId: 'asc' }, { subIndex: 'asc' }],
            },
          },
        })
        return NextResponse.json({ success: true, data: { submission, status: 'submitted' } })
      }

      // Create submission with type-appropriate answer slots
      const submission = await db.cQExamSubmission.create({
        data: {
          userId,
          setId,
          totalMarks: set.totalMarks,
          status: 'in-progress',
          startedAt: new Date(),
          answers: { create: createAnswersForQuestions(set.questions) },
        },
        include: {
          answers: {
            include: { images: true },
            orderBy: [{ questionId: 'asc' }, { subIndex: 'asc' }],
          },
        },
      })

      return NextResponse.json({ success: true, data: { submission, status: 'new' } }, { status: 201 })
    }

    // Submit answer text
    if (action === 'save-answer') {
      const { answerId, answerText } = body
      if (!answerId) return apiError('Answer ID required', 400)

      const answer = await db.cQExamAnswer.update({
        where: { id: answerId },
        data: { answerText },
      })

      return NextResponse.json({ success: true, data: { answer } })
    }

    // Add image to an answer
    if (action === 'add-image') {
      const { answerId, imageUrl } = body
      if (!answerId || !imageUrl) return apiError('Answer ID and image URL required', 400)

      // Get the current max order for this answer
      const existingImages = await db.cQExamAnswerImage.findMany({
        where: { answerId },
        orderBy: { order: 'desc' },
        take: 1,
      })
      const nextOrder = existingImages.length > 0 ? existingImages[0].order + 1 : 0

      const image = await db.cQExamAnswerImage.create({
        data: {
          answerId,
          imageUrl,
          order: nextOrder,
        },
      })

      return NextResponse.json({ success: true, data: { image } }, { status: 201 })
    }

    // Remove image from an answer
    if (action === 'remove-image') {
      const { imageId } = body
      if (!imageId) return apiError('Image ID required', 400)

      await db.cQExamAnswerImage.delete({
        where: { id: imageId },
      })

      return NextResponse.json({ success: true })
    }

    // Request retake
    if (action === 'request-retake') {
      const { setId, reason } = body
      if (!setId) return apiError('Set ID required', 400)

      // Check if already requested
      const existing = await db.cQExamRetakeRequest.findUnique({
        where: { userId_setId: { userId, setId } },
      })
      if (existing) {
        if (existing.status === 'pending') {
          return apiError('ইতিমধ্যে একটি অনুরোধ জমা দেওয়া হয়েছে', 400)
        }
        if (existing.status === 'approved') {
          return apiError('ইতিমধ্যে পুনরায় পরীক্ষার অনুমতি দেওয়া হয়েছে', 400)
        }
        // If rejected, allow re-request
        await db.cQExamRetakeRequest.update({
          where: { id: existing.id },
          data: { status: 'pending', reason: reason || null, reviewedBy: null, reviewedAt: null },
        })
        return NextResponse.json({ success: true, data: { request: { ...existing, status: 'pending', reason: reason || null } } })
      }

      const request = await db.cQExamRetakeRequest.create({
        data: {
          userId,
          setId,
          reason: reason || null,
          status: 'pending',
        },
      })

      return NextResponse.json({ success: true, data: { request } })
    }

    // Submit exam
    if (action === 'submit-exam') {
      const { submissionId, timeTaken } = body
      if (!submissionId) return apiError('Submission ID required', 400)

      const submission = await db.cQExamSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'submitted',
          timeTaken: timeTaken || 0,
          submittedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, data: { submission, message: 'আপনার উত্তর জমা দেওয়া হয়েছে। শিক্ষক উত্তর মূল্যায়ন করে ফলাফল প্রকাশ করবেন।' } })
    }

    return apiError('Unknown action', 400)
  } catch (error) {
    console.error('CQ Exam POST error:', error)
    return apiError('Internal server error', 500)
  }
}
