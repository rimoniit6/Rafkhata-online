'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, BookOpen, MapPin, Calendar,
  Sparkles, ChevronDown, Lock, Crown, Bookmark, Share2, CheckCircle2, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getDifficultyLabel, getDifficultyColor } from '@/lib/board-utils'
import { sanitizeHtml } from '@/lib/sanitize'
import type { BoardQuestionItem, AccessStatus } from '@/types/board-questions'

interface QuestionDetailPanelProps {
  question: BoardQuestionItem
  accessStatus?: AccessStatus
  currentIndex: number
  totalCount: number
  isBookmarked: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onBookmark: () => void
  onShare: () => void
  onUnlock: () => void
}

const subQuestionKeys = [
  { key: 'question1' as const, answerKey: 'answer1' as const, num: 1 },
  { key: 'question2' as const, answerKey: 'answer2' as const, num: 2 },
  { key: 'question3' as const, answerKey: 'answer3' as const, num: 3 },
  { key: 'question4' as const, answerKey: 'answer4' as const, num: 4 },
]

export function QuestionDetailPanel({
  question: q, accessStatus, currentIndex, totalCount, isBookmarked,
  onClose, onPrev, onNext, onBookmark, onShare, onUnlock,
}: QuestionDetailPanelProps) {
  const accessType = accessStatus?.accessType ?? (q.isPremium ? 'locked' : 'free')
  const isLocked = accessType === 'locked'
  const isPending = accessType === 'pending'
  const isExplanationLocked = q.isPremium && isLocked && (q.explanation?.length ?? 0) > 0

  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showAllCqAnswers, setShowAllCqAnswers] = useState(false)

  useEffect(() => {
    setShowAnswer(false)
    setSelectedOption(null)
    setShowExplanation(false)
    setShowAllCqAnswers(false)
  }, [q.id])

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < totalCount - 1

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev() }
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  const isMcq = q.type === 'mcq'

  const options = isMcq ? [
    { label: 'A', value: q.optionA },
    { label: 'B', value: q.optionB },
    { label: 'C', value: q.optionC },
    { label: 'D', value: q.optionD },
  ] : []

  const handleOptionClick = useCallback((label: string) => {
    if (isLocked) return
    setSelectedOption(label)
    setShowAnswer(true)
  }, [isLocked])

  const handleToggleCqAnswers = useCallback(() => {
    setShowAllCqAnswers((prev) => !prev)
  }, [])

  const cqHasSubQuestions = !isMcq && subQuestionKeys.some(({ key }) => q[key])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-40 flex items-start justify-center sm:items-center bg-black/40 backdrop-blur-sm overflow-y-auto py-0 sm:py-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full sm:max-w-3xl mx-auto bg-card sm:border sm:border-border/60 sm:rounded-2xl shadow-2xl overflow-hidden min-h-screen sm:min-h-0 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-5 sm:py-3 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {currentIndex + 1}/{totalCount}
            </span>
            <Badge variant="secondary" className={cn(
              'text-[10px] px-1.5 py-0 gap-1',
              isMcq ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
            )}>
              {isMcq ? 'MCQ' : 'CQ'}
            </Badge>
            <Badge className={cn('text-[10px] px-1.5 py-0', getDifficultyColor(q.difficulty))}>
              {getDifficultyLabel(q.difficulty)}
            </Badge>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className={cn('h-8 w-8 rounded-lg', isBookmarked && 'text-amber-500')}
              onClick={(e) => { e.stopPropagation(); onBookmark() }}>
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
              onClick={(e) => { e.stopPropagation(); onShare() }}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground mb-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="font-medium text-foreground/80">{q.board.charAt(0).toUpperCase() + q.board.slice(1)} Board</span>
            <span className="text-muted-foreground/40">•</span>
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{q.year}</span>
          </div>

          <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground/70">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="font-medium text-foreground/70 truncate">{q.subjectName}</span>
            {q.chapterName && <><span className="text-muted-foreground/40 shrink-0">•</span><span className="truncate">{q.chapterName}</span></>}
          </div>

          {/* Question text */}
          <div className="text-sm sm:text-base leading-relaxed mb-5 [&_*]:inline [&_math]:text-inherit">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} />
          </div>

          {/* MCQ: Options */}
          {isMcq && (
            <div className="space-y-2 mb-5">
              {options.map((opt) => {
                const isCorrect = showAnswer && opt.label === q.correctAnswer
                const isWrong = showAnswer && selectedOption === opt.label && opt.label !== q.correctAnswer
                const isSelected = selectedOption === opt.label
                return (
                  <button
                    key={opt.label}
                    disabled={isLocked}
                    onClick={() => handleOptionClick(opt.label)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 text-left',
                      showAnswer && isCorrect
                        ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700/50 dark:bg-emerald-950/20'
                        : isWrong
                          ? 'border-red-300 bg-red-50/50 dark:border-red-700/50 dark:bg-red-950/20'
                          : showAnswer && !isSelected
                            ? 'border-border/50 bg-muted/20 opacity-60'
                            : 'border-border/40 hover:border-foreground/20 hover:bg-muted/10',
                      isLocked && 'opacity-60 cursor-not-allowed',
                      !isLocked && !showAnswer && 'cursor-pointer',
                    )}
                  >
                    <span className={cn(
                      'flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold shrink-0 mt-0.5',
                      showAnswer && isCorrect
                        ? 'bg-emerald-500 text-white'
                        : isWrong
                          ? 'bg-red-500 text-white'
                          : 'bg-muted-foreground/10 text-muted-foreground/70',
                    )}>
                      {showAnswer && isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : isWrong ? <XCircle className="h-3.5 w-3.5" /> : opt.label}
                    </span>
                    <span className="text-sm leading-relaxed flex-1 [&_*]:inline">{opt.value}</span>
                  </button>
                )
              })}

              {/* Answer result + Explanation */}
              {showAnswer && !isLocked && !isPending && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Correct Answer: {q.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="border-t border-border/40 pt-3">
                    <button onClick={() => setShowExplanation((prev) => !prev)}
                      className="flex items-center justify-between w-full text-left group">
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary/60" />View Explanation
                      </span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', showExplanation && 'rotate-180')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {showExplanation && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                          {isExplanationLocked ? (
                            <div className="pt-3">
                              <div className="relative rounded-xl border border-amber-200/60 dark:border-amber-800/40 overflow-hidden">
                                <div className="p-4 blur-sm select-none pointer-events-none">
                                  <div className="space-y-2">
                                    <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                                    <div className="h-4 bg-muted-foreground/10 rounded w-1/2" />
                                    <div className="h-4 bg-muted-foreground/10 rounded w-5/6" />
                                  </div>
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] p-6 text-center">
                                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-2">
                                    <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <p className="text-sm font-semibold text-foreground mb-1">Premium Explanation</p>
                                  <p className="text-xs text-muted-foreground mb-3 max-w-[220px]">Upgrade to access detailed explanation</p>
                                  <Button size="sm" onClick={onUnlock}
                                    className="gap-1.5 text-xs h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg">
                                    <Crown className="h-3.5 w-3.5" />Unlock Now
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-3">
                              <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                                <div className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit"
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.explanation || 'No explanation available for this question.') }} />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Locked state */}
              {!showAnswer && isLocked && !isPending && (
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" onClick={onUnlock}
                    className="gap-1.5 text-xs h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg">
                    <Lock className="h-3.5 w-3.5" />Unlock to Check Answer
                  </Button>
                </div>
              )}

              {isPending && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit mt-4">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending verification</span>
                </div>
              )}
            </div>
          )}

          {/* CQ: sub-questions */}
          {!isMcq && (
            <div className="space-y-3">
              {isLocked ? (
                <div className="text-center py-8 border border-dashed border-amber-200/60 dark:border-amber-800/40 rounded-xl">
                  <Lock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">Sub-questions locked</p>
                  <p className="text-xs text-muted-foreground mb-3">Unlock to view sub-questions and answers</p>
                  <Button size="sm" onClick={onUnlock}
                    className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg">
                    <Lock className="h-3.5 w-3.5" />Unlock
                  </Button>
                </div>
              ) : (
                <>
                  {cqHasSubQuestions && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleCqAnswers}
                      className="gap-1.5 rounded-lg text-xs h-8 mb-2"
                    >
                      {showAllCqAnswers ? 'Hide All Answers' : 'Show All Answers'}
                    </Button>
                  )}
                  {subQuestionKeys.map(({ key, answerKey, num }) => {
                    const questionText = q[key]
                    const answerText = q[answerKey]
                    if (!questionText) return null
                    return (
                      <div key={num} className="p-3 rounded-xl border border-border/40">
                        <div className="flex items-start gap-3">
                          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                            {num}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionText) }} />
                            {!isPending && showAllCqAnswers && answerText && (
                              <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 w-fit">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{answerText}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {isPending && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending verification</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 border-t border-border/40 bg-muted/20 shrink-0">
          <Button variant="outline" size="sm" disabled={!hasPrev} onClick={onPrev}
            className="gap-1 text-xs rounded-lg px-2.5">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-xs text-muted-foreground">{currentIndex + 1}/{totalCount}</span>
          <Button variant="outline" size="sm" disabled={!hasNext} onClick={onNext}
            className="gap-1 text-xs rounded-lg px-2.5">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
