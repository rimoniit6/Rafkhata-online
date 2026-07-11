import { api } from '@/lib/api-client'

export interface NoteUser {
  id: string
  name: string | null
  email: string
  avatar: string | null
}

export interface NoteRecord {
  id: string
  userId: string
  contentId: string
  contentType: string
  content: string
  createdAt: string
  updatedAt: string
  user: NoteUser
}

export interface NotePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface NoteListResponse {
  data: NoteRecord[]
  pagination: NotePagination
}

export type NoteListParams = {
  page?: number
  limit?: number
  contentType?: string
  userId?: string
  search?: string
}

export const noteService = {
  list: (params?: NoteListParams) =>
    api.get<NoteListResponse>('admin/notes', params),
  remove: (id: string) => api.delete<{ id: string }>('admin/notes', { id }),
  bulkRemove: (ids: string[]) =>
    api.delete<{ deleted: number }>('admin/notes', { ids: ids.join(',') }),
}
