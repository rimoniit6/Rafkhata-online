import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify user authentication
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const { userId } = await props.params

    // Users can only view their own results (unless admin)
    if (auth.user.id !== userId && !auth.isAdmin) {
      return apiError('আপনি শুধুমাত্র নিজের ফলাফল দেখতে পারবেন', 403)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [results, total] = await Promise.all([
      db.examResult.findMany({
        where: { userId },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              type: true,
              classLevel: true,
              totalMarks: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.examResult.count({ where: { userId } }),
    ])

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get User Exam Results error:', error)
    return apiError('পরীক্ষার ফলাফল আনতে সমস্যা হয়েছে', 500)
  }
}
