export interface BundleItemRecord {
  id: string
  bundleId: string
  contentType: string
  contentId: string
  order: number
  createdAt: string
}

export interface BundleRecord {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  originalPrice: number
  classLevel: string | null
  board: string | null
  year: string | null
  type: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  items: BundleItemRecord[]
}

export interface ContentItem {
  id: string
  title?: string
  question?: string
  uddeepok?: string
  price: number
  isPremium?: boolean
  classLevel?: string
  thumbnail?: string | null
  chapter?: { id: string; name: string } | null
  subject?: { id: string; name: string } | null
}

export interface SelectedContentItem {
  contentType: string
  contentId: string
  title: string
  price: number
  order: number
}

export interface HierarchyData {
  classes: { id: string; name: string; slug: string }[]
  subjects: { id: string; name: string; slug: string; classId: string }[]
  chapters: { id: string; name: string; slug: string; subjectId: string }[]
}

export interface ChapterCount {
  chapterId: string
  chapterName: string
  subjectName: string
  mcqTotal: number
  mcqPremium: number
  mcqFree: number
  cqTotal: number
  cqPremium: number
  cqFree: number
}

export const typeLabels: Record<string, string> = {
  mcq: 'MCQ',
  cq: 'CQ',
  lecture: 'লেকচার',
  board: 'বোর্ড',
  mixed: 'মিশ্র',
}

export const typeColors: Record<string, string> = {
  mcq: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  cq: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  lecture: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  board: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  mixed: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
}
