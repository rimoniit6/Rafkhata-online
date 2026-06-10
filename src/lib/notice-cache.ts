// Simple in-memory cache for sharing notice data between pages

interface NoticeRecord {
  id: string
  title: string
  content: string | null
  type: 'text' | 'pdf' | 'link'
  pdfUrl: string | null
  pdfTitle: string | null
  linkUrl: string | null
  linkLabel: string | null
  thumbnail: string | null
  classLevel: string | null
  isPinned: boolean
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

let noticesCache: NoticeRecord[] = []

export function setNoticesCache(notices: NoticeRecord[]) {
  noticesCache = notices
}

export function getNoticeFromCache(id: string): NoticeRecord | undefined {
  return noticesCache.find((n) => n.id === id)
}

export function getNoticesCache(): NoticeRecord[] {
  return noticesCache
}

export type { NoticeRecord }
