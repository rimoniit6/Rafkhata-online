'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileQuestion, BookOpen, Bookmark, Share2, CheckCircle2, XCircle, Clock, Lock, Zap, Sparkles, ChevronDown, Crown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getBoardColorClasses, getDifficultyColor, getDifficultyLabel } from '@/lib/board-utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { useIsMobile } from '@/hooks/use-mobile'
import { stripBoardPrefix } from '@/lib/board-grouping'
import { BoardAggregationBadge } from '@/components/shared/BoardAggregationBadge'
import type { BoardQuestionItem, AccessStatus, PurchaseStatusType } from '@/types/board-questions'

interface McqCardProps {
  question: BoardQuestionItem
  accessStatus?: AccessStatus
  isBookmarked: boolean
  boardColor: string
  onBookmark: () => void
  onShare: () => void
  onUnlock: () => void
  boards?: string[]
  years?: string[]
  boardLabel?: string
  yearLabel?: string
}

const accessTypeConfig: Record<PurchaseStatusType, { label: string; className: string; icon: React.ElementType }> = {
  free: { label: 'Free', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: Zap },
  purchased: { label: 'Unlocked', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  pending: { label: 'Pending', className: 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700', icon: Clock },
  locked: { label: 'Locked', className: 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700', icon: Lock },
}

export function McqCard({ question: q, accessStatus, isBookmarked, boardColor, onBookmark, onShare, onUnlock, boards: aggregatedBoards, years: aggregatedYears, boardLabel, yearLabel }: McqCardProps) {
  const isMobile = useIsMobile()
  const colorClasses = getBoardColorClasses(boardColor)
  const accessType = accessStatus?.accessType ?? (q.isPremium ? 'locked' : 'free')
  const isLocked = accessType === 'locked'
  const isPending = accessType === 'pending'
  const accessCfg = accessTypeConfig[accessType]

  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  const options = [
    { label: 'A', value: q.optionA },
    { label: 'B', value: q.optionB },
    { label: 'C', value: q.optionC },
    { label: 'D', value: q.optionD },
  ]

  const handleOptionClick = useCallback((label: string) => {
    if (isLocked) return
    setSelectedOption(label)
    setShowAnswer(true)
  }, [isLocked])

  const showLockOverlay = isLocked && !isPending

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-card border transition-all duration-200',
        'shadow-sm hover:shadow-md',
        isLocked ? 'border-amber-200/60 dark:border-amber-800/40' : 'border-border/50',
        'border-l-4',
        isLocked ? 'border-l-amber-400 dark:border-l-amber-600' : colorClasses.border,
      )}>
        {/* Card content */}
        <div className={isMobile ? 'p-3.5' : 'p-4'}>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <BoardAggregationBadge
                boards={aggregatedBoards} boardLabel={boardLabel} yearLabel={yearLabel}
                singleBoard={q.board} singleYear={q.year} />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400">
                <FileQuestion className="h-2.5 w-2.5" />MCQ{q.questionCount > 0 && <span className="opacity-60">({q.questionCount})</span>}
              </Badge>
              <Badge className={cn('text-[10px] px-1.5 py-0', getDifficultyColor(q.difficulty))}>{getDifficultyLabel(q.difficulty)}</Badge>
            </div>
            {isLocked && (
              <Badge className="shrink-0 text-[10px] px-1.5 py-0 gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-xs">
                <Crown className="h-2.5 w-2.5" />Premium
              </Badge>
            )}
          </div>

          {/* Subject / Chapter */}
          <div className="flex items-center gap-1.5 mb-3">
            <BookOpen className={isMobile ? 'h-2.5 w-2.5 text-muted-foreground' : 'h-3 w-3 text-muted-foreground'} />
            <span className={isMobile ? 'text-[11px] font-medium text-foreground/80' : 'text-xs font-medium text-foreground/80'}>{q.subjectName}</span>
            {q.chapterName && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className={cn('text-muted-foreground/60 truncate', isMobile ? 'text-[11px]' : 'text-xs')}>{q.chapterName}</span>
              </>
            )}
          </div>

          {/* Question text */}
          <div className={cn(
            'text-sm leading-relaxed mb-4 [&_*]:inline [&_math]:text-inherit',
            showLockOverlay ? 'blur-sm select-none' : '',
          )}>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(stripBoardPrefix(q.question, q.board, q.year)) }} />
          </div>

          {/* Options */}
          <div className={cn(
            'space-y-2 mb-3',
            showLockOverlay ? 'blur-sm select-none pointer-events-none' : '',
          )}>
            {options.map((opt) => {
              const isCorrect = showAnswer && opt.label === q.correctAnswer
              const isWrong = showAnswer && selectedOption === opt.label && opt.label !== q.correctAnswer
              const isSelected = selectedOption === opt.label
              const showDim = showAnswer && !isSelected && !isCorrect && !isWrong
              return (
                <button key={opt.label} disabled={isLocked || isPending} onClick={() => handleOptionClick(opt.label)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border transition-all duration-200 text-left',
                    isMobile ? 'p-3.5' : 'p-3',
                    showAnswer && isCorrect
                      ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-emerald-950/20'
                      : isWrong
                        ? 'border-red-300 bg-red-50/60 dark:border-red-700/50 dark:bg-red-950/20'
                        : showDim
                          ? 'border-border/50 bg-muted/20 opacity-50'
                          : 'border-border/40 hover:border-foreground/20 hover:bg-muted/10',
                    isLocked && 'opacity-60 cursor-not-allowed',
                    !isLocked && !showAnswer && 'cursor-pointer',
                  )}>
                  <span className={cn(
                    'flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 transition-colors',
                    showAnswer && isCorrect
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isWrong
                        ? 'bg-red-500 text-white shadow-xs'
                        : isSelected
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted-foreground/10 text-muted-foreground/70',
                  )}>
                    {showAnswer && isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : isWrong ? <XCircle className="h-3.5 w-3.5" /> : opt.label}
                  </span>
                  <span className={cn('flex-1 leading-relaxed [&_*]:inline', isMobile ? 'text-sm' : 'text-sm')}>{opt.value}</span>
                </button>
              )
            })}
          </div>

          {/* Free: Answer result + Explanation */}
          {showAnswer && !isLocked && !isPending && (
            <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 w-fit">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Correct Answer: {q.correctAnswer}
                </span>
              </div>

              {q.explanation && (
                <div className="border border-border/40 rounded-xl overflow-hidden">
                  <button onClick={() => setShowExplanation((prev) => !prev)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-left bg-muted/20 hover:bg-muted/40 transition-colors">
                    <span className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary/60" />Explanation
                    </span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', showExplanation && 'rotate-180')} />
                  </button>
                  <AnimatePresence initial={false}>
                    {showExplanation && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                        <div className="px-3 py-3 border-t border-border/40">
                          <div className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.explanation) }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {!showAnswer && isLocked && !isPending && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Unlock to check your answer</span>
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending verification</span>
            </div>
          )}

          {/* Bottom actions */}
          <div className="flex items-center justify-end gap-1 pt-3 mt-2 border-t border-border/30">
            <Button variant="ghost" size="icon" className={cn(isMobile ? 'h-9 w-9' : 'h-8 w-8', 'rounded-lg', isBookmarked && 'text-amber-500')}
              onClick={(e) => { e.stopPropagation(); onBookmark() }}>
              <Bookmark className={cn('h-3.5 w-3.5', isBookmarked && 'fill-current')} />
            </Button>
            <Button variant="ghost" size="icon" className={isMobile ? 'h-9 w-9 rounded-lg' : 'h-8 w-8 rounded-lg'} onClick={(e) => { e.stopPropagation(); onShare() }}>
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Premium lock overlay — full card blur cover */}
        {showLockOverlay && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-background/20 via-background/50 to-background/80 backdrop-blur-sm rounded-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3 max-w-[240px]">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-200/50 dark:border-amber-700/50 shadow-sm">
                  <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <motion.div className="absolute -top-1 -right-1" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </motion.div>
              </div>
              <p className="text-sm font-semibold text-foreground">Premium Question</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlock this question to attempt it, check your answer, and view the explanation.
              </p>
              {q.price > 0 && (
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">৳{q.price}</span>
              )}
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onUnlock() }}
                className="gap-2 h-10 px-5 text-sm rounded-xl font-medium shadow-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Crown className="h-4 w-4" />Unlock Now
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
