import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const classLevel = searchParams.get('classLevel') || ''
    const durationFilter = searchParams.get('duration') || ''

    const where: Record<string, unknown> = { isActive: true }

    if (search && classLevel) {
      where.AND = [
        { OR: [{ title: { contains: search } }, { description: { contains: search } }] },
        { OR: [{ classLevel: classLevel }, { classLevel: null }] },
      ]
    } else if (search) {
      where.OR = [{ title: { contains: search } }, { description: { contains: search } }]
    } else if (classLevel) {
      where.OR = [{ classLevel: classLevel }, { classLevel: null }]
    }
    if (durationFilter) where.duration = parseInt(durationFilter, 10)

    const packages = await db.contentPackage.findMany({
      where,
      orderBy: [{ order: 'asc' }, { price: 'asc' }],
    })

    const packagesWithCounts = await Promise.all(
      packages.map(async (pkg) => {
        const targetClass = pkg.classLevel || classLevel || ''

        const mcqWhere: Record<string, unknown> = { isActive: true, isPremium: true }
        if (targetClass) mcqWhere.classLevel = targetClass

        const cqWhere: Record<string, unknown> = { isActive: true, isPremium: true }
        if (targetClass) cqWhere.classLevel = targetClass

        const [mcqCount, cqCount, lectureCount] = await Promise.all([
          db.mCQ.count({ where: mcqWhere }),
          db.cQ.count({ where: cqWhere }),
          targetClass
            ? db.lecture.count({
                where: {
                  isActive: true,
                  isPremium: true,
                  chapter: {
                    subject: {
                      classId: { in: (await db.classCategory.findMany({ where: { slug: targetClass }, select: { id: true } })).map(c => c.id) },
                    },
                  },
                },
              })
            : Promise.resolve(0),
        ])

        return { ...pkg, mcqCount, cqCount, lectureCount, totalContent: mcqCount + cqCount + lectureCount }
      })
    )

    return NextResponse.json({ success: true, data: { packages: packagesWithCounts } })
  } catch (error) {
    return handleApiError(error, 'Get public packages error')
  }
}
