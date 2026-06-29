'use client'

import MCQExamPackagePurchaseDialog from '@/components/exam/MCQExamPackagePurchaseDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import {
Collapsible,
CollapsibleContent,
CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn,toBengaliNumerals } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { AnimatePresence,motion } from 'framer-motion'
import {
AlertCircle,
ArrowLeft,
ArrowRight,
Award,
BookOpen,
Calendar,
CheckCircle,
ChevronDown,
ChevronUp,
Clock,
Crown,
FileQuestion,
Loader2,
Medal,
MinusCircle,
Play,
RefreshCw,
RotateCcw,
Send,
ShoppingCart,
Target,
Timer,
TrendingDown,
TrendingUp,
Trophy,
Users,
XCircle,
Zap,
} from 'lucide-react'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExamSet {
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

interface ExamPackageDetail {
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

interface ExamQuestion {
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

interface ExamResult {
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

interface WeaknessData {
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

interface ExamSetStatusItem {
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

interface LeaderboardEntry {
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

type PageView = 'detail' | 'exam' | 'result'
type DetailTab = 'exams' | 'analysis' | 'leaderboard'

// ─── Utility Functions ───────────────────────────────────────────────────────

function getGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-600' }
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-500' }
  if (percentage >= 70) return { grade: 'A-', color: 'text-teal-500' }
  if (percentage >= 60) return { grade: 'B', color: 'text-cyan-500' }
  if (percentage >= 50) return { grade: 'C', color: 'text-amber-500' }
  if (percentage >= 40) return { grade: 'D', color: 'text-orange-500' }
  return { grade: 'F', color: 'text-destructive' }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} সেকেন্ড`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m} মিনিট ${s} সেকেন্ড` : `${m} মিনিট`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h} ঘণ্টা ${rm} মিনিট`
}

function formatDate(dateStr: string): string {
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

// ─── Date Helpers (using Dhaka timezone UTC+6 for consistency with server) ────

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000

function getDhakaNow(): Date {
  const now = new Date()
  return new Date(now.getTime() + DHAKA_OFFSET_MS + now.getTimezoneOffset() * 60 * 1000)
}

function getExamTimeMs(scheduledDate: Date, timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return scheduledDate.getTime() - DHAKA_OFFSET_MS + h * 3600000 + m * 60000
}

function isToday(dateStr: string): boolean {
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

function isFuture(dateStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const dhakaNow = getDhakaNow()
    const todayBD = new Date(Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate()))
    return date.getTime() > todayBD.getTime()
  } catch {
    return false
  }
}

function isPast(dateStr: string): boolean {
  return !isToday(dateStr) && !isFuture(dateStr)
}

function getDaysUntil(dateStr: string): number {
  try {
    const date = new Date(dateStr)
    const dhakaNow = getDhakaNow()
    const todayBD = new Date(Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate()))
    return Math.ceil((date.getTime() - todayBD.getTime()) / (1000 * 60 * 60 * 24))
  } catch {
    return 0
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MCQExamPackageDetailPage() {
  const { params, goBack, navigate } = useRouterStore()
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  const packageId = params.packageId || ''

  // Page state
  const [currentView, setCurrentView] = useState<PageView>('detail')
  const [pkgDetail, setPkgDetail] = useState<ExamPackageDetail | null>(null)
  const [purchased, setPurchased] = useState(false)
  const [accessSource, setAccessSource] = useState<'direct_purchase' | 'course' | 'none'>('none')
  const [loading, setLoading] = useState(true)

  // Purchase dialog (independent from bundles/packages)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)

  // Exam state
  const [activeSetId, setActiveSetId] = useState<string>('')
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([])
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [examLoading, setExamLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [examSetInfo, setExamSetInfo] = useState<ExamSet | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)

  // Result state
  const [resultDetail, setResultDetail] = useState<{
    result: ExamResult
    questions: ExamQuestion[]
  } | null>(null)
  const [_resultId, setResultId] = useState<string>('')

  // Result filters
  const [resultStatusFilter, setResultStatusFilter] = useState<string>('all')
  const [resultChapterFilter, setResultChapterFilter] = useState<string>('all')

  // Weakness analysis
  const [weakness, setWeakness] = useState<WeaknessData | null>(null)
  const [weaknessLoading, setWeaknessLoading] = useState(false)

  // Exam set status (from API)
  const [examSetStatuses, setExamSetStatuses] = useState<ExamSetStatusItem[]>([])
  const [_examSetStatusLoading, setExamSetStatusLoading] = useState(false)

  // Leaderboard
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [leaderboardSetId, setLeaderboardSetId] = useState<string>('')
  const [leaderboardMyRank, setLeaderboardMyRank] = useState<number | null>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  // Detail tab
  const [detailTab, setDetailTab] = useState<DetailTab>('exams')

  // Retake request
  const [retakeDialogOpen, setRetakeDialogOpen] = useState(false)
  const [retakeSetId, setRetakeSetId] = useState<string>('')
  const [retakeReason, setRetakeReason] = useState('')
  const [retakeSubmitting, setRetakeSubmitting] = useState(false)
  const [retakeHistory, setRetakeHistory] = useState<any[]>([])
  const [_retakeHistoryLoading, setRetakeHistoryLoading] = useState(false)
  const [retakeHistoryOpen, setRetakeHistoryOpen] = useState(false)
  const timerShouldRun = currentView === 'exam' && timeRemaining > 0

  // Countdown for today's exam
  const [todayCountdown, setTodayCountdown] = useState<number>(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const handleSubmitExamRef = useRef<() => void | Promise<void>>(() => {})

  // ─── Fetch Package Detail ───────────────────────────────────────────────

  const fetchDetail = useCallback(async () => {
    if (!packageId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/mcq-exam-packages?action=detail&id=${packageId}`
      )
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success) {
        setPkgDetail(json.data.package)
        setPurchased(json.data.purchased)
        setAccessSource(json.data.accessSource || 'none')
      }
    } catch (err) {
      console.error('Failed to fetch package detail:', err)
      toast({
        title: 'ত্রুটি',
        description: 'প্যাকেজের তথ্য লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [packageId, toast])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  // Auto-start exam set if startSetId is provided in params
  const autoStartRef = useRef(false)
  useEffect(() => {
    if (!pkgDetail || !params.startSetId || autoStartRef.current) return
    autoStartRef.current = true
    // Small delay so purchased check finishes
    const timer = setTimeout(() => handleStartExam(params.startSetId!), 500)
    return () => clearTimeout(timer)
  }, [pkgDetail, params.startSetId])

  // ─── Fetch Weakness Analysis ────────────────────────────────────────────

  const fetchWeakness = useCallback(async () => {
    if (!packageId || !purchased) return
    setWeaknessLoading(true)
    try {
      const res = await fetch(
        `/api/mcq-exam-packages?action=weakness-analysis&packageId=${packageId}`
      )
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setWeakness(json.data)
        }
      }
    } catch {
      // Silently ignore
    } finally {
      setWeaknessLoading(false)
    }
  }, [packageId, purchased])

  useEffect(() => {
    if (purchased && currentView === 'detail') {
      fetchWeakness()
    }
  }, [purchased, currentView, fetchWeakness])

  // ─── Fetch Exam Set Status ─────────────────────────────────────────────

  const fetchExamSetStatuses = useCallback(async () => {
    if (!packageId || !purchased || !isAuthenticated) return
    setExamSetStatusLoading(true)
    try {
      const res = await fetch(
        `/api/mcq-exam-packages?action=exam-set-status&packageId=${packageId}`
      )
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setExamSetStatuses(json.data.sets || [])
        }
      }
    } catch {
      // Silently ignore
    } finally {
      setExamSetStatusLoading(false)
    }
  }, [packageId, purchased, isAuthenticated])

  useEffect(() => {
    if (purchased && currentView === 'detail') {
      fetchExamSetStatuses()
    }
  }, [purchased, currentView, fetchExamSetStatuses])

  // ─── Fetch Retake History ─────────────────────────────────────────────────

  const fetchRetakeHistory = useCallback(async () => {
    if (!packageId || !isAuthenticated) return
    setRetakeHistoryLoading(true)
    try {
      const res = await fetch(
        `/api/mcq-exam-packages?action=my-retake-requests&packageId=${packageId}`
      )
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setRetakeHistory(json.data.requests || [])
        }
      }
    } catch {
      // Silently ignore
    } finally {
      setRetakeHistoryLoading(false)
    }
  }, [packageId, isAuthenticated])

  useEffect(() => {
    if (currentView === 'detail') {
      fetchRetakeHistory()
    }
  }, [currentView, fetchRetakeHistory])

  // ─── Fetch Leaderboard ─────────────────────────────────────────────────

  const fetchLeaderboard = useCallback(async (setId: string) => {
    if (!isAuthenticated) return
    setLeaderboardLoading(true)
    setLeaderboardSetId(setId)
    try {
      const res = await fetch(
        `/api/mcq-exam-packages?action=leaderboard&setId=${setId}&limit=10`
      )
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setLeaderboardData(json.data.leaderboard || [])
          setLeaderboardMyRank(json.data.myRank)
        }
      }
    } catch {
      // Silently ignore
    } finally {
      setLeaderboardLoading(false)
    }
  }, [isAuthenticated])

  // ─── Today's Exam Countdown ────────────────────────────────────────────

  useEffect(() => {
    if (currentView !== 'detail') return
    const todaySet = pkgDetail?.examSets.find((s) => isToday(s.scheduledDate))
    if (!todaySet) return

    const calculateCountdown = () => {
      const nowMs = Date.now()
      const startMs = getExamTimeMs(new Date(todaySet.scheduledDate), todaySet.startTime || '00:00')
      const diff = Math.max(0, Math.floor((startMs - nowMs) / 1000))
      setTodayCountdown(diff)
    }

    calculateCountdown()
    countdownRef.current = setInterval(calculateCountdown, 1000)

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [currentView, pkgDetail?.examSets])

  // ─── Start Exam ─────────────────────────────────────────────────────────

  const handleStartExam = async (setId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'লগইন করুন',
        description: 'পরীক্ষা দিতে প্রথমে লগইন করুন',
        variant: 'destructive',
      })
      navigate('login')
      return
    }

    setExamLoading(true)
    setActiveSetId(setId)
    try {
      const res = await fetch(
        `/api/mcq-exam-packages?action=take-exam&setId=${setId}`
      )
      const json = await res.json()

      if (!res.ok) {
        if (json.code === 'NOT_PURCHASED') {
          toast({
            title: 'ক্রয় করুন',
            description: 'পরীক্ষা দিতে প্রথমে প্যাকেজটি কিনুন',
            variant: 'destructive',
          })
          setPurchaseDialogOpen(true)
        } else if (json.code === 'EXAM_NOT_YET_AVAILABLE') {
          toast({
            title: 'পরীক্ষা শুরু হয়নি',
            description: json.error || 'পরীক্ষা এখনো শুরু হয়নি',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'ত্রুটি',
            description: json.error || 'পরীক্ষা শুরু করতে সমস্যা হয়েছে',
            variant: 'destructive',
          })
        }
        setExamLoading(false)
        return
      }

      const { set, questions, result, timeRemaining: remaining, alreadyCompleted } = json.data

      setExamSetInfo(set)
      setExamQuestions(questions)

      if (alreadyCompleted) {
        // Show result directly
        setResultDetail({
          result: result as ExamResult,
          questions: questions as ExamQuestion[],
        })
        setResultId(result.id)
        setCurrentView('result')
      } else {
        // Start or resume exam
        setExamResult(result as ExamResult)
        setResultId(result.id)
        setAnswers(result.answers || {})
        setTimeRemaining(remaining || set.duration * 60)
        setCurrentIndex(0)
        setCurrentView('exam')
      }
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'পরীক্ষা শুরু করতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    } finally {
      setExamLoading(false)
    }
  }

  // ─── View Result ────────────────────────────────────────────────────────

  const handleViewResult = async (resultIdParam: string, setId: string) => {
    setExamLoading(true)
    setActiveSetId(setId)
    try {
      const res = await fetch(
        `/api/mcq-exam-packages?action=result-detail&resultId=${resultIdParam}`
      )
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      if (json.success) {
        setResultDetail(json.data)
        setResultId(resultIdParam)
        setCurrentView('result')
      } else {
        toast({
          title: 'ত্রুটি',
          description: json.error || 'ফলাফল লোড করতে সমস্যা হয়েছে',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'ফলাফল লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    } finally {
      setExamLoading(false)
    }
  }

  // ─── Request Retake ─────────────────────────────────────────────────────

  const handleRequestRetake = async () => {
    if (!retakeSetId) return
    setRetakeSubmitting(true)
    try {
      const res = await fetch('/api/mcq-exam-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-retake',
          setId: retakeSetId,
          reason: retakeReason || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'পুনরায় পরীক্ষার অনুরোধ জমা দেওয়া হয়েছে' })
        setRetakeDialogOpen(false)
        setRetakeReason('')
        fetchExamSetStatuses()
        fetchRetakeHistory()
      } else {
        toast({ title: 'ত্রুটি', description: json.error || 'অনুরোধ ব্যর্থ হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'অনুরোধ করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setRetakeSubmitting(false)
    }
  }

  // ─── Submit Exam ────────────────────────────────────────────────────────

  const handleSubmitDialogOpen = useCallback(() => {
    setSubmitDialogOpen(true)
  }, [])

  const handleSubmitExam = useCallback(async () => {
    if (!examResult?.id || !activeSetId) return

    setSubmitDialogOpen(false)
    setSubmitting(true)
    try {
      const res = await fetch('/api/mcq-exam-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit-exam',
          setId: activeSetId,
          resultId: examResult.id,
          answers,
          timeTaken: (examSetInfo?.duration || 0) * 60 - timeRemaining,
        }),
      })

      const json = await res.json()
      if (json.success) {
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        setResultDetail(json.data)
        setResultId(examResult.id)
        setCurrentView('result')

        toast({
          title: 'পরীক্ষা জমা হয়েছে!',
          description: 'আপনার ফলাফল দেখুন',
        })

        // Refresh weakness data
        fetchWeakness()
      } else {
        toast({
          title: 'ত্রুটি',
          description: json.error || 'পরীক্ষা জমা দিতে সমস্যা হয়েছে',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'পরীক্ষা জমা দিতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }, [examResult, activeSetId, answers, timeRemaining, examSetInfo, toast, fetchWeakness])

  useEffect(() => {
    handleSubmitExamRef.current = handleSubmitExam
  }, [handleSubmitExam])

  // ─── Timer ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!timerShouldRun) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleSubmitExamRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [timerShouldRun])

  // ─── Exam UI Handlers ──────────────────────────────────────────────────

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const answeredCount = useMemo(
    () => examQuestions.filter((q) => answers[q.mcqId]).length,
    [examQuestions, answers]
  )

  const progressPercent = useMemo(
    () => (examQuestions.length > 0 ? (answeredCount / examQuestions.length) * 100 : 0),
    [answeredCount, examQuestions.length]
  )

  // ─── Get Exam Set Status (API-based with fallback) ──────────────────────

  const getSetStatusInfo = useCallback(
    (set: ExamSet) => {
      // Try API status first (when purchased & authenticated)
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
              score: undefined,
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
              score: undefined,
            }
          case 'upcoming': {
            const days = getDaysUntil(set.scheduledDate)
            return {
              label: days > 0 ? `${toBengaliNumerals(days)} দিন পর` : 'শীঘ্রই',
              color: 'bg-amber-500',
              bgColor: 'bg-amber-100 dark:bg-amber-900/30',
              textColor: 'text-amber-700 dark:text-amber-400',
              icon: <Clock className="size-3" />,
              score: undefined,
            }
          }
          case 'missed':
            return {
              label: 'মিস করেছেন',
              color: 'bg-gray-400',
              bgColor: 'bg-gray-100 dark:bg-gray-900/30',
              textColor: 'text-gray-600 dark:text-gray-400',
              icon: <XCircle className="size-3" />,
              score: undefined,
            }
        }
      }
      // Fallback: client-side date-based status (for non-purchased users)
      if (isToday(set.scheduledDate)) {
        return {
          label: 'আজ',
          color: 'bg-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-400',
          icon: <Zap className="size-3" />,
          score: undefined,
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
          score: undefined,
        }
      }
      return {
        label: 'অতীত',
        color: 'bg-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        textColor: 'text-gray-600 dark:text-gray-400',
        icon: <Calendar className="size-3" />,
        score: undefined,
      }
    },
    [examSetStatuses]
  )

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <div className="sticky top-16 z-30 bg-background border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!pkgDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">প্যাকেজ খুঁজে পাওয়া যায়নি</p>
          <Button onClick={goBack} variant="outline">
            ফিরে যান
          </Button>
        </Card>
      </div>
    )
  }

  // ─── Exam View ──────────────────────────────────────────────────────────

  if (currentView === 'exam') {
    const currentQuestion = examQuestions[currentIndex]
    const selectedAnswer = currentQuestion ? answers[currentQuestion.mcqId] : undefined

    return (
      <div>
        {/* Exam Header */}
        <div className="sticky top-16 z-40 bg-background border-b">
          <div className="flex items-center justify-between px-4 py-2.5 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current)
                  setCurrentView('detail')
                }}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {examSetInfo?.title || 'পরীক্ষা'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {answeredCount}/{examQuestions.length} উত্তর দেওয়া হয়েছে
                </p>
              </div>
            </div>

            <Badge
              variant={timeRemaining < 300 ? 'destructive' : 'secondary'}
              className="gap-1.5 tabular-nums shrink-0"
            >
              <Clock className="size-3.5" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-1 rounded-none" />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Question Area */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="p-5 sm:p-6">
                      {/* Question Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="font-mono">
                          প্রশ্ন {currentIndex + 1}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          / {examQuestions.length}
                        </span>
                        {examSetInfo && examSetInfo.negativeMarks > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-destructive border-destructive/30"
                          >
                            -{examSetInfo.negativeMarks} নেগেটিভ
                          </Badge>
                        )}
                      </div>

                      {/* Question Text */}
                      <div className="text-lg font-medium mb-6 leading-relaxed">
                        <RichContentRenderer content={currentQuestion?.question || ''} />
                      </div>

                      {/* Question Image */}
                      {currentQuestion?.questionImage && (
                        <div className="mb-4">
                          <SafeImage
                            src={currentQuestion.questionImage}
                            alt="প্রশ্নের ছবি"
                            className="max-w-full rounded-lg border"
                          />
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-3">
                        {(
                          [
                            { key: 'A', text: currentQuestion?.optionA, image: currentQuestion?.optionAImage },
                            { key: 'B', text: currentQuestion?.optionB, image: currentQuestion?.optionBImage },
                            { key: 'C', text: currentQuestion?.optionC, image: currentQuestion?.optionCImage },
                            { key: 'D', text: currentQuestion?.optionD, image: currentQuestion?.optionDImage },
                          ] as const
                        ).map((option) => (
                          <button
                            key={option.key}
                            className={cn(
                              'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                              selectedAnswer === option.key
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-muted/50'
                            )}
                            onClick={() =>
                              currentQuestion &&
                              handleSelectOption(currentQuestion.mcqId, option.key)
                            }
                          >
                            <span
                              className={cn(
                                'flex items-center justify-center size-8 rounded-full border-2 font-semibold text-sm shrink-0',
                                selectedAnswer === option.key
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : 'border-current'
                              )}
                            >
                              {option.key}
                            </span>
                            <div className="flex-1 min-w-0">
                              <RichContentRenderer
                                content={option.text || ''}
                                inline
                                className="text-sm sm:text-base"
                              />
                              {option.image && (
                                <SafeImage
                                  src={option.image}
                                  alt={`অপশন ${option.key}`}
                                  className="mt-2 max-w-full rounded-lg border max-h-32"
                                />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="size-4" />
                  আগের
                </Button>

                <div className="flex items-center gap-2">
                  {currentIndex < examQuestions.length - 1 ? (
                    <Button onClick={handleNext} className="gap-2">
                      পরের
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitDialogOpen}
                      disabled={submitting}
                      className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    >
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      {submitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Question Palette - Desktop */}
            <div className="hidden lg:block w-64">
              <Card className="sticky top-[5rem]">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3">প্রশ্ন প্যালেট</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {examQuestions.map((q, i) => {
                      const isAnswered = !!answers[q.mcqId]
                      const isCurrent = i === currentIndex
                      return (
                        <button
                          key={q.id}
                          className={cn(
                            'flex items-center justify-center size-9 rounded-lg text-sm font-medium transition-colors',
                            isCurrent
                              ? 'bg-emerald-500 text-white'
                              : isAnswered
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                          onClick={() => setCurrentIndex(i)}
                        >
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>

                  <Separator className="my-3" />
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded bg-emerald-500" />
                      <span>উত্তর দেওয়া হয়েছে ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded bg-muted" />
                      <span>উত্তর দেওয়া হয়নি</span>
                    </div>
                  </div>

                  <Separator className="my-3" />
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    size="sm"
                    onClick={handleSubmitDialogOpen}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {submitting ? 'জমা হচ্ছে...' : 'পরীক্ষা জমা দিন'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* ─── Submit Confirmation Dialog ─────────────────────────────── */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>পরীক্ষা জমা দিন</DialogTitle>
              <DialogDescription>
                আপনি {toBengaliNumerals(answeredCount)}টি প্রশ্নের উত্তর দিয়েছেন।{' '}
                {toBengaliNumerals(examQuestions.length - answeredCount)}টি প্রশ্ন বাকি আছে।
                আপনি কি নিশ্চিতভাবে জমা দিতে চান?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setSubmitDialogOpen(false)}
                disabled={submitting}
              >
                বাতিল
              </Button>
              <Button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {submitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── Result View ────────────────────────────────────────────────────────

  if (currentView === 'result' && resultDetail) {
    const { result, questions: resultQuestions } = resultDetail
    const percentage = result.totalMarks > 0 ? (result.marksObtained / result.totalMarks) * 100 : 0
    const { grade, color: gradeColor } = getGrade(percentage)
    const parsedAnswers: Record<string, string> = result.answers || {}

    return (
      <div>
        {/* Result Header */}
        <div className="sticky top-16 z-40 bg-background border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentView('detail')
                setResultDetail(null)
              }}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="size-5 text-emerald-500" />
              পরীক্ষার ফলাফল
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-12">
          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white text-center">
                <Award className="size-12 mx-auto mb-2 opacity-80" />
                <div className="text-4xl font-bold mb-1">
                  {Math.round(result.marksObtained)}/{Math.round(result.totalMarks)}
                </div>
                <div className="text-white/80 text-sm mb-3">
                  {percentage.toFixed(1)}% নম্বর
                </div>
                <Badge
                  className={cn(
                    'text-lg px-4 py-1 bg-white/20 text-white border-white/30',
                    gradeColor
                  )}
                >
                  গ্রেড: {grade}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                      <CheckCircle className="size-4" />
                      <span className="text-xl font-bold">{result.totalCorrect}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">সঠিক</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                      <XCircle className="size-4" />
                      <span className="text-xl font-bold">{result.totalWrong}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">ভুল</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                      <MinusCircle className="size-4" />
                      <span className="text-xl font-bold">{result.totalSkipped}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">বাদ দেওয়া</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-teal-500 mb-1">
                      <Clock className="size-4" />
                      <span className="text-xl font-bold">
                        {formatDuration(result.timeTaken)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">সময়</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Question-by-Question Review */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="size-5 text-emerald-500" />
              প্রশ্ন বিশ্লেষণ
            </h3>

            {/* Chapter filters */}
            {(() => {
              const uniqueChapters = resultQuestions
                .map(q => ({ id: q.chapterId, name: q.chapterName }))
                .filter((c, i, arr) => c.id && arr.findIndex(x => x.id === c.id) === i)
              if (uniqueChapters.length === 0) return null
              return (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <button
                    onClick={() => setResultChapterFilter('all')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                      resultChapterFilter === 'all'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    সব
                  </button>
                  {uniqueChapters.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setResultChapterFilter(ch.id!)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                        resultChapterFilter === ch.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              )
            })()}

            {/* Status filters */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <button
                onClick={() => setResultStatusFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  resultStatusFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                সব
              </button>
              <button
                onClick={() => setResultStatusFilter('wrong')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  resultStatusFilter === 'wrong'
                    ? 'bg-destructive text-white'
                    : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                )}
              >
                ভুল
              </button>
              <button
                onClick={() => setResultStatusFilter('correct')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  resultStatusFilter === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                )}
              >
                সঠিক
              </button>
              <button
                onClick={() => setResultStatusFilter('skipped')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  resultStatusFilter === 'skipped'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                )}
              >
                বাদ দেওয়া
              </button>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3 pr-4">
                {resultQuestions
                  .filter((q) => {
                    const userAnswer = parsedAnswers[q.mcqId]
                    const isCorrect = userAnswer && q.correctAnswer && userAnswer.toUpperCase() === q.correctAnswer.toUpperCase()
                    const isWrong = userAnswer && q.correctAnswer && userAnswer.toUpperCase() !== q.correctAnswer.toUpperCase()
                    const isSkipped = !userAnswer
                    if (resultStatusFilter !== 'all') {
                      if (resultStatusFilter === 'correct' && !isCorrect) return false
                      if (resultStatusFilter === 'wrong' && !isWrong) return false
                      if (resultStatusFilter === 'skipped' && !isSkipped) return false
                    }
                    if (resultChapterFilter !== 'all' && q.chapterId !== resultChapterFilter) return false
                    return true
                  })
                  .map((q, i, _filtered) => {
                    const userAnswer = parsedAnswers[q.mcqId]
                    const isCorrect =
                      userAnswer &&
                      q.correctAnswer &&
                      userAnswer.toUpperCase() === q.correctAnswer.toUpperCase()
                    const isWrong =
                      userAnswer &&
                      q.correctAnswer &&
                      userAnswer.toUpperCase() !== q.correctAnswer.toUpperCase()
                    const isSkipped = !userAnswer

                    return (
                      <QuestionReviewItem
                        key={q.id}
                        question={q}
                        index={i}
                        userAnswer={userAnswer}
                        isCorrect={!!isCorrect}
                        isWrong={!!isWrong}
                        isSkipped={isSkipped}
                      />
                    )
                  })}
              </div>
            </ScrollArea>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            {(() => {
              const setStatus = examSetStatuses.find(s => s.setId === activeSetId)
              const retakeAllowed = setStatus?.allowRetake
              const canRetakeNow = setStatus?.retakeRequestStatus === 'approved' || setStatus?.canRetake
              const hasPending = setStatus?.retakeRequestStatus === 'pending'
              const wasRejected = setStatus?.retakeRequestStatus === 'rejected'
              return (
                <>
                  {retakeAllowed && canRetakeNow && (
                    <Button
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setCurrentView('detail')
                        setResultDetail(null)
                        handleStartExam(activeSetId)
                      }}
                    >
                      <RotateCcw className="size-4" />
                      পুনরায় পরীক্ষা দিন
                    </Button>
                  )}
                  {retakeAllowed && hasPending && (
                    <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 py-2">
                      <RefreshCw className="size-3 mr-1" /> অনুরোধ অপেক্ষমাণ
                    </Badge>
                  )}
                  {retakeAllowed && !canRetakeNow && !hasPending && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setRetakeSetId(activeSetId)
                        setRetakeReason('')
                        setRetakeDialogOpen(true)
                      }}
                    >
                      <RefreshCw className="size-4" />
                      {wasRejected ? 'পুনরায় অনুরোধ' : 'রিটেক অনুরোধ'}
                    </Button>
                  )}
                </>
              )
            })()}
            <Button
              onClick={() => {
                setCurrentView('detail')
                setResultDetail(null)
                fetchDetail()
                fetchExamSetStatuses()
              }}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              প্যাকেজে ফিরে যান
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Detail View ────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {pkgDetail.title}
            </h1>
          </div>
          {pkgDetail.class && (
            <Badge
              variant="outline"
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shrink-0"
            >
              {pkgDetail.class.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Package Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-5">
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-200/50 dark:border-emerald-800/30">
                  {pkgDetail.thumbnail ? (
                    <SafeImage
                      src={pkgDetail.thumbnail}
                      alt={pkgDetail.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="size-8 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {pkgDetail.title}
                  </h2>
                  {pkgDetail.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      <RichContentRenderer content={pkgDetail.description} inline />
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary" className="gap-1">
                      <FileQuestion className="size-3" />
                      {pkgDetail.examSets?.length || 0}টি সেট
                    </Badge>
                    {purchased ? (
                      accessSource === 'course' ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 gap-1">
                          <CheckCircle className="size-3" />
                          কোর্সের মাধ্যমে
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1">
                          <CheckCircle className="size-3" />
                          ক্রয় সম্পন্ন
                        </Badge>
                      )
                    ) : pkgDetail.isPremium && pkgDetail.price > 0 ? (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                        <Crown className="size-3" />
                        ৳{Math.round(pkgDetail.price)}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        ফ্রি
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Not purchased — Buy banner */}
        {!purchased && pkgDetail.isPremium && pkgDetail.price > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
                    <ShoppingCart className="size-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">প্যাকেজটি কিনুন</h3>
                    <p className="text-xs text-muted-foreground">
                      সকল এক্সাম সেটে অংশ নিতে প্যাকেজটি কিনুন
                    </p>
                  </div>
                  <Button
                    className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shrink-0"
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('login')
                        return
                      }
                      setPurchaseDialogOpen(true)
                    }}
                  >
                    <Crown className="size-4" />
                    ৳{Math.round(pkgDetail.price)} কিনুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── আজকের পরীক্ষা Highlight Card ──────────────────────────────── */}
        {purchased && pkgDetail.examSets.some((s) => isToday(s.scheduledDate)) && (() => {
          const todaySet = pkgDetail.examSets.find((s) => isToday(s.scheduledDate))!
          const statusInfo = getSetStatusInfo(todaySet)
          const isCompleted = statusInfo.label === 'সম্পন্ন'
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
            >
              <Card className="border-red-200 dark:border-red-800 overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 shrink-0">
                      <Zap className="size-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm">আজকের পরীক্ষা</h3>
                        <Badge className={cn('text-[10px] px-1.5 py-0 gap-1', statusInfo.bgColor, statusInfo.textColor)}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                        {statusInfo.score && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {statusInfo.score}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{todaySet.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {todaySet.startTime} - {todaySet.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="size-3" />
                          {todaySet.duration} মিনিট
                        </span>
                        <span className="flex items-center gap-1">
                          <FileQuestion className="size-3" />
                          {todaySet.totalQuestions} প্রশ্ন
                        </span>
                      </div>
                      {todayCountdown > 0 && !isCompleted && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                            শুরু হতে বাকি: {formatTime(todayCountdown)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {isCompleted ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => {
                            const apiStatus = examSetStatuses.find((s) => s.setId === todaySet.id)
                            if (apiStatus?.result?.id) {
                              handleViewResult(apiStatus.result.id, todaySet.id)
                            } else {
                              handleStartExam(todaySet.id)
                            }
                          }}
                        >
                          <Trophy className="size-3" />
                          ফলাফল দেখুন
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs"
                          disabled={examLoading || todayCountdown > 0}
                          onClick={() => handleStartExam(todaySet.id)}
                        >
                          <Play className="size-3" />
                          পরীক্ষা শুরু করুন
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })()}

        {/* ─── Tab Navigation ──────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[
            { key: 'exams' as DetailTab, label: 'পরীক্ষা সমূহ', icon: <Calendar className="size-4" /> },
            { key: 'analysis' as DetailTab, label: 'বিশ্লেষণ', icon: <TrendingUp className="size-4" /> },
            { key: 'leaderboard' as DetailTab, label: 'লিডারবোর্ড', icon: <Trophy className="size-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                detailTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setDetailTab(tab.key)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Exams Tab ───────────────────────────────────────────────────── */}
        {detailTab === 'exams' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="size-5 text-emerald-500" />
              এক্সাম সেটসমূহ
            </h3>

            {pkgDetail.examSets.length === 0 ? (
              <Card className="p-8 text-center">
                <FileQuestion className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  এখনো কোনো এক্সাম সেট যুক্ত হয়নি
                </p>
              </Card>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-emerald-200 dark:bg-emerald-800 hidden sm:block" />

                <div className="space-y-4">
                  {pkgDetail.examSets.map((set, idx) => {
                    const statusInfo = getSetStatusInfo(set)
                    const isCompleted = statusInfo.label === 'সম্পন্ন'
                    const apiStatusData = examSetStatuses.find((s) => s.setId === set.id)
                    const isAvailable = isToday(set.scheduledDate) || isPast(set.scheduledDate)

                    return (
                      <motion.div
                        key={set.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative sm:pl-12"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-3.5 top-5 hidden sm:block">
                          <div
                            className={cn(
                              'size-3 rounded-full border-2 border-background',
                              statusInfo.color
                            )}
                          />
                        </div>

                        <Card className="border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-semibold text-sm">{set.title}</h4>
                                  <Badge
                                    className={cn(
                                      'text-[10px] px-1.5 py-0 gap-1',
                                      statusInfo.bgColor,
                                      statusInfo.textColor
                                    )}
                                  >
                                    {statusInfo.icon}
                                    {statusInfo.label}
                                  </Badge>
                                  {statusInfo.score && (
                                    <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                      {statusInfo.score}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-1.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {formatDate(set.scheduledDate)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {set.duration} মিনিট
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FileQuestion className="size-3" />
                                    {set.totalQuestions} প্রশ্ন
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Target className="size-3" />
                                    {set.totalMarks} নম্বর
                                  </span>
                                </div>

                                {set.instructions && (
                                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                                    {set.instructions}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="shrink-0 flex flex-col gap-1.5">
                                {!purchased && pkgDetail.isPremium && pkgDetail.price > 0 ? (
                                  <Button
                                    size="sm"
                                    className="gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs"
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        navigate('login')
                                        return
                                      }
                                      setPurchaseDialogOpen(true)
                                    }}
                                  >
                                    <Crown className="size-3" />
                                    প্যাকেজ কিনুন
                                  </Button>
                                ) : isCompleted ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-xs"
                                      onClick={() => {
                                        if (apiStatusData?.result?.id) {
                                          handleViewResult(apiStatusData.result.id, set.id)
                                        } else {
                                          handleStartExam(set.id)
                                        }
                                      }}
                                    >
                                      <Trophy className="size-3" />
                                      ফলাফল দেখুন
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="gap-1 text-xs"
                                      onClick={() => {
                                        setDetailTab('leaderboard')
                                        fetchLeaderboard(set.id)
                                      }}
                                    >
                                    <Medal className="size-3" />
                                    লিডারবোর্ড
                                    </Button>
                                    {apiStatusData?.allowRetake && (
                                      <>
                                        {apiStatusData.retakeRequestStatus === 'approved' || apiStatusData.canRetake ? (
                                          <Button
                                            size="sm"
                                            className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => handleStartExam(set.id)}
                                          >
                                            <RotateCcw className="size-3" />
                                            পুনরায় দিন
                                          </Button>
                                        ) : apiStatusData.retakeRequestStatus === 'pending' ? (
                                          <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            <RefreshCw className="size-3 mr-1" /> অনুরোধ অপেক্ষমাণ
                                          </Badge>
                                        ) : apiStatusData.retakeRequestStatus === 'rejected' ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                                            onClick={() => {
                                              setRetakeSetId(set.id)
                                              setRetakeReason('')
                                              setRetakeDialogOpen(true)
                                            }}
                                          >
                                            <RefreshCw className="size-3" />
                                            পুনরায় অনুরোধ
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1 text-xs"
                                            onClick={() => {
                                              setRetakeSetId(set.id)
                                              setRetakeReason('')
                                              setRetakeDialogOpen(true)
                                            }}
                                          >
                                            <RefreshCw className="size-3" />
                                            রিটেক অনুরোধ
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </>
                                ) : isAvailable ? (
                                  <Button
                                    size="sm"
                                    className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs"
                                    disabled={examLoading}
                                    onClick={() => handleStartExam(set.id)}
                                  >
                                    <Play className="size-3" />
                                    এক্সাম শুরু করুন
                                  </Button>
                                ) : (
                                  <Button size="sm" disabled className="text-xs">
                                    শীঘ্রই খুলবে
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Analysis Tab (Weakness) ─────────────────────────────────────── */}
        {detailTab === 'analysis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            {!purchased ? (
              <Card className="p-6 text-center">
                <Crown className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  দুর্বলতা বিশ্লেষণ দেখতে প্যাকেজটি কিনুন
                </p>
              </Card>
            ) : weaknessLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            ) : !weakness || weakness.overallStats.totalExams === 0 ? (
              <Card className="p-6 text-center">
                <Target className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  দুর্বলতা বিশ্লেষণ দেখতে অন্তত একটি পরীক্ষা সম্পন্ন করুন
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Overall Performance Card */}
                <Card className="border-emerald-200/50 dark:border-emerald-800/30">
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Award className="size-4 text-emerald-500" />
                      সামগ্রিক পরিসংখ্যান
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                        <div className="text-2xl font-bold text-emerald-600">
                          {toBengaliNumerals(weakness.overallStats.totalExams)}
                        </div>
                        <p className="text-xs text-muted-foreground">পরীক্ষা দিয়েছেন</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-teal-50 dark:bg-teal-950/20">
                        <div className="text-2xl font-bold text-teal-600">
                          {toBengaliNumerals(weakness.overallStats.avgScore)}%
                        </div>
                        <p className="text-xs text-muted-foreground">গড় স্কোর</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                        <div className="text-2xl font-bold text-emerald-500">
                          {toBengaliNumerals(weakness.overallStats.totalCorrect)}
                        </div>
                        <p className="text-xs text-muted-foreground">সঠিক উত্তর</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
                        <div className="text-2xl font-bold text-destructive">
                          {toBengaliNumerals(weakness.overallStats.totalWrong)}
                        </div>
                        <p className="text-xs text-muted-foreground">ভুল উত্তর</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject-wise Performance Bars */}
                {weakness.subjectWise.length > 0 && (
                  <Card className="border-emerald-200/50 dark:border-emerald-800/30">
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <BookOpen className="size-4 text-emerald-500" />
                        বিষয়ভিত্তিক সঠিকতা
                      </h4>
                      <div className="space-y-3">
                        {weakness.subjectWise.map((subject) => (
                          <div key={subject.subjectId}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{subject.subjectName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {toBengaliNumerals(subject.totalCorrect)}/{toBengaliNumerals(subject.totalCorrect + subject.totalWrong)}
                                </span>
                                <span
                                  className={cn(
                                    'text-sm font-bold',
                                    subject.accuracy >= 70
                                      ? 'text-emerald-600'
                                      : subject.accuracy >= 40
                                      ? 'text-amber-600'
                                      : 'text-destructive'
                                  )}
                                >
                                  {toBengaliNumerals(subject.accuracy)}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  subject.accuracy >= 70
                                    ? 'bg-emerald-500'
                                    : subject.accuracy >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-destructive'
                                )}
                                style={{ width: `${subject.accuracy}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Chapter-wise Performance (Collapsible, sorted weakest first) */}
                {weakness.chapterWise.length > 0 && (
                  <Card className="border-emerald-200/50 dark:border-emerald-800/30">
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Target className="size-4 text-emerald-500" />
                        অধ্যায়ভিত্তিক সঠিকতা
                        <span className="text-xs text-muted-foreground font-normal">
                          (দুর্বল থেকে শক্তিশালী)
                        </span>
                      </h4>
                      <ScrollArea className="max-h-[400px]">
                        <div className="space-y-1 pr-4">
                          {/* Show first 3 chapters open, rest collapsed */}
                          {weakness.chapterWise.map((chapter, idx) => {
                            const barColor = chapter.accuracy >= 70
                              ? 'bg-emerald-500'
                              : chapter.accuracy >= 40
                              ? 'bg-amber-500'
                              : 'bg-destructive'
                            const textColor = chapter.accuracy >= 70
                              ? 'text-emerald-600'
                              : chapter.accuracy >= 40
                              ? 'text-amber-600'
                              : 'text-destructive'

                            return (
                              <Collapsible key={chapter.chapterId} defaultOpen={idx < 3}>
                                <CollapsibleTrigger asChild>
                                  <button className="w-full text-left py-2 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {idx < 3 && (
                                          <TrendingDown className="size-3.5 text-destructive shrink-0" />
                                        )}
                                        {idx >= 3 && idx < weakness.chapterWise.length - 2 && (
                                          <TrendingUp className="size-3.5 text-amber-500 shrink-0" />
                                        )}
                                        {idx >= weakness.chapterWise.length - 2 && (
                                          <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                                        )}
                                        <span className="text-sm font-medium line-clamp-1">{chapter.chapterName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-xs text-muted-foreground">
                                          {toBengaliNumerals(chapter.totalCorrect)}/{toBengaliNumerals(chapter.totalCorrect + chapter.totalWrong)}
                                        </span>
                                        <span className={cn('text-sm font-bold', textColor)}>
                                          {toBengaliNumerals(chapter.accuracy)}%
                                        </span>
                                        <ChevronDown className="size-3.5 text-muted-foreground" />
                                      </div>
                                    </div>
                                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className={cn('h-full rounded-full transition-all duration-500', barColor)}
                                        style={{ width: `${chapter.accuracy}%` }}
                                      />
                                    </div>
                                  </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="pl-7 py-2 text-xs text-muted-foreground space-y-1">
                                    <div className="flex justify-between">
                                      <span>সঠিক: <span className="text-emerald-600 font-medium">{toBengaliNumerals(chapter.totalCorrect)}</span></span>
                                      <span>ভুল: <span className="text-destructive font-medium">{toBengaliNumerals(chapter.totalWrong)}</span></span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>মোট প্রশ্ন: {toBengaliNumerals(chapter.totalCorrect + chapter.totalWrong + (weakness.overallStats.totalCorrect + weakness.overallStats.totalWrong > 0 ? 0 : 0))}</span>
                                      <span>সঠিকতা: <span className={cn('font-medium', textColor)}>{toBengaliNumerals(chapter.accuracy)}%</span></span>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Leaderboard Tab ─────────────────────────────────────────────── */}
        {detailTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="size-5 text-emerald-500" />
              লিডারবোর্ড
            </h3>

            {/* Set selector */}
            {pkgDetail.examSets.length > 0 && (
              <div className="mb-4">
                <div className="flex gap-2 flex-wrap">
                  {pkgDetail.examSets.map((set) => (
                    <Button
                      key={set.id}
                      size="sm"
                      variant={leaderboardSetId === set.id ? 'default' : 'outline'}
                      className={cn(
                        'text-xs gap-1',
                        leaderboardSetId === set.id && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      )}
                      onClick={() => fetchLeaderboard(set.id)}
                    >
                      {set.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {leaderboardLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : leaderboardData.length === 0 ? (
              <Card className="p-6 text-center">
                <Users className="size-8 text-muted-foreground mx-auto mb-2" />
                {leaderboardSetId ? (
                  <p className="text-sm text-muted-foreground">
                    এখনো কেউ পরীক্ষা সম্পন্ন করেননি। আপনি প্রথম হন!
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    লিডারবোর্ড দেখতে একটি সেট নির্বাচন করুন
                  </p>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Current user rank highlight */}
                {leaderboardMyRank && leaderboardMyRank > 10 && (
                  <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-full bg-emerald-500 text-white font-bold text-sm shrink-0">
                        {toBengaliNumerals(leaderboardMyRank)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">আপনার অবস্থান</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {toBengaliNumerals(leaderboardMyRank)} তম
                      </Badge>
                    </CardContent>
                  </Card>
                )}

                {/* Top 10 Leaderboard */}
                {leaderboardData.map((entry) => {
                  const isMe = user?.id === entry.user.id
                  const rankDisplay = entry.rank <= 3
                    ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                    : toBengaliNumerals(entry.rank)

                  return (
                    <Card
                      key={`${entry.user.id}-${entry.rank}`}
                      className={cn(
                        'transition-colors',
                        isMe
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-border/50'
                      )}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        {/* Rank */}
                        <div
                          className={cn(
                            'flex items-center justify-center size-8 rounded-full font-bold text-sm shrink-0',
                            entry.rank === 1
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                              : entry.rank === 2
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              : entry.rank === 3
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {rankDisplay}
                        </div>

                        {/* Avatar + Name */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {entry.user.avatar ? (
                            <SafeImage
                              src={entry.user.avatar}
                              alt={entry.user.name}
                              className="size-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-xs font-medium">
                                {entry.user.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={cn('text-sm font-medium truncate', isMe && 'text-emerald-700 dark:text-emerald-400')}>
                              {entry.user.name}
                              {isMe && <span className="text-xs ml-1">(আপনি)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              সঠিক: {toBengaliNumerals(entry.totalCorrect)} | সময়: {formatDuration(entry.timeTaken)}
                            </p>
                          </div>
                        </div>

                        {/* Marks */}
                        <div className="text-right shrink-0">
                          <p className={cn(
                            'text-sm font-bold',
                            isMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                          )}>
                            {toBengaliNumerals(Math.round(entry.marksObtained))}/{toBengaliNumerals(Math.round(entry.totalMarks))}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ─── Retake History ─── */}
      {retakeHistory.length > 0 && (
        <div className="mt-6">
          <Collapsible open={retakeHistoryOpen} onOpenChange={setRetakeHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
                <RefreshCw className="size-3" />
                রিটেক ইতিহাস ({toBengaliNumerals(retakeHistory.length)})
                {retakeHistoryOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Card>
                <CardContent className="p-3 space-y-2">
                  {retakeHistory.map((req) => (
                    <div key={req.id} className="flex items-start justify-between gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{req.set?.title || 'সেট'}</p>
                        {req.reason && <p className="text-[11px] text-muted-foreground mt-0.5">{req.reason}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(req.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge className={cn(
                        'text-[10px] shrink-0',
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      )}>
                        {req.status === 'approved' ? 'অনুমোদিত' : req.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমাণ'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* ─── Retake Request Dialog ─── */}
      <Dialog open={retakeDialogOpen} onOpenChange={setRetakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পুনরায় পরীক্ষার অনুরোধ</DialogTitle>
            <DialogDescription>
              আপনি কি এই পরীক্ষাটি পুনরায় দিতে চান? আপনার অনুরোধটি পর্যালোচনা করে অনুমোদন দেওয়া হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">কারণ (ঐচ্ছিক)</label>
              <Textarea
                placeholder="পুনরায় পরীক্ষা দেওয়ার কারণ লিখুন..."
                value={retakeReason}
                onChange={(e) => setRetakeReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRetakeDialogOpen(false)} disabled={retakeSubmitting}>
              বাতিল
            </Button>
            <Button onClick={handleRequestRetake} disabled={retakeSubmitting} className="gap-2">
              {retakeSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {retakeSubmitting ? 'অনুরোধ পাঠানো হচ্ছে...' : 'অনুরোধ জমা দিন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Independent Purchase Dialog (NOT linked to bundles/packages) ─── */}
      <MCQExamPackagePurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={(open) => {
          setPurchaseDialogOpen(open)
          // Refresh purchase status when dialog closes after successful purchase
          if (!open) {
            fetchDetail()
          }
        }}
        packageDetail={pkgDetail}
      />
    </div>
  )
}

// ─── Question Review Item ────────────────────────────────────────────────────

function QuestionReviewItem({
  question,
  index,
  userAnswer,
  isCorrect,
  isWrong,
  isSkipped: _isSkipped,
}: {
  question: ExamQuestion
  index: number
  userAnswer: string | undefined
  isCorrect: boolean
  isWrong: boolean
  isSkipped: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  const options = [
    { key: 'A', text: question.optionA, image: question.optionAImage },
    { key: 'B', text: question.optionB, image: question.optionBImage },
    { key: 'C', text: question.optionC, image: question.optionCImage },
    { key: 'D', text: question.optionD, image: question.optionDImage },
  ]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn(
          'border-l-4 overflow-hidden',
          isCorrect
            ? 'border-l-emerald-500'
            : isWrong
            ? 'border-l-destructive'
            : 'border-l-amber-500'
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors">
            <div
              className={cn(
                'flex items-center justify-center size-7 rounded-full shrink-0',
                isCorrect
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : isWrong
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
              )}
            >
              {isCorrect ? (
                <CheckCircle className="size-4" />
              ) : isWrong ? (
                <XCircle className="size-4" />
              ) : (
                <MinusCircle className="size-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground">প্রশ্ন {index + 1}</span>
              <RichContentRenderer content={question.question} className="text-sm line-clamp-1" inline />
            </div>
            {isOpen ? (
              <ChevronUp className="size-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t">
            {/* Question Text */}
            <div className="mb-3">
              <RichContentRenderer
                content={question.question}
                className="text-sm leading-relaxed"
              />
              {question.questionImage && (
                <SafeImage
                  src={question.questionImage}
                  alt="প্রশ্নের ছবি"
                  className="mt-2 max-w-full rounded-lg border max-h-40"
                />
              )}
            </div>

            {/* Options */}
            <div className="space-y-2 mb-3">
              {options.map((opt) => {
                const isUserAnswer = userAnswer === opt.key
                const isCorrectAnswer =
                  question.correctAnswer && opt.key === question.correctAnswer.toUpperCase()

                return (
                  <div
                    key={opt.key}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg text-sm',
                      isCorrectAnswer
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                        : isUserAnswer && isWrong
                        ? 'bg-destructive/10 border border-destructive/30'
                        : 'bg-muted/30'
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center size-6 rounded-full text-xs font-semibold shrink-0 border',
                        isCorrectAnswer
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : isUserAnswer && isWrong
                          ? 'border-destructive bg-destructive text-white'
                          : 'border-border'
                      )}
                    >
                      {opt.key}
                    </span>
                    <span className="flex-1 min-w-0">
                      <RichContentRenderer content={opt.text || ''} inline className="text-xs" />
                      {opt.image && (
                        <SafeImage src={opt.image} alt={`অপশন ${opt.key}`} className="mt-1 max-w-full rounded-lg border max-h-16" />
                      )}
                    </span>
                    {isCorrectAnswer && (
                      <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                    )}
                    {isUserAnswer && isWrong && !isCorrectAnswer && (
                      <XCircle className="size-4 text-destructive shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">ব্যাখ্যা:</span>
                <RichContentRenderer content={question.explanation} className="text-xs text-muted-foreground inline" />
                {question.explanationImage && (
                  <SafeImage src={question.explanationImage} alt="ব্যাখ্যা চিত্র" className="mt-2 max-w-full rounded-lg border max-h-32" />
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
