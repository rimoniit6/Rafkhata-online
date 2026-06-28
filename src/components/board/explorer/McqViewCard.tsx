'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { getDifficultyLabel } from '@/lib/board-utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { cn } from '@/lib/utils'
import type { AccessStatus,BoardQuestionItem } from '@/types/board-questions'
import { AnimatePresence,motion } from 'framer-motion'
import {
BookOpen,
Calendar,
CheckCircle2,
ChevronDown,
Crown,
Lock,
MapPin,
Sparkles,
Star,
Zap,
} from 'lucide-react'
import { useState } from 'react'

interface McqViewCardProps {
  question: BoardQuestionItem
  index: number
  accessStatus?: AccessStatus
  onUnlock: () => void
}

const _optionLabels = ['A', 'B', 'C', 'D']

export function McqViewCard({
  question: q,
  index,
  accessStatus,
  onUnlock,
}: McqViewCardProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const accessType = accessStatus?.accessType ?? (q.isPremium ? 'locked' : 'free')
  const isLocked = accessType === 'locked'
  const isPending = accessType === 'pending'
  const isExplanationLocked = q.isPremium && isLocked

  const options = [
    { label: 'A', value: q.optionA, image: q.optionAImage },
    { label: 'B', value: q.optionB, image: q.optionBImage },
    { label: 'C', value: q.optionC, image: q.optionCImage },
    { label: 'D', value: q.optionD, image: q.optionDImage },
  ]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-border/50 hover:border-border/80 transition-all duration-300 overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="font-medium text-foreground/80">{q.board.charAt(0).toUpperCase() + q.board.slice(1)} Board</span>
              <span className="text-muted-foreground/40">•</span>
              <Calendar className="h-3 w-3" />
              <span>{q.year}</span>
              {!isLocked && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {getDifficultyLabel(q.difficulty)}
                  </Badge>
                </>
              )}
            </div>
            <Badge
              className={cn(
                'text-[10px] px-1.5 py-0 gap-1 shrink-0',
                isLocked
                  ? 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
              )}
              variant={isLocked ? 'outline' : 'secondary'}
            >
              {isLocked ? (
                <><Lock className="h-2.5 w-2.5" /> Locked</>
              ) : (
                <><Zap className="h-2.5 w-2.5" /> Free</>
              )}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground/70">
            <BookOpen className="h-3 w-3" />
            <span className="font-medium text-foreground/70">{q.subjectName}</span>
            {q.chapterName && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span>Chapter: {q.chapterName}</span>
              </>
            )}
          </div>

          <div className="mb-1">
            <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              Question #{index + 1}
            </span>
          </div>

          {/* Question Text */}
          <div className="text-sm sm:text-base leading-relaxed mb-5 [&_*]:inline [&_math]:text-inherit">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} />
          </div>

          {/* Options */}
          <div className="space-y-2 mb-5">
            {options.map((opt) => {
              const isCorrect = showAnswer && opt.label === q.correctAnswer
              const _isWrong = showAnswer && opt.label !== q.correctAnswer

              return (
                <div
                  key={opt.label}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border transition-all duration-200',
                    showAnswer && isCorrect
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700/50 dark:bg-emerald-950/20'
                      : showAnswer
                        ? 'border-border/50 bg-muted/20'
                        : 'border-border/40 hover:border-foreground/20 hover:bg-muted/10',
                    isLocked && 'opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold shrink-0 mt-0.5',
                      showAnswer && isCorrect
                        ? 'bg-emerald-500 text-white'
                        : showAnswer
                          ? 'bg-muted-foreground/10 text-muted-foreground'
                          : 'bg-muted-foreground/10 text-muted-foreground/70',
                    )}
                  >
                    {showAnswer && isCorrect ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      opt.label
                    )}
                  </span>
                  <span className="text-sm leading-relaxed flex-1 [&_*]:inline">
                    {opt.value}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Answer Section */}
          {!isPending && (
            <div className="mb-4">
              {showAnswer ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Correct Answer: {q.correctAnswer}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnswer(false)}
                    className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                  >
                    Hide
                  </Button>
                </motion.div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswer(true)}
                  className="gap-1.5 rounded-lg text-xs h-8"
                >
                  <Star className="h-3.5 w-3.5" />
                  Show Answer
                </Button>
              )}
            </div>
          )}

          {/* Unlock button for locked content */}
          {isLocked && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="sm"
                onClick={onUnlock}
                className="gap-1.5 text-xs h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg"
              >
                <Lock className="h-3.5 w-3.5" />
                Unlock
              </Button>
            </div>
          )}
          {isPending && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 mb-4">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending verification</span>
            </div>
          )}

          {/* Explanation Section */}
          {showAnswer && (
            <div className="border-t border-border/40 pt-4">
              <button
                onClick={() => setShowExplanation((prev) => !prev)}
                className="flex items-center justify-between w-full text-left group"
              >
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary/60" />
                  View Explanation
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    showExplanation && 'rotate-180',
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {showExplanation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {isExplanationLocked ? (
                      <div className="pt-3">
                        <div className="relative rounded-xl border border-amber-200/60 dark:border-amber-800/40 overflow-hidden">
                          {/* Blurred preview */}
                          <div className="p-4 blur-sm select-none pointer-events-none">
                            <div className="space-y-2">
                              <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                              <div className="h-4 bg-muted-foreground/10 rounded w-1/2" />
                              <div className="h-4 bg-muted-foreground/10 rounded w-5/6" />
                              <div className="h-4 bg-muted-foreground/10 rounded w-2/3" />
                            </div>
                          </div>
                          {/* Lock overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] p-6 text-center">
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-2">
                              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-sm font-semibold text-foreground mb-1">Premium Explanation</p>
                            <p className="text-xs text-muted-foreground mb-3 max-w-[220px]">
                              Upgrade to access detailed explanation and solution
                            </p>
                            <Button
                              size="sm"
                              onClick={onUnlock}
                              className="gap-1.5 text-xs h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg"
                            >
                              <Crown className="h-3.5 w-3.5" />
                              Unlock Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                          <div
                            className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.explanation || 'No explanation available for this question.') }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
