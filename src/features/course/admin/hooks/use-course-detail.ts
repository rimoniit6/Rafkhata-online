'use client'

import { useCallback, useEffect, useState } from 'react'
import { courseAdminService } from '@/services/api/course-admin.service'
import type { CourseDetailRecord, CourseOverviewData, CourseLessonRecord } from '@/features/course/types'

export type TabId = 'overview' | 'lessons' | 'syllabus' | 'exams' | 'assignments' | 'students' | 'analytics' | 'settings'

export function useCourseDetail(courseId: string | null) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [course, setCourse] = useState<CourseDetailRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchDetail = useCallback(async (silent?: boolean) => {
    if (!courseId) return
    if (!silent) setLoading(true)
    try {
      const result = await courseAdminService.detail(courseId)
      setCourse(result.course as unknown as CourseDetailRecord)
    } catch { setCourse(null) } finally { if (!silent) setLoading(false) }
  }, [courseId])

  useEffect(() => { if (courseId) fetchDetail() }, [fetchDetail, courseId])

  const updateCourse = useCallback(async (data: Partial<CourseOverviewData>) => {
    if (!courseId) return
    setSaving(true)
    try {
      await courseAdminService.update(courseId, data)
      await fetchDetail(true)
      return true
    } catch { return false } finally { setSaving(false) }
  }, [courseId, fetchDetail])

  // Lesson CRUD
  const createLesson = useCallback(async (data: Record<string, unknown>) => {
    if (!courseId) return
    try {
      const result = await courseAdminService.createLesson({ courseId, ...data })
      await fetchDetail(true)
      return result?.lesson?.id as string | undefined
    } catch { }
  }, [courseId, fetchDetail])

  const updateLesson = useCallback(async (id: string, data: Record<string, unknown>) => {
    try {
      await courseAdminService.updateLesson(id, data)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const deleteLesson = useCallback(async (id: string) => {
    try {
      await courseAdminService.deleteLesson(id)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const reorderLessons = useCallback(async (lessonIds: string[]) => {
    if (!courseId) return
    try {
      await courseAdminService.reorderLessons(courseId, lessonIds)
      await fetchDetail(true)
    } catch { }
  }, [courseId, fetchDetail])

  const duplicateLesson = useCallback(async (id: string) => {
    try {
      await courseAdminService.duplicateLesson(id)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  // Exam Schedule (independent of lessons)
  const addExamSchedule = useCallback(async (data: Record<string, unknown>) => {
    if (!courseId) return
    try {
      await courseAdminService.addExamSchedule({ courseId, ...data })
      await fetchDetail(true)
    } catch { }
  }, [courseId, fetchDetail])

  const addExamSchedulesFromPackage = useCallback(async (data: Record<string, unknown>): Promise<number> => {
    if (!courseId) return 0
    try {
      const result = await courseAdminService.addExamSchedulesFromPackage({ courseId, ...data })
      await fetchDetail(true)
      return result?.count ?? 0
    } catch { return 0 }
  }, [courseId, fetchDetail])

  const updateExamSchedule = useCallback(async (id: string, data: Record<string, unknown>) => {
    try {
      await courseAdminService.updateExamSchedule(id, data)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const removeExamSchedule = useCallback(async (id: string) => {
    try {
      await courseAdminService.removeExamSchedule(id)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const addAssignmentToLesson = useCallback(async (data: Record<string, unknown>) => {
    try {
      await courseAdminService.addAssignment(data)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const removeAssignmentFromLesson = useCallback(async (id: string) => {
    try {
      await courseAdminService.removeAssignment(id)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const addNoteToLesson = useCallback(async (data: Record<string, unknown>) => {
    try {
      await courseAdminService.addNote(data)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const removeNoteFromLesson = useCallback(async (id: string) => {
    try {
      await courseAdminService.removeNote(id)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const addResourceToLesson = useCallback(async (data: Record<string, unknown>) => {
    try {
      await courseAdminService.addResource(data)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const removeResourceFromLesson = useCallback(async (id: string) => {
    try {
      await courseAdminService.removeResource(id)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const setScheduleForLesson = useCallback(async (lessonId: string, date?: string, startTime?: string, endTime?: string) => {
    try {
      await courseAdminService.setSchedule(lessonId, date, startTime, endTime)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

  const removeScheduleFromLesson = useCallback(async (lessonId: string) => {
    try {
      await courseAdminService.removeSchedule(lessonId)
      await fetchDetail(true)
    } catch { }
  }, [fetchDetail])

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
