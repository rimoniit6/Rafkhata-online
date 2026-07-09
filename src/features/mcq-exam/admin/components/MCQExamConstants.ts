export const statusOptions = [
  { value: '', label: 'সকল স্ট্যাটাস' },
  { value: 'draft', label: 'ড্রাফট' },
  { value: 'published', label: 'প্রকাশিত' },
  { value: 'archived', label: 'আর্কাইভ' },
] as const

export const statusLabels: Record<string, string> = {
  'draft': 'ড্রাফট',
  'published': 'প্রকাশিত',
  'archived': 'আর্কাইভ',
  'completed': 'সম্পন্ন',
}

export const statusColors: Record<string, string> = {
  'draft': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'published': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'archived': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  'completed': 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
}

export const difficultyLabels: Record<string, string> = {
  'easy': 'সহজ',
  'medium': 'মাঝারি',
  'hard': 'কঠিন',
}

export const difficultyColors: Record<string, string> = {
  'easy': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'hard': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m} মিনিট ${s} সেকেন্ড`
}
