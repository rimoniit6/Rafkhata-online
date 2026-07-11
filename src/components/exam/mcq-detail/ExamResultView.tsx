import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, getGrade } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  MinusCircle,
  RefreshCw,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'
import { memo, useState } from 'react'
import type {
  ExamQuestion,
  ExamResult,
  ExamSetStatusItem,
} from '@/components/exam/mcq-exam-detail-utils'
import { formatDuration } from '@/components/exam/mcq-exam-detail-utils'


interface ExamResultViewProps {
  resultDetail: {
    result: ExamResult
    questions: ExamQuestion[]
  }
  activeSetId: string
  examSetStatuses: ExamSetStatusItem[]
  resultStatusFilter: string
  resultChapterFilter: string
  onBack: () => void
  onSetResultStatusFilter: (filter: string) => void
  onSetResultChapterFilter: (filter: string) => void
  onStartExam: (setId: string) => void
  onOpenRetakeDialog: (setId: string) => void
  onRefreshOverview: () => void
}

function ExamResultView({
  resultDetail,
  activeSetId,
  examSetStatuses,
  resultStatusFilter,
  resultChapterFilter,
  onBack,
  onSetResultStatusFilter,
  onSetResultChapterFilter,
  onStartExam,
  onOpenRetakeDialog,
  onRefreshOverview,
}: ExamResultViewProps) {
  const { result, questions: resultQuestions } = resultDetail
  const percentage = result.totalMarks > 0 ? (result.marksObtained / result.totalMarks) * 100 : 0
  const { grade, color: gradeColor } = getGrade(percentage)
  const parsedAnswers: Record<string, string> = result.answers || {}

  return (
    <div>
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="size-5 text-emerald-500" />
            প্রশ্ন বিশ্লেষণ
          </h3>

          {(() => {
            const uniqueChapters = resultQuestions
              .map(q => ({ id: q.chapterId, name: q.chapterName }))
              .filter((c, i, arr) => c.id && arr.findIndex(x => x.id === c.id) === i)
            if (uniqueChapters.length === 0) return null
            return (
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <button
                  onClick={() => onSetResultChapterFilter('all')}
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
                    onClick={() => onSetResultChapterFilter(ch.id!)}
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

          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <button
              onClick={() => onSetResultStatusFilter('all')}
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
              onClick={() => onSetResultStatusFilter('wrong')}
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
              onClick={() => onSetResultStatusFilter('correct')}
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
              onClick={() => onSetResultStatusFilter('skipped')}
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
                .map((q, i) => {
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
                    onClick={() => onStartExam(activeSetId)}
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
                    onClick={() => onOpenRetakeDialog(activeSetId)}
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
              onBack()
              onRefreshOverview()
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

export default memo(ExamResultView)
