import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

type WhereInput = Record<string, unknown>

interface PaginationParams {
  page: number
  limit: number
}

interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ContentQueryParams {
  q?: string
  classLevel?: string
  subjectId?: string
  chapterId?: string
  difficulty?: string
  board?: string
  year?: string
  topic?: string
  isPremium?: string
  isActive?: string
  page?: string
  limit?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

function parsePagination(params: ContentQueryParams): PaginationParams {
  return {
    page: Math.max(1, parseInt(params.page || '1')),
    limit: Math.min(100, Math.max(1, parseInt(params.limit || '20'))),
  }
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === null) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function buildSearchFilter(q: string | undefined, fields: string[]): WhereInput | undefined {
  if (!q) return undefined
  return {
    OR: fields.map(field => ({ [field]: { contains: q } })),
  }
}

export class ContentService {
  static async listMCQs(params: ContentQueryParams): Promise<PaginatedResult<unknown>> {
    const { page, limit } = parsePagination(params)
    const where: WhereInput = {
      ...(params.classLevel && { classLevel: params.classLevel }),
      ...(params.subjectId && { subjectId: params.subjectId }),
      ...(params.chapterId && { chapterId: params.chapterId }),
      ...(params.difficulty && { difficulty: params.difficulty }),
      ...(params.board && { board: params.board }),
      ...(params.year && { year: params.year }),
      ...(params.topic && { topic: params.topic }),
      ...(parseBoolean(params.isPremium) !== undefined && { isPremium: params.isPremium === 'true' }),
      ...(parseBoolean(params.isActive) !== undefined && { isActive: params.isActive === 'true' }),
      ...buildSearchFilter(params.q, ['question', 'explanation', 'tags']),
    }

    const [data, total] = await Promise.all([
      db.mCQ.findMany({
        where,
        include: { chapter: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mCQ.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  static async listCQs(params: ContentQueryParams): Promise<PaginatedResult<unknown>> {
    const { page, limit } = parsePagination(params)
    const where: WhereInput = {
      ...(params.classLevel && { classLevel: params.classLevel }),
      ...(params.subjectId && { subjectId: params.subjectId }),
      ...(params.chapterId && { chapterId: params.chapterId }),
      ...(params.difficulty && { difficulty: params.difficulty }),
      ...(params.board && { board: params.board }),
      ...(params.year && { year: params.year }),
      ...(params.topic && { topic: params.topic }),
      ...(parseBoolean(params.isPremium) !== undefined && { isPremium: params.isPremium === 'true' }),
      ...(parseBoolean(params.isActive) !== undefined && { isActive: params.isActive === 'true' }),
      ...buildSearchFilter(params.q, ['uddeepok', 'topic']),
    }

    const [data, total] = await Promise.all([
      db.cQ.findMany({
        where,
        include: { chapter: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.cQ.count({ where }),
    ])

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  static async listLectures(params: ContentQueryParams): Promise<PaginatedResult<unknown>> {
    const { page, limit } = parsePagination(params)
    const where: WhereInput = {
      ...(params.classLevel && { classLevel: params.classLevel }),
      ...(params.subjectId && { subjectId: params.subjectId }),
      ...(params.chapterId && { chapterId: params.chapterId }),
      ...(parseBoolean(params.isPremium) !== undefined && { isPremium: params.isPremium === 'true' }),
      ...(parseBoolean(params.isActive) !== undefined && { isActive: params.isActive === 'true' }),
      ...buildSearchFilter(params.q, ['title', 'description']),
    }

    const [data, total] = await Promise.all([
      db.lecture.findMany({
        where,
        include: { chapter: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lecture.count({ where }),
    ])

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  static async listExams(params: ContentQueryParams): Promise<PaginatedResult<unknown>> {
    const { page, limit } = parsePagination(params)
    const where: WhereInput = {
      ...(params.classLevel && { classLevel: params.classLevel }),
      ...(params.subjectId && { subjectId: params.subjectId }),
      ...(parseBoolean(params.isPremium) !== undefined && { isPremium: params.isPremium === 'true' }),
      ...(parseBoolean(params.isActive) !== undefined && { isActive: params.isActive === 'true' }),
    }

    const [data, total] = await Promise.all([
      db.exam.findMany({
        where,
        include: {
          questions: { orderBy: { order: 'asc' } },
          _count: { select: { results: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.exam.count({ where }),
    ])

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  static async getClassCategories(where?: WhereInput) {
    return db.classCategory.findMany({
      where,
      include: { _count: { select: { subjects: true } } },
      orderBy: { order: 'asc' },
    })
  }

  static async getSubjects(classId?: string) {
    const where: WhereInput = {}
    if (classId) where.classId = classId
    return db.subject.findMany({
      where,
      orderBy: { name: 'asc' },
    })
  }

  static async getChapters(subjectId?: string) {
    const where: WhereInput = {}
    if (subjectId) where.subjectId = subjectId
    return db.chapter.findMany({
      where,
      orderBy: { name: 'asc' },
    })
  }
}

export function buildWhereFromSearchParams(
  searchParams: URLSearchParams,
  filterMap: Record<string, string>
): WhereInput {
  const where: WhereInput = {}
  for (const [param, field] of Object.entries(filterMap)) {
    const value = searchParams.get(param)
    if (value !== null && value !== undefined && value !== '') {
      where[field] = value === 'true' ? true : value === 'false' ? false : value
    }
  }
  return where
}
