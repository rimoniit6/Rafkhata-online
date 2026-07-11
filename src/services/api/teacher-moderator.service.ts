import { api } from '@/lib/api-client'

export interface TeacherRecord {
  id: string
  name: string
  image: string | null
  title: string
  institution: string | null
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface TeacherInput {
  name: string
  image?: string | null
  title: string
  institution?: string | null
  isActive?: boolean
  order?: number
}

export const teacherModeratorService = {
  list: () => api.get<TeacherRecord[]>('admin/teacher-moderators'),
  create: (data: TeacherInput) => api.post<TeacherRecord>('admin/teacher-moderators', data),
  update: (id: string, data: Partial<TeacherInput>) =>
    api.put<TeacherRecord>('admin/teacher-moderators', { id, ...data }),
  remove: (id: string) =>
    api.delete<{ id: string }>('admin/teacher-moderators', { id }),
}
