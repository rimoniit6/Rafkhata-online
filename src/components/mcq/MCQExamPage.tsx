'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, ChevronLeft, ChevronRight, SkipForward, CheckCircle2,
  Circle, AlertCircle, Send, BookOpen, ArrowLeft, Layers
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useExamStore } from '@/store/exam'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'

interface MCQQuestion {
  id: string
  text: string
  questionImage?: string | null
  options: { key: string; text: string; image?: string | null }[]
  correctAnswer?: string
  explanation?: string
  explanationImage?: string | null
  isPremium?: boolean
  price?: number
}

type ExamMode = 'practice' | 'exam'

// Batch size for question palette grouping
const BATCH_SIZE = 20

export default function MCQExamPage() {
  const { params, navigate, goBack } = useRouterStore()
  const { startExam, setAnswer, setTimeRemaining, endExam, resetExam, answers, timeRemaining, isExamActive, currentExamId, setQuestionIds } = useExamStore()
  const { user } = useAuthStore()
  const [questions, setQuestions] = useState<MCQQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mode, setMode] = useState<ExamMode>('exam')
  const [showPalette, setShowPalette] = useState(false)
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set())
  const [showExplanation, setShowExplanation] = useState<string | null>(null)
  const [examTitle, setExamTitle] = useState<string>('MCQ পরীক্ষা')
  const [paletteBatch, setPaletteBatch] = useState(0) // Which batch is shown in palette

  const chapterId = params.chapterId || ''
  const mcqId = params.mcqId || ''
  const examIdParam = params.examId || ''
  const classSlug = params.classSlug || ''
  const subjectId = params.subjectId || ''
  const source = params.source || ''
  const paramYear = params.year || ''
  const paramBoard = params.boardName || ''
  const paramClassLevel = params.classLevel || ''
  const examId = examIdParam ? `exam-${examIdParam}` : `exam-${chapterId || classSlug || subjectId || paramBoard || '1'}`
  const [examDuration, setExamDuration] = useState(0) // 0 = will be set to 1 min per question after loading
  const [examMarksPerMcq, setExamMarksPerMcq] = useState(1)
  const [examNegativeMarks, setExamNegativeMarks] = useState(0)

  // ─── Batch calculations ────────────────────────────────────────
  const totalBatches = useMemo(() => Math.ceil(questions.length / BATCH_SIZE), [questions.length])
  const currentBatch = useMemo(() => Math.floor(currentIndex / BATCH_SIZE), [currentIndex])
  const currentBatchRange = useMemo(() => {
    const start = currentBatch * BATCH_SIZE + 1
    const end = Math.min((currentBatch + 1) * BATCH_SIZE, questions.length)
    return { start, end }
  }, [currentBatch, questions.length])

  // Sync palette batch with current question batch
  useEffect(() => {
    setPaletteBatch(currentBatch)
  }, [currentBatch])

  // Handle back navigation - return to board questions with preserved state
  const handleGoBack = useCallback(() => {
    if (source === 'board' && paramYear && paramBoard) {
      navigate('board-questions', { year: paramYear, boardName: paramBoard, classLevel: paramClassLevel })
    } else {
      goBack()
    }
  }, [source, paramYear, paramBoard, paramClassLevel, navigate, goBack])

  // Fetch questions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Case 0: Board question practice (from BoardQuestionsPage "সকল ফ্রি MCQ প্র্যাকটিস শুরু করুন" button)
        if (source === 'board' && paramYear && paramBoard && !mcqId) {
          try {
            const queryParams = new URLSearchParams({
              board: paramBoard,
              year: paramYear,
              limit: '9999',
            })
            if (paramClassLevel) queryParams.set('classLevel', paramClassLevel)
            const res = await fetch(`/api/mcq?${queryParams}`)
            if (res.ok) {
              const data = await res.json()
              const loadedQuestions = data.data?.questions || data.questions || data
              if (loadedQuestions.length > 0) {
                setQuestions(loadedQuestions)
                setExamDuration(loadedQuestions.length) // 1 min per question
                setMode('practice')
                setExamTitle(`বোর্ড প্রশ্ন - ${paramYear} প্র্যাকটিস`)
                return
              }
            }
          } catch {
            // Fall through to other cases
          }
        }

        // Case 1: Navigated with mcqId (from board questions or purchased content) — look up MCQ's chapter first
        if (mcqId && !chapterId) {
          try {
            const mcqRes = await fetch(`/api/mcq/${mcqId}`)
            if (mcqRes.ok) {
              const mcqData = await mcqRes.json()
              const resolvedChapterId = mcqData.chapterId || mcqData.data?.chapterId
              if (resolvedChapterId) {
                // Load all MCQs for that chapter
                const res = await fetch(`/api/mcq?chapterId=${resolvedChapterId}&limit=9999`)
                if (res.ok) {
                  const data = await res.json()
                  const allQuestions: MCQQuestion[] = (data.data?.questions || data.questions || data)
                  if (allQuestions.length > 0) {
                    setQuestions(allQuestions)
                    setExamDuration(allQuestions.length) // 1 min per question
                    // Find and set the index to the target MCQ
                    const targetIdx = allQuestions.findIndex((q: MCQQuestion) => q.id === mcqId)
                    if (targetIdx >= 0) setCurrentIndex(targetIdx)
                    // Default to practice mode when navigating from purchased content
                    setMode('practice')
                    setExamTitle('MCQ প্র্যাকটিস')
                    return
                  }
                }
              }
              // Fallback: chapter not found or chapter has no MCQs — use the single MCQ we already fetched
              const singleMcq: MCQQuestion = {
                id: mcqData.id,
                text: mcqData.text,
                options: mcqData.options || [],
                correctAnswer: mcqData.correctAnswer,
                explanation: mcqData.explanation || '',
                isPremium: mcqData.isPremium || false,
                price: mcqData.price || 0,
              }
              setQuestions([singleMcq])
              setExamDuration(1)
              setMode('practice')
              setExamTitle('MCQ প্র্যাকটিস')
              return
            }
          } catch {
            // Fall through to chapter-based
          }
        }

        // Case 2: Navigated with examId (from Exam Center)
        if (examIdParam && !chapterId && !mcqId) {
          try {
            const examRes = await fetch(`/api/exams/${examIdParam}`)
            if (examRes.ok) {
              const examData = await examRes.json()
              const examObj = examData.data?.exam || examData.exam
              if (examObj && examObj.questions && examObj.questions.length > 0) {
                setQuestions(examObj.questions)
                setExamTitle(examObj.title || 'পরীক্ষা')
                if (examObj.duration) setExamDuration(examObj.duration)
                if (examObj.marksPerMcq) setExamMarksPerMcq(examObj.marksPerMcq)
                if (examObj.negativeMarks !== undefined) setExamNegativeMarks(examObj.negativeMarks)
                return
              }
            }
          } catch {
            // Fall through to chapter-based
          }
        }

        // Case 3: Standard chapter-based loading
        if (chapterId) {
          const res = await fetch(`/api/mcq?chapterId=${chapterId}&limit=9999`)
          if (!res.ok) throw new Error('Failed')
          const data = await res.json()
          const loadedQuestions = data.data?.questions || data.questions || data
          if (loadedQuestions.length > 0) {
            setQuestions(loadedQuestions)
            setExamDuration(loadedQuestions.length) // 1 min per question
            return
          }
        }

        // Case 4: Subject-based loading (from SubjectDetailPage)
        if (subjectId && !chapterId && !mcqId && !examIdParam) {
          const res = await fetch(`/api/mcq?subjectId=${subjectId}&limit=9999`)
          if (res.ok) {
            const data = await res.json()
            const loadedQuestions = data.data?.questions || data.questions || data
            if (loadedQuestions.length > 0) {
              setQuestions(loadedQuestions)
              setExamDuration(loadedQuestions.length) // 1 min per question
              setExamTitle('MCQ প্র্যাকটিস')
              setMode('practice')
              return
            }
          }
        }

        // Case 5: Class-based loading (from MCQPracticeSection)
        if (classSlug && !chapterId && !mcqId && !examIdParam && !subjectId) {
          const res = await fetch(`/api/mcq?classLevel=${classSlug}&limit=9999`)
          if (res.ok) {
            const data = await res.json()
            const loadedQuestions = data.data?.questions || data.questions || data
            if (loadedQuestions.length > 0) {
              setQuestions(loadedQuestions)
              setExamDuration(loadedQuestions.length) // 1 min per question
              setExamTitle('MCQ প্র্যাকটিস')
              setMode('practice')
              return
            }
          }
        }

        // No demo data - show empty state instead
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [chapterId, mcqId, examIdParam, classSlug, subjectId, source, paramYear, paramBoard, paramClassLevel])

  // ─── Filter out unpurchased premium MCQs ─────────────────────
  // Both non-logged-in and logged-in free users follow the same path:
  // batch-check returns purchased:false for all premium items → all removed
  // Logged-in users with purchases keep those purchased items
  // Uses a ref to prevent re-triggering after filtering is done
  const premiumFilteredRef = useRef(false)
  useEffect(() => {
    if (questions.length === 0 || premiumFilteredRef.current) return

    const premiumQuestions = questions.filter(q => q.isPremium)
    if (premiumQuestions.length === 0) return // No premium content to filter

    const filterPremium = async () => {
      try {
        // Batch check purchase status for all premium questions
        // For non-logged-in users, the API returns purchased:false for all items
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumQuestions.map(q => ({
              contentType: 'mcq',
              contentId: q.id,
            })),
          }),
        })

        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []

          // Build set of unpurchased premium IDs
          const unpurchasedPremiumIds = new Set<string>()
          for (const item of items) {
            if (!item.purchased) {
              unpurchasedPremiumIds.add(item.contentId)
            }
          }

          // Filter out unpurchased premium MCQs and adjust currentIndex
          if (unpurchasedPremiumIds.size > 0) {
            setQuestions(prev => {
              const filtered = prev.filter(q => !unpurchasedPremiumIds.has(q.id))
              // Re-locate the target mcqId in the filtered array, or clamp currentIndex
              if (mcqId) {
                const newIdx = filtered.findIndex(q => q.id === mcqId)
                if (newIdx >= 0) {
                  setCurrentIndex(newIdx)
                } else {
                  // mcqId was filtered out — clamp to valid range
                  setCurrentIndex(prevIdx => Math.min(prevIdx, filtered.length - 1))
                }
              } else {
                // No specific mcqId — just clamp currentIndex to valid range
                setCurrentIndex(prevIdx => Math.min(prevIdx, filtered.length - 1))
              }
              return filtered
            })
          }
          premiumFilteredRef.current = true
        }
      } catch {
        // If batch check fails, remove all premium questions (fail closed)
        setQuestions(prev => {
          const filtered = prev.filter(q => !q.isPremium)
          if (mcqId) {
            const newIdx = filtered.findIndex(q => q.id === mcqId)
            if (newIdx >= 0) {
              setCurrentIndex(newIdx)
            } else {
              setCurrentIndex(prevIdx => Math.min(prevIdx, filtered.length - 1))
            }
          } else {
            setCurrentIndex(prevIdx => Math.min(prevIdx, filtered.length - 1))
          }
          return filtered
        })
        premiumFilteredRef.current = true
      }
    }

    filterPremium()
  }, [questions.length, user?.id, mcqId])

  // Sync question IDs to exam store (after premium filtering is done)
  useEffect(() => {
    if (!loading && questions.length > 0) {
      setQuestionIds(questions.map(q => q.id))
    }
  }, [loading, questions, setQuestionIds])

  // Start exam
  useEffect(() => {
    if (!loading && questions.length > 0) {
      if (!isExamActive || currentExamId !== examId) {
        startExam(examId, examDuration)
      }
      setVisitedQuestions((prev) => new Set([...prev, questions[0]?.id]))
    }
  }, [loading, questions, examDuration])

  // Timer
  useEffect(() => {
    if (!isExamActive || mode === 'practice') return
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [isExamActive, setTimeRemaining, mode])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const answeredCount = questions.filter((q) => answers[q.id]).length
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  const advanceToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setVisitedQuestions((prev) => new Set([...prev, questions[nextIndex].id]))
      setShowExplanation(null)
    }
  }, [currentIndex, questions.length, setCurrentIndex, setVisitedQuestions, setShowExplanation])

  const handleSelectOption = useCallback(
    (optionKey: string) => {
      if (!currentQuestion) return
      setAnswer(currentQuestion.id, optionKey)
      if (mode === 'practice') {
        setShowExplanation(currentQuestion.id)
      }
      advanceToNext()
    },
    [currentQuestion, mode, setAnswer, setShowExplanation, advanceToNext]
  )

  const handleNext = useCallback(() => {
    advanceToNext()
  }, [advanceToNext])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowExplanation(null)
    }
  }, [currentIndex, setCurrentIndex, setShowExplanation])

  const handleSkip = useCallback(() => {
    advanceToNext()
  }, [advanceToNext])

  const handleSubmit = async () => {
    // Save exam result to database if this is a real exam (not practice mode)
    if (examIdParam) {
      try {
        let correct = 0
        let wrong = 0
        for (const q of questions) {
          const ua = answers[q.id]
          if (!ua) continue
          if (ua === q.correctAnswer) correct++
          else wrong++
        }
        const score = correct * examMarksPerMcq - wrong * examNegativeMarks
        const totalMarks = questions.length * examMarksPerMcq
        const initialDurationSeconds = examDuration ? examDuration * 60 : questions.length * 60
        const timeTaken = Math.max(0, initialDurationSeconds - timeRemaining)

        await fetch('/api/exams/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: examIdParam,
            score: Math.max(0, score),
            totalMarks,
            timeTaken,
            answers,
          }),
        })
      } catch {
        // Don't block navigation on save failure
      }
    }

    endExam()
    navigate('mcq-result', {
      examId: examIdParam || undefined,
      chapterId: chapterId || undefined,
      subjectId: params.subjectId || undefined,
      classSlug: params.classSlug || undefined,
      source: source || undefined,
      year: paramYear || undefined,
      boardName: paramBoard || undefined,
    })
  }

  // ─── Batch-aware question palette ────────────────────────────
  const getBatchQuestions = useMemo(() => {
    const start = paletteBatch * BATCH_SIZE
    const end = Math.min(start + BATCH_SIZE, questions.length)
    return questions.slice(start, end).map((q, i) => ({ q, globalIndex: start + i }))
  }, [paletteBatch, questions])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-12 mb-4" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">কোনো প্রশ্ন পাওয়া যায়নি</p>
          <Button onClick={handleGoBack} variant="outline">ফিরে যান</Button>
        </Card>
      </div>
    )
  }

  const getOptionStyle = (optionKey: string) => {
    const isSelected = selectedAnswer === optionKey
    const isCorrect = mode === 'practice' && showExplanation === currentQuestion?.id && currentQuestion?.correctAnswer && optionKey === currentQuestion?.correctAnswer
    const isWrong = mode === 'practice' && showExplanation === currentQuestion?.id && isSelected && currentQuestion?.correctAnswer && optionKey !== currentQuestion?.correctAnswer

    if (isCorrect) return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
    if (isWrong) return 'border-destructive bg-destructive/10 text-destructive'
    if (isSelected) return 'border-primary bg-primary/10 text-primary'
    return 'border-border hover:border-primary/50 hover:bg-muted/50'
  }

  // Batch navigation indicator for the header
  const BatchIndicator = () => {
    if (totalBatches <= 1) return null
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Layers className="size-3.5" />
        <span>
          ব্যাচ {currentBatch + 1}/{totalBatches}
        </span>
        <span className="text-muted-foreground/60">
          (প্রশ্ন {currentBatchRange.start}-{currentBatchRange.end})
        </span>
      </div>
    )
  }

  // Question palette component (shared between desktop and mobile)
  const QuestionPalette = () => (
    <>
      {/* Batch navigation */}
      {totalBatches > 1 && (
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            disabled={paletteBatch === 0}
            onClick={() => setPaletteBatch(prev => Math.max(0, prev - 1))}
          >
            <ChevronLeft className="size-3" />
            আগের
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            {paletteBatch + 1}/{totalBatches}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            disabled={paletteBatch >= totalBatches - 1}
            onClick={() => setPaletteBatch(prev => Math.min(totalBatches - 1, prev + 1))}
          >
            পরের
            <ChevronRight className="size-3" />
          </Button>
        </div>
      )}

      {/* Question number grid */}
      <div className="grid grid-cols-5 gap-2">
        {getBatchQuestions.map(({ q, globalIndex }) => {
          const isAnswered = !!answers[q.id]
          const isVisited = visitedQuestions.has(q.id)
          const isCurrent = globalIndex === currentIndex
          return (
            <button
              key={q.id}
              className={`flex items-center justify-center size-9 rounded-lg text-sm font-medium transition-colors ${
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : isAnswered
                  ? 'bg-emerald-500 text-white'
                  : isVisited
                  ? 'bg-amber-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => {
                setCurrentIndex(globalIndex)
                setVisitedQuestions((prev) => new Set([...prev, q.id]))
                setShowExplanation(null)
                setPaletteBatch(Math.floor(globalIndex / BATCH_SIZE))
              }}
            >
              {globalIndex + 1}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <div>
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <p className="font-medium text-sm">{examTitle}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {answeredCount}/{questions.length} উত্তর দেওয়া হয়েছে
                </p>
                <BatchIndicator />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  mode === 'exam' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'
                }`}
                onClick={() => setMode('exam')}
              >
                পরীক্ষা
              </button>
              <button
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  mode === 'practice' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'
                }`}
                onClick={() => setMode('practice')}
              >
                প্র্যাকটিস
              </button>
            </div>

            {/* Timer */}
            <Badge variant={timeRemaining < 300 ? 'destructive' : 'secondary'} className="gap-1.5 tabular-nums">
              <Clock className="size-3.5" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1 rounded-none" />
      </div>

      {/* Main */}
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
                      <span className="text-xs text-muted-foreground">/ {questions.length}</span>
                      {/* Batch indicator inside question */}
                      {totalBatches > 1 && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Layers className="size-3" />
                          ব্যাচ {currentBatch + 1}
                        </Badge>
                      )}
                      {mode === 'practice' && showExplanation === currentQuestion?.id && currentQuestion?.correctAnswer && (
                        <Badge className={
                          selectedAnswer === currentQuestion?.correctAnswer
                            ? 'bg-emerald-500'
                            : 'bg-destructive'
                        }>
                          {selectedAnswer === currentQuestion?.correctAnswer ? 'সঠিক!' : 'ভুল!'}
                        </Badge>
                      )}
                    </div>

                    {/* Question Text */}
                    <RichContentRenderer content={currentQuestion?.text || ''} className="text-lg font-medium mb-6 leading-relaxed" />
                    {currentQuestion?.questionImage && (
                      <div className="mb-4">
                        <SafeImage src={currentQuestion.questionImage} alt="প্রশ্ন চিত্র" className="max-w-full rounded-lg border max-h-64 mx-auto" />
                      </div>
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                      {currentQuestion?.options.map((option) => (
                        <button
                          key={option.key}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${getOptionStyle(option.key)}`}
                          onClick={() => handleSelectOption(option.key)}
                        >
                          <span className={`flex items-center justify-center size-8 rounded-full border-2 font-semibold text-sm shrink-0 ${
                            selectedAnswer === option.key
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-current'
                          }`}>
                            {option.key}
                          </span>
                          <RichContentRenderer content={option.text} inline className="text-sm sm:text-base" />
                          {option.image && (
                            <SafeImage src={option.image} alt={`অপশন ${option.key}`} className="ml-auto max-w-full rounded-lg border max-h-20" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Explanation (Practice mode) */}
                    {mode === 'practice' && showExplanation === currentQuestion?.id && currentQuestion?.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                      >
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">ব্যাখ্যা:</p>
                        <RichContentRenderer content={currentQuestion?.explanation || ''} className="text-sm text-muted-foreground" />
                        {currentQuestion?.explanationImage && (
                          <SafeImage src={currentQuestion.explanationImage} alt="ব্যাখ্যা চিত্র" className="mt-2 max-w-full rounded-lg border max-h-48" />
                        )}
                      </motion.div>
                    )}
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
                <ChevronLeft className="size-4" />
                আগের
              </Button>

              <div className="flex gap-2 sm:hidden">
                <Button variant="ghost" size="icon" onClick={() => setShowPalette(!showPalette)}>
                  <BookOpen className="size-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleSkip} className="gap-1.5">
                  <SkipForward className="size-4" />
                  স্কিপ
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button onClick={handleNext} className="gap-2">
                    পরের
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Send className="size-4" />
                        জমা দিন
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>পরীক্ষা জমা দিন</DialogTitle>
                        <DialogDescription>
                          আপনি {answeredCount}টি প্রশ্নের উত্তর দিয়েছেন। {questions.length - answeredCount}টি প্রশ্ন বাকি আছে।
                          আপনি কি নিশ্চিতভাবে জমা দিতে চান?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2">
                        <DialogClose asChild>
                          <Button variant="outline">
                            বাতিল
                          </Button>
                        </DialogClose>
                        <Button onClick={handleSubmit}>জমা দিন</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Batch quick navigation (below question when >20 questions) */}
            {totalBatches > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">ব্যাচ:</span>
                {Array.from({ length: totalBatches }).map((_, i) => {
                  const batchStart = i * BATCH_SIZE + 1
                  const batchEnd = Math.min((i + 1) * BATCH_SIZE, questions.length)
                  const batchAnswered = questions.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE).filter(q => answers[q.id]).length
                  const isCurrentBatch = i === currentBatch
                  return (
                    <Button
                      key={i}
                      variant={isCurrentBatch ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs gap-1 px-2"
                      onClick={() => {
                        setPaletteBatch(i)
                        setCurrentIndex(i * BATCH_SIZE)
                        setVisitedQuestions((prev) => new Set([...prev, questions[i * BATCH_SIZE]?.id]))
                        setShowExplanation(null)
                      }}
                    >
                      {batchStart}-{batchEnd}
                      {batchAnswered > 0 && (
                        <span className="text-[10px] opacity-70">({batchAnswered})</span>
                      )}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Question Palette - Desktop */}
          <div className="hidden lg:block w-64">
            <Card className="sticky top-[5rem]">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">প্রশ্ন প্যালেট</h4>
                <QuestionPalette />
                <Separator className="my-3" />
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded bg-emerald-500" />
                    <span>উত্তর দেওয়া হয়েছে ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded bg-amber-500" />
                    <span>ভিজিট করা হয়েছে</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded bg-muted" />
                    <span>উত্তর দেওয়া হয়নি</span>
                  </div>
                </div>

                <Separator className="my-3" />

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2" size="sm">
                      <Send className="size-4" />
                      পরীক্ষা জমা দিন
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>পরীক্ষা জমা দিন</DialogTitle>
                      <DialogDescription>
                        আপনি {answeredCount}টি প্রশ্নের উত্তর দিয়েছেন। {questions.length - answeredCount}টি প্রশ্ন বাকি আছে।
                        আপনি কি নিশ্চিতভাবে জমা দিতে চান?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">বাতিল</Button>
                      </DialogClose>
                      <Button onClick={handleSubmit}>জমা দিন</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Question Palette Sheet */}
        {showPalette && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background border-t rounded-t-2xl p-4 shadow-lg lg:hidden max-h-[70vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">প্রশ্ন প্যালেট</h4>
              <Button variant="ghost" size="icon" onClick={() => setShowPalette(false)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <QuestionPalette />
            {/* Mobile batch navigation */}
            {totalBatches > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                {Array.from({ length: totalBatches }).map((_, i) => {
                  const batchStart = i * BATCH_SIZE + 1
                  const batchEnd = Math.min((i + 1) * BATCH_SIZE, questions.length)
                  return (
                    <Button
                      key={i}
                      variant={paletteBatch === i ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setPaletteBatch(i)}
                    >
                      {batchStart}-{batchEnd}
                    </Button>
                  )
                })}
              </div>
            )}
            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-emerald-500" />
                <span>উত্তর ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-amber-500" />
                <span>ভিজিট</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-muted" />
                <span>বাকি</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
