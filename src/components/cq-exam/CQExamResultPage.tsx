'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  Award,
  Trophy,
  CheckCircle,
  AlertCircle,
  FileQuestion,
  BookOpen,
  MessageSquare,
  ImageIcon,
  GraduationCap,
  RefreshCw,
  Loader2,
  Send,
  ChevronDown,
  PenTool,
  Eye,
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { bengaliLabels, getTypeLabel, getStatusBadge, getAnswerModeLabel, formatDuration } from '@/lib/cq-exam/utils'
import { useToast } from '@/hooks/use-toast'
import SafeImage from '@/components/ui/safe-image'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import ImageAnnotator from '@/components/ui/image-annotator'

interface CQAnswerImage {
  id: string
  answerId: string
  imageUrl: string
  annotations: string | null
  order: number
}

interface CQAnswer {
  id: string
  submissionId: string
  questionId: string
  subIndex: number
  answerText: string | null
  obtainedMarks: number
  maxMarks: number
  feedback: string | null
  gradedAt: string | null
  images: CQAnswerImage[]
}

interface CQQuestionDetail {
  id: string
  cqId: string | null
  marks: number
  order: number
  type?: string
  subMarks?: string | null
  stem?: string | null
  stemImage?: string | null
  config?: string | null
  typedUddeepok?: string | null
  typedUddeepokImage?: string | null
  typedQuestion1?: string | null
  typedQuestion1Image?: string | null
  typedQuestion2?: string | null
  typedQuestion2Image?: string | null
  typedQuestion3?: string | null
  typedQuestion3Image?: string | null
  typedQuestion4?: string | null
  typedQuestion4Image?: string | null
  cq: {
    id: string
    uddeepok: string
    uddeepokImage: string | null
    question1: string
    question1Image: string | null
    question2: string
    question2Image: string | null
    question3: string
    question3Image: string | null
    question4: string
    question4Image: string | null
    answer1: string
    answer1Image: string | null
    answer2: string
    answer2Image: string | null
    answer3: string
    answer3Image: string | null
    answer4: string
    answer4Image: string | null
    classLevel: string
    subjectId: string
    chapterId: string
    chapter?: { id: string; name: string }
  } | null
}

interface SubmissionData {
  id: string
  userId: string
  setId: string
  totalMarks: number
  obtainedMarks: number
  timeTaken: number
  status: string
  startedAt: string | null
  submittedAt: string | null
  gradedAt: string | null
  set: {
    id: string
    title: string
    description: string | null
    scheduledDate: string
    duration: number
    totalMarks: number
    totalQuestions: number
    showAnnotatedImages: boolean
    passMarks: number
    showCorrectAnswers: boolean
    answerMode: string
  }
  answers: CQAnswer[]
  questions: CQQuestionDetail[]
}

function AnswerBlock({
  label,
  answerText,
  images,
  obtainedMarks,
  maxMarks,
  feedback,
  showAnnotatedImages = true,
}: {
  label: string
  answerText: string | null
  images: CQAnswerImage[]
  obtainedMarks: number
  maxMarks: number
  feedback: string | null
  showAnnotatedImages?: boolean
}) {
  const hasAnnotatedImages = showAnnotatedImages && images.some((img) => img.annotations && img.annotations.trim() !== '' && img.annotations !== '[]')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-7 rounded-full bg-emerald-500 text-white font-bold text-xs shrink-0">
            {label}
          </span>
          <span className="font-semibold text-sm">প্রশ্ন {label}</span>
          {hasAnnotatedImages && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800 gap-1">
              <PenTool className="size-2.5" />
              শিক্ষক মার্ক করেছেন
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'text-sm font-bold',
            obtainedMarks === maxMarks
              ? 'text-emerald-600'
              : obtainedMarks > 0
              ? 'text-amber-600'
              : 'text-destructive'
          )}>
            {toBengaliNumerals(Math.round(obtainedMarks))}/{toBengaliNumerals(Math.round(maxMarks))}
          </span>
          <span className="text-xs text-muted-foreground">নম্বর</span>
        </div>
      </div>

      {answerText ? (
        <div className="rounded-lg bg-muted/30 p-3 border">
          <RichContentRenderer content={answerText} className="text-sm leading-relaxed" />
        </div>
      ) : (
        <div className="rounded-lg bg-muted/20 p-3 border border-dashed">
          <p className="text-sm text-muted-foreground italic">কোনো উত্তর দেওয়া হয়নি</p>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <ImageIcon className="size-3" />
            সংযুক্ত ছবি ({images.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {images.map((img) => {
              const hasAnnotations = showAnnotatedImages && img.annotations && img.annotations.trim() !== '' && img.annotations !== '[]'
              return (
                <div key={img.id} className="relative">
                  {hasAnnotations ? (
                    <ImageAnnotator
                      imageUrl={img.imageUrl}
                      annotations={img.annotations!}
                      readonly={true}
                    />
                  ) : (
                    <div className="rounded-lg overflow-hidden border bg-muted/30">
                      <SafeImage
                        src={img.imageUrl}
                        alt="উত্তরের ছবি"
                        className="w-full h-24 object-cover"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {feedback && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 flex items-baseline gap-2">
          <MessageSquare className="size-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">প্রতিক্রিয়া:</p>
            <p className="text-sm text-muted-foreground">{feedback}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CQExamResultPage() {
  const { params, goBack, navigate } = useRouterStore()
  const { toast } = useToast()

  const submissionId = params.resultId || ''
  const packageId = params.packageId || ''

  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [retakeRequesting, setRetakeRequesting] = useState(false)
  const [retakeRequested, setRetakeRequested] = useState(false)

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/cq-exam-packages?action=my-submission&submissionId=${submissionId}`
      )
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setSubmission({ ...json.submission, questions: json.submission.set?.questions || [] })
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'ফলাফল লোড করতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [submissionId, toast])

  useEffect(() => {
    fetchSubmission()
  }, [fetchSubmission])

  // Check if user already has a pending retake request
  useEffect(() => {
    if (!submission || !submission.userId) return
    const checkRetakeRequest = async () => {
      try {
        const res = await fetch(
          `/api/cq-exam-packages?action=my-retake-requests&userId=${submission.userId}&packageId=${packageId}`
        )
        if (!res.ok) return
        const json = await res.json()
        const requests = json.requests || []
        const hasPending = requests.some(
          (r: any) => r.setId === submission.setId && r.status === 'pending'
        )
        setRetakeRequested(hasPending)
      } catch { /* */ }
    }
    // Only check for submitted/graded/published status — not in-progress
    if (['submitted', 'graded', 'published'].includes(submission.status)) {
      checkRetakeRequest()
    }
  }, [submission, packageId])

  const handleRequestRetake = async () => {
    if (!submission) return
    setRetakeRequesting(true)
    try {
      const res = await fetch('/api/cq-exam-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-retake',
          setId: submission.setId,
          userId: submission.userId,
          reason: 'পুনরায় পরীক্ষা দেওয়ার অনুরোধ',
        }),
      })
      const json = await res.json()
      if (json.error) {
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
        return
      }
      setRetakeRequested(true)
      toast({ title: 'অনুরোধ পাঠানো হয়েছে', description: 'অ্যাডমিন অনুমোদন করলে পুনরায় পরীক্ষা দিতে পারবেন' })
    } catch {
      toast({ title: 'ত্রুটি', description: 'অনুরোধ পাঠাতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setRetakeRequesting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="sticky top-16 z-30 bg-background border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">ফলাফল খুঁজে পাওয়া যায়নি</p>
          <Button onClick={goBack} variant="outline">ফিরে যান</Button>
        </Card>
      </div>
    )
  }

  const statusBadge = getStatusBadge(submission.status)
  const isPending = submission.status === 'submitted'
  const isGraded = submission.status === 'graded' || submission.status === 'published'
  const percentage = submission.totalMarks > 0
    ? (submission.obtainedMarks / submission.totalMarks) * 100
    : 0

  const passMarks = submission.set?.passMarks ?? 0
  const showAnnotatedImages = submission.set?.showAnnotatedImages ?? true
  const showCorrectAnswers = submission.set?.showCorrectAnswers ?? false
  const answerMode = submission.set?.answerMode ?? 'flexible'
  const answerModeInfo = getAnswerModeLabel(answerMode)
  const hasPassed = passMarks > 0 ? submission.obtainedMarks >= passMarks : null

  return (
    <div>
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigate('cq-exam-package-detail', { packageId: params.packageId || '' })
            }}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="size-5 text-emerald-500" />
            পরীক্ষার ফলাফল
          </h1>
          <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5 ml-auto', answerModeInfo.color)}>
            {answerModeInfo.label}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
            {isPending ? (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center">
                <GraduationCap className="size-12 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold mb-1">ফলাফল অপেক্ষমাণ</div>
                <div className="text-white/80 text-sm mb-3">
                  আপনার উত্তর জমা দেওয়া হয়েছে। শিক্ষক উত্তর মূল্যায়ন করে ফলাফল প্রকাশ করবেন।
                </div>
                <Badge className="text-sm px-3 py-1 bg-white/20 text-white border-white/30">
                  {statusBadge.label}
                </Badge>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white text-center">
                <Award className="size-12 mx-auto mb-2 opacity-80" />
                <div className="text-4xl font-bold mb-1">
                  {toBengaliNumerals(Math.round(submission.obtainedMarks))}/{toBengaliNumerals(Math.round(submission.totalMarks))}
                </div>
                <div className="text-white/80 text-sm mb-3">
                  {percentage.toFixed(1)}% নম্বর
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge className={cn('text-sm px-3 py-1 bg-white/20 text-white border-white/30')}>
                    {statusBadge.label}
                  </Badge>
                  {hasPassed !== null && (
                    <Badge className={cn(
                      'text-sm px-3 py-1 border',
                      hasPassed
                        ? 'bg-green-200/80 text-green-900 border-green-400/50'
                        : 'bg-red-200/80 text-red-900 border-red-400/50'
                    )}>
                      {hasPassed ? 'পাস' : 'ফেল'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <CardContent className="p-4">
              <div className={cn(
                'grid gap-4 text-center',
                passMarks > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
              )}>
                <div>
                  <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                    <Award className="size-4" />
                    <span className="text-xl font-bold">
                      {toBengaliNumerals(Math.round(submission.obtainedMarks))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">প্রাপ্ত নম্বর</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-teal-600 mb-1">
                    <FileQuestion className="size-4" />
                    <span className="text-xl font-bold">
                      {toBengaliNumerals(Math.round(submission.totalMarks))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">মোট নম্বর</p>
                </div>
                {passMarks > 0 && (
                  <div>
                    <div className="flex items-center justify-center gap-1 text-rose-600 mb-1">
                      <CheckCircle className="size-4" />
                      <span className="text-xl font-bold">
                        {toBengaliNumerals(Math.round(passMarks))}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">পাসের নম্বর</p>
                  </div>
                )}
                <div className={cn(passMarks > 0 && 'col-span-2 sm:col-span-1')}>
                  <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                    <Clock className="size-4" />
                    <span className="text-xl font-bold">
                      {formatDuration(submission.timeTaken)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">গৃহীত সময়</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="size-5 text-emerald-500" />
            উত্তর পর্যালোচনা
            {isPending && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 ml-2">
                নম্বর অপেক্ষমাণ
              </Badge>
            )}
          </h3>

          <div className="space-y-6">
            {submission.questions.map((q, qi) => {
                const questionType = q.type || 'cq'

                // Non-CQ question types
                if (questionType !== 'cq' && questionType !== 'typed') {
                  let config: any = {}
                  try { config = JSON.parse(q.config || '{}') } catch {}
                  const qStem = q.stem || ''
                  const qStemImage = q.stemImage || null

                  const getTypeLabel = () => {
                    switch (questionType) {
                      case 'mcq-single': return 'MCQ (একক উত্তর)'
                      case 'mcq-multiple': return 'MCQ (একাধিক উত্তর)'
                      case 'fill-blanks': return 'শূন্যস্থান পূরণ'
                      case 'written': return 'রচনামূলক প্রশ্ন'
                      default: return questionType
                    }
                  }

                  return (
                    <Card key={q.id} className="border-border/50 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center size-8 rounded-full bg-emerald-500 text-white font-bold text-sm shrink-0">
                            {toBengaliNumerals(qi + 1)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                              {getTypeLabel()}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {toBengaliNumerals(q.marks)} নম্বর
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 sm:p-6 space-y-6">
                        {qStem ? (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                              <FileQuestion className="size-4" />
                              প্রশ্ন
                            </h4>
                            <div className="rounded-lg bg-muted/50 p-4 border">
                              <RichContentRenderer content={qStem} className="text-base leading-relaxed" />
                            </div>
                            {qStemImage && (
                              <div className="rounded-lg overflow-hidden border bg-muted/30">
                                <SafeImage src={qStemImage} alt="প্রশ্নের ছবি" className="max-h-64 object-contain mx-auto" />
                              </div>
                            )}
                            <Separator />
                          </div>
                        ) : null}

                        {/* MCQ Single */}
                        {questionType === 'mcq-single' && (() => {
                          const options = config.options || []
                          const answer = submission.answers.find((a) => a.questionId === q.id && a.subIndex === 0)
                          const selectedIndex = answer?.answerText ? parseInt(answer.answerText) : -1
                          return (
                            <div className="space-y-2">
                              <p className="font-semibold text-sm">আপনার উত্তর:</p>
                              {options.map((opt: string, oi: number) => (
                                <div key={oi} className={cn(
                                  'flex items-center gap-3 p-3 rounded-lg border',
                                  selectedIndex === oi ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'opacity-70'
                                )}>
                                  <span className="size-4 rounded-full border-2 flex items-center justify-center shrink-0">
                                    {selectedIndex === oi && <span className="size-2.5 rounded-full bg-emerald-500" />}
                                  </span>
                                  <span className="text-sm">{opt}</span>
                                </div>
                              ))}
                              {answer && (isGraded || isPending) && (
                                <AnswerBlock
                                  label=""
                                  answerText=""
                                  images={answer.images || []}
                                  obtainedMarks={answer.obtainedMarks}
                                  maxMarks={answer.maxMarks}
                                  feedback={answer.feedback}
                                  showAnnotatedImages={showAnnotatedImages}
                                />
                              )}
                            </div>
                          )
                        })()}

                        {/* MCQ Multiple */}
                        {questionType === 'mcq-multiple' && (() => {
                          const options = config.options || []
                          const answer = submission.answers.find((a) => a.questionId === q.id && a.subIndex === 0)
                          let selectedIndices: number[] = []
                          try { selectedIndices = JSON.parse(answer?.answerText || '[]') } catch {}
                          return (
                            <div className="space-y-2">
                              <p className="font-semibold text-sm">আপনার উত্তর:</p>
                              {options.map((opt: string, oi: number) => (
                                <div key={oi} className={cn(
                                  'flex items-center gap-3 p-3 rounded-lg border',
                                  selectedIndices.includes(oi) ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'opacity-70'
                                )}>
                                  <span className="size-4 rounded border-2 flex items-center justify-center shrink-0">
                                    {selectedIndices.includes(oi) && <span className="size-2 bg-emerald-500 rounded-sm" />}
                                  </span>
                                  <span className="text-sm">{opt}</span>
                                </div>
                              ))}
                              {answer && (isGraded || isPending) && (
                                <AnswerBlock
                                  label=""
                                  answerText=""
                                  images={answer.images || []}
                                  obtainedMarks={answer.obtainedMarks}
                                  maxMarks={answer.maxMarks}
                                  feedback={answer.feedback}
                                  showAnnotatedImages={showAnnotatedImages}
                                />
                              )}
                            </div>
                          )
                        })()}

                        {/* Fill Blanks */}
                        {questionType === 'fill-blanks' && (() => {
                          const blanks: { id: string; answer: string; marks: number }[] = config.blanks || []
                          return (
                            <div className="space-y-3">
                              <p className="font-semibold text-sm">আপনার উত্তর:</p>
                              {blanks.map((blank, si) => {
                                const ans = submission.answers.find((a) => a.questionId === q.id && a.subIndex === si)
                                return (
                                  <div key={si} className="space-y-2">
                                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                                      <span className="text-sm font-medium text-muted-foreground">{toBengaliNumerals(si + 1)}.</span>
                                      <div className="flex-1">
                                        {ans?.answerText ? (
                                          <span className="text-sm">{ans.answerText}</span>
                                        ) : (
                                          <span className="text-sm text-muted-foreground italic">পূরণ করা হয়নি</span>
                                        )}
                                      </div>
                                      {isGraded && (
                                        <span className={cn(
                                          'text-xs font-bold',
                                          (ans?.obtainedMarks ?? 0) >= (ans?.maxMarks ?? 1) ? 'text-emerald-600' : 'text-destructive'
                                        )}>
                                          {toBengaliNumerals(Math.round(ans?.obtainedMarks || 0))}/{toBengaliNumerals(Math.round(ans?.maxMarks || 1))}
                                        </span>
                                      )}
                                    </div>
                                    {ans && ans.feedback && (
                                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 flex items-baseline gap-2 ml-2">
                                        <MessageSquare className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">প্রতিক্রিয়া:</p>
                                          <p className="text-sm text-muted-foreground">{ans.feedback}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}

                        {/* Written */}
                        {questionType === 'written' && (() => {
                          const ans = submission.answers.find((a) => a.questionId === q.id && a.subIndex === 0)
                          const imgAns = submission.answers.find((a) => a.questionId === q.id && a.subIndex === 1)
                          const hasImages = imgAns && imgAns.images && imgAns.images.length > 0
                          return (
                            <div className="space-y-3">
                              <p className="font-semibold text-sm">আপনার উত্তর:</p>
                              {ans?.answerText ? (
                                <div className="rounded-lg bg-muted/30 p-4 border">
                                  <RichContentRenderer content={ans.answerText} className="text-sm leading-relaxed" />
                                </div>
                              ) : (
                                <div className="rounded-lg bg-muted/20 p-3 border border-dashed">
                                  <p className="text-sm text-muted-foreground italic">কোনো উত্তর দেওয়া হয়নি</p>
                                </div>
                              )}
                              {hasImages && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                                    <ImageIcon className="size-3" />
                                    সংযুক্ত ছবি ({imgAns!.images.length})
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {imgAns!.images.map((img) => {
                                      const hasAnnotations = showAnnotatedImages && img.annotations && img.annotations.trim() !== '' && img.annotations !== '[]'
                                      return (
                                        <div key={img.id} className="relative">
                                          {hasAnnotations ? (
                                            <ImageAnnotator imageUrl={img.imageUrl} annotations={img.annotations!} readonly={true} />
                                          ) : (
                                            <div className="rounded-lg overflow-hidden border bg-muted/30">
                                              <SafeImage src={img.imageUrl} alt="উত্তরের ছবি" className="w-full h-24 object-cover" />
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {ans && (isGraded || isPending) && (
                                <AnswerBlock
                                  label=""
                                  answerText=""
                                  images={[]}
                                  obtainedMarks={ans.obtainedMarks}
                                  maxMarks={ans.maxMarks}
                                  feedback={ans.feedback}
                                  showAnnotatedImages={showAnnotatedImages}
                                />
                              )}
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  )
                }

                const isTyped = questionType === 'typed'
                const cq = q.cq

                let stimulus = ''
                let stimulusImage: string | null = null
                let subQuestions: { text: string; image: string | null }[] = []

                if (isTyped) {
                  stimulus = q.typedUddeepok || ''
                  stimulusImage = q.typedUddeepokImage || null
                  subQuestions = [
                    { text: q.typedQuestion1 || '', image: q.typedQuestion1Image || null },
                    { text: q.typedQuestion2 || '', image: q.typedQuestion2Image || null },
                    { text: q.typedQuestion3 || '', image: q.typedQuestion3Image || null },
                    { text: q.typedQuestion4 || '', image: q.typedQuestion4Image || null },
                  ]
                } else if (cq) {
                  stimulus = cq.uddeepok
                  stimulusImage = cq.uddeepokImage
                  subQuestions = [
                    { text: cq.question1, image: cq.question1Image },
                    { text: cq.question2, image: cq.question2Image },
                    { text: cq.question3, image: cq.question3Image },
                    { text: cq.question4, image: cq.question4Image },
                  ]
                }

                return (
                  <Card key={q.id} className="border-border/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center size-8 rounded-full bg-emerald-500 text-white font-bold text-sm shrink-0">
                          {toBengaliNumerals(qi + 1)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                            CQ {toBengaliNumerals(qi + 1)}
                          </span>
                          {isTyped && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-2">টাইপকৃত</span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {toBengaliNumerals(q.marks)} নম্বর
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 sm:p-6 space-y-6">
                      {stimulus ? (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            <FileQuestion className="size-4" />
                            উদ্দীপক
                          </h4>
                          <div className="rounded-lg bg-muted/50 p-4 border">
                            <RichContentRenderer content={stimulus} className="text-base leading-relaxed" />
                          </div>
                          {stimulusImage && (
                            <div className="rounded-lg overflow-hidden border bg-muted/30">
                              <SafeImage src={stimulusImage} alt="উদ্দীপকের ছবি" className="max-h-64 object-contain mx-auto" />
                            </div>
                          )}
                          <Separator />
                        </div>
                      ) : null}

                      {subQuestions.map((sq, si) => {
                        const actualAnswer = submission.answers.find(
                          (a) => a.questionId === q.id && a.subIndex === si
                        )

                        return (
                          <div key={si} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                                {bengaliLabels[si]}
                              </span>
                              <span className="font-semibold text-sm">প্রশ্ন {bengaliLabels[si]}</span>
                            </div>

                            <div className="rounded-lg bg-muted/30 p-3 border text-sm leading-relaxed">
                              <RichContentRenderer content={sq.text} />
                            </div>

                            {sq.image && (
                              <div className="rounded-lg overflow-hidden border bg-muted/30">
                                <SafeImage src={sq.image} alt={`প্রশ্ন ${bengaliLabels[si]}-এর ছবি`} className="max-h-48 object-contain mx-auto" />
                              </div>
                            )}

                            <Separator className="my-2" />

                            {actualAnswer ? (
                              <AnswerBlock
                                label={bengaliLabels[si]}
                                answerText={actualAnswer.answerText}
                                images={actualAnswer.images || []}
                                obtainedMarks={actualAnswer.obtainedMarks}
                                maxMarks={actualAnswer.maxMarks}
                                feedback={actualAnswer.feedback}
                                showAnnotatedImages={showAnnotatedImages}
                              />
                            ) : (
                              <div className="rounded-lg bg-muted/20 p-3 border border-dashed">
                                <p className="text-sm text-muted-foreground italic">এই প্রশ্নের উত্তর পাওয়া যায়নি</p>
                              </div>
                            )}

                            {/* Model/Correct Answers */}
                            {showCorrectAnswers && isGraded && !isTyped && cq && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <button className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors mt-1">
                                    <Eye className="size-4" />
                                    সঠিক উত্তর — {bengaliLabels[si]}
                                    <ChevronDown className="size-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                  </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 mt-2 space-y-2">
                                    {(() => {
                                      const answerTexts = [cq.answer1, cq.answer2, cq.answer3, cq.answer4]
                                      const answerImages = [cq.answer1Image, cq.answer2Image, cq.answer3Image, cq.answer4Image]
                                      const text = answerTexts[si]
                                      const image = answerImages[si]
                                      return (
                                        <>
                                          {text ? (
                                            <RichContentRenderer content={text} className="text-sm leading-relaxed" />
                                          ) : (
                                            <p className="text-sm text-muted-foreground italic">মডেল উত্তর প্রদান করা হয়নি</p>
                                          )}
                                          {image && (
                                            <div className="rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950/30">
                                              <SafeImage src={image} alt={`সঠিক উত্তর ${bengaliLabels[si]}-এর ছবি`} className="max-h-48 object-contain mx-auto" />
                                            </div>
                                          )}
                                        </>
                                      )
                                    })()}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        )
                      })}

                      {/* Global images for whole CQ (subIndex 4) */}
                      {(() => {
                        const globalAnswer = submission.answers.find(
                          (a) => a.questionId === q.id && a.subIndex === 4
                        )
                        if (!globalAnswer || !globalAnswer.images?.length) return null
                        return (
                          <div className="space-y-2 pt-2 border-t border-dashed border-border/50">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                              <ImageIcon className="size-4" />
                              সম্পূর্ণ উত্তরের ছবি
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {globalAnswer.images.map((img: any) => {
                                const hasGlobalAnnotations = showAnnotatedImages && img.annotations && img.annotations.trim() !== '' && img.annotations !== '[]'
                                return (
                                  <div key={img.id} className="relative">
                                    {hasGlobalAnnotations ? (
                                      <ImageAnnotator
                                        imageUrl={img.imageUrl}
                                        annotations={img.annotations}
                                        readonly={true}
                                      />
                                    ) : (
                                      <div className="rounded-lg overflow-hidden border bg-muted/30">
                                        <SafeImage src={img.imageUrl} alt="সম্পূর্ণ উত্তরের ছবি" className="w-full h-24 object-cover" />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </motion.div>

          {/* Refresh & Retake buttons */}
          <div className="flex flex-col items-center gap-3">
            {isPending && (
              <>
                <p className="text-xs text-muted-foreground">
                  শিক্ষক উত্তর মূল্যায়ন শেষে এখানে ফলাফল দেখতে পারবেন
                </p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={fetchSubmission}
                  disabled={loading}
                >
                  <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                  রিফ্রেশ করুন
                </Button>
              </>
            )}
            {!isPending && !retakeRequested && (
              <Button
                variant="outline"
                className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                onClick={handleRequestRetake}
                disabled={retakeRequesting}
              >
                {retakeRequesting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                পুনরায় পরীক্ষার অনুরোধ করুন
              </Button>
            )}
            {!isPending && retakeRequested && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                <Clock className="size-4" />
                অনুরোধ পাঠানো হয়েছে — অ্যাডমিন অনুমোদনের অপেক্ষায়
              </div>
            )}
          </div>

        <div className="flex justify-center">
          <Button
            onClick={() => {
              navigate('cq-exam-package-detail', { packageId: params.packageId || '' })
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
