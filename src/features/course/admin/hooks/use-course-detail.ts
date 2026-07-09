'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { courseAdminService } from '@/services/api/course-admin.service'
import type { CourseDetailRecord, CourseOverviewData } from '@/features/course/types'
import { createRaceGuard } from '@/features/common/admin-utils'

export type TabId = 'overview' | 'lessons' | 'syllabus' | 'exams' | 'assignments' | 'students' | 'analytics' | 'settings'

export function useCourseDetail(courseId: string | null) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [course, setCourse] = useState<CourseDetailRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const raceRef = useRef(createRaceGuard())

  // Abort in-flight requests on unmount
  useEffect(() => () => raceRef.current.dispose(), [])

  const fetchDetail = useCallback(async (silent?: boolean) => {
    if (!courseId) return
    if (!silent) setLoading(true)
    const { signal, isStale } = raceRef.current.next()
    try {
      const result = await courseAdminService.detail(courseId, { signal })
      if (!isStale()) {
        setCourse(result.course as unknown as CourseDetailRecord)
      }
    } catch (err: unknown) {
      // AbortError is expected when a newer request supersedes this one
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (!isStale()) {
        console.error('[CourseDetail] Failed to fetch course:', err)
        setCourse(null)
      }
    } finally {
      if (!isStale() && !silent) setLoading(false)
    }
  }, [courseId])

  useEffect(() => { if (courseId) fetchDetail() }, [fetchDetail, courseId])

  const updateCourse = useCallback(async (data: Partial<CourseOverviewData>) => {
    if (!courseId) return
    setSaving(true)
    try {
      await courseAdminService.update(courseId, data)
      await fetchDetail(true)
      return true
    } catch (err) {
      console.error('[CourseDetail] Failed to update course:', err)
      return false
    } finally {
      setSaving(false)
    }
  }, [courseId, fetchDetail])

  // ─── Generic CRUD helper ───
  // Eliminates the repeated try { await X; fetchDetail(true) } catch { console.error(...) } pattern.
  const crud = useCallback(async <T>(
    operation: () => Promise<T>,
    label: string,
  ): Promise<T | undefined> => {
    try {
      const result = await operation()
      await fetchDetail(true)
      return result
    } catch (err) {
      console.error(`[CourseDetail] Failed to ${label}:`, err)
      return undefined
    }
  }, [fetchDetail])

  // Lesson CRUD
  const createLesson = useCallback(async (data: Record<string, unknown>) => {
    if (!courseId) return
    const result = await crud(
      () => courseAdminService.createLesson({ courseId, ...data }),
      'create lesson',
    )
    return result?.lesson?.id as string | undefined
  }, [courseId, crud])

  const updateLesson = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
    await crud(() => courseAdminService.updateLesson(id, data), 'update lesson')
  }, [crud])

  const deleteLesson = useCallback(async (id: string): Promise<void> => {
    await crud(() => courseAdminService.deleteLesson(id), 'delete lesson')
  }, [crud])

  const reorderLessons = useCallback(async (lessonIds: string[]): Promise<void> => {
    if (!courseId) return
    await crud(() => courseAdminService.reorderLessons(courseId, lessonIds), 'reorder lessons')
  }, [courseId, crud])

  const duplicateLesson = useCallback(async (id: string): Promise<void> => {
    await crud(() => courseAdminService.duplicateLesson(id), 'duplicate lesson')
  }, [crud])

  // Exam Schedule
  const addExamSchedule = useCallback(async (data: Record<string, unknown>): Promise<void> => {
    if (!courseId) return
    await crud(() => courseAdminService.addExamSchedule({ courseId, ...data }), 'add exam schedule')
  }, [courseId, crud])

  const addExamSchedulesFromPackage = useCallback(async (data: Record<string, unknown>): Promise<number> => {
    if (!courseId) return 0
    const result = await crud(
      () => courseAdminService.addExamSchedulesFromPackage({ courseId, ...data }),
      'add exam schedules from package',
    )
    return result?.count ?? 0
  }, [courseId, crud])

  const updateExamSchedule = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
    await crud(() => courseAdminService.updateExamSchedule(id, data), 'update exam schedule')
  }, [crud])

  const removeExamSchedule = useCallback(async (id: string): Promise<void> => {
    await crud(() => courseAdminService.removeExamSchedule(id), 'remove exam schedule')
  }, [crud])

  // Assignments
  const addAssignmentToLesson = useCallback(async (data: Record<string, unknown>): Promise<void> => {
    await crud(() => courseAdminService.addAssignment(data), 'add assignment')
  }, [crud])

  const removeAssignmentFromLesson = useCallback(async (id: string): Promise<void> => {
    await crud(() => courseAdminService.removeAssignment(id), 'remove assignment')
  }, [crud])

  // Notes
  const addNoteToLesson = useCallback(async (data: Record<string, unknown>): Promise<void> => {
    await crud(() => courseAdminService.addNote(data), 'add note')
  }, [crud])

  const removeNoteFromLesson = useCallback(async (id: string): Promise<void> => {
    await crud(() => courseAdminService.removeNote(id), 'remove note')
  }, [crud])

  // Resources
  const addResourceToLesson = useCallback(async (data: Record<string, unknown>): Promise<void> => {
    await crud(() => courseAdminService.addResource(data), 'add resource')
  }, [crud])

  const removeResourceFromLesson = useCallback(async (id: string): Promise<void> => {
    await crud(() => courseAdminService.removeResource(id), 'remove resource')
  }, [crud])

  // Schedule
  const setScheduleForLesson = useCallback(async (lessonId: string, date?: string, startTime?: string, endTime?: string): Promise<void> => {
    await crud(() => courseAdminService.setSchedule(lessonId, date, startTime, endTime), 'set schedule')
  }, [crud])

  const removeScheduleFromLesson = useCallback(async (lessonId: string): Promise<void> => {
    await crud(() => courseAdminService.removeSchedule(lessonId), 'remove schedule')
  }, [crud])

  return {
    activeTab, setActiveTab, course, loading, saving,
    lessons: course?.lessons || [],
    fetchDetail, updateCourse,
    createLesson, updateLesson, deleteLesson, reorderLessons, duplicateLesson,
    addExamSchedule, addExamSchedulesFromPackage, updateExamSchedule, removeExamSchedule,
    addAssignmentToLesson, removeAssignmentFromLesson,
    addNoteToLesson, removeNoteFromLesson,
    addResourceToLesson, removeResourceFromLesson,
    setScheduleForLesson, removeScheduleFromLesson,
  }
}
