import { api } from '@/lib/api-client'

export interface ClassItem {
  id: string
  name: string
  slug: string
  subjectCount?: number
  icon?: string
  gradient?: string
  description?: string | null
  color?: string | null
  contentCounts?: {
    lectures: number
    mcqs: number
    cqs: number
    boardQuestions: number
  }
  totalContent?: number
}

export interface SubjectItem {
  id: string
  name: string
  slug: string
  classId: string
  icon?: string | null
  color?: string | null
  description?: string | null
  order?: number
  isActive?: boolean
  class?: { id: string; name: string; slug: string }
  _count?: { chapters: number }
}

export interface ChapterItem {
  id: string
  name: string
  slug: string
  subjectId: string
  order?: number
  description?: string | null
  isActive?: boolean
  subject?: { id: string; name: string; slug: string; classId?: string }
  _count?: { lectures: number; mcqs: number; cqs: number }
}

export interface MCQItem {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  isPremium: boolean
  price: number
  difficulty: string
  board?: string | null
  year?: string | null
  chapter?: { id: string; name: string; slug: string }
  // Transformed fields for frontend
  text?: string
  options?: { key: string; text: string }[]
}

export interface LectureItem {
  id: string
  title: string
  content?: string | null
  videoUrl?: string | null
  pdfUrl?: string | null
  chapterId?: string
  isPremium?: boolean
  price?: number
  duration?: number | null
  order?: number
  chapterName?: string
  subjectName?: string
  className?: string
  classSlug?: string
  subjectId?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const contentService = {
  // Classes
  listClasses: () =>
    api.get<{ classes: ClassItem[] }>('classes'),

  getClassBySlug: (slug: string) =>
    api.get<{ class: ClassItem }>(`classes/${slug}`),

  // Subjects
  listSubjects: (classId?: string) =>
    api.get<{ data: SubjectItem[] }>('subjects', classId ? { classId } : undefined),

  getSubjectById: (id: string) =>
    api.get<{ subject: SubjectItem }>(`subjects/${id}`),

  // Chapters
  listChapters: (subjectId?: string, params?: Record<string, string | number | boolean>) =>
    api.get<{ data: ChapterItem[] }>('chapters', { ...(subjectId && { subjectId }), ...params }),

  getChapterById: (id: string) =>
    api.get<{ chapter: ChapterItem }>(`chapters/${id}`),

  // MCQs
  listMCQs: (params?: Record<string, string | number | boolean>) =>
    api.get<{ questions: MCQItem[]; pagination: PaginationInfo }>('mcq', params),

  getMCQById: (id: string) =>
    api.get<{ question: MCQItem }>(`mcq/${id}`),

  // CQs
  listCQs: (params?: Record<string, string | number | boolean>) =>
    api.get<{ data: MCQItem[]; pagination: PaginationInfo }>('cq', params),

  getCQById: (id: string) =>
    api.get<{ data: MCQItem }>(`cq/${id}`),

  // Lectures
  listLectures: (params?: Record<string, string | number | boolean>) =>
    api.get<{ lectures: LectureItem[]; pagination: PaginationInfo }>('lectures', params),

  getLectureById: (id: string) =>
    api.get<{ lecture: LectureItem }>(`lectures/${id}`),

  // Content types
  listContentTypes: () =>
    api.get<{ data: { id: string; name: string; slug: string }[] }>('content-types'),
}
