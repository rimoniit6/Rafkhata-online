export interface SuggestionRecord {
  id: string
  title: string
  slug: string
  content: string
  classId: string | null
  subjectId: string | null
  chapterId: string | null
  thumbnail: string | null
  pdfUrl: string | null
  isPremium: boolean
  price: number
  order: number
  isActive: boolean
  viewCount: number
  class?: { id: string; name: string; slug: string }
  subject?: { id: string; name: string; slug: string; classId: string }
  chapter?: { id: string; name: string; slug: string; subjectId: string }
}

export interface ClassItem { id: string; name: string; slug: string }
export interface SubjectItem { id: string; name: string; slug: string; classId: string }
export interface ChapterItem { id: string; name: string; slug: string; subjectId: string }
