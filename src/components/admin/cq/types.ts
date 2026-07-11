import { AlignLeft, BookOpen, Eye } from 'lucide-react'

export interface CQRecord {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  question1: string
  question1Image?: string | null
  question2: string
  question2Image?: string | null
  question3: string
  question3Image?: string | null
  question4: string
  question4Image?: string | null
  answer1: string
  answer1Image?: string | null
  answer2: string
  answer2Image?: string | null
  answer3: string
  answer3Image?: string | null
  answer4: string
  answer4Image?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  board?: string | null
  year?: string | null
  topic?: string | null
  difficulty: string
  isPremium: boolean
  price: number
  isActive: boolean
  chapter?: { id: string; name: string }
}

export interface ClassItem { id: string; name: string; slug: string }
export interface SubjectItem { id: string; name: string; slug: string; classId: string }
export interface ChapterItem { id: string; name: string; slug: string; subjectId: string }

export type ViewMode = 'list' | 'editor'
export type StepNumber = 1 | 2 | 3

export const difficultyLabels: Record<string, string> = { easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন' }
export const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const steps: { num: StepNumber; label: string; icon: React.ElementType }[] = [
  { num: 1, label: 'উদ্দীপক ও প্রশ্ন', icon: AlignLeft },
  { num: 2, label: 'হায়ারার্কি ও মেটাডাটা', icon: BookOpen },
  { num: 3, label: 'প্রিভিউ ও প্রকাশ', icon: Eye },
]

export const emptyForm = {
  uddeepok: '',
  uddeepokImage: '',
  question1: '', question2: '', question3: '', question4: '',
  question1Image: '', question2Image: '', question3Image: '', question4Image: '',
  answer1: '', answer2: '', answer3: '', answer4: '',
  answer1Image: '', answer2Image: '', answer3Image: '', answer4Image: '',
  classId: '', subjectId: '', chapterId: '',
  board: 'none',
  year: '',
  topic: '',
  difficulty: 'easy' as 'easy' | 'medium' | 'hard',
  isPremium: false,
  price: '',
}

export type CQForm = typeof emptyForm
