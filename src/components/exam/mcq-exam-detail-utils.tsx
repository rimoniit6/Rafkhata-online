import { Calendar, CheckCircle, Clock, Play, Timer, XCircle, Zap } from 'lucide-react'
import { toBengaliNumerals } from '@/lib/utils'

export interface ExamSet {
  id: string
  title: string
  description: string | null
  scheduledDate: string
  startTime: string
  endTime: string
  duration: number
  totalMarks: number
  totalQuestions: number
  marksPerQ: number
  negativeMarks: number
  instructions: string | null
  status: string
  order: number
}

interface PackageClass {
  id: string
  name: string
  slug: string
}

export interface ExamPackageDetail {
  id: string
  title: string
  description: string | null
  classId: string
  price: number
  originalPrice: number
  isPremium: boolean
  thumbnail: string | null
  totalSets: number
  status: string
  class: PackageClass
  examSets: ExamSet[]
  _count: { purchases: number }
}

export interface ExamQuestion {
  id: string
  mcqId: string
  question: string
  questionImage: string | null
  optionA: string
  optionAImage: string | null
  optionB: string
  optionBImage: string | null
  optionC: string
  optionCImage: string | null
  optionD: string
  optionDImage: string | null
  correctAnswer?: string
  explanation?: string
  explanationImage?: string | null
  marks: number
  order: number
  chapterId?: string
  chapterName?: string | null
}

export interface ExamResult {
  id: string
  userId: string
  setId: string
  answers: Record<string, string>
  totalCorrect: number
  totalWrong: number
  totalSkipped: number
  marksObtained: number
  totalMarks: number
  timeTaken: number
  startedAt: string | null
  submittedAt: string | null
  status: string
}

export interface WeaknessData {
  overallStats: {
    totalExams: number
    avgScore: number
    totalCorrect: number
    totalWrong: number
  }
  subjectWise: Array<{
    subjectId: string
    subjectName: string
    totalCorrect: number
    totalWrong: number
    accuracy: number
  }>
  chapterWise: Array<{
    chapterId: string
    chapterName: string
    totalCorrect: number
    totalWrong: number
    accuracy: number
  }>
}

export interface ExamSetStatusItem {
  setId: string
  title: string
  scheduledDate: string
  startTime: string
  endTime: string
  status: 'completed' | 'in-progress' | 'not-started' | 'upcoming' | 'missed'
  allowRetake?: boolean
  canRetake?: boolean
  retakeRequestStatus?: string | null
  result?: {
    id: string
    totalCorrect: number
    totalWrong: number
    totalSkipped: number
    marksObtained: number
    totalMarks: number
    timeTaken: number
    status: string
  } | null
}

export interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    name: string
    avatar: string | null
    classLevel: number | null
  }
  marksObtained: number
  totalMarks: number
  totalCorrect: number
  totalWrong: number
  timeTaken: number
  submittedAt: string | null
}

export type PageView = 'detail' | 'exam' | 'result'
export type DetailTab = 'exams' | 'analysis' | 'leaderboard'

export interface SetStatusInfo {
  label: string
  color: string
  bgColor: string
  textColor: string
  icon: React.ReactNode
  score?: string
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} সেকেন্ড`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m} মিনিট ${s} সেকেন্ড` : `${m} মিনিট`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h} ঘণ্টা ${rm} মিনিট`
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return date.toLocaleDateString('bn-BD', options)
  } catch {
    return dateStr
  }
}

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000

function getDhakaNow(): Date {
  const now = new Date()
  return new Date(now.getTime() + DHAKA_OFFSET_MS + now.getTimezoneOffset() * 60 * 1000)
}

export function getExamTimeMs(scheduledDate: Date, timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return scheduledDate.getTime() - DHAKA_OFFSET_MS + h * 3600000 + m * 60000
}

export function isToday(dateStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const dhakaNow = getDhakaNow()
    return (
      date.getUTCFullYear() === dhakaNow.getUTCFullYear() &&
      date.getUTCMonth() === dhakaNow.getUTCMonth() &&
      date.getUTCDate() === dhakaNow.getUTCDate()
    )
  } catch {
    return false
  }
}

export function isFuture(dateStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const dhakaNow = getDhakaNow()
    const todayBD = new Date(Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate()))
    return date.getTime() > todayBD.getTime()
  } catch {
    return false
  }
}

export function isPast(dateStr: string): boolean {
  return !isToday(dateStr) && !isFuture(dateStr)
}

export function getDaysUntil(dateStr: string): number {
  try {
    const date = new Date(dateStr)
    const dhakaNow = getDhakaNow()
    const todayBD = new Date(Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate()))
    return Math.ceil((date.getTime() - todayBD.getTime()) / (1000 * 60 * 60 * 24))
  } catch {
    return 0
  }
}

export function getSetStatusInfo(
  set: ExamSet,
  examSetStatuses: ExamSetStatusItem[]
): SetStatusInfo {
  const apiStatus = examSetStatuses.find((s) => s.setId === set.id)
  if (apiStatus) {
    switch (apiStatus.status) {
      case 'completed':
        return {
          label: 'সম্পন্ন',
          color: 'bg-emerald-500',
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          icon: <CheckCircle className="size-3" />,
          score: apiStatus.result
            ? `${toBengaliNumerals(apiStatus.result.totalCorrect)}/${toBengaliNumerals(apiStatus.result.totalCorrect + apiStatus.result.totalWrong + apiStatus.result.totalSkipped)}`
            : undefined,
        }
      case 'in-progress':
        return {
          label: 'চলমান',
          color: 'bg-sky-500',
          bgColor: 'bg-sky-100 dark:bg-sky-900/30',
          textColor: 'text-sky-700 dark:text-sky-400',
          icon: <Timer className="size-3" />,
        }
      case 'not-started':
        return {
          label: isToday(set.scheduledDate) ? 'আজ পরীক্ষা' : 'উপলব্ধ',
          color: 'bg-emerald-500',
          bgColor: isToday(set.scheduledDate)
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: isToday(set.scheduledDate)
            ? 'text-red-700 dark:text-red-400'
            : 'text-emerald-700 dark:text-emerald-400',
          icon: <Play className="size-3" />,
        }
      case 'upcoming': {
        const days = getDaysUntil(set.scheduledDate)
        return {
          label: days > 0 ? `${toBengaliNumerals(days)} দিন পর` : 'শীঘ্রই',
          color: 'bg-amber-500',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-400',
          icon: <Clock className="size-3" />,
        }
      }
      case 'missed':
        return {
          label: 'মিস করেছেন',
          color: 'bg-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-600 dark:text-gray-400',
          icon: <XCircle className="size-3" />,
        }
    }
  }
  if (isToday(set.scheduledDate)) {
    return {
      label: 'আজ',
      color: 'bg-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      icon: <Zap className="size-3" />,
    }
  }
  if (isFuture(set.scheduledDate)) {
    const days = getDaysUntil(set.scheduledDate)
    return {
      label: days > 0 ? `${toBengaliNumerals(days)} দিন পর` : 'শীঘ্রই',
      color: 'bg-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-400',
      icon: <Clock className="size-3" />,
    }
  }
  return {
    label: 'অতীত',
    color: 'bg-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: <Calendar className="size-3" />,
  }
}
