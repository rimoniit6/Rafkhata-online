import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const userId = searchParams.get('userId')

    // List available packages (public)
    if (action === 'list') {
      const classSlug = searchParams.get('classSlug') || ''
      const search = searchParams.get('search') || ''

      const where: Record<string, unknown> = { status: 'published', isActive: true }
      if (classSlug) {
        where.class = { slug: classSlug }
      }
      if (search) {
        where.title = { contains: search }
      }

      const packages = await db.cQExamPackage.findMany({
        where,
        include: {
          class: { select: { id: true, name: true, slug: true } },
          _count: { select: { examSets: true } },
        },
        orderBy: { order: 'asc' },
      })

      return NextResponse.json({ packages })
    }

    // Package detail with sets
    if (action === 'detail') {
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'Package ID required' }, { status: 400 })

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
      if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

      // Check if user has purchased
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
          include: {
            set: { select: { id: true, title: true, totalQuestions: true, totalMarks: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
      }

      return NextResponse.json({ package: pkg, hasPurchased, hasPendingPayment, submissions })
    }

    // Check purchase status for a user
    if (action === 'check-purchase') {
      const packageId = searchParams.get('packageId')
      if (!packageId) {
        return NextResponse.json({ success: false, error: 'Package ID required' }, { status: 400 })
      }

      const auth = await verifyAuth(request)
      const purchaseUserId = auth?.user.id || userId
      if (!purchaseUserId) {
        return NextResponse.json(
          { success: false, error: 'ক্রয় অবস্থা দেখতে লগইন করুন', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }

      const purchaseRecord = await db.cQExamPackagePurchase.findUnique({
        where: {
          userId_packageId: {
            userId: purchaseUserId,
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
            userId: purchaseUserId,
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

    // User's retake requests for a package
    if (action === 'my-retake-requests') {
      const packageId = searchParams.get('packageId')
      const uid = searchParams.get('userId')
      if (!uid || !packageId) return NextResponse.json({ error: 'User ID and Package ID required' }, { status: 400 })

      const requests = await db.cQExamRetakeRequest.findMany({
        where: {
          userId: uid,
          set: { packageId },
        },
        include: {
          set: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ requests })
    }

    // Get submission detail for user
    if (action === 'my-submission') {
      const submissionId = searchParams.get('submissionId')
      if (!submissionId) return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })

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
      if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

      // If showAnnotatedImages is false, strip annotations from answer images
      const showAnnotated = submission.set.showAnnotatedImages
      if (!showAnnotated) {
        const serialized = JSON.parse(JSON.stringify(submission))
        for (const answer of serialized.answers) {
          for (const image of answer.images) {
            delete image.annotations
          }
        }
        return NextResponse.json({ submission: serialized })
      }

      return NextResponse.json({ submission })
    }

    // Get set detail for user (requires auth + purchase for premium packages)
    if (action === 'set-detail') {
      const setId = searchParams.get('setId')
      if (!setId) return NextResponse.json({ error: 'Set ID required' }, { status: 400 })

      const auth = await verifyAuth(request)
      if (!auth) {
        return NextResponse.json({ error: 'লগইন প্রয়োজন', code: 'UNAUTHORIZED' }, { status: 401 })
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
      if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 })

      if (set.package.isPremium) {
        const purchase = await db.cQExamPackagePurchase.findUnique({
          where: { userId_packageId: { userId: auth.user.id, packageId: set.package.id } },
        })
        if (!purchase?.isActive) {
          return NextResponse.json({ error: 'আপনি এই প্যাকেজটি কিনেননি। প্রথমে প্যাকেজটি কিনুন।', code: 'NOT_PURCHASED' }, { status: 403 })
        }
      }

      return NextResponse.json({ set })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('CQ Exam API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, userId } = body

    // Start exam attempt
    if (action === 'start-exam') {
      const { setId } = body
      if (!setId || !userId) return NextResponse.json({ error: 'Set ID and User ID required' }, { status: 400 })

      // Get set details with package info
      const set = await db.cQExamSet.findUnique({
        where: { id: setId },
        include: {
          questions: true,
          package: { select: { id: true, isPremium: true, price: true } },
        },
      })
      if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 })

      // Check purchase for premium packages
      if (set.package.isPremium) {
        const purchase = await db.cQExamPackagePurchase.findUnique({
          where: { userId_packageId: { userId, packageId: set.package.id } },
        })
        if (!purchase?.isActive) {
          return NextResponse.json({ error: 'আপনি এই প্যাকেজটি কিনেননি। প্রথমে প্যাকেজটি কিনুন।' }, { status: 403 })
        }
      }

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
            answers: {
              create: set.questions.flatMap((q) => {
                let subMarks: number[] = []
                if (q.subMarks) {
                  try { subMarks = JSON.parse(q.subMarks) } catch { subMarks = [] }
                }
                const ans = Array.from({ length: 4 }, (_, si) => ({
                  questionId: q.id,
                  subIndex: si,
                  maxMarks: subMarks[si] ?? q.marks / 4,
                  answerText: null,
                  obtainedMarks: 0,
                }))
                ans.push({
                  questionId: q.id,
                  subIndex: 4,
                  maxMarks: 0,
                  answerText: null,
                  obtainedMarks: 0,
                })
                return ans
              }),
            },
          },
          include: {
            answers: {
              include: { images: true },
              orderBy: [{ questionId: 'asc' }, { subIndex: 'asc' }],
            },
          },
        })
        return NextResponse.json({ submission, status: 'new' }, { status: 201 })
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
        return NextResponse.json({ submission, status: 'in-progress' })
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
        return NextResponse.json({ submission, status: 'submitted' })
      }

      // Create submission + 5 answers per question (subIndex 0-4)
      // subIndex 0-3 are individual sub-questions, subIndex 4 is for global "whole CQ" images
      const submission = await db.cQExamSubmission.create({
        data: {
          userId,
          setId,
          totalMarks: set.totalMarks,
          status: 'in-progress',
          startedAt: new Date(),
          answers: {
            create: set.questions.flatMap((q) => {
              let subMarks: number[] = []
              if (q.subMarks) {
                try { subMarks = JSON.parse(q.subMarks) } catch { subMarks = [] }
              }
              const ans = Array.from({ length: 4 }, (_, si) => ({
                questionId: q.id,
                subIndex: si,
                maxMarks: subMarks[si] ?? q.marks / 4,
                answerText: null,
                obtainedMarks: 0,
              }))
              // Add global answer slot for "whole CQ" images (subIndex 4, 0 marks)
              ans.push({
                questionId: q.id,
                subIndex: 4,
                maxMarks: 0,
                answerText: null,
                obtainedMarks: 0,
              })
              return ans
            }),
          },
        },
        include: {
          answers: {
            include: { images: true },
            orderBy: [{ questionId: 'asc' }, { subIndex: 'asc' }],
          },
        },
      })

      return NextResponse.json({ submission, status: 'new' }, { status: 201 })
    }

    // Submit answer text
    if (action === 'save-answer') {
      const { answerId, answerText } = body
      if (!answerId) return NextResponse.json({ error: 'Answer ID required' }, { status: 400 })

      const answer = await db.cQExamAnswer.update({
        where: { id: answerId },
        data: { answerText },
      })

      return NextResponse.json({ answer })
    }

    // Add image to an answer
    if (action === 'add-image') {
      const { answerId, imageUrl } = body
      if (!answerId || !imageUrl) return NextResponse.json({ error: 'Answer ID and image URL required' }, { status: 400 })

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

      return NextResponse.json({ image }, { status: 201 })
    }

    // Remove image from an answer
    if (action === 'remove-image') {
      const { imageId } = body
      if (!imageId) return NextResponse.json({ error: 'Image ID required' }, { status: 400 })

      await db.cQExamAnswerImage.delete({
        where: { id: imageId },
      })

      return NextResponse.json({ success: true })
    }

    // Request retake
    if (action === 'request-retake') {
      const { setId, userId, reason } = body
      if (!setId || !userId) return NextResponse.json({ error: 'Set ID and User ID required' }, { status: 400 })

      // Check if already requested
      const existing = await db.cQExamRetakeRequest.findUnique({
        where: { userId_setId: { userId, setId } },
      })
      if (existing) {
        if (existing.status === 'pending') {
          return NextResponse.json({ error: 'ইতিমধ্যে একটি অনুরোধ জমা দেওয়া হয়েছে' }, { status: 400 })
        }
        if (existing.status === 'approved') {
          return NextResponse.json({ error: 'ইতিমধ্যে পুনরায় পরীক্ষার অনুমতি দেওয়া হয়েছে' }, { status: 400 })
        }
        // If rejected, allow re-request
        await db.cQExamRetakeRequest.update({
          where: { id: existing.id },
          data: { status: 'pending', reason: reason || null, reviewedBy: null, reviewedAt: null },
        })
        return NextResponse.json({ request: { ...existing, status: 'pending', reason: reason || null } })
      }

      const request = await db.cQExamRetakeRequest.create({
        data: {
          userId,
          setId,
          reason: reason || null,
          status: 'pending',
        },
      })

      return NextResponse.json({ request })
    }

    // Submit exam
    if (action === 'submit-exam') {
      const { submissionId, timeTaken } = body
      if (!submissionId) return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })

      const submission = await db.cQExamSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'submitted',
          timeTaken: timeTaken || 0,
          submittedAt: new Date(),
        },
      })

      return NextResponse.json({ submission, message: 'আপনার উত্তর জমা দেওয়া হয়েছে। শিক্ষক উত্তর মূল্যায়ন করে ফলাফল প্রকাশ করবেন।' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('CQ Exam POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
