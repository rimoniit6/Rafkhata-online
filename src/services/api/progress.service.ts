import { api } from '@/lib/api-client'

export interface ProgressItem {
  id: string
  contentId: string
  contentType: string
  progress: number
  lastAccessed: string
  title?: string | null
}

export const progressService = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<{ data: { progress: ProgressItem[] } }>('progress', params),

  update: (contentId: string, contentType: string, progress: number) =>
    api.post<{ progress: number }>('progress', { contentId, contentType, progress }),

  getProgress: (contentId: string, contentType: string) =>
    api.get<{ data: { progress: number } }>('progress', { contentId, contentType }),
}
