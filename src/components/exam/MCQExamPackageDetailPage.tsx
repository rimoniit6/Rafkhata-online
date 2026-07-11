'use client'

import MCQExamPackagePurchaseDialog from '@/components/exam/MCQExamPackagePurchaseDialog'
import ExamActiveView from '@/components/exam/mcq-detail/ExamActiveView'
import ExamAnalysisTab from '@/components/exam/mcq-detail/ExamAnalysisTab'
import ExamLeaderboardTab from '@/components/exam/mcq-detail/ExamLeaderboardTab'
import ExamResultView from '@/components/exam/mcq-detail/ExamResultView'
import ExamSetList from '@/components/exam/mcq-detail/ExamSetList'
import LoadingSkeleton from '@/components/exam/mcq-detail/LoadingSkeleton'
import PackageInfoCard from '@/components/exam/mcq-detail/PackageInfoCard'
import RetakeSection from '@/components/exam/mcq-detail/RetakeSection'
import TodayExamCard from '@/components/exam/mcq-detail/TodayExamCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { useShallowAuth } from '@/store/auth'
import { useRouterStore, useRouteParams } from '@/store/router'
import { fetchCsrfToken } from '@/lib/api-client'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ExamSet,
  ExamPackageDetail,
  ExamQuestion,
  ExamResult,
  WeaknessData,
  ExamSetStatusItem,
  LeaderboardEntry,
  PageView,
  DetailTab,
  SetStatusInfo,
} from '@/components/exam/mcq-exam-detail-utils'
import {
  isToday,
  getExamTimeMs,
  getSetStatusInfo,
} from '@/components/exam/mcq-exam-detail-utils'

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MCQExamPackageDetailPage() {
  const params = useRouteParams()
  const goBack = useRouterStore((s) => s.goBack)
  const navigate = useRouterStore((s) => s.navigate)
  const { user, isAuthenticated } = useShallowAuth()
  const { toast } = useToast()

  const packageId = params.packageId || ''

  const [currentView, setCurrentView] = useState<PageView>('detail')
  const [pkgDetail, setPkgDetail] = useState<ExamPackageDetail | null>(null)
  const [purchased, setPurchased] = useState(false)
  const [accessSource, setAccessSource] = useState<'direct_purchase' | 'course' | 'none'>('none')
  const [loading, setLoading] = useState(true)

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)

  const [activeSetId, setActiveSetId] = useState<string>('')
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([])
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [examLoading, setExamLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [examSetInfo, setExamSetInfo] = useState<ExamSet | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)

  const [resultDetail, setResultDetail] = useState<{
    result: ExamResult
    questions: ExamQuestion[]
  } | null>(null)
  const [_resultId, setResultId] = useState<string>('')

  const [resultStatusFilter, setResultStatusFilter] = useState<string>('all')
  const [resultChapterFilter, setResultChapterFilter] = useState<string>('all')

  const [weakness, setWeakness] = useState<WeaknessData | null>(null)
  const [weaknessLoading, setWeaknessLoading] = useState(false)

  const [examSetStatuses, setExamSetStatuses] = useState<ExamSetStatusItem[]>([])

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [leaderboardSetId, setLeaderboardSetId] = useState<string>('')
  const [leaderboardMyRank, setLeaderboardMyRank] = useState<number | null>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  const [detailTab, setDetailTab] = useState<DetailTab>('exams')

  const [retakeDialogOpen, setRetakeDialogOpen] = useState(false)
  const [retakeSetId, setRetakeSetId] = useState<string>('')
  const [retakeReason, setRetakeReason] = useState('')
  const [retakeSubmitting, setRetakeSubmitting] = useState(false)
  const [retakeHistory, setRetakeHistory] = useState<any[]>([])
  const [retakeHistoryOpen, setRetakeHistoryOpen] = useState(false)
  const timerShouldRun = currentView === 'exam' && timeRemaining > 0

  const [todayCountdown, setTodayCountdown] = useState<number>(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const handleSubmitExamRef = useRef<() => void | Promise<void>>(() => {})
  const timerWarnedRef = useRef(false)

  // ─── Fetch Package Overview ─────────────────────────────────────────────

  const fetchOverview = useCallback(async () => {
    if (!packageId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/mcq-exam-packages?action=set-overview&id=${packageId}`
      )
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success) {
        setPkgDetail(json.data.package)
        setPurchased(json.data.purchased)
        setAccessSource(json.data.accessSource || 'none')
        setExamSetStatuses(json.data.examSetStatuses || [])
        setRetakeHistory(json.data.retakeRequests || [])
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
    fetchOverview()
  }, [fetchOverview])

  const autoStartRef = useRef(false)
  useEffect(() => {
    if (!pkgDetail || !params.startSetId || autoStartRef.current) return
    autoStartRef.current = true
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
    } finally {
      setWeaknessLoading(false)
    }
  }, [packageId, purchased])

  useEffect(() => {
    if (purchased && currentView === 'detail') {
      fetchWeakness()
    }
  }, [purchased, currentView, fetchWeakness])

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
        setResultDetail({
          result: result as ExamResult,
          questions: questions as ExamQuestion[],
        })
        setResultId(result.id)
        setCurrentView('result')
      } else {
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
      const csrfToken = await fetchCsrfToken()
      const res = await fetch('/api/mcq-exam-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
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
        fetchOverview()
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
      const csrfToken = await fetchCsrfToken()
      const res = await fetch('/api/mcq-exam-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({
          action: 'submit-exam',
          setId: activeSetId,
          resultId: examResult.id,
          answers,
        }),
      })

      const json = await res.json()
      if (json.success) {
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

  const toggleMarkForReview = (mcqId: string) => {
    setMarkedForReview((prev) => ({ ...prev, [mcqId]: !prev[mcqId] }))
  }

  const handleExamBack = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrentView('detail')
  }, [])

  const handleResultBack = useCallback(() => {
    setCurrentView('detail')
    setResultDetail(null)
  }, [])

  const handleResultStartExam = useCallback((setId: string) => {
    setCurrentView('detail')
    setResultDetail(null)
    handleStartExam(setId)
  }, [handleStartExam])

  const handleOpenRetakeDialog = useCallback((setId: string) => {
    setRetakeSetId(setId)
    setRetakeReason('')
    setRetakeDialogOpen(true)
  }, [])

  const handleOpenPurchaseDialog = useCallback(() => {
    setPurchaseDialogOpen(true)
  }, [])

  const handleNavigateToLogin = useCallback(() => {
    navigate('login')
  }, [navigate])

  const handlePurchaseClick = useCallback(() => {
    if (!isAuthenticated) {
      navigate('login')
      return
    }
    setPurchaseDialogOpen(true)
  }, [isAuthenticated, navigate])

  const reviewedCount = useMemo(
    () => Object.values(markedForReview).filter(Boolean).length,
    [markedForReview]
  )

  const currentQuestion = useMemo(
    () => examQuestions[currentIndex],
    [examQuestions, currentIndex]
  )

  useEffect(() => {
    if (currentView !== 'exam' || !currentQuestion) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      const options = ['A', 'B', 'C', 'D'] as const
      const key = e.key.toUpperCase()
      if (options.includes(key as (typeof options)[number])) {
        e.preventDefault()
        handleSelectOption(currentQuestion.mcqId, key)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentView, currentQuestion, handleSelectOption, handleNext, handlePrev])

  useEffect(() => {
    if (currentView !== 'exam') return
    if (timeRemaining <= 60 && timeRemaining > 0 && !timerWarnedRef.current) {
      timerWarnedRef.current = true
      toast({
        title: '⏰ সময় শেষ হতে চলেছে!',
        description: `আর মাত্র ${toBengaliNumerals(timeRemaining)} সেকেন্ড বাকি আছে`,
        variant: 'destructive',
      })
    }
    if (timeRemaining > 60) {
      timerWarnedRef.current = false
    }
  }, [currentView, timeRemaining])

  const answeredCount = useMemo(
    () => examQuestions.filter((q) => answers[q.mcqId]).length,
    [examQuestions, answers]
  )

  const progressPercent = useMemo(
    () => (examQuestions.length > 0 ? (answeredCount / examQuestions.length) * 100 : 0),
    [answeredCount, examQuestions.length]
  )

  const computeSetStatusInfo = useCallback(
    (set: ExamSet): SetStatusInfo => getSetStatusInfo(set, examSetStatuses),
    [examSetStatuses]
  )

  const selectedAnswer = useMemo(
    () => currentQuestion ? answers[currentQuestion.mcqId] : undefined,
    [currentQuestion, answers]
  )

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return <LoadingSkeleton />
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
    return (
      <ExamActiveView
        examSetInfo={examSetInfo}
        examQuestions={examQuestions}
        currentIndex={currentIndex}
        answers={answers}
        markedForReview={markedForReview}
        timeRemaining={timeRemaining}
        submitting={submitting}
        submitDialogOpen={submitDialogOpen}
        answeredCount={answeredCount}
        progressPercent={progressPercent}
        reviewedCount={reviewedCount}
        currentQuestion={currentQuestion}
        selectedAnswer={selectedAnswer}
        onSelectOption={handleSelectOption}
        onNext={handleNext}
        onPrev={handlePrev}
        onToggleMarkForReview={toggleMarkForReview}
        onSetCurrentIndex={setCurrentIndex}
        onSubmitDialogOpen={handleSubmitDialogOpen}
        onSetSubmitDialogOpen={setSubmitDialogOpen}
        handleSubmitExam={handleSubmitExam}
        onBack={handleExamBack}
      />
    )
  }

  // ─── Result View ────────────────────────────────────────────────────────

  if (currentView === 'result' && resultDetail) {
    return (
      <ExamResultView
        resultDetail={resultDetail}
        activeSetId={activeSetId}
        examSetStatuses={examSetStatuses}
        resultStatusFilter={resultStatusFilter}
        resultChapterFilter={resultChapterFilter}
        onBack={handleResultBack}
        onSetResultStatusFilter={setResultStatusFilter}
        onSetResultChapterFilter={setResultChapterFilter}
        onStartExam={handleResultStartExam}
        onOpenRetakeDialog={handleOpenRetakeDialog}
        onRefreshOverview={fetchOverview}
      />
    )
  }

  // ─── Detail View ────────────────────────────────────────────────────────

  return (
    <div>
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
        <PackageInfoCard
          pkgDetail={pkgDetail}
          purchased={purchased}
          accessSource={accessSource}
          onPurchaseClick={handlePurchaseClick}
        />

        {purchased && pkgDetail.examSets.some((s) => isToday(s.scheduledDate)) && (() => {
          const todaySet = pkgDetail.examSets.find((s) => isToday(s.scheduledDate))!
          return (
            <TodayExamCard
              todaySet={todaySet}
              statusInfo={computeSetStatusInfo(todaySet)}
              todayCountdown={todayCountdown}
              examLoading={examLoading}
              examSetStatuses={examSetStatuses}
              onStartExam={handleStartExam}
              onViewResult={handleViewResult}
            />
          )
        })()}

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

        {detailTab === 'exams' && (
          <ExamSetList
            examSets={pkgDetail.examSets}
            getSetStatusInfo={computeSetStatusInfo}
            examSetStatuses={examSetStatuses}
            purchased={purchased}
            pkgDetail={pkgDetail}
            examLoading={examLoading}
            onStartExam={handleStartExam}
            onViewResult={handleViewResult}
            onFetchLeaderboard={fetchLeaderboard}
            onSetDetailTab={setDetailTab}
            onOpenRetakeDialog={handleOpenRetakeDialog}
            onOpenPurchaseDialog={handleOpenPurchaseDialog}
            onNavigateToLogin={handleNavigateToLogin}
            isAuthenticated={isAuthenticated}
            markedForReview={markedForReview}
            currentQuestion={currentQuestion}
            onToggleMarkForReview={toggleMarkForReview}
          />
        )}

        {detailTab === 'analysis' && (
          <ExamAnalysisTab
            purchased={purchased}
            weakness={weakness}
            weaknessLoading={weaknessLoading}
          />
        )}

        {detailTab === 'leaderboard' && (
          <ExamLeaderboardTab
            examSets={pkgDetail.examSets}
            leaderboardSetId={leaderboardSetId}
            leaderboardLoading={leaderboardLoading}
            leaderboardData={leaderboardData}
            leaderboardMyRank={leaderboardMyRank}
            user={user}
            onFetchLeaderboard={fetchLeaderboard}
          />
        )}
      </div>

      <RetakeSection
        retakeHistory={retakeHistory}
        retakeHistoryOpen={retakeHistoryOpen}
        onRetakeHistoryOpenChange={setRetakeHistoryOpen}
        retakeDialogOpen={retakeDialogOpen}
        onRetakeDialogOpenChange={setRetakeDialogOpen}
        retakeReason={retakeReason}
        onRetakeReasonChange={setRetakeReason}
        retakeSubmitting={retakeSubmitting}
        onSubmitRetake={handleRequestRetake}
      />

      <MCQExamPackagePurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={(open) => {
          setPurchaseDialogOpen(open)
          if (!open) {
            fetchOverview()
          }
        }}
        packageDetail={pkgDetail}
      />
    </div>
  )
}
