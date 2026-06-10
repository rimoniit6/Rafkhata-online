import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth, requireAdmin } from '@/lib/auth'
import { apiLimiter, getClientIdentifier, rateLimitHeaders } from '@/lib/rate-limit'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Require auth
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'প্রমাণীকরণ প্রয়োজন।', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { id } = await props.params

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'পেমেন্ট খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    // Non-admin users can only view their own payments
    if (!auth.isAdmin && payment.userId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'এই পেমেন্ট দেখার অনুমতি নেই।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: { payment } })
  } catch (error) {
    console.error('Get payment detail error:', error)
    return NextResponse.json(
      { success: false, error: 'পেমেন্টের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin
    const auth = await requireAdmin(request)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'অ্যাডমিন অনুমতি প্রয়োজন।', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const { id } = await props.params
    const body = await request.json()
    const { status, adminNote } = body

    const existingPayment = await db.payment.findUnique({ where: { id } })

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, error: 'পেমেন্ট খুঁজে পাওয়া যায়নি' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (status) {
      if (!['approved', 'rejected'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'স্ট্যাটাস শুধুমাত্র approved বা rejected হতে পারে' },
          { status: 400 }
        )
      }
      updateData.status = status
      updateData.reviewedAt = new Date()
      // Get reviewedBy from session, NOT from request body
      updateData.reviewedBy = auth.user.email || auth.user.id
    }

    if (adminNote !== undefined) updateData.adminNote = adminNote

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // If payment is approved, update user to premium if contentType is subscription
    if (status === 'approved' && existingPayment.contentType === 'subscription') {
      // Try to read duration from the linked package if available
      let durationDays = 30
      if (existingPayment.contentId) {
        try {
          const pkg = await db.contentPackage.findUnique({
            where: { id: existingPayment.contentId },
            select: { duration: true },
          })
          if (pkg?.duration) durationDays = pkg.duration
        } catch {
          // Fallback to default 30 days
        }
      }
      await db.user.update({
        where: { id: existingPayment.userId },
        data: {
          isPremium: true,
          premiumExpiry: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        },
      })
    }

    // If this is a package payment that was approved, create a UserSubscription
    if (status === 'approved' && existingPayment.contentType === 'package' && existingPayment.contentId) {
      try {
        const pkg = await db.contentPackage.findUnique({
          where: { id: existingPayment.contentId },
          select: { duration: true, durationLabel: true, title: true, classLevel: true },
        })

        if (pkg) {
          const subscriptionClassLevel = existingPayment.classLevel || pkg.classLevel

          if (subscriptionClassLevel) {
            const startDate = new Date()
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + pkg.duration)

            const existingSub = await db.userSubscription.findFirst({
              where: {
                userId: existingPayment.userId,
                packageId: existingPayment.contentId,
                classLevel: subscriptionClassLevel,
              },
            })

            if (!existingSub) {
              await db.userSubscription.create({
                data: {
                  userId: existingPayment.userId,
                  packageId: existingPayment.contentId,
                  classLevel: subscriptionClassLevel,
                  startDate,
                  endDate,
                  isActive: true,
                  paymentId: existingPayment.id,
                },
              })
            } else {
              const currentEnd = new Date(existingSub.endDate)
              const newEnd = currentEnd > startDate ? currentEnd : startDate
              newEnd.setDate(newEnd.getDate() + pkg.duration)

              await db.userSubscription.update({
                where: { id: existingSub.id },
                data: {
                  endDate: newEnd,
                  isActive: true,
                  paymentId: existingPayment.id,
                },
              })
            }
          }
        }
      } catch (subError) {
        console.error('Failed to create subscription:', subError)
      }
    }

    // ===== If this is an MCQ Exam Package payment that was approved, create a purchase record =====
    if (status === 'approved' && existingPayment.contentType === 'mcq-exam-package' && existingPayment.contentId) {
      try {
        const existingPurchase = await db.mCQExamPackagePurchase.findFirst({
          where: {
            userId: existingPayment.userId,
            packageId: existingPayment.contentId,
          },
        })

        if (!existingPurchase) {
          await db.mCQExamPackagePurchase.create({
            data: {
              userId: existingPayment.userId,
              packageId: existingPayment.contentId,
              paymentId: existingPayment.id,
              isActive: true,
            },
          })
        } else {
          await db.mCQExamPackagePurchase.update({
            where: { id: existingPurchase.id },
            data: { isActive: true, paymentId: existingPayment.id },
          })
        }
      } catch (purchaseError) {
        console.error('Failed to create MCQ exam package purchase:', purchaseError)
      }
    }

    // ===== If this is a CQ Exam Package payment that was approved, create a purchase record =====
    if (status === 'approved' && existingPayment.contentType === 'cq-exam-package' && existingPayment.contentId) {
      try {
        const existingPurchase = await db.cQExamPackagePurchase.findFirst({
          where: {
            userId: existingPayment.userId,
            packageId: existingPayment.contentId,
          },
        })

        if (!existingPurchase) {
          await db.cQExamPackagePurchase.create({
            data: {
              userId: existingPayment.userId,
              packageId: existingPayment.contentId,
              paymentId: existingPayment.id,
              isActive: true,
            },
          })
        } else {
          await db.cQExamPackagePurchase.update({
            where: { id: existingPurchase.id },
            data: { isActive: true, paymentId: existingPayment.id },
          })
        }
      } catch (purchaseError) {
        console.error('Failed to create CQ exam package purchase:', purchaseError)
      }
    }

    // Create notification for user
    if (status === 'approved' || status === 'rejected') {
      try {
        const notificationTitle = status === 'approved' ? 'পেমেন্ট অনুমোদিত' : 'পেমেন্ট প্রত্যাখ্যাত'
        let notificationMessage = ''
        if (status === 'approved') {
          const contentLabel = existingPayment.contentTitle || existingPayment.contentType || 'কন্টেন্ট'
          notificationMessage = `আপনার "${contentLabel}" ক্রয়ের ৳${existingPayment.amount} পেমেন্ট অনুমোদিত হয়েছে।`
        } else {
          notificationMessage = `আপনার ৳${existingPayment.amount} পেমেন্ট প্রত্যাখ্যাত হয়েছে।${adminNote ? ` কারণ: ${adminNote}` : ''}`
        }
        await db.notification.create({
          data: {
            userId: existingPayment.userId,
            title: notificationTitle,
            message: notificationMessage,
            type: status === 'approved' ? 'success' : 'error',
          },
        })
      } catch {
        // Notification creation should not block the main flow
      }
    }

    return NextResponse.json({ success: true, data: { message: 'পেমেন্ট আপডেট হয়েছে', payment } })
  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json(
      { success: false, error: 'পেমেন্ট আপডেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  // PUT does the same as PATCH - delegate
  return PATCH(request, props)
}
