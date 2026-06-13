import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const durationLabels: Record<number, string> = {
  30: '১ মাস',
  90: '৩ মাস',
  365: '১২ মাস',
}

export async function GET() {
  try {
    // SubscriptionPlan model was removed — use ContentPackage instead
    const packages = await db.contentPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    const parsedPlans = packages.map((pkg) => {
      const slug = pkg.duration === 30 ? 'monthly' : pkg.duration === 90 ? 'quarterly' : pkg.duration === 365 ? 'yearly' : `plan-${pkg.duration}`
      const isRecommended = slug === 'quarterly'

      return {
        id: slug,
        name: pkg.title.replace(/ প্যাকেজ$/, ''),
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        duration: durationLabels[pkg.duration] || `${pkg.duration} দিন`,
        durationDays: pkg.duration,
        durationLabel: pkg.durationLabel,
        description: pkg.description,
        thumbnail: pkg.thumbnail,
        features: [
          `সকল প্রিমিয়াম কন্টেন্ট অ্যাক্সেস`,
          `${durationLabels[pkg.duration] || `${pkg.duration} দিন`} মেয়াদ`,
          'MCQ, সৃজনশীল প্রশ্ন, লেকচার',
          'বোর্ড প্রশ্ন প্র্যাকটিস',
        ],
        isRecommended,
      }
    })

    return NextResponse.json({ success: true, data: { plans: parsedPlans } })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json(
      { error: 'প্ল্যান আনতে সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
