'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { getBoardColorClasses, getDifficultyColor, getDifficultyLabel } from '@/lib/board-utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { BoardQuestionItem } from '@/types/board-questions'
import { stripBoardPrefix } from '@/lib/board-grouping'
import { BoardAggregationBadge } from '@/components/shared/BoardAggregationBadge'
import { CheckCircle2, Crown, Eye, EyeOff, FileQuestion, Sparkles, XCircle, ChevronDown } from 'lucide-react'

interface BoardQuestionCardProps {
  question: BoardQuestionItem & { boards?: string[]; years?: string[]; boardLabel?: string; yearLabel?: string }
  index: number
  isPurchased?: boolean
  onUnlock?: () => void
}

export function BoardQuestionCard({ question, index, isPurchased, onUnlock }: BoardQuestionCardProps) {
  const isMobile = useIsMobile()
  const isLocked = question.isPremium && !isPurchased
  const isMcq = question.type === 'mcq'
  const colorClasses = getBoardColorClasses(question.boardColor || 'rose')

  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({})

  const handleOptionClick = useCallback((key: string) => {
    if (isLocked) return
    setSelectedOption(key)
    setShowAnswer(true)
  }, [isLocked])

  const toggleCqAnswer = useCallback((qId: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }))
  }, [])

  const mcqOptions = [
    { key: 'A', text: question.optionA, image: question.optionAImage },
    { key: 'B', text: question.optionB, image: question.optionBImage },
    { key: 'C', text: question.optionC, image: question.optionCImage },
    { key: 'D', text: question.optionD, image: question.optionDImage },
  ]

  const cqSubQuestions = [
    { label: 'ক', text: question.question1, image: question.question1Image, answer: question.answer1, answerImage: question.answer1Image },
    { label: 'খ', text: question.question2, image: question.question2Image, answer: question.answer2, answerImage: question.answer2Image },
    { label: 'গ', text: question.question3, image: question.question3Image, answer: question.answer3, answerImage: question.answer3Image },
    { label: 'ঘ', text: question.question4, image: question.question4Image, answer: question.answer4, answerImage: question.answer4Image },
  ]

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }}>
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-card border transition-all duration-200',
        'shadow-sm hover:shadow-md',
        isLocked ? 'border-amber-200/60 dark:border-amber-800/40' : 'border-border/50',
        'border-l-4',
        isLocked ? 'border-l-amber-400 dark:border-l-amber-600' : colorClasses.border,
      )}>
        <div className={isMobile ? 'p-3.5' : 'p-4'}>
          {/* Badge row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <BoardAggregationBadge
                boards={question.boards} boardLabel={question.boardLabel} yearLabel={question.yearLabel}
                singleBoard={question.board} singleYear={question.year} />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                <FileQuestion className="h-2.5 w-2.5" />{isMcq ? 'MCQ' : 'CQ'}
              </Badge>
              {question.difficulty && (
                <Badge className={cn('text-[10px] px-1.5 py-0', getDifficultyColor(question.difficulty))}>
                  {getDifficultyLabel(question.difficulty)}
                </Badge>
              )}
            </div>
            {isLocked && (
              <Badge className="shrink-0 text-[10px] px-1.5 py-0 gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-xs">
                <Crown className="h-2.5 w-2.5" />Premium
              </Badge>
            )}
          </div>

          {/* Question / Stimulus */}
          <div className={cn(
            'text-sm leading-relaxed mb-4 [&_*]:inline [&_math]:text-inherit',
            isLocked ? 'blur-sm select-none' : '',
          )}>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(stripBoardPrefix(question.question, question.board, question.year)) }} />
          </div>

          {/* MCQ: Options always visible */}
          {isMcq && (
            <div className={cn(
              'space-y-2 mb-3',
              isLocked ? 'blur-sm select-none pointer-events-none' : '',
            )}>
              {mcqOptions.map((opt) => {
                const isCorrect = showAnswer && opt.key === question.correctAnswer
                const isWrong = showAnswer && selectedOption === opt.key && opt.key !== question.correctAnswer
                const isSelected = selectedOption === opt.key
                const showDim = showAnswer && !isSelected && !isCorrect && !isWrong
                return (
                  <button key={opt.key} disabled={isLocked} onClick={() => handleOptionClick(opt.key)}
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
                      {showAnswer && isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : isWrong ? <XCircle className="h-3.5 w-3.5" /> : opt.key}
                    </span>
                    {opt.image ? (
                      <Image src={opt.image} alt={`Option ${opt.key}`} width={80} height={80} className="max-h-12 rounded object-contain" unoptimized />
                    ) : (
                      <span className={cn('flex-1 leading-relaxed [&_*]:inline', isMobile ? 'text-sm' : 'text-sm')} dangerouslySetInnerHTML={{ __html: sanitizeHtml(opt.text || '') }} />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* MCQ: Answer result + Explanation */}
          {isMcq && showAnswer && !isLocked && (
            <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 w-fit">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Correct Answer: {question.correctAnswer}
                </span>
              </div>

              {question.explanation && (
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
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.explanation) }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {isMcq && !showAnswer && isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Unlock to check your answer</span>
            </div>
          )}

          {/* CQ: Sub-questions always visible */}
          {!isMcq && (
            <div className={cn(
              'space-y-3',
              isLocked ? 'blur-sm select-none pointer-events-none' : '',
            )}>
              {cqSubQuestions.map((q) => {
                if (!q.text) return null
                const qId = q.label
                return (
                  <div key={qId} className="p-3.5 rounded-xl border border-border/40 bg-muted/10">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold shrink-0 mt-0.5">
                        {qId}
                      </span>
                      <div className="flex-1 min-w-0">
                        {q.image ? (
                          <Image src={q.image} alt={`Question ${qId}`} width={80} height={80} className="max-h-20 rounded object-contain" unoptimized />
                        ) : (
                          <div className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.text) }} />
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="ghost" size="sm" onClick={() => toggleCqAnswer(qId)}
                            className="h-7 text-xs rounded-lg gap-1.5">
                            {revealedAnswers[qId] ? <><EyeOff className="h-3 w-3" /> Hide Answer</> : <><Eye className="h-3 w-3" /> Show Answer</>}
                          </Button>
                        </div>
                        <AnimatePresence>
                          {revealedAnswers[qId] && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 w-fit">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                {q.answerImage ? (
                                  <Image src={q.answerImage} alt={`Answer ${qId}`} width={128} height={128} className="max-h-20 rounded object-contain" unoptimized />
                                ) : (
                                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300" dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.answer || '') }} />
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!isMcq && isLocked && (
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
              <p className="text-sm font-semibold text-foreground">Premium {isMcq ? 'MCQ' : 'Creative'} Question</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isMcq
                  ? 'Unlock this question to attempt it, check your answer, and view the explanation.'
                  : 'Unlock this question to view sub-questions and check detailed answers.'}
              </p>
              {question.price > 0 && (
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">৳{question.price}</span>
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
