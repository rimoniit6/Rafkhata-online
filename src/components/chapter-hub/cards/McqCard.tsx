'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SafeImage from '@/components/ui/safe-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { Crown, HelpCircle, Sparkles, XCircle, CheckCircle2, ChevronDown } from 'lucide-react'

export interface McqItem {
  id: string
  text: string
  questionImage?: string | null
  options: { key: string; text: string; image?: string | null }[]
  correctAnswer: string
  explanation: string
  explanationImage?: string | null
  isPremium: boolean
  price: number
  difficulty: string
  board: string | null
  year: string | null
  hasAccess: boolean
}

interface McqCardProps {
  item: McqItem
  isPurchased?: boolean
  onUnlock?: () => void
}

export function McqCard({ item, isPurchased, onUnlock }: McqCardProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const isLocked = item.isPremium && !isPurchased

  const handleOptionClick = useCallback((key: string) => {
    if (isLocked) return
    setSelectedOption(key)
    setShowAnswer(true)
  }, [isLocked])

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-card border transition-all duration-200',
        'shadow-sm hover:shadow-md',
        isLocked ? 'border-amber-200/60 dark:border-amber-800/40' : 'border-border/50',
        'border-l-4',
        isLocked ? 'border-l-amber-400 dark:border-l-amber-600' : 'border-l-primary/40',
      )}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 border-blue-300 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">
                <HelpCircle className="h-2.5 w-2.5" />MCQ
              </Badge>
              {item.difficulty && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.difficulty}</Badge>
              )}
              {item.board && item.year && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.board} {item.year}</Badge>
              )}
            </div>
            {isLocked && (
              <Badge className="shrink-0 text-[10px] px-1.5 py-0 gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-xs">
                <Crown className="h-2.5 w-2.5" />Premium
              </Badge>
            )}
          </div>

          <div className={cn(
            'text-sm leading-relaxed mb-4 [&_*]:inline [&_math]:text-inherit',
            isLocked ? 'blur-sm select-none' : '',
          )}>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.text) }} />
          </div>

          {item.questionImage && (
            <SafeImage src={item.questionImage} alt="" width={640} height={360}
              className={cn('mb-3 max-w-full h-auto rounded-lg max-h-48', isLocked && 'blur-sm')} />
          )}

          <div className={cn(
            'space-y-2 mb-3',
            isLocked ? 'blur-sm select-none pointer-events-none' : '',
          )}>
            {item.options.map((opt) => {
              const isCorrect = showAnswer && opt.key === item.correctAnswer
              const isWrong = showAnswer && selectedOption === opt.key && opt.key !== item.correctAnswer
              const isDim = showAnswer && !isCorrect && selectedOption !== opt.key
              return (
                <button key={opt.key} disabled={isLocked} onClick={() => handleOptionClick(opt.key)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border transition-all duration-200 text-left p-3',
                    showAnswer && isCorrect
                      ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/50 dark:bg-emerald-950/20'
                      : isWrong
                        ? 'border-red-300 bg-red-50/60 dark:border-red-700/50 dark:bg-red-950/20'
                        : isDim
                          ? 'border-border/50 bg-muted/20 opacity-50'
                          : 'border-border/40 hover:border-foreground/20 hover:bg-muted/10',
                    !isLocked && !showAnswer && 'cursor-pointer',
                  )}>
                  <span className={cn(
                    'flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 transition-colors',
                    showAnswer && isCorrect
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isWrong
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'bg-muted-foreground/10 text-muted-foreground/70',
                  )}>
                    {showAnswer && isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : isWrong ? <XCircle className="h-3.5 w-3.5" /> : opt.key}
                  </span>
                  <span className="flex-1 leading-relaxed text-sm">{opt.text}</span>
                  {item.questionImage && opt.image && (
                    <SafeImage src={opt.image} alt="" width={32} height={32} className="h-8 w-8 object-cover rounded" />
                  )}
                </button>
              )
            })}
          </div>

          {showAnswer && !isLocked && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 w-fit">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Correct Answer: {item.correctAnswer}
                </span>
              </div>

              {item.explanation && (
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
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.explanation) }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {!showAnswer && isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Unlock to check your answer</span>
            </div>
          )}
        </div>

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
              <p className="text-sm font-semibold text-foreground">Premium MCQ</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlock this question to attempt it, check your answer, and view the explanation.
              </p>
              {item.price > 0 && (
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">৳{item.price}</span>
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
