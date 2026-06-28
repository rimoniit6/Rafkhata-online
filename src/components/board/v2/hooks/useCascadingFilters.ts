'use client'

import { useMemo, useCallback } from 'react'
import { useBoardFilterStore } from '@/store/board-filters'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

export function useCascadingFilters() {
  const metadata = useHierarchyMetadata()
  const classLevels = useBoardFilterStore((s) => s.classLevels)
  const subjects = useBoardFilterStore((s) => s.subjects)
  const chapters = useBoardFilterStore((s) => s.chapters)
  const setFilter = useBoardFilterStore((s) => s.setFilter)

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

  const noClassSelected = classLevels.length === 0
  const noSubjectSelected = subjects.length === 0

  return {
    classSlugToId,
    selectedClassIds,
    subjectOptions,
    chapterOptions,
    handleClassChange,
    handleSubjectChange,
    noClassSelected,
    noSubjectSelected,
  }
}
