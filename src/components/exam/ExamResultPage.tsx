'use client'

import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useExamStore } from '@/store/exam'
import { useRouterStore, useRouteParams } from '@/store/router'
import { BarChart3,CheckCircle2,ChevronDown,ChevronUp,Clock,Home,MinusCircle,RotateCcw,Target,Trophy,XCircle } from 'lucide-react'

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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className={value >= 60 ? 'text-emerald-500' : value >= 40 ? 'text-amber-500' : 'text-destructive'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="animate-fade-in animate-scale-in text-3xl font-bold">
          {value}%
        </span>
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

export default function ExamResultPage() {
  const params = useRouteParams()
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const { answers, resetExam, timeRemaining, questionIds, examDuration: storeExamDuration } = useExamStore()
  const [questions, setQuestions] = useState<QuestionResult[]>([])
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [resultStatusFilter, setResultStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      const { answers: storeAnswers, questionIds: storeQuestionIds } = useExamStore.getState()
      setLoading(true)
      try {
        const examIdParam = params.resultId || ''

        let rawQuestions: { id: string; text: string; options: { key: string; text: string }[]; correctAnswer: string; explanation: string; questionImage?: string | null; explanationImage?: string | null; isPremium?: boolean }[] = []

        if (examIdParam) {
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

        if (rawQuestions.length > 0) {
          let filteredQuestions = storeQuestionIds.length > 0
            ? rawQuestions.filter(q => storeQuestionIds.includes(q.id))
            : rawQuestions

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
                filteredQuestions = filteredQuestions.filter(q => !q.isPremium)
              }
            } catch {
              filteredQuestions = filteredQuestions.filter(q => !q.isPremium)
            }
          }

          const mapped = filteredQuestions.map((q) => ({
            id: q.id,
            text: q.text,
            questionImage: q.questionImage,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: storeAnswers[q.id],
            explanation: q.explanation,
            explanationImage: q.explanationImage,
            isCorrect: storeAnswers[q.id] === q.correctAnswer,
            isSkipped: !storeAnswers[q.id],
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
  }, [params.resultId])

  const correctCount = useMemo(() => questions.filter((q) => q.isCorrect).length, [questions])
  const wrongCount = useMemo(() => questions.filter((q) => !q.isCorrect && !q.isSkipped).length, [questions])
  const skippedCount = useMemo(() => questions.filter((q) => q.isSkipped).length, [questions])
  const totalQuestions = questions.length
  const percentage = useMemo(() => totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0, [correctCount, totalQuestions])
  const initialDurationSeconds = storeExamDuration ? storeExamDuration * 60 : totalQuestions * 60
  const timeTaken = useMemo(() => Math.max(0, initialDurationSeconds - timeRemaining), [initialDurationSeconds, timeRemaining])
  const minutesTaken = useMemo(() => Math.floor(timeTaken / 60), [timeTaken])
  const secondsTaken = useMemo(() => timeTaken % 60, [timeTaken])
  const gradeInfo = useMemo(() => getGrade(percentage), [percentage])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-fade-in text-center">
          <Trophy className="size-16 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">ফলাফল হিসাব করা হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 sm:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <div className="animate-fade-in-up">
          <Card className="border-border/50 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
              <div className="animate-scale-in">
                <Trophy className="size-12 mx-auto mb-3" />
              </div>
              <h1 className="text-2xl font-bold mb-1">পরীক্ষার ফলাফল</h1>
              <p className="text-emerald-100">MCQ পরীক্ষা সম্পন্ন</p>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <CircularProgress value={percentage} />

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
        </div>

        {/* Performance Analytics */}
        <div className="animate-fade-in-up delay-300 mt-6">
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
                    <div
                      className="h-full bg-destructive rounded-full"
                      style={{ width: `${(wrongCount / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-amber-500">স্কিপ</span>
                    <span>{skippedCount}/{totalQuestions}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(skippedCount / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Review */}
        <div className="animate-fade-in-up delay-500 mt-6 mb-8">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="size-5 text-primary" />
            প্রশ্ন পর্যালোচনা
          </h3>

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
                  <div className="px-4 pb-4">
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
                   </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="animate-fade-in-up delay-700 mt-8 mb-24 sm:mb-8 flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 gap-2"
            onClick={() => {
              resetExam()
              navigate('exam-session', {
                examId: params.resultId || undefined,
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
              goBack()
            }}
          >
            <Home className="size-4" />
            ফিরে যান
          </Button>
        </div>
      </div>
    </div>
  )
}
