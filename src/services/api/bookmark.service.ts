import { api } from '@/lib/api-client'

export interface BookmarkItem {
  id: string
  contentId: string
  contentType: string
  title?: string | null
  createdAt: string
}

export const bookmarkService = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<{ data: { bookmarks: BookmarkItem[]; total: number; page: number; limit: number; totalPages: number } }>('bookmarks', params),

  add: (contentId: string, contentType: string) =>
    api.post<{ bookmarked: boolean }>('bookmarks', { contentId, contentType }),

  check: (contentId: string, contentType: string) =>
    api.get<{ bookmarked: boolean }>('bookmarks/check', { contentId, contentType }),

  batchCheck: (data: { items: { contentId: string; contentType: string }[] }) =>
    api.post<{ bookmarks: Record<string, boolean> }>('bookmarks/batch-check', data),

  remove: (contentId: string, contentType: string) =>
    api.delete<{ bookmarked: boolean }>('bookmarks', { contentId, contentType }),
}
