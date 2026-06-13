import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const packages = await db.contentPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    const parsedPlans = packages.map((pkg) => ({
      id: pkg.slug,
      name: pkg.title.replace(/ প্যাকেজ$/, ''),
      price: pkg.price,
      originalPrice: pkg.originalPrice,
      duration: pkg.durationLabel,
      durationDays: pkg.duration,
      durationLabel: pkg.durationLabel,
      description: pkg.description,
      thumbnail: pkg.thumbnail,
      isRecommended: pkg.order === 0,
    }))

    return apiResponse({ plans: parsedPlans })
  } catch (error) {
    return handleApiError(error, 'Get plans error')
  }
}
