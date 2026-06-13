import { apiError } from '@/lib/api-utils'

const MESSAGE = 'ডাটাবেস রিসেট API সরানো হয়েছে। শুধুমাত্র CLI স্ক্রিপ্টের মাধ্যমে ডাটাবেস রিসেট করা যাবে। CLI তে চালান: bun run scripts/reset-database.ts'

export async function POST() {
  return apiError(MESSAGE, 410, 'DISABLED')
}
