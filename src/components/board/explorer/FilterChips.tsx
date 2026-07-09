'use client'

import { Button } from '@/components/ui/button'
import { useBoardFilterStore } from '@/store/board-filters'
import type { FilterChip } from '@/types/board-questions'
import { AnimatePresence,motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useMemo } from 'react'

function useFilterChips(): FilterChip[] {
  const classLevels = useBoardFilterStore((s) => s.classLevels)
  const boards = useBoardFilterStore((s) => s.boards)
  const years = useBoardFilterStore((s) => s.years)
  const subjects = useBoardFilterStore((s) => s.subjects)
  const chapters = useBoardFilterStore((s) => s.chapters)
  const questionTypes = useBoardFilterStore((s) => s.questionTypes)
  const difficulty = useBoardFilterStore((s) => s.difficulty)
  const topics = useBoardFilterStore((s) => s.topics)
  const status = useBoardFilterStore((s) => s.status)
  const contentAccess = useBoardFilterStore((s) => s.contentAccess)
  const labelMap = useBoardFilterStore((s) => s.labelMap)
  const removeFilterValue = useBoardFilterStore((s) => s.removeFilterValue)
  const setFilter = useBoardFilterStore((s) => s.setFilter)

  return useMemo(() => {
    const chips: FilterChip[] = []

    const add = (key: 'classLevels' | 'boards' | 'years' | 'subjects' | 'chapters' | 'questionTypes' | 'difficulty' | 'topics' | 'status', values: string[], section: keyof typeof labelMap) => {
      for (const v of values) {
        chips.push({
          key: `${key}:${v}`,
          value: v,
          label: labelMap[section]?.[v] || v,
          onRemove: () => removeFilterValue(key, v),
        })
      }
    }

    add('classLevels', classLevels, 'classLevels')
    add('boards', boards, 'boards')
    add('years', years, 'years')
    add('subjects', subjects, 'subjects')
    add('chapters', chapters, 'chapters')
    add('questionTypes', questionTypes, 'questionTypes')
    add('difficulty', difficulty, 'difficulty')
    add('topics', topics, 'topics')
    add('status', status, 'status')

    if (contentAccess !== 'all') {
      chips.push({
        key: `contentAccess:${contentAccess}`,
        value: contentAccess,
        label: labelMap.contentAccess[contentAccess] || contentAccess,
        onRemove: () => setFilter('contentAccess', 'all'),
      })
    }

    return chips
  }, [classLevels, boards, years, subjects, chapters, questionTypes, difficulty, topics, status, contentAccess, labelMap, removeFilterValue, setFilter])
}

export function FilterChips() {
  const chips = useFilterChips()
  const clearFilters = useBoardFilterStore((s) => s.clearFilters)

  if (chips.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.div
            key={chip.key}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
              <span className="max-w-[120px] truncate">{chip.label}</span>
              <button
                onClick={chip.onRemove}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {chips.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="shrink-0"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-[10px] text-muted-foreground hover:text-destructive px-2 rounded-full"
          >
            Clear All
          </Button>
        </motion.div>
      )}
    </div>
  )
}
