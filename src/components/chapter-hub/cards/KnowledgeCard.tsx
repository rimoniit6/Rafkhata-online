'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { useIsMobile } from '@/hooks/use-mobile'
import type { KnowledgeItem } from '@/hooks/use-chapter-content'
import { Brain, CheckCircle2, Crown, Sparkles } from 'lucide-react'

interface KnowledgeCardProps {
  item: KnowledgeItem
  index: number
  isPurchased?: boolean
  onUnlock?: () => void
}

export function KnowledgeCard({ item, index, isPurchased, onUnlock }: KnowledgeCardProps) {
  const isMobile = useIsMobile()
  const isLocked = item.isPremium && !isPurchased

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
              <Badge variant="secondary" className={cn(
                'text-[10px] px-1.5 py-0 gap-1',
                item.type === 'knowledge'
                  ? 'border-blue-300 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-purple-300 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30',
              )}>
                <Brain className="h-2.5 w-2.5" />
                {item.type === 'knowledge' ? 'Knowledge' : 'Comprehension'}
              </Badge>
            </div>
            {isLocked && (
              <Badge className="shrink-0 text-[10px] px-1.5 py-0 gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-xs">
                <Crown className="h-2.5 w-2.5" />Premium
              </Badge>
            )}
          </div>

          {/* Question */}
          <div className={cn(
            'text-sm leading-relaxed mb-3 [&_*]:inline [&_math]:text-inherit',
            isLocked ? 'blur-sm select-none' : '',
          )}>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.question) }} />
          </div>

          {item.questionImage && (
            <Image src={item.questionImage} alt="Question" width={800} height={600}
              className={cn('mb-3 max-w-full h-auto rounded-lg', isLocked && 'blur-sm')} unoptimized />
          )}

          {/* Answer — always visible */}
          {!isLocked && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Answer:</span>
                <div className="text-sm leading-relaxed [&_*]:inline [&_math]:text-inherit text-emerald-800 dark:text-emerald-200"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }} />
                {item.answerImage && (
                  <Image src={item.answerImage} alt="Answer" width={800} height={600} className="max-w-full h-auto rounded-lg" unoptimized />
                )}
              </div>
            </div>
          )}

          {isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 w-fit">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Unlock to view answer</span>
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
              <p className="text-sm font-semibold text-foreground">Premium {item.type === 'knowledge' ? 'Knowledge' : 'Comprehension'} Question</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlock this question to view the answer.
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
