import { db } from '@/lib/db'
import { apiResponse, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

const SEO_SEEDS = [
  { key: 'seo_title', value: 'শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম', group: 'seo', label: 'সাইট শিরোনাম (SEO Title)' },
  { key: 'seo_description', value: 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।', group: 'seo', label: 'সাইট বিবরণ (SEO Description)' },
  { key: 'seo_keywords', value: 'শিক্ষা বাংলা,অনলাইন শিক্ষা,MCQ,বোর্ড প্রশ্ন,HSC,SSC,বাংলাদেশ', group: 'seo', label: 'কীওয়ার্ড (SEO Keywords)' },
  { key: 'seo_author', value: 'শিক্ষা বাংলা', group: 'seo', label: 'লেখক (SEO Author)' },
]

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
if ('error' in csrfCheck) return csrfCheck.error
    const results: Array<Record<string, unknown>> = []

    for (const seed of SEO_SEEDS) {
      const existing = await db.siteSetting.findUnique({ where: { key: seed.key } })
      if (existing) {
        // Update if group/label missing, but keep existing value
        const data = await db.siteSetting.update({
          where: { key: seed.key },
          data: {
            group: existing.group || seed.group,
            label: existing.label || seed.label,
          },
        })
        results.push({ key: seed.key, action: 'updated', data })
      } else {
        const data = await db.siteSetting.create({
          data: {
            key: seed.key,
            value: seed.value,
            group: seed.group,
            label: seed.label,
          },
        })
        results.push({ key: seed.key, action: 'created', data })
      }
    }

    return apiResponse(results, 'SEO সেটিংস সফলভাবে সিড করা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Seed SEO Settings error')
  }
}
