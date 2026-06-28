'use client'

import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBoardFilterStore } from '@/store/board-filters'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { cn } from '@/lib/utils'
import type { BoardQuestionFilters } from '@/types/board-questions'

type QuickFilterKey = 'classLevels' | 'boards'
interface QuickFilterDef {
  id: string; label: string; icon: React.ElementType; filters: Partial<{ [K in QuickFilterKey]: string[] }>
}

export function QuickFilterRow() {
  const metadata = useHierarchyMetadata()
  const classLevels = useBoardFilterStore((s) => s.classLevels)
  const boards = useBoardFilterStore((s) => s.boards)
  const filterCount = useBoardFilterStore((s) => s.classLevels.length + s.boards.length + s.years.length + s.subjects.length + s.chapters.length + s.questionTypes.length + s.difficulty.length + s.topics.length + s.status.length + (s.contentAccess !== 'all' ? 1 : 0))
  const setFilter = useBoardFilterStore((s) => s.setFilter)
  const clearFilters = useBoardFilterStore((s) => s.clearFilters)

  const quickFilters = useMemo(() => {
    const filters: QuickFilterDef[] = []
    for (const cls of metadata.classOptions.slice(-2)) {
      filters.push({ id: 'class-' + cls.value, label: cls.label, icon: GraduationCap, filters: { classLevels: [cls.value] } })
    }
    for (const brd of metadata.boardOptions.filter((b) => b.value === 'dhaka' || b.value === 'rajshahi')) {
      filters.push({ id: 'board-' + brd.value, label: brd.label, icon: MapPin, filters: { boards: [brd.value] } })
    }
    return filters
  }, [metadata.classOptions, metadata.boardOptions])

  const handleClick = useCallback((def: QuickFilterDef) => {
    const state = useBoardFilterStore.getState()
    let isActive = true
    for (const [key, values] of Object.entries(def.filters)) {
      if (!values?.length) continue
      const filterKey = key as QuickFilterKey
      for (const v of values) {
        if (!state[filterKey].includes(v)) { isActive = false; break }
      }
      if (!isActive) break
    }
    if (isActive) {
      for (const [key, values] of Object.entries(def.filters)) {
        if (values?.length) {
          const filterKey = key as QuickFilterKey
          setFilter(filterKey as keyof BoardQuestionFilters, state[filterKey].filter((v: string) => !values.includes(v)))
        }
      }
    } else {
      for (const [key, values] of Object.entries(def.filters)) {
        if (values?.length) {
          const filterKey = key as QuickFilterKey
          setFilter(filterKey as keyof BoardQuestionFilters, [...new Set([...state[filterKey], ...values])])
        }
      }
    }
  }, [setFilter])

  const isActive = useCallback((def: QuickFilterDef) => {
    const maps = { classLevels, boards }
    for (const [key, values] of Object.entries(def.filters)) {
      if (!values?.length) continue
      const stateValues = maps[key as keyof typeof maps] ?? []
      for (const v of values) { if (!stateValues.includes(v)) return false }
    }
    return Object.values(def.filters).some((v) => v && v.length > 0)
  }, [classLevels, boards])

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {quickFilters.map((def) => {
        const active = isActive(def)
        const Icon = def.icon
        return (
          <motion.div key={def.id} whileTap={{ scale: 0.95 }} className="shrink-0">
            <Button variant={active ? 'default' : 'outline'} size="sm" onClick={() => handleClick(def)}
              className={cn('rounded-full gap-1.5 h-8 text-xs font-medium', active && 'shadow-sm')}>
              <Icon className="h-3.5 w-3.5" /> {def.label}
            </Button>
          </motion.div>
        )
      })}
      {filterCount > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0">
          <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full h-8 text-xs text-muted-foreground hover:text-destructive">
            Clear All
          </Button>
        </motion.div>
      )}
    </div>
  )
}
