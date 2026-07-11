'use client'

import { useMemo } from 'react'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

/**
 * Thin selectors over the single shared `useHierarchyMetadata` fetch.
 * Every admin page that needs classes / subjects / chapters should use these
 * instead of re-fetching `/api/admin/classes|subjects|chapters`, eliminating
 * the duplicated hierarchy requests.
 */

export interface HierarchyClassOption {
  id: string
  name: string
  slug: string
  color?: string
  gradient?: string
}

export interface HierarchySubjectOption {
  id: string
  name: string
  slug: string
  classId: string
  order?: number
  icon?: string
  color?: string
}

export interface HierarchyChapterOption {
  id: string
  name: string
  slug: string
  subjectId: string
  order?: number
}

export function useHierarchyClasses(): HierarchyClassOption[] {
  const { metadata } = useHierarchyMetadata()
  return useMemo(() => (metadata?.classes ?? []) as HierarchyClassOption[], [metadata?.classes])
}

export function useHierarchySubjects(classId?: string): HierarchySubjectOption[] {
  const { metadata } = useHierarchyMetadata()
  return useMemo(() => {
    const subjects = (metadata?.subjects ?? []) as HierarchySubjectOption[]
    if (!classId) return subjects
    return subjects.filter((s) => s.classId === classId)
  }, [metadata?.subjects, classId])
}

export function useHierarchyChapters(subjectId?: string): HierarchyChapterOption[] {
  const { metadata } = useHierarchyMetadata()
  return useMemo(() => {
    const chapters = (metadata?.chapters ?? []) as HierarchyChapterOption[]
    if (!subjectId) return chapters
    return chapters.filter((c) => c.subjectId === subjectId)
  }, [metadata?.chapters, subjectId])
}
