import { api } from '@/lib/api-client'

type QueryParams = Record<string, string | number | boolean | undefined | null>
type Payload = Record<string, unknown>
type PaginationMeta = { page: number; limit: number; total: number; totalPages: number }

export const courseAdminService = {
  list: (params?: QueryParams) =>
    api.get<{ courses: any[]; pagination: PaginationMeta }>('admin/courses', { action: 'list', ...params }),
  detail: (id: string, config?: { signal?: AbortSignal }) =>
    api.get<{ course: any }>('admin/courses', { action: 'detail', id }, config),
  create: (data: Payload) =>
    api.post<{ course: any }>('admin/courses', { action: 'create', ...data }),
  update: (id: string, data: Payload) =>
    api.post<{ course: any }>('admin/courses', { action: 'update', id, ...data }),
  delete: (id: string) =>
    api.post<{ success: boolean }>('admin/courses', { action: 'delete', id }),

  syllabus: (courseId: string) =>
    api.get<{ summary: any; rows: any[]; examCalendar: any[] }>('admin/courses', { action: 'syllabus', id: courseId }),

  // Lessons
  listLessons: (courseId: string) =>
    api.get<{ lessons: any[] }>('admin/courses/lessons', { courseId }),
  createLesson: (data: Payload) =>
    api.post<{ lesson: any }>('admin/courses/lessons', { action: 'create', ...data }),
  updateLesson: (id: string, data: Payload) =>
    api.post<{ lesson: any }>('admin/courses/lessons', { action: 'update', id, ...data }),
  deleteLesson: (id: string) =>
    api.post<{ success: boolean }>('admin/courses/lessons', { action: 'delete', id }),
  reorderLessons: (courseId: string, lessonIds: string[]) =>
    api.post<{ success: boolean }>('admin/courses/lessons', { action: 'reorder', courseId, lessonIds }),
  duplicateLesson: (id: string) =>
    api.post<{ lesson: any }>('admin/courses/lessons', { action: 'duplicate', id }),

  // Exam Schedule (course-level, independent of lessons)
  addExamSchedule: (data: Record<string, unknown>) =>
    api.post<{ schedule: any }>('admin/courses', { action: 'add-exam-schedule', ...data }),
  addExamSchedulesFromPackage: (data: Record<string, unknown>) =>
    api.post<{ schedules: any[]; count: number }>('admin/courses', { action: 'add-exam-schedules-from-package', ...data }),
  updateExamSchedule: (id: string, data: Record<string, unknown>) =>
    api.post<{ schedule: any }>('admin/courses', { action: 'update-exam-schedule', id, ...data }),
  removeExamSchedule: (id: string) =>
    api.post<{ success: boolean }>('admin/courses', { action: 'remove-exam-schedule', id }),

  // Lesson Assignments
  addAssignment: (data: Payload) =>
    api.post<{ assignment: any }>('admin/courses/lessons', { action: 'add-assignment', ...data }),
  removeAssignment: (id: string) =>
    api.post<{ success: boolean }>('admin/courses/lessons', { action: 'remove-assignment', id }),

  // Lesson Notes
  addNote: (data: Payload) =>
    api.post<{ note: any }>('admin/courses/lessons', { action: 'add-note', ...data }),
  removeNote: (id: string) =>
    api.post<{ success: boolean }>('admin/courses/lessons', { action: 'remove-note', id }),

  // Lesson Resources
  addResource: (data: Payload) =>
    api.post<{ resource: any }>('admin/courses/lessons', { action: 'add-resource', ...data }),
  removeResource: (id: string) =>
    api.post<{ success: boolean }>('admin/courses/lessons', { action: 'remove-resource', id }),

  // Lesson Schedule
  setSchedule: (lessonId: string, date?: string, startTime?: string, endTime?: string) =>
    api.post<{ schedule: any }>('admin/courses/lessons', { action: 'add-schedule', lessonId, date, startTime, endTime }),
  removeSchedule: (lessonId: string) =>
    api.post<{ success: boolean }>('admin/courses/lessons', { action: 'remove-schedule', lessonId }),
}
