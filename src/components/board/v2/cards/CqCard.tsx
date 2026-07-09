'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, BookOpen, Bookmark, Share2, CheckCircle2, Clock, Lock, Zap, Sparkles, ChevronDown, Crown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getBoardColorClasses, getDifficultyColor, getDifficultyLabel } from '@/lib/board-utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { useIsMobile } from '@/hooks/use-mobile'
import { stripBoardPrefix } from '@/lib/board-grouping'
import { BoardAggregationBadge } from '@/components/shared/BoardAggregationBadge'
import type { BoardQuestionItem, AccessStatus, PurchaseStatusType } from '@/types/board-questions'

interface CqCardProps {
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

const subQuestionKeys = [
  { key: 'question1' as const, answerKey: 'answer1' as const, num: 1 },
  { key: 'question2' as const, answerKey: 'answer2' as const, num: 2 },
  { key: 'question3' as const, answerKey: 'answer3' as const, num: 3 },
  { key: 'question4' as const, answerKey: 'answer4' as const, num: 4 },
]

export function CqCard({ question: q, accessStatus, isBookmarked, boardColor, onBookmark, onShare, onUnlock, boards: aggregatedBoards, years: aggregatedYears, boardLabel, yearLabel }: CqCardProps) {
  const isMobile = useIsMobile()
  const colorClasses = getBoardColorClasses(boardColor)
  const accessType = accessStatus?.accessType ?? (q.isPremium ? 'locked' : 'free')
  const isLocked = accessType === 'locked'
  const isPending = accessType === 'pending'
  const accessCfg = accessTypeConfig[accessType]

  const [showAllCqAnswers, setShowAllCqAnswers] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const cqHasSubQuestions = subQuestionKeys.some(({ key }) => q[key])

  const handleToggleCqAnswers = useCallback(() => {
    setShowAllCqAnswers((prev) => !prev)
  }, [])

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
        <div className={isMobile ? 'p-3.5' : 'p-4'}>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <BoardAggregationBadge
                boards={aggregatedBoards} boardLabel={boardLabel} yearLabel={yearLabel}
                singleBoard={q.board} singleYear={q.year} />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                <ClipboardList className="h-2.5 w-2.5" />CQ{q.questionCount > 0 && <span className="opacity-60">({q.questionCount})</span>}
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

          {/* Question stimulus text */}
          <div className={cn(
            'text-sm leading-relaxed mb-4 [&_*]:inline [&_math]:text-inherit',
            showLockOverlay ? 'blur-sm select-none' : '',
          )}>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(stripBoardPrefix(q.question, q.board, q.year)) }} />
          </div>

          {/* Sub-questions */}
          <div className={cn(
            'space-y-3',
            showLockOverlay ? 'blur-sm select-none pointer-events-none' : '',
          )}>
            {cqHasSubQuestions && !isLocked && (
              <Button variant="outline" size="sm" onClick={handleToggleCqAnswers}
                className="gap-1.5 rounded-lg text-xs h-8 mb-2">
                {showAllCqAnswers ? 'Hide All Answers' : 'Show All Answers'}
              </Button>
            )}
            {subQuestionKeys.map(({ key, answerKey, num }) => {
              const questionText = q[key]
              const answerText = q[answerKey]
              if (!questionText) return null
              return (
                <div key={num} className="p-3.5 rounded-xl border border-border/40 bg-muted/10">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold shrink-0 mt-0.5">
                      {num}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionText) }} />
                      {!isPending && showAllCqAnswers && answerText && (
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{answerText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {isLocked && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Unlock to reveal answers</span>
              </div>
            )}

            {isPending && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending verification</span>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-border/30">
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
              <p className="text-sm font-semibold text-foreground">Premium Creative Question</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlock this question to view sub-questions and check detailed answers.
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
