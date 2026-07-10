'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouterStore, useRouteParams } from '@/store/router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import { useToast } from '@/hooks/use-toast'
import { cn, toBengaliNumerals } from '@/lib/utils'
import {
  ArrowLeft,
  Trophy,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface QuestionReview {
  id: string
  questionText: string
  questionImage: string | null
  options: { key: string; text: string; image: string | null }[]
  correctAnswer: string
  userAnswer: string | null
  isCorrect: boolean
  isSkipped: boolean
  explanation: string
  explanationImage: string | null
  order: number
  marks: number
}

interface ResultData {
  result: {
    id: string
    score: number
    totalMarks: number
    timeTaken: number
    completedAt: string
  }
  exam: {
    id: string
    title: string
    description: string | null
    duration: number
    totalMarks: number
    marksPerMcq: number
    negativeMarks: number
  }
  questions: QuestionReview[]
}

export default function CreatorExamResultReviewPage() {
  const params = useRouteParams()
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const { toast } = useToast()

  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped'>('all')

  const resultId = params.resultId || ''

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/exams/results/detail?resultId=${encodeURIComponent(resultId)}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'ফলাফল লোড করতে ব্যর্থ হয়েছে')
        }
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          throw new Error(json.error || 'ফলাফল লোড করতে ব্যর্থ হয়েছে')
        }
      } catch (e) {
        toast({ title: 'ত্রুটি', description: e instanceof Error ? e.message : 'ফলাফল লোড করতে ব্যর্থ হয়েছে', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [resultId, toast])

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredQuestions = useMemo(() => {
    if (!data) return []
    switch (filter) {
      case 'correct': return data.questions.filter((q) => q.isCorrect)
      case 'wrong': return data.questions.filter((q) => !q.isCorrect && !q.isSkipped)
      case 'skipped': return data.questions.filter((q) => q.isSkipped)
      default: return data.questions
    }
  }, [data, filter])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="size-16 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">ফলাফল লোড করা হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">ফলাফল পাওয়া যায়নি</p>
          <Button onClick={goBack} variant="outline">ফিরে যান</Button>
        </Card>
      </div>
    )
  }

  const correctCount = data.questions.filter((q) => q.isCorrect).length
  const wrongCount = data.questions.filter((q) => !q.isCorrect && !q.isSkipped).length
  const skippedCount = data.questions.filter((q) => q.isSkipped).length
  const totalQuestions = data.questions.length
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  const minutesTaken = Math.floor(data.result.timeTaken / 60)
  const secondsTaken = data.result.timeTaken % 60

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <Card className="border-border/50 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
            <Trophy className="size-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-1">{data.exam.title}</h1>
            <p className="text-emerald-100">পরীক্ষার ফলাফল পর্যালোচনা</p>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                  <CheckCircle2 className="size-5" />
                </div>
                <p className="text-2xl font-bold">{toBengaliNumerals(correctCount)}</p>
                <p className="text-xs text-muted-foreground">সঠিক</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                  <XCircle className="size-5" />
                </div>
                <p className="text-2xl font-bold">{toBengaliNumerals(wrongCount)}</p>
                <p className="text-xs text-muted-foreground">ভুল</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                  <MinusCircle className="size-5" />
                </div>
                <p className="text-2xl font-bold">{toBengaliNumerals(skippedCount)}</p>
                <p className="text-xs text-muted-foreground">বাদ</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <Target className="size-5" />
                </div>
                <p className="text-2xl font-bold">{toBengaliNumerals(percentage)}%</p>
                <p className="text-xs text-muted-foreground">স্কোর</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground justify-center">
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                সময়: {toBengaliNumerals(minutesTaken)} মিনিট {toBengaliNumerals(secondsTaken)} সেকেন্ড
              </span>
              <span className="flex items-center gap-1">
                <Target className="size-4" />
                নম্বর: {toBengaliNumerals(Math.round(data.result.score))}/{toBengaliNumerals(Math.round(data.result.totalMarks))}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">সঠিকতার হার</span>
                <span className={cn('font-bold', percentage >= 60 ? 'text-emerald-500' : percentage >= 40 ? 'text-amber-500' : 'text-destructive')}>
                  {toBengaliNumerals(percentage)}%
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="size-5 text-primary" />
            প্রশ্ন পর্যালোচনা
          </h2>

          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {(['all', 'correct', 'wrong', 'skipped'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  filter === f
                    ? f === 'all' ? 'bg-primary text-primary-foreground'
                      : f === 'correct' ? 'bg-emerald-600 text-white'
                      : f === 'wrong' ? 'bg-destructive text-white'
                      : 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {f === 'all' ? 'সব' : f === 'correct' ? 'সঠিক' : f === 'wrong' ? 'ভুল' : 'বাদ দেওয়া'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredQuestions.map((q, idx) => (
              <Card key={q.id} className="border-border/50">
                <button className="w-full text-left" onClick={() => toggleQuestion(q.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex items-center justify-center size-8 rounded-full shrink-0',
                        q.isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600'
                          : q.isSkipped
                          ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600'
                          : 'bg-destructive/10 text-destructive'
                      )}>
                        {q.isCorrect ? <CheckCircle2 className="size-4" /> : q.isSkipped ? <MinusCircle className="size-4" /> : <XCircle className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">প্রশ্ন {toBengaliNumerals(idx + 1)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={q.isCorrect ? 'default' : 'destructive'} className="text-[10px]">
                            {q.isCorrect ? 'সঠিক' : q.isSkipped ? 'বাদ' : 'ভুল'}
                          </Badge>
                          {q.userAnswer && (
                            <span className="text-xs text-muted-foreground">আপনার উত্তর: {q.userAnswer}</span>
                          )}
                        </div>
                      </div>
                      {expandedQuestions.has(q.id) ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </div>
                  </CardContent>
                </button>

                {expandedQuestions.has(q.id) && (
                  <div className="px-4 pb-4">
                    <Separator className="mb-3" />
                    <div className="space-y-3 text-sm pl-11">
                      <RichContentRenderer content={q.questionText} className="font-medium" />
                      {q.questionImage && (
                        <SafeImage src={q.questionImage} alt="প্রশ্ন চিত্র" className="max-w-full rounded-lg border max-h-40" />
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={cn(
                              'p-2 rounded-lg text-xs border',
                              opt.key === q.correctAnswer
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                                : opt.key === q.userAnswer && opt.key !== q.correctAnswer
                                ? 'bg-destructive/10 border-destructive/20'
                                : 'bg-muted/50 border-border'
                            )}
                          >
                            <span className="font-semibold">{opt.key}.</span>{' '}
                            <RichContentRenderer content={opt.text} inline />
                            {opt.image && (
                              <SafeImage src={opt.image} alt={`অপশন ${opt.key}`} className="max-w-full rounded-lg border max-h-16 mt-1" />
                            )}
                            {opt.key === q.correctAnswer && (
                              <CheckCircle2 className="inline size-3 text-emerald-500 ml-1" />
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
                          <span className="text-xs font-medium text-muted-foreground shrink-0">ব্যাখ্যা:</span>
                          <RichContentRenderer content={q.explanation} className="text-xs flex-1 inline" />
                        </div>
                      )}
                      {q.explanationImage && (
                        <SafeImage src={q.explanationImage} alt="ব্যাখ্যা চিত্র" className="max-w-full rounded-lg border max-h-32" />
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={goBack}>
            <ArrowLeft className="size-4" />
            ফিরে যান
          </Button>
          <Button className="flex-1 gap-2" onClick={() => navigate('exam-creator-history')}>
            <Target className="size-4" />
            আমার পরীক্ষাসমূহ
          </Button>
        </div>
      </div>
    </div>
  )
}
