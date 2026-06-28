'use client'

import { useCallback, useEffect, useState } from 'react'
import { courseService } from '@/services/api/course.service'
import type { ActivityProgress, CourseProgressResponse } from '@/services/api/course.service'
import { useRouterStore } from '@/store/router'
import type { CourseLessonRecord, SyllabusRow, SyllabusSummary } from '@/features/course/types'

interface CourseContentRecord {
  id: string; courseId: string; contentType: string; referenceId: string | null
  sourceType: string | null; sourceId: string | null
  title: string | null; description: string | null
  displayOrder: number; isPreview: boolean; isPublished: boolean
  releaseAt: string | null; metadata: Record<string, unknown> | null
  videoUrl: string | null; previewVideo: string | null
  scheduleStartTime: string | null; scheduleEndTime: string | null
  meetingLink: string | null; meetingId: string | null
  platform: string | null; password: string | null
}

export type StudentTabId = 'overview' | 'curriculum' | 'syllabus' | 'routine' | 'notes'

interface StudentCourseData {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  teacherName: string | null
  isPremium: boolean
  price: number | null
  status: string
  features: string | null
  requirements: string | null
  targetStudents: string | null
  hasCertificate: boolean
  duration: number | null
  language: string | null
  difficulty: string | null
  classCategory: { id: string; name: string; slug: string } | null
  subject: { id: string; name: string; slug: string; color?: string; icon?: string } | null
  contents: CourseContentRecord[]
  routines: []
  notes: []
}

function mapLessonToContent(lesson: CourseLessonRecord): CourseContentRecord {
  const schedule = lesson.schedules?.[0] || null
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    contentType: lesson.lessonType === 'LIVE' ? 'LIVE_CLASS' : 'RECORDED_CLASS',
    referenceId: null,
    sourceType: null,
    sourceId: null,
    title: lesson.title,
    description: lesson.description,
    displayOrder: lesson.displayOrder,
    isPreview: false,
    isPublished: true,
    releaseAt: schedule?.date || null,
    metadata: null,
    videoUrl: lesson.videoUrl,
    previewVideo: lesson.previewVideo,
    scheduleStartTime: schedule?.startTime || null,
    scheduleEndTime: schedule?.endTime || null,
    meetingLink: lesson.meetingLink,
    meetingId: lesson.meetingId,
    platform: lesson.platform,
    password: lesson.password,
  }
}

function n(val: string | null | undefined): string | null { return val ?? null }
function bool(val: boolean | undefined): boolean { return val ?? false }
function num(val: number | null | undefined): number | null { return val ?? null }

export function useStudentCourseDetail(slug: string | null) {
  const [activeTab, setActiveTab] = useState<StudentTabId>('overview')
  const [course, setCourse] = useState<StudentCourseData | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [enrollment, setEnrollment] = useState<{ id: string; status: string; type: string; enrolledAt: string; completedAt: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [syllabusRows, setSyllabusRows] = useState<SyllabusRow[]>([])
  const [syllabusSummary, setSyllabusSummary] = useState<SyllabusSummary | null>(null)
  const [syllabusLoading, setSyllabusLoading] = useState(false)
  const [examCalendar, setExamCalendar] = useState<any[]>([])
  const [pendingPayment, setPendingPayment] = useState(false)
  const [courseAssignments, setCourseAssignments] = useState<any[]>([])
  const [courseAssignmentsLoading, setCourseAssignmentsLoading] = useState(false)

  // Progress state
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [overallProgress, setOverallProgress] = useState<ActivityProgress & { percent: number }>({ total: 0, completed: 0, percent: 0 })
  const [breakdown, setBreakdown] = useState<CourseProgressResponse['breakdown'] | null>(null)
  const [progressLoading, setProgressLoading] = useState(false)

  const router = useRouterStore()

  const fetchProgress = useCallback(async (courseId: string) => {
    setProgressLoading(true)
    try {
      const result = await courseService.progress(courseId)
      setProgress(result.lessonProgress)
      setOverallProgress(result.overall)
      setBreakdown(result.breakdown)
    } catch {
      /* keep stale data */
    } finally {
      setProgressLoading(false)
    }
  }, [])

  const fetchDetail = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    try {
      const result = await courseService.detail(slug)
      const c = result.course
      setCourse({
        id: c.id, title: c.title, slug: c.slug,
        description: n(c.description), thumbnail: n(c.thumbnail),
        teacherName: n(c.teacherName), isPremium: c.isPremium,
        price: num(c.price), status: c.status,
        features: n(c.features), requirements: n(c.requirements),
        targetStudents: n(c.targetStudents), hasCertificate: bool(c.hasCertificate),
        duration: num(c.duration), language: n(c.language), difficulty: n(c.difficulty),
        classCategory: c.classCategory ?? null, subject: c.subject ?? null,
        contents: (c.lessons || []).map(mapLessonToContent),
        routines: [],
        notes: [],
      })
      setHasAccess(result.hasAccess)
      setEnrollment(result.enrollment || null)

      // Fetch activity-based progress in parallel
      if (result.hasAccess) {
        fetchProgress(c.id)
      }

      // Check for pending payment
      try {
        const pmRes = await fetch(`/api/payment?contentType=course&contentId=${c.id}&status=pending&limit=1`)
        const pmData = await pmRes.json()
        const unwrapped = pmData.data || pmData
        setPendingPayment(unwrapped.payments?.length > 0)
      } catch {
        setPendingPayment(false)
      }

      // Fetch assignments with submissions in parallel
      setCourseAssignmentsLoading(true)
      try {
        const aRes = await fetch(`/api/courses/assignments?action=list&courseId=${c.id}`)
        if (aRes.ok) {
          const aData = await aRes.json()
          const unwrapped = aData.data || aData
          setCourseAssignments(unwrapped.assignments || [])
        }
      } catch { /* ignore */ }
      finally { setCourseAssignmentsLoading(false) }
    } catch {
      setCourse(null)
    } finally {
      setLoading(false)
    }
  }, [slug, fetchProgress])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  useEffect(() => {
    if (course && syllabusRows.length === 0 && !syllabusLoading) {
      loadSyllabus()
    }
  }, [course])

  const toggleProgress = useCallback(async (contentId: string, completed: boolean) => {
    if (!course) return
    try {
      await courseService.toggleProgress(course.id, contentId, completed)
      // Optimistic update
      setProgress(prev => ({ ...prev, [contentId]: completed }))
      // Re-fetch overall progress to keep breakdown accurate
      fetchProgress(course.id)
    } catch { }
  }, [course, fetchProgress])

  const enroll = useCallback(async () => {
    if (!course) return false
    try {
      const result = await courseService.enroll(course.id)
      const enr = result.enrollment
      setEnrollment({ id: enr.id, status: enr.status, type: enr.type, enrolledAt: enr.enrolledAt, completedAt: n(enr.completedAt) })
      setHasAccess(enr.status === 'ACTIVE')
      if (enr.status === 'ACTIVE') {
        fetchProgress(course.id)
      }
      return true
    } catch { return false }
  }, [course, fetchProgress])

  const loadSyllabus = useCallback(async () => {
    if (!course) return
    setSyllabusLoading(true)
    try {
      const result = await courseService.syllabus(course.id)
      setSyllabusRows(result.rows)
      setSyllabusSummary(result.summary)
      setExamCalendar(result.examCalendar || [])
    } catch { } finally { setSyllabusLoading(false) }
  }, [course])

  const purchase = useCallback(async () => {
    if (!course) return false
    router.navigate('payment', {
      contentType: 'course', contentId: course.id,
      contentTitle: course.title, contentPrice: String(course.price ?? 0),
    })
    return true
  }, [course, router])

  // Derive simple totals for backward-compat display
  const totalContents = course?.contents.length || 0
  const completedCount = totalContents > 0 ? course?.contents.filter(c => progress[c.id]).length || 0 : 0
  const progressPercent = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0
  const isEnrolled = enrollment?.status === 'ACTIVE'

  return {
    activeTab, setActiveTab, course, hasAccess, enrollment, isEnrolled, loading,
    // Progress data
    progress, totalContents, completedCount, progressPercent,
    overallProgress, breakdown, progressLoading,
    // Syllabus
    syllabusRows, syllabusSummary, examCalendar, syllabusLoading, loadSyllabus,
    // Actions
    fetchDetail, toggleProgress, purchase, enroll, pendingPayment,
    courseAssignments, courseAssignmentsLoading,
  }
}
