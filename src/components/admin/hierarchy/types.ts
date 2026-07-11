export interface ClassItem {
  id: string
  name: string
  slug: string
  order: number
  icon?: string | null
  color?: string | null
  description?: string | null
  isActive: boolean
  _count?: { subjects: number }
}

export interface SubjectItem {
  id: string
  name: string
  slug: string
  classId: string
  order: number
  icon?: string | null
  color?: string | null
  description?: string | null
  isActive: boolean
  class?: { id: string; name: string; slug: string }
  _count?: { chapters: number }
}

export interface ChapterItem {
  id: string
  name: string
  slug: string
  subjectId: string
  order: number
  description?: string | null
  isActive: boolean
  subject?: { id: string; name: string; slug: string; classId: string }
  _count?: { lectures: number; mcqs: number; cqs: number }
}

export interface BoardItem {
  id: string
  name: string
  slug: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface ChapterCountItem {
  chapterId: string
  chapterName: string
  subjectName: string
  mcqTotal: number
  mcqPremium: number
  mcqFree: number
  cqTotal: number
  cqPremium: number
  cqFree: number
}

export interface DeleteConfirm {
  type: 'class' | 'subject' | 'chapter' | 'board'
  id: string
  name: string
}
