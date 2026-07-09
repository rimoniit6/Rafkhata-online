'use client'

import { useBoardFilterStore } from '@/store/board-filters'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { BarChart3, Lock, SlidersHorizontal, Sparkles, TrendingUp, Trophy } from 'lucide-react'
import type { BoardQuestionFilters } from '@/types/board-questions'

interface AdvancedFiltersProps {
  compact?: boolean
}

interface FilterGroup {
  id: string; label: string; icon: React.ElementType; type: 'radio' | 'checkbox'; key: keyof BoardQuestionFilters;
  options: { value: string; label: string }[]
}

const FILTER_GROUPS: FilterGroup[] = [
  { id: 'access', label: 'Content Access', icon: Lock, type: 'radio', key: 'contentAccess',
    options: [{ value: 'all', label: 'All Questions' }, { value: 'free', label: 'Free Questions' }, { value: 'premium', label: 'Premium Questions' }, { value: 'unlocked', label: 'Unlocked Questions' }] },
  { id: 'difficulty', label: 'Difficulty', icon: BarChart3, type: 'checkbox', key: 'difficulty',
    options: [{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }] },
  { id: 'status', label: 'Progress Status', icon: Trophy, type: 'checkbox', key: 'status',
    options: [{ value: 'solved', label: 'Solved' }, { value: 'unsolved', label: 'Unsolved' }, { value: 'bookmarked', label: 'Bookmarked' }, { value: 'attempted', label: 'Attempted' }, { value: 'not_attempted', label: 'Not Attempted' }, { value: 'correct', label: 'Correct Answers' }, { value: 'wrong', label: 'Wrong Answers' }] },
  { id: 'popularity', label: 'Popularity', icon: TrendingUp, type: 'checkbox', key: 'topics',
    options: [{ value: 'recently_viewed', label: 'Recently Viewed' }, { value: 'frequently_asked', label: 'Frequently Asked' }, { value: 'most_repeated', label: 'Most Repeated' }] },
  { id: 'sort', label: 'Sort By', icon: SlidersHorizontal, type: 'radio', key: 'sortBy',
    options: [{ value: 'year_desc', label: 'Year (Newest First)' }, { value: 'year_asc', label: 'Year (Oldest First)' }, { value: 'popularity', label: 'Popularity' }, { value: 'recently_viewed', label: 'Recently Viewed' }] },
]

function FilterGroupSection({ group }: { group: FilterGroup }) {
  const store = useBoardFilterStore()
  const Icon = group.icon
  const currentValue = store[group.key]
  const currentArr = Array.isArray(currentValue) ? currentValue : []
  const currentStr = typeof currentValue === 'string' ? currentValue : ''

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
        <span className="text-sm font-semibold">{group.label}</span>
      </div>
      {group.type === 'radio' ? (
        <RadioGroup value={currentStr} onValueChange={(v) => store.setFilter(group.key, v)} className="grid grid-cols-2 gap-2">
          {group.options.map((opt) => (
            <Label key={opt.value} htmlFor={group.id + '-' + opt.value}
              className={cn('flex items-center gap-2 p-3 rounded-xl border border-border/50 cursor-pointer transition-all hover:border-primary/30', currentStr === opt.value && 'border-primary/50 bg-primary/5')}>
              <RadioGroupItem value={opt.value} id={group.id + '-' + opt.value} className="sr-only" />
              <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0', currentStr === opt.value ? 'border-primary' : 'border-muted-foreground/30')}>
                {currentStr === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-xs font-medium">{opt.label}</span>
            </Label>
          ))}
        </RadioGroup>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {group.options.map((opt) => {
            const selected = currentArr.includes(opt.value)
            return (
              <button key={opt.value} onClick={() => store.toggleFilter(group.key, opt.value)}
                className={cn('flex items-center gap-2 p-3 rounded-xl border text-left transition-all', selected ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border/50 hover:border-primary/30')}>
                <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors', selected ? 'bg-primary border-primary' : 'border-muted-foreground/30')}>
                  {selected && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AdvancedFilters({ compact }: AdvancedFiltersProps) {
  const store = useBoardFilterStore()
  const filterCount = useBoardFilterStore((s) => s.getFilterCount())

  if (compact) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Advanced Filters</span>
        </div>
        <div className="space-y-6">
          {FILTER_GROUPS.map((group) => (
            <div key={group.id}><FilterGroupSection group={group} /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Advanced Filters</span>
        </div>
        {filterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => store.clearFilters()} className="text-xs text-muted-foreground hover:text-destructive h-7">
            Clear All ({filterCount})
          </Button>
        )}
      </div>
      <Separator />
      <div className="space-y-8">
        {FILTER_GROUPS.map((group) => (
          <div key={group.id}><FilterGroupSection group={group} /><Separator className="mt-6" /></div>
        ))}
        <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Coming Soon</span>
          </div>
          <p className="text-xs text-muted-foreground">More filter options like exam type, marking scheme, and custom date ranges are on the way.</p>
        </div>
      </div>
    </div>
  )
}
