import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType') || ''
    const contentId = searchParams.get('contentId') || ''
    const classLevel = searchParams.get('classLevel') || ''

    // Find packages that match the content's class level
    // Packages with classLevel=null cover all classes
    const where: Record<string, unknown> = { isActive: true }

    if (classLevel) {
      where.OR = [
        { classLevel: classLevel },
        { classLevel: null },
      ]
    }

    const packages = await db.contentPackage.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { price: 'asc' },
      ],
    })

    // Count premium content for each package's class
    const packagesWithCounts = await Promise.all(
      packages.map(async (pkg) => {
        const targetClass = pkg.classLevel || classLevel || ''
        let mcqCount = 0
        let cqCount = 0

        if (targetClass) {
          mcqCount = await db.mCQ.count({ where: { isActive: true, isPremium: true, classLevel: targetClass } })
          cqCount = await db.cQ.count({ where: { isActive: true, isPremium: true, classLevel: targetClass } })
        }

        return { ...pkg, mcqCount, cqCount, totalContent: mcqCount + cqCount }
      })
    )

    return NextResponse.json({ packages: packagesWithCounts })
  } catch (error) {
    console.error('Suggest packages error:', error)
    return NextResponse.json({ error: 'প্যাকেজ সাজেশন লোড করতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
