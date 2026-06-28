'use client'

import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBoardFilterStore } from '@/store/board-filters'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { cn } from '@/lib/utils'
import type { BoardQuestionFilters } from '@/types/board-questions'

type QuickFilterKey = 'classLevels' | 'boards' | 'years' | 'subjects'

interface QuickFilterDef {
  id: string
  label: string
  icon: React.ElementType
  filters: Partial<{
    [K in QuickFilterKey]: string[]
  }>
}

export function QuickFilters() {
  const metadata = useHierarchyMetadata()
  const classLevels = useBoardFilterStore((s) => s.classLevels)
  const boards = useBoardFilterStore((s) => s.boards)
  const years = useBoardFilterStore((s) => s.years)
  const subjects = useBoardFilterStore((s) => s.subjects)
  const filterCount = useBoardFilterStore((s) => {
    return s.classLevels.length + s.boards.length + s.years.length +
      s.subjects.length + s.chapters.length + s.questionTypes.length +
      s.difficulty.length + s.topics.length + s.status.length +
      (s.contentAccess !== 'all' ? 1 : 0)
  })
  const setFilter = useBoardFilterStore((s) => s.setFilter)
  const clearFilters = useBoardFilterStore((s) => s.clearFilters)

    // Build dynamic quick filters from metadata — class + board only
  const quickFilters = useMemo(() => {
    const filters: QuickFilterDef[] = []

    for (const cls of metadata.classOptions.slice(-2)) {
      filters.push({
        id: `class-${cls.value}`,
        label: cls.label,
        icon: GraduationCap,
        filters: { classLevels: [cls.value] },
      })
    }

    const popularBoards = metadata.boardOptions.filter(
      (b) => b.value === 'dhaka' || b.value === 'rajshahi',
    )
    for (const brd of popularBoards) {
      filters.push({
        id: `board-${brd.value}`,
        label: brd.label,
        icon: MapPin,
        filters: { boards: [brd.value] },
      })
    }

    return filters
  }, [metadata.classOptions, metadata.boardOptions])

  const handleClick = useCallback((def: QuickFilterDef) => {
    const current = useBoardFilterStore.getState()

    let isActive = true
    for (const [key, values] of Object.entries(def.filters)) {
      if (!values?.length) continue
      const filterKey = key as QuickFilterKey
      const stateValues = current[filterKey]
      for (const v of values) {
        if (!stateValues.includes(v)) { isActive = false; break }
      }
      if (!isActive) break
    }

    if (isActive) {
      for (const [key, values] of Object.entries(def.filters)) {
        if (values?.length) {
          const filterKey = key as QuickFilterKey
          const currentValues = current[filterKey]
          setFilter(filterKey as keyof BoardQuestionFilters, currentValues.filter((v) => !values.includes(v)))
        }
      }
    } else {
      for (const [key, values] of Object.entries(def.filters)) {
        if (values?.length) {
          const filterKey = key as QuickFilterKey
          const currentValues = current[filterKey]
          setFilter(filterKey as keyof BoardQuestionFilters, [...new Set([...currentValues, ...values])])
        }
      }
    }
  }, [setFilter])

  const isQuickFilterActive = useCallback((def: QuickFilterDef) => {
    const stateValuesByKey = { classLevels, boards, years, subjects }

    for (const [key, values] of Object.entries(def.filters)) {
      if (!values?.length) continue
      const stateValues = stateValuesByKey[key as keyof typeof stateValuesByKey] ?? []
      for (const v of values) {
        if (!stateValues.includes(v)) return false
      }
    }

    return Object.values(def.filters).some((v) => v && v.length > 0)
  }, [classLevels, boards, years, subjects])

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {quickFilters.map((def) => {
        const active = isQuickFilterActive(def)
        const Icon = def.icon

        return (
          <motion.div
            key={def.id}
            whileTap={{ scale: 0.95 }}
            className="shrink-0"
          >
            <Button
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleClick(def)}
              className={cn(
                'rounded-full gap-1.5 h-8 text-xs font-medium',
                active && 'shadow-sm'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {def.label}
            </Button>
          </motion.div>
        )
      })}

      {filterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="shrink-0"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="rounded-full h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        </motion.div>
      )}
    </div>
  )
}
