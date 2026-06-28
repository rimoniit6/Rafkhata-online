'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'
import { useChapterFilterStore } from '@/store/chapter-filters'
import type { BoardQuestionItem } from '@/types/board-questions'

// ─── Content type endpoint map ───

type ContentType = 'lecture' | 'mcq' | 'cq' | 'board' | 'knowledge' | 'suggestion' | 'exam'

const ENDPOINTS: Record<ContentType, string> = {
  lecture: '/api/lectures',
  mcq: '/api/mcq',
  cq: '/api/cq',
  board: '/api/board-questions',
  knowledge: '/api/knowledge-questions',
  suggestion: '/api/suggestions',
  exam: '/api/exams',
}

// ─── Generic response types ───

export interface LectureItem {
  id: string; title: string; content?: string; videoUrl?: string | null; duration?: number | null
  isPremium: boolean; price: number; order: number; chapterId: string; pdfUrl?: string | null
}

export interface CQListItem {
  id: string; uddeepok: string; uddeepokImage?: string | null; questionCount: number
  isPremium: boolean; price: number; difficulty: string; board: string | null; year: string | null
  chapterId: string; chapterName: string; subjectName: string; subjectId: string
}

export interface ExamItem {
  id: string; title: string; description: string | null; classLevel: string
  type: string; duration: number; totalMarks: number; isPremium: boolean; price: number
  totalQuestions: number
}

export interface SuggestionItem {
  id: string; title: string; slug: string; thumbnail: string | null; pdfUrl: string | null
  isPremium: boolean; price: number | null; viewCount: number; chapterId: string | null
}

export interface KnowledgeItem {
  id: string; type: string; question: string; answer: string
  questionImage: string | null; answerImage: string | null
  isPremium: boolean; price: number; order: number
}

// Extract item array from each API's response shape
function extractItems(contentType: ContentType, raw: unknown): unknown[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw

  const obj = raw as Record<string, unknown>

  switch (contentType) {
    case 'lecture':    return (obj.lectures as unknown[]) ?? []
    case 'mcq':        return (obj.questions as unknown[]) ?? []
    case 'cq':         return (obj.cqs as unknown[]) ?? []
    case 'board':      return (obj.data as unknown[]) ?? []
    case 'knowledge':  return (obj.data as unknown[]) ?? []
    case 'suggestion': return (obj.data as unknown[]) ?? []
    case 'exam':       return (obj.data as unknown[]) ?? []
    default:           return []
  }
}

// ─── Hook ───

export function useChapterContent<T = unknown>(
  contentType: ContentType,
  chapterId: string | undefined,
  page: number = 1,
  limit: number = 10,
) {
  const filters = useChapterFilterStore()

  const queryKey = [
    'chapter-content',
    chapterId,
    contentType,
    page,
    limit,
    filters.access,
    filters.difficulty,
    filters.board,
    filters.year,
    filters.topic,
    filters.searchQuery,
  ]

  return useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('chapterId', chapterId!)
      params.set('page', String(page))
      params.set('limit', String(limit))

      if (filters.searchQuery) params.set('search', filters.searchQuery)
      if (filters.access === 'free') params.set('isPremium', 'false')
      if (filters.access === 'locked') params.set('isPremium', 'true')
      if (filters.difficulty.length > 0) params.set('difficulty', filters.difficulty.join(','))
      if (filters.board.length > 0) params.set('board', filters.board.join(','))
      if (filters.year.length > 0) params.set('year', filters.year.join(','))

      const url = `${ENDPOINTS[contentType]}?${params.toString()}`
      const raw = await fetchJSON<unknown>(url)
      return extractItems(contentType, raw) as T[]
    },
    enabled: !!chapterId,
    staleTime: 15_000,
  })
}

// ─── Specialised wrappers for type safety ───

export function useChapterLectures(chapterId: string | undefined, page?: number, limit?: number) {
  return useChapterContent<LectureItem>('lecture', chapterId, page, limit)
}

export function useChapterMCQs(chapterId: string | undefined, page?: number, limit?: number) {
  return useChapterContent<BoardQuestionItem>('mcq', chapterId, page, limit)
}

export function useChapterCQs(chapterId: string | undefined, page?: number, limit?: number) {
  return useChapterContent<CQListItem>('cq', chapterId, page, limit)
}

export function useChapterBoardQuestions(chapterId: string | undefined, page?: number, limit?: number) {
  return useChapterContent<BoardQuestionItem>('board', chapterId, page, limit)
}

export function useChapterKnowledge(chapterId: string | undefined) {
  return useChapterContent<KnowledgeItem>('knowledge', chapterId, 1, 100)
}

export function useChapterSuggestions(chapterId: string | undefined) {
  return useChapterContent<SuggestionItem>('suggestion', chapterId, 1, 50)
}

export function useChapterExams(chapterId: string | undefined, page?: number, limit?: number) {
  return useChapterContent<ExamItem>('exam', chapterId, page, limit)
}
