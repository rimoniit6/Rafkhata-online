'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { getDifficultyColor, getDifficultyLabel } from '@/lib/board-utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { stripBoardPrefix } from '@/lib/board-grouping'
import { BoardAggregationBadge } from '@/components/shared/BoardAggregationBadge'
import type { CQListItem } from '@/hooks/use-chapter-content'
import { CheckCircle2, ClipboardList, Crown, Sparkles } from 'lucide-react'

interface CqCardProps {
  cq: CQListItem & { questions?: Array<{ id: string; label: string; text: string; answer: string; marks: number }>; boards?: string[]; years?: string[]; boardLabel?: string }
  index: number
  isPurchased?: boolean
  onUnlock?: () => void
}

export function CqCard({ cq, index, isPurchased, onUnlock }: CqCardProps) {
  const isMobile = useIsMobile()
  const isLocked = cq.isPremium && !isPurchased

  const [showAllAnswers, setShowAllAnswers] = useState(false)

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }}>
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-card border transition-all duration-200',
        'shadow-sm hover:shadow-md',
        isLocked ? 'border-amber-200/60 dark:border-amber-800/40' : 'border-border/50',
        'border-l-4',
        isLocked ? 'border-l-amber-400 dark:border-l-amber-600' : 'border-l-primary/40',
      )}>
        <div className={isMobile ? 'p-3.5' : 'p-4'}>
          {/* Badge row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                <ClipboardList className="h-2.5 w-2.5" />CQ
              </Badge>
              <BoardAggregationBadge
                boards={(cq as any).boards} boardLabel={(cq as any).boardLabel} yearLabel={(cq as any).yearLabel}
                singleBoard={cq.board} singleYear={cq.year} />
              <Badge className={cn('text-[10px] px-1.5 py-0', getDifficultyColor(cq.difficulty))}>
                {getDifficultyLabel(cq.difficulty)}
              </Badge>
            </div>
            {isLocked && (
              <Badge className="shrink-0 text-[10px] px-1.5 py-0 gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-xs">
                <Crown className="h-2.5 w-2.5" />Premium
              </Badge>
            )}
          </div>

          {/* Stimulus */}
          <div className={cn(
            'text-sm leading-relaxed mb-4 [&_*]:inline [&_math]:text-inherit',
            isLocked ? 'blur-sm select-none' : '',
          )}>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(stripBoardPrefix(cq.uddeepok, cq.board, cq.year)) }} />
          </div>

          {/* Sub-questions with toggle answers */}
          <div className={cn(
            'space-y-3',
            isLocked ? 'blur-sm select-none pointer-events-none' : '',
          )}>
            {cq.questions && cq.questions.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowAllAnswers((prev) => !prev)}
                className="gap-1.5 rounded-lg text-xs h-8 mb-2">
                {showAllAnswers ? 'Hide All Answers' : 'Show All Answers'}
              </Button>
            )}
            {cq.questions?.map((q) => (
              <div key={q.id} className="p-3.5 rounded-xl border border-border/40 bg-muted/10">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold shrink-0 mt-0.5">
                    {q.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.text) }} />
                    {q.marks > 0 && (
                      <span className="text-[11px] text-muted-foreground mt-1 block">({q.marks} marks)</span>
                    )}
                    {showAllAnswers && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300" dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.answer) }} />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit mt-2">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Unlock to reveal answers</span>
            </div>
          )}
        </div>

        {/* Premium lock overlay */}
        {isLocked && (
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
              {cq.price > 0 && (
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">৳{cq.price}</span>
              )}
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onUnlock?.() }}
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
