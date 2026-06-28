
import { Card,CardContent } from '@/components/ui/card'
import { cn,toBengaliNumerals } from '@/lib/utils'
import type { AnalyticsData } from '@/types/board-questions'
import {
BookOpen,
Layers,
Library,
Lock,
MapPin,
TrendingUp,
Unlock
} from 'lucide-react'

interface ResultsAnalyticsProps {
  data: AnalyticsData
  isLoading: boolean
}

const STAT_CARDS = [
  { key: 'totalQuestions', icon: BookOpen, label: 'Total Found', gradient: 'from-blue-500 to-cyan-500' },
  { key: 'accessibleQuestions', icon: Unlock, label: 'Accessible', gradient: 'from-emerald-500 to-teal-500' },
  { key: 'premiumQuestions', icon: Lock, label: 'Premium', gradient: 'from-amber-500 to-orange-500' },
  { key: 'availableBoards', icon: MapPin, label: 'Boards', gradient: 'from-violet-500 to-purple-500' },
  { key: 'availableSubjects', icon: Library, label: 'Subjects', gradient: 'from-pink-500 to-rose-500' },
  { key: 'availableChapters', icon: Layers, label: 'Chapters', gradient: 'from-indigo-500 to-blue-500' },
  { key: 'accuracyRate', icon: TrendingUp, label: 'Accuracy', gradient: 'from-teal-500 to-emerald-500', suffix: '%' },
] as const

export function ResultsAnalytics({ data, isLoading }: ResultsAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (data.totalQuestions === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {STAT_CARDS.map((card, idx) => {
        const Icon = card.icon
        const value = data[card.key as keyof AnalyticsData] as number
        const display = 'suffix' in card ? `${value}${card.suffix}` : toBengaliNumerals(value)

        return (
          <div
            key={card.key}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 0.04}s` }}
          >
            <Card className="border-border/40 hover:shadow-sm transition-shadow duration-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-lg bg-gradient-to-br', card.gradient, 'shadow-xs')}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">
                      {typeof value === 'number' ? display : value}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate leading-tight">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
