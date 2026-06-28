'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import type { SuggestionItem } from '@/hooks/use-chapter-content'
import { cn } from '@/lib/utils'
import { EyeIcon,FileText,Lock,Zap } from 'lucide-react'

interface SuggestionCardProps {
  suggestion: SuggestionItem
  index: number
  isPurchased?: boolean
  onUnlock?: () => void
  onView?: () => void
}

export function SuggestionCard({ suggestion, index, isPurchased, onUnlock, onView }: SuggestionCardProps) {
  const isLocked = suggestion.isPremium && !isPurchased

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
      <Card
        className={cn(
          'border-border/50 transition-all duration-300 overflow-hidden',
          !isLocked && 'cursor-pointer hover:border-border/80',
        )}
        onClick={!isLocked ? onView : undefined}
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                'p-2.5 rounded-xl shrink-0',
                isLocked ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30',
              )}>
                <FileText className={cn(
                  'h-5 w-5',
                  isLocked ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400',
                )} />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-sm sm:text-base truncate">{suggestion.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn(
                    'text-[10px] px-1.5 py-0 gap-1',
                    isLocked
                      ? 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
                  )} variant="outline">
                    {isLocked ? <><Lock className="h-2.5 w-2.5" /> Locked</> : <><Zap className="h-2.5 w-2.5" /> Free</>}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isLocked ? (
                <Button size="sm" variant="outline" onClick={onUnlock} className="rounded-lg text-xs h-8">
                  <Lock className="h-3 w-3 mr-1" /> Unlock
                </Button>
              ) : (
                <Button size="sm" onClick={onView} className="rounded-lg text-xs h-8">
                  <EyeIcon className="h-3 w-3 mr-1" /> View
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
