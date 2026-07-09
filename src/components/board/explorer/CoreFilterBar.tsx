'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBoardFilterStore } from '@/store/board-filters'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useIsMobile } from '@/hooks/use-mobile'
import { MultiSelect } from '@/components/ui/multi-select'
import { AdvancedFiltersDrawer } from './AdvancedFiltersDrawer'
import { cn } from '@/lib/utils'

export function CoreFilterBar() {
  const metadata = useHierarchyMetadata()
  const isMobile = useIsMobile()
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const classLevels = useBoardFilterStore((s) => s.classLevels)
  const boards = useBoardFilterStore((s) => s.boards)
  const years = useBoardFilterStore((s) => s.years)
  const subjects = useBoardFilterStore((s) => s.subjects)
  const chapters = useBoardFilterStore((s) => s.chapters)
  const questionTypes = useBoardFilterStore((s) => s.questionTypes)
  const setFilter = useBoardFilterStore((s) => s.setFilter)
  const clearFilters = useBoardFilterStore((s) => s.clearFilters)
  const filterCount = useBoardFilterStore((s) =>
    s.classLevels.length + s.boards.length + s.years.length +
    s.subjects.length + s.chapters.length + s.questionTypes.length +
    s.difficulty.length + s.topics.length + s.status.length +
    (s.contentAccess !== 'all' ? 1 : 0)
  )

  const classOptions = useMemo(() => {
    return (metadata.classOptions || []).map((o) => ({
      ...o,
      label: o.label || o.value,
    }))
  }, [metadata.classOptions])

  const boardOptions = useMemo(() => {
    return (metadata.boardOptions || []).map((o) => ({
      ...o,
      label: o.label || o.value,
    }))
  }, [metadata.boardOptions])

  const yearOptions = useMemo(() => {
    const items = metadata.yearOptions || []
    return items.length > 0
      ? items
      : Array.from({ length: 10 }, (_, i) => {
          const y = String(2025 - i)
          return { value: y, label: y }
        })
  }, [metadata.yearOptions])

  // ─── Hierarchical cascading for subject & chapter ──────────────

  const classSlugToId = useMemo(() => {
    const map: Record<string, string> = {}
    const classes = metadata.metadata?.classes ?? []
    for (const c of classes) {
      if (c.slug) map[c.slug] = c.id
    }
    return map
  }, [metadata.metadata])

  const selectedClassIds = useMemo(
    () => classLevels.map((slug) => classSlugToId[slug]).filter(Boolean),
    [classLevels, classSlugToId],
  )

  const subjectOptions = useMemo(() => {
    if (selectedClassIds.length === 0) return []
    return (metadata.subjects || [])
      .filter((s) => selectedClassIds.includes(s.classId))
      .map((s) => ({ value: s.id, label: s.name }))
  }, [metadata.subjects, selectedClassIds])

  const chapterOptions = useMemo(() => {
    if (subjects.length === 0) return []
    return (metadata.chapters || [])
      .filter((c) => subjects.includes(c.subjectId))
      .map((c) => ({ value: c.id, label: c.name }))
  }, [metadata.chapters, subjects])

  const handleClassChange = useCallback(
    (values: string[]) => {
      setFilter('classLevels', values)

      const newClassIds = values
        .map((slug) => classSlugToId[slug])
        .filter(Boolean)
      const validIds = new Set(
        (metadata.subjects || [])
          .filter((s) => newClassIds.includes(s.classId))
          .map((s) => s.id),
      )
      const keptSubjects = subjects.filter((id) => validIds.has(id))
      if (keptSubjects.length !== subjects.length) {
        setFilter('subjects', keptSubjects)
        const keptChapterIds = new Set(
          (metadata.chapters || [])
            .filter((c) => keptSubjects.includes(c.subjectId))
            .map((c) => c.id),
        )
        const keptChapters = chapters.filter((id) => keptChapterIds.has(id))
        if (keptChapters.length !== chapters.length) {
          setFilter('chapters', keptChapters)
        }
      }
    },
    [classSlugToId, metadata.subjects, metadata.chapters, subjects, chapters, setFilter],
  )

  const handleSubjectChange = useCallback(
    (values: string[]) => {
      setFilter('subjects', values)

      const validIds = new Set(
        (metadata.chapters || [])
          .filter((c) => values.includes(c.subjectId))
          .map((c) => c.id),
      )
      const keptChapters = chapters.filter((id) => validIds.has(id))
      if (keptChapters.length !== chapters.length) {
        setFilter('chapters', keptChapters)
      }
    },
    [metadata.chapters, chapters, setFilter],
  )

  const typeOptions = [
    { value: 'mcq', label: 'MCQ' },
    { value: 'cq', label: 'CQ' },
  ]

  const noClassSelected = classLevels.length === 0
  const noSubjectSelected = subjects.length === 0

  if (isMobile) {
    return (
      <>
        {/* Primary filters — always visible on mobile */}
        <div className="py-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <MultiSelect
              options={classOptions}
              selectedValues={classLevels}
              onChange={handleClassChange}
              placeholder="Class"
            />
            <MultiSelect
              options={boardOptions}
              selectedValues={boards}
              onChange={(v) => setFilter('boards', v)}
              placeholder="Board"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MultiSelect
              options={yearOptions}
              selectedValues={years}
              onChange={(v) => setFilter('years', v)}
              placeholder="Year"
            />
            <MultiSelect
              options={typeOptions}
              selectedValues={questionTypes}
              onChange={(v) => setFilter('questionTypes', v)}
              placeholder="Question Type"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MultiSelect
              options={subjectOptions}
              selectedValues={subjects}
              onChange={handleSubjectChange}
              placeholder="Subject"
              disabled={noClassSelected}
            />
            <MultiSelect
              options={chapterOptions}
              selectedValues={chapters}
              onChange={(v) => setFilter('chapters', v)}
              placeholder="Chapter"
              disabled={noSubjectSelected}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedOpen(true)}
              className={cn(
                'rounded-full gap-2 h-9 text-sm flex-1 justify-between',
                filterCount > 0 && 'border-primary/50 text-primary',
              )}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </div>
              {filterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                  {filterCount}
                </span>
              )}
            </Button>
            {filterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-full h-9 text-xs text-muted-foreground shrink-0"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <AdvancedFiltersDrawer open={advancedOpen} onOpenChange={setAdvancedOpen} />
      </>
    )
  }

  return (
    <div className="py-3 border-y border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-6 gap-2">
          <MultiSelect
            options={classOptions}
            selectedValues={classLevels}
            onChange={handleClassChange}
            placeholder="Class"
          />
          <MultiSelect
            options={boardOptions}
            selectedValues={boards}
            onChange={(v) => setFilter('boards', v)}
            placeholder="Board"
          />
          <MultiSelect
            options={yearOptions}
            selectedValues={years}
            onChange={(v) => setFilter('years', v)}
            placeholder="Year"
          />
          <MultiSelect
            options={subjectOptions}
            selectedValues={subjects}
            onChange={handleSubjectChange}
            placeholder="Subject"
            disabled={noClassSelected}
          />
          <MultiSelect
            options={chapterOptions}
            selectedValues={chapters}
            onChange={(v) => setFilter('chapters', v)}
            placeholder="Chapter"
            disabled={noSubjectSelected}
          />
          <MultiSelect
            options={typeOptions}
            selectedValues={questionTypes}
            onChange={(v) => setFilter('questionTypes', v)}
            placeholder="Question Type"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdvancedOpen(true)}
            className={cn(
              'gap-2 h-10 rounded-xl',
              advancedOpen && 'border-primary/50 bg-primary/5',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden lg:inline text-xs">Advanced</span>
          </Button>

          <AnimatePresence>
            {filterCount > 0 && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1 h-10 rounded-xl text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden lg:inline text-xs">Clear</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AdvancedFiltersDrawer open={advancedOpen} onOpenChange={setAdvancedOpen} />
    </div>
  )
}
