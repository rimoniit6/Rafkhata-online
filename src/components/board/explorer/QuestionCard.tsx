'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileQuestion,
  ClipboardList,
  BookOpen,
  MapPin,
  Calendar,
  Zap,
  CheckCircle2,
  Lock,
  Eye,
  Bookmark,
  Share2,
  Play,
  Clock,
  Sparkles,
  ChevronDown,
  Crown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { getBoardColorClasses, getDifficultyColor, getDifficultyLabel, getDifficultyStripe } from '@/lib/board-utils'
import type { BoardQuestionItem, AccessStatus, PurchaseStatusType } from '@/types/board-questions'

interface QuestionCardProps {
  question: BoardQuestionItem
  accessStatus?: AccessStatus
  isBookmarked: boolean
  isExpanded: boolean
  boardColor: string
  onCardClick: () => void
  onBookmark: () => void
  onShare: () => void
}

const accessTypeConfig: Record<PurchaseStatusType, { label: string; className: string; icon: React.ElementType }> = {
  free: {
    label: 'Free',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    icon: Zap,
  },
  purchased: {
    label: 'Unlocked',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    className: 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700',
    icon: Clock,
  },
  locked: {
    label: 'Locked',
    className: 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700',
    icon: Lock,
  },
}

export function QuestionCard({
  question: q,
  accessStatus,
  isBookmarked,
  isExpanded,
  boardColor,
  onCardClick,
  onBookmark,
  onShare,
}: QuestionCardProps) {
  const colorClasses = getBoardColorClasses(boardColor)
  const accessType = accessStatus?.accessType ?? (q.isPremium ? 'locked' : 'free')
  const isLocked = accessType === 'locked'
  const isPending = accessType === 'pending'
  const isUnlocked = accessType === 'purchased'
  const isFree = accessType === 'free'
  const isMcq = q.type === 'mcq'
  const [showExplanation, setShowExplanation] = useState(false)
  const accessCfg = accessTypeConfig[accessType]

  const options = [
    { label: 'A', value: q.optionA },
    { label: 'B', value: q.optionB },
    { label: 'C', value: q.optionC },
    { label: 'D', value: q.optionD },
  ]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border',
          isLocked
            ? 'border-amber-200/60 dark:border-amber-800/40 hover:border-amber-300/80'
            : isUnlocked
              ? 'border-emerald-200/60 dark:border-emerald-800/40'
              : 'border-border/50 hover:border-foreground/10',
          isExpanded && isMcq && 'ring-1 ring-primary/20',
        )}
        onClick={isLocked ? onCardClick : (isMcq ? onCardClick : onCardClick)}
      >
        <div className={cn('h-1 w-full', getDifficultyStripe(q.difficulty))} />

        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {q.board && (
              <Badge
                variant="secondary"
                className={cn('text-[10px] px-1.5 py-0 gap-1', colorClasses.lightBg, colorClasses.text)}
              >
                <MapPin className="h-2.5 w-2.5" />
                {q.board.charAt(0).toUpperCase() + q.board.slice(1)}
              </Badge>
            )}

            {q.year && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {q.year}
              </Badge>
            )}

            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] px-1.5 py-0 gap-1',
                q.type === 'mcq'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
              )}
            >
              {q.type === 'mcq' ? (
                <FileQuestion className="h-2.5 w-2.5" />
              ) : (
                <ClipboardList className="h-2.5 w-2.5" />
              )}
              {q.type.toUpperCase()}
              {q.questionCount > 0 && (
                <span className="opacity-60">({q.questionCount})</span>
              )}
            </Badge>

            <Badge
              className={cn(
                'text-[10px] px-1.5 py-0 gap-1',
                isLocked ? 'border border-amber-300/50' : '',
                accessCfg.className,
              )}
            >
              <accessCfg.icon className="h-2.5 w-2.5" />
              {accessCfg.label}
            </Badge>

            <Badge className={cn('text-[10px] px-1.5 py-0', getDifficultyColor(q.difficulty))}>
              {getDifficultyLabel(q.difficulty)}
            </Badge>
          </div>

          <div className={cn(
            'text-sm leading-relaxed mb-2',
            isLocked ? 'blur-sm select-none' : '',
          )}>
            <div
              className={cn(!isExpanded || isLocked ? 'line-clamp-2' : '')}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(isExpanded && !isLocked
                  ? q.question
                  : q.question.length > 120
                    ? q.question.slice(0, 120) + '...'
                    : q.question),
              }}
            />
          </div>

          {isLocked && accessStatus && (accessStatus.packages?.length || accessStatus.bundles?.length) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {accessStatus.packages?.slice(0, 1).map((pkg) => (
                <Badge
                  key={pkg.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 gap-1 text-primary/70 border-primary/20"
                >
                  {pkg.title}
                  {pkg.discount > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">-{pkg.discount}%</span>
                  )}
                </Badge>
              ))}
              {accessStatus.bundles?.slice(0, 1).map((bundle) => (
                <Badge
                  key={bundle.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 gap-1 text-violet-600/70 border-violet-200/50 dark:text-violet-400/70 dark:border-violet-800/30"
                >
                  {bundle.title}
                  {bundle.discount > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">-{bundle.discount}%</span>
                  )}
                </Badge>
              ))}
              {((accessStatus.packages?.length ?? 0) + (accessStatus.bundles?.length ?? 0) > 1) && (
                <span className="text-[10px] text-muted-foreground/60 self-center">+more</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-3">
            <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{q.subjectName}</span>
            {q.chapterName && (
              <>
                <span className="text-xs text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground/70 truncate">{q.chapterName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isLocked && !isPending && (
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg"
                onClick={(e) => { e.stopPropagation(); onCardClick() }}
              >
                <Lock className="h-3 w-3" />
                Unlock
              </Button>
            )}
            {isPending && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending</span>
              </div>
            )}
            {!isMcq && (isUnlocked || isFree) && (
              <Button
                size="sm"
                className={cn(
                  'gap-1.5 text-xs h-8 px-3 rounded-lg',
                  isUnlocked
                    ? 'variant-outline'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm',
                )}
                onClick={(e) => { e.stopPropagation(); onCardClick() }}
              >
                {isUnlocked ? <Eye className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {isUnlocked ? 'View' : 'Practice'}
              </Button>
            )}

            <div className="ml-auto flex items-center gap-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-8 w-8 rounded-lg',
                        isBookmarked && 'text-amber-500',
                      )}
                      onClick={(e) => { e.stopPropagation(); onBookmark() }}
                    >
                      <Bookmark className={cn('h-3.5 w-3.5', isBookmarked && 'fill-current')} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">{isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={(e) => { e.stopPropagation(); onShare() }}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Share</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isExpanded && isMcq && !isLocked && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-border/40 space-y-3">
                  {/* Options */}
                  <div className="space-y-1.5">
                    {options.map((opt) => {
                      const isCorrect = opt.label === q.correctAnswer
                      return (
                        <div
                          key={opt.label}
                          className={cn(
                            'flex items-center gap-2.5 p-2 rounded-lg border transition-colors text-xs',
                            isCorrect
                              ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700/50 dark:bg-emerald-950/20'
                              : 'border-border/40',
                          )}
                        >
                          <div className={cn(
                            'flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-semibold shrink-0',
                            isCorrect
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted-foreground/10 text-muted-foreground/70',
                          )}>
                            {isCorrect ? <CheckCircle2 className="h-3 w-3" /> : opt.label}
                          </div>
                          <span className="leading-relaxed">{opt.label}. {opt.value}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Correct Answer */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Correct Answer: {q.correctAnswer}
                    </span>
                  </div>

                  {/* Explanation Accordion */}
                  <div className="border-t border-border/40 pt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowExplanation((prev) => !prev) }}
                      className="flex items-center justify-between w-full text-left group"
                    >
                      <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                        View Explanation
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
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
                          {q.isPremium && isLocked ? (
                            <div className="pt-2">
                              <div className="relative rounded-lg border border-amber-200/60 dark:border-amber-800/40 overflow-hidden">
                                <div className="p-3 blur-sm select-none pointer-events-none">
                                  <div className="space-y-1.5">
                                    <div className="h-3 bg-muted-foreground/10 rounded w-3/4" />
                                    <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
                                  </div>
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] p-4 text-center">
                                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-1.5">
                                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <p className="text-xs font-semibold text-foreground mb-0.5">Premium Explanation</p>
                                  <p className="text-[10px] text-muted-foreground mb-2">Upgrade to access detailed solution</p>
                                  <Button
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); onCardClick() }}
                                    className="gap-1 text-[10px] h-7 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm rounded-lg"
                                  >
                                    <Crown className="h-3 w-3" />
                                    Unlock Now
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                                <div
                                  className="text-xs leading-relaxed [&_*]:inline [&_math]:text-inherit"
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.explanation || 'No explanation available for this question.') }}
                                />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
