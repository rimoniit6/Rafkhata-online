import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import { cn, toBengaliNumerals } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flag,
  Loader2,
  Send,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ExamSet, ExamQuestion } from '@/components/exam/mcq-exam-detail-utils'
import { formatTime } from '@/components/exam/mcq-exam-detail-utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button as UIButton } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { memo } from 'react'

interface ExamActiveViewProps {
  examSetInfo: ExamSet | null
  examQuestions: ExamQuestion[]
  currentIndex: number
  answers: Record<string, string>
  markedForReview: Record<string, boolean>
  timeRemaining: number
  submitting: boolean
  submitDialogOpen: boolean
  answeredCount: number
  progressPercent: number
  reviewedCount: number
  currentQuestion: ExamQuestion | undefined
  selectedAnswer: string | undefined
  onSelectOption: (questionId: string, optionKey: string) => void
  onNext: () => void
  onPrev: () => void
  onToggleMarkForReview: (mcqId: string) => void
  onSetCurrentIndex: (index: number) => void
  onSubmitDialogOpen: () => void
  onSetSubmitDialogOpen: (open: boolean) => void
  handleSubmitExam: () => void
  onBack: () => void
}

function ExamActiveView({
  examSetInfo,
  examQuestions,
  currentIndex,
  answers,
  markedForReview,
  timeRemaining,
  submitting,
  submitDialogOpen,
  answeredCount,
  progressPercent,
  reviewedCount,
  currentQuestion,
  selectedAnswer,
  onSelectOption,
  onNext,
  onPrev,
  onToggleMarkForReview: _onToggleMarkForReview,
  onSetCurrentIndex,
  onSubmitDialogOpen,
  onSetSubmitDialogOpen,
  handleSubmitExam,
  onBack,
}: ExamActiveViewProps) {
  return (
    <div>
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <UIButton variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="size-5" />
            </UIButton>
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
            className={cn(
              'gap-1.5 tabular-nums shrink-0',
              timeRemaining <= 60 && 'animate-pulse'
            )}
          >
            <Clock className="size-3.5" />
            {formatTime(timeRemaining)}
          </Badge>
        </div>
        <Progress value={progressPercent} className="h-1 rounded-none" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
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

                    <div className="text-lg font-medium mb-6 leading-relaxed">
                      <RichContentRenderer content={currentQuestion?.question || ''} />
                    </div>

                    {currentQuestion?.questionImage && (
                      <div className="mb-4">
                        <SafeImage
                          src={currentQuestion.questionImage}
                          alt="প্রশ্নের ছবি"
                          className="max-w-full rounded-lg border"
                        />
                      </div>
                    )}

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
                            onSelectOption(currentQuestion.mcqId, option.key)
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

            <div className="flex items-center justify-between mt-4">
              <UIButton
                variant="outline"
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                আগের
              </UIButton>

              <div className="flex items-center gap-2">
                {currentIndex < examQuestions.length - 1 ? (
                  <UIButton onClick={onNext} className="gap-2">
                    পরের
                    <ArrowRight className="size-4" />
                  </UIButton>
                ) : (
                  <UIButton
                    onClick={onSubmitDialogOpen}
                    disabled={submitting}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {submitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
                  </UIButton>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-64">
            <Card className="sticky top-[5rem]">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">প্রশ্ন প্যালেট</h4>
                <div className="grid grid-cols-5 gap-2">
                  {examQuestions.map((q, i) => {
                    const isAnswered = !!answers[q.mcqId]
                    const isCurrent = i === currentIndex
                    const isMarked = !!markedForReview[q.mcqId]
                    return (
                      <button
                        key={q.id}
                        className={cn(
                          'flex items-center justify-center size-9 rounded-lg text-sm font-medium transition-colors relative',
                          isCurrent
                            ? 'bg-emerald-500 text-white'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                          isMarked && !isCurrent && 'ring-2 ring-amber-400 ring-offset-1'
                        )}
                        onClick={() => onSetCurrentIndex(i)}
                      >
                        {i + 1}
                        {isMarked && (
                          <Flag className="size-2.5 absolute -top-1 -right-1 text-amber-500" />
                        )}
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
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded ring-2 ring-amber-400" />
                    <span>পর্যালোচনার জন্য চিহ্নিত ({reviewedCount})</span>
                  </div>
                </div>

                <Separator className="my-3" />
                <UIButton
                  className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  size="sm"
                  onClick={onSubmitDialogOpen}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {submitting ? 'জমা হচ্ছে...' : 'পরীক্ষা জমা দিন'}
                </UIButton>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={submitDialogOpen} onOpenChange={onSetSubmitDialogOpen}>
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
            <UIButton
              variant="outline"
              onClick={() => onSetSubmitDialogOpen(false)}
              disabled={submitting}
            >
              বাতিল
            </UIButton>
            <UIButton
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
            </UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default memo(ExamActiveView)
