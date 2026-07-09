import { FileQuestion, ChevronDown, Eye } from 'lucide-react'

export const difficultyLabels: Record<string, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
}

export const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const emptyForm = {
  question: '',
  questionImage: '',
  optionA: '',
  optionAImage: '',
  optionB: '',
  optionBImage: '',
  optionC: '',
  optionCImage: '',
  optionD: '',
  optionDImage: '',
  correctAnswer: 'A',
  explanation: '',
  explanationImage: '',
  classId: '',
  subjectId: '',
  chapterId: '',
  board: 'none',
  year: '',
  topic: '',
  difficulty: 'easy',
  isPremium: false,
  price: '',
  tags: '',
}

export const STEPS = [
  { id: 1, label: 'মৌলিক তথ্য', icon: FileQuestion },
  { id: 2, label: 'হায়ারার্কি ও মেটাডাটা', icon: ChevronDown },
  { id: 3, label: 'প্রিভিউ ও প্রকাশ', icon: Eye },
]
