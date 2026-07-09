'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { sanitizeHtml } from '@/lib/sanitize'
import { cn } from '@/lib/utils'
import type { AccessStatus,BoardQuestionItem } from '@/types/board-questions'
import { motion } from 'framer-motion'
import {
BookOpen,
Calendar,
CheckCircle2,
Eye,
EyeOff,
Lock,
MapPin,
Zap,
} from 'lucide-react'
import { useState } from 'react'

interface CqViewCardProps {
  question: BoardQuestionItem
  index: number
  accessStatus?: AccessStatus
  onUnlock: () => void
}

const subQuestionKeys = [
  { key: 'question1' as const, answerKey: 'answer1' as const, num: 1 },
  { key: 'question2' as const, answerKey: 'answer2' as const, num: 2 },
  { key: 'question3' as const, answerKey: 'answer3' as const, num: 3 },
  { key: 'question4' as const, answerKey: 'answer4' as const, num: 4 },
]

export function CqViewCard({
  question: q,
  index,
  accessStatus,
  onUnlock,
}: CqViewCardProps) {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set())

  const accessType = accessStatus?.accessType ?? (q.isPremium ? 'locked' : 'free')
  const isLocked = accessType === 'locked'
  const isPending = accessType === 'pending'
  const _isAccessible = accessType === 'free' || accessType === 'purchased'

  const toggleAnswer = (num: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

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
            </div>
            <Badge
              className={cn(
                'text-[10px] px-1.5 py-0 gap-1 shrink-0',
                isLocked
                  ? 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700'
                  : 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
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
              Creative Question #{index + 1}
            </span>
          </div>

          {/* Stimulus */}
          <div className="text-sm sm:text-base leading-relaxed mb-5 p-4 rounded-xl bg-muted/20 border border-border/30 [&_*]:inline [&_math]:text-inherit">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} />
          </div>

          {/* Locked: only passage + unlock button */}
          {isLocked ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onUnlock}
                  className="gap-1.5 text-xs h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Unlock
                </Button>
              </div>
              {isPending && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending verification</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Sub-questions */}
              <div className="space-y-3 mb-4">
                {subQuestionKeys.map(({ key, answerKey, num }) => {
                  const questionText = q[key]
                  const answerText = q[answerKey]
                  const isRevealed = revealedAnswers.has(num)

                  if (!questionText) return null

                  return (
                    <div key={num} className="p-3 rounded-xl border border-border/40">
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                          {num}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionText) }}
                          />

                          {!isPending && (
                            <div className="mt-2">
                              {isRevealed ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                      {answerText}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleAnswer(num)}
                                    className="text-xs h-6 px-1.5 text-muted-foreground hover:text-foreground"
                                  >
                                    <EyeOff className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleAnswer(num)}
                                  className="gap-1.5 text-xs h-7 rounded-lg"
                                >
                                  <Eye className="h-3 w-3" />
                                  Show Answer
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
