import { Card, CardContent } from '@/components/ui/card'
import { cn, toBengaliNumerals } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { AnalyticsData } from '@/types/board-questions'
import { BookOpen, Layers, Library, Lock, MapPin, TrendingUp, Unlock } from 'lucide-react'

interface AnalyticsBarProps {
  data: AnalyticsData | null
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

const MOBILE_STAT_CARDS = [
  { key: 'totalQuestions', icon: BookOpen, label: 'Total', gradient: 'from-blue-500 to-cyan-500' },
  { key: 'accessibleQuestions', icon: Unlock, label: 'Accessible', gradient: 'from-emerald-500 to-teal-500' },
  { key: 'premiumQuestions', icon: Lock, label: 'Premium', gradient: 'from-amber-500 to-orange-500' },
  { key: 'accuracyRate', icon: TrendingUp, label: 'Accuracy', gradient: 'from-teal-500 to-emerald-500', suffix: '%' },
] as const

export function AnalyticsBar({ data, isLoading }: AnalyticsBarProps) {
  const isMobile = useIsMobile()
  const cards = isMobile ? MOBILE_STAT_CARDS : STAT_CARDS

  if (isLoading) {
    return (
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2'}>
        {cards.map((card) => (
          <div key={card.key} className={isMobile ? 'h-16 rounded-xl bg-muted/50 animate-pulse' : 'h-20 rounded-xl bg-muted/50 animate-pulse'} />
        ))}
      </div>
    )
  }

  if (!data || data.totalQuestions === 0) return null

  return (
    <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2'}>
      {cards.map((card) => {
        const Icon = card.icon
        const value = data[card.key as keyof AnalyticsData] as number
        const display = 'suffix' in card ? value + card.suffix : toBengaliNumerals(value)

        return (
          <Card key={card.key} className="border-border/40 hover:shadow-sm transition-shadow duration-200">
            <CardContent className={isMobile ? 'p-2.5' : 'p-3'}>
              <div className="flex items-center gap-2">
                <div className={cn('rounded-lg bg-gradient-to-br', card.gradient, isMobile ? 'p-1 shadow-xs' : 'p-1.5 shadow-xs')}>
                  <Icon className={isMobile ? 'h-3 w-3 text-white' : 'h-3.5 w-3.5 text-white'} />
                </div>
                <div className="min-w-0">
                  <p className={isMobile ? 'text-xs font-bold leading-tight truncate' : 'text-sm font-bold leading-tight truncate'}>{display}</p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
