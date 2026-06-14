'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Home, RotateCcw, CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronUp, Clock, Target, BarChart3 } from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { useExamStore } from '@/store/exam'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { cn } from '@/lib/utils'

interface QuestionResult {
  id: string
  text: string
  options: { key: string; text: string; image?: string | null }[]
  correctAnswer: string
  userAnswer: string | undefined
  explanation: string
  explanationImage?: string | null
  questionImage?: string | null
  isCorrect: boolean
  isSkipped: boolean
}

// Circular progress component
function CircularProgress({ value, size = 120, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className="text-muted"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className={value >= 60 ? 'text-emerald-500' : value >= 40 ? 'text-amber-500' : 'text-destructive'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
           transition={{ duration: 1.5, ease: 'easeOut' } as const}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {value}%
        </motion.span>
      </div>
    </div>
  )
}

function getGrade(percentage: number): { grade: string; label: string; color: string } {
  if (percentage >= 80) return { grade: 'A+', label: 'অসাধারণ', color: 'text-emerald-500' }
  if (percentage >= 70) return { grade: 'A', label: 'চমৎকার', color: 'text-emerald-500' }
  if (percentage >= 60) return { grade: 'A-', label: 'ভালো', color: 'text-teal-500' }
  if (percentage >= 50) return { grade: 'B', label: 'মোটামুটি', color: 'text-amber-500' }
  if (percentage >= 40) return { grade: 'C', label: 'প্রয়োজনীয় উন্নতি', color: 'text-orange-500' }
  return { grade: 'F', label: 'আবার চেষ্টা করুন', color: 'text-destructive' }
}

export default function MCQResultPage() {
  const { params, navigate, goBack } = useRouterStore()
  const { answers, resetExam, timeRemaining, currentExamId, questionIds, examDuration: storeExamDuration } = useExamStore()
  const { user } = useAuthStore()
  const [questions, setQuestions] = useState<QuestionResult[]>([])
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [resultStatusFilter, setResultStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const chapterId = params.chapterId || ''
        const examIdParam = params.examId || ''
        const subjectId = params.subjectId || ''
        const classSlug = params.classSlug || ''

        let rawQuestions: { id: string; text: string; options: { key: string; text: string }[]; correctAnswer: string; explanation: string; questionImage?: string | null; explanationImage?: string | null; isPremium?: boolean }[] = []

        // Case 1: Exam-based — fetch questions from exam API (with answers for result review)
        if (examIdParam && !chapterId) {
          try {
            const examRes = await fetch(`/api/exams/${examIdParam}?showAnswers=true`)
            if (examRes.ok) {
              const examData = await examRes.json()
              const examObj = examData.data?.exam || examData.exam
              if (examObj && examObj.questions) {
                rawQuestions = examObj.questions
              }
            }
          } catch {
            // Fall through
          }
        }

        // Case 2: Chapter-based
        if (rawQuestions.length === 0 && chapterId) {
          const res = await fetch(`/api/mcq?chapterId=${chapterId}&limit=9999`)
          if (res.ok) {
            const data = await res.json()
            rawQuestions = data.data?.questions || data.questions || data
          }
        }

        // Case 3: Subject-based
        if (rawQuestions.length === 0 && subjectId) {
          const res = await fetch(`/api/mcq?subjectId=${subjectId}&limit=9999`)
          if (res.ok) {
            const data = await res.json()
            rawQuestions = data.data?.questions || data.questions || data
          }
        }

        // Case 4: Class-based
        if (rawQuestions.length === 0 && classSlug) {
          const res = await fetch(`/api/mcq?classLevel=${classSlug}&limit=9999`)
          if (res.ok) {
            const data = await res.json()
            rawQuestions = data.data?.questions || data.questions || data
          }
        }

        if (rawQuestions.length > 0) {
          // Step 1: Filter to only include questions that were part of the exam
          // (excludes premium questions that were filtered out during the exam)
          let filteredQuestions = questionIds.length > 0
            ? rawQuestions.filter(q => questionIds.includes(q.id))
            : rawQuestions

          // Step 2: Apply premium filtering — same batch-check path for all users
          // Non-logged-in users: batch-check returns purchased:false → all premium removed
          // Logged-in free users: batch-check returns purchased:false → all premium removed
          // Logged-in premium/purchased users: batch-check returns purchased:true → keep purchased items
          const premiumQuestions = filteredQuestions.filter(q => q.isPremium)
          if (premiumQuestions.length > 0) {
            try {
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
                const unpurchasedPremiumIds = new Set<string>()
                for (const item of items) {
                  if (!item.purchased) unpurchasedPremiumIds.add(item.contentId)
                }
                if (unpurchasedPremiumIds.size > 0) {
                  filteredQuestions = filteredQuestions.filter(q => !unpurchasedPremiumIds.has(q.id))
                }
              } else {
                // If batch check fails, remove all premium questions (fail closed)
                filteredQuestions = filteredQuestions.filter(q => !q.isPremium)
              }
            } catch {
              // If batch check fails, remove all premium questions (fail closed)
              filteredQuestions = filteredQuestions.filter(q => !q.isPremium)
            }
          }

          const mapped = filteredQuestions.map((q) => ({
            id: q.id,
            text: q.text,
            questionImage: q.questionImage,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: answers[q.id],
            explanation: q.explanation,
            explanationImage: q.explanationImage,
            isCorrect: answers[q.id] === q.correctAnswer,
            isSkipped: !answers[q.id],
          }))
          setQuestions(mapped)
        }
      } catch {
        // No data available
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [answers, params.chapterId, params.examId, params.subjectId, params.classSlug, questionIds, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Trophy className="size-16 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">ফলাফল হিসাব করা হচ্ছে...</p>
        </motion.div>
      </div>
    )
  }

  const correctCount = questions.filter((q) => q.isCorrect).length
  const wrongCount = questions.filter((q) => !q.isCorrect && !q.isSkipped).length
  const skippedCount = questions.filter((q) => q.isSkipped).length
  const totalQuestions = questions.length
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  // Calculate time taken from exam store's initial duration
  // Use the actual exam duration from the store if available (set when exam starts)
  // Otherwise fall back to 1 min per question for practice mode
  const initialDurationSeconds = storeExamDuration ? storeExamDuration * 60 : totalQuestions * 60
  const timeTaken = Math.max(0, initialDurationSeconds - timeRemaining)
  const minutesTaken = Math.floor(timeTaken / 60)
  const secondsTaken = timeTaken % 60
  const gradeInfo = getGrade(percentage)

  return (
    <div className="pb-24 sm:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <Trophy className="size-12 mx-auto mb-3" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-1">পরীক্ষার ফলাফল</h1>
              <p className="text-emerald-100">MCQ পরীক্ষা সম্পন্ন</p>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                {/* Circular Progress */}
                <CircularProgress value={percentage} />

                {/* Grade & Stats */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                    <span className={`text-4xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                    <span className="text-lg text-muted-foreground">—</span>
                    <span className="text-lg font-medium">{gradeInfo.label}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <p className="text-2xl font-bold">{correctCount}</p>
                      <p className="text-xs text-muted-foreground">সঠিক</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                        <XCircle className="size-4" />
                      </div>
                      <p className="text-2xl font-bold">{wrongCount}</p>
                      <p className="text-xs text-muted-foreground">ভুল</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                        <MinusCircle className="size-4" />
                      </div>
                      <p className="text-2xl font-bold">{skippedCount}</p>
                      <p className="text-xs text-muted-foreground">স্কিপ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground justify-center sm:justify-start">
                    <Clock className="size-4" />
                    <span>সময়: {minutesTaken} মিনিট {secondsTaken} সেকেন্ড</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="border-border/50">
            <CardContent className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="size-5 text-primary" />
                পারফরম্যান্স বিশ্লেষণ
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-emerald-600">সঠিক</span>
                    <span>{correctCount}/{totalQuestions}</span>
                  </div>
                  <Progress value={(correctCount / totalQuestions) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-destructive">ভুল</span>
                    <span>{wrongCount}/{totalQuestions}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-destructive rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(wrongCount / totalQuestions) * 100}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-amber-500">স্কিপ</span>
                    <span>{skippedCount}/{totalQuestions}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(skippedCount / totalQuestions) * 100}%` }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 mb-8"
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="size-5 text-primary" />
            প্রশ্ন পর্যালোচনা
          </h3>

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

          <div className="space-y-2">
            {questions
              .filter((q) => {
                if (resultStatusFilter === 'all') return true
                if (resultStatusFilter === 'correct') return q.isCorrect
                if (resultStatusFilter === 'wrong') return !q.isCorrect && !q.isSkipped
                if (resultStatusFilter === 'skipped') return q.isSkipped
                return true
              })
              .map((q, i) => (
              <Card key={q.id} className="border-border/50">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center size-8 rounded-full shrink-0 ${
                        q.isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                          : q.isSkipped
                          ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {q.isCorrect ? <CheckCircle2 className="size-4" /> : q.isSkipped ? <MinusCircle className="size-4" /> : <XCircle className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <RichContentRenderer content={`প্রশ্ন ${i + 1}: ${q.text.slice(0, 80)}...`} className="text-sm font-medium" inline />
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={q.isCorrect ? 'default' : 'destructive'} className="text-xs">
                            {q.isCorrect ? 'সঠিক' : q.isSkipped ? 'স্কিপ' : 'ভুল'}
                          </Badge>
                          {q.userAnswer && (
                            <span className="text-xs text-muted-foreground">আপনার উত্তর: {q.userAnswer}</span>
                          )}
                        </div>
                      </div>
                      {expandedQuestion === q.id ? (
                        <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </button>

                {expandedQuestion === q.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 pb-4"
                  >
                    <Separator className="mb-3" />
                    <div className="space-y-2 text-sm pl-11">
                      <RichContentRenderer content={q.text} className="font-medium" />
                      {q.questionImage && (
                        <SafeImage
                          src={q.questionImage}
                          alt="প্রশ্ন চিত্র"
                          className="max-w-full rounded-lg border max-h-40"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-2 rounded-lg text-xs ${
                              opt.key === q.correctAnswer
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                                : opt.key === q.userAnswer && opt.key !== q.correctAnswer
                                ? 'bg-destructive/10 border border-destructive/20'
                                : 'bg-muted/50 border border-border'
                            }`}
                          >
                            <span className="font-semibold">{opt.key}.</span> <RichContentRenderer content={opt.text} inline />
                            {opt.image && (
                              <SafeImage src={opt.image} alt={`অপশন ${opt.key}`} className="max-w-full rounded-lg border max-h-16 mt-1" />
                            )}
                            {opt.key === q.correctAnswer && (
                              <CheckCircle2 className="inline size-3 text-emerald-500 ml-1" />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
                        <span className="text-xs font-medium text-muted-foreground shrink-0">ব্যাখ্যা:</span>
                        <RichContentRenderer content={q.explanation} className="text-xs flex-1 inline" />
                        {q.explanationImage && (
                          <SafeImage src={q.explanationImage} alt="ব্যাখ্যা চিত্র" className="mt-1 max-w-full rounded-lg border max-h-32" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 mb-24 sm:mb-8 flex flex-col sm:flex-row gap-3"
        >
          <Button
            className="flex-1 gap-2"
            onClick={() => {
              resetExam()
              navigate('mcq-exam', {
                chapterId: params.chapterId || undefined,
                subjectId: params.subjectId || undefined,
                classSlug: params.classSlug || undefined,
                examId: params.examId || undefined,
              })
            }}
          >
            <RotateCcw className="size-4" />
            আবার চেষ্টা করুন
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              resetExam()
              // If came from board questions, return there with preserved state
              const src = params.source || ''
              const yr = params.year || ''
              const brd = params.boardName || ''
              if (src === 'board' && yr && brd) {
                navigate('board-questions', { year: yr, boardName: brd })
              } else {
                goBack()
              }
            }}
          >
            <Home className="size-4" />
            ফিরে যান
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
