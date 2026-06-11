'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'
import { queryKeys } from '@/lib/query-keys'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ============ Types ============

export interface MetadataClass {
  id: string
  name: string
  slug: string
}

export interface MetadataSubject {
  id: string
  name: string
  slug: string
  classId: string
}

export interface MetadataChapter {
  id: string
  name: string
  slug: string
  subjectId: string
}

export interface MetadataBoard {
  id: string
  name: string
  slug: string
}

export interface MetadataYear {
  id: string
  year: string
}

export interface MetadataFAQ {
  id: string
  question: string
  answer: string
  category?: string | null
}

export interface MetadataTestimonial {
  id: string
  name: string
  role?: string | null
  avatar?: string | null
  content: string
  rating: number
}

export interface MetadataTeacherModerator {
  id: string
  name: string
  image: string | null
  title: string
  institution: string | null
}

export interface SiteConfig {
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  facebook: string
  youtube: string
  telegram: string
  bkash: string
  nagad: string
  rocket: string
  logo: string
  favicon: string
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  statsSubtitle: string
  footerDescription: string
  premiumFeatures: string[]
  mcqFeatures: string[]
  searchSuggestions: string[]
  homepageClassesBadge: string
  homepageClassesTitle: string
  homepageClassesSubtitle: string
  homepageBoardTitle: string
  homepageBoardSubtitle: string
  homepageMcqTitle: string
  homepageMcqSubtitle: string
  homepageFaqTitle: string
  homepageFaqSubtitle: string
  homepageTestimonialsTitle: string
  homepageTestimonialsSubtitle: string
  homepageTeachersTitle: string
  homepageTeachersSubtitle: string
  homepageStatsTitle: string
  homepageStatsSubtitle: string
  homepageFeaturedTitle: string
  homepageFeaturedSubtitle: string
  homepagePremiumTitle: string
  homepagePremiumSubtitle: string
  messages: {
    contentComingSoon: string
    chaptersComingSoon: string
    chapterContentSoon: string
    mcqComingSoon: string
    cqComingSoon: string
    lectureComingSoon: string
    boardComingSoon: string
    contentLoadError: string
    contentTypeSoon: string
    noQuestionsFound: string
    footerClassesSoon: string
    footerContactSoon: string
    subjectsComingSoon: string
  }
}

export interface PublicStats {
  students: number
  mcqs: number
  lectures: number
  cqs: number
  exams: number
}

const defaultPublicStats: PublicStats = {
  students: 0,
  mcqs: 0,
  lectures: 0,
  cqs: 0,
  exams: 0,
}

// ============ Hooks ============

export function useClasses() {
  const { metadata, loading, error } = useHierarchyMetadata()
  const classes = (metadata?.classes || []) as MetadataClass[]
  const labelMap = useMemo(() => Object.fromEntries(classes.map((c) => [c.slug, c.name])), [classes])

  return { classes, labelMap, loading, error }
}

export function useBoards() {
  const { data: boards = [], isLoading, error } = useQuery({
    queryKey: queryKeys.boards,
    queryFn: async () => {
      const json = await fetchJSON<{ data?: MetadataBoard[] }>('/api/boards')
      return Array.isArray(json.data) ? json.data : []
    },
    select: (data) => data,
  })

  const labelMap = useMemo(() => Object.fromEntries(boards.map((b) => [b.slug, b.name])), [boards])
  const options = useMemo(() => boards.map((b) => ({ value: b.slug, label: b.name })), [boards])

  return { boards, labelMap, options, loading: isLoading, error: error?.message ?? null }
}

export function useYears() {
  const { data: years = [], isLoading, error } = useQuery({
    queryKey: queryKeys.years,
    queryFn: async () => {
      const json = await fetchJSON<{ data?: MetadataYear[] }>('/api/years')
      return Array.isArray(json.data) ? json.data : []
    },
    select: (data) => data,
  })

  const options = useMemo(() => years.map((y) => ({ value: y.year, label: y.year })), [years])

  return { years, options, loading: isLoading, error: error?.message ?? null }
}

export function useFAQs() {
  const { data: faqs = [], isLoading, error } = useQuery({
    queryKey: queryKeys.faqs,
    queryFn: async () => {
      const json = await fetchJSON<{ faqs?: MetadataFAQ[]; data?: MetadataFAQ[] }>('/api/faqs')
      return Array.isArray(json.faqs) ? json.faqs : (Array.isArray(json.data) ? json.data : [])
    },
    select: (data) => data,
  })

  return { faqs, loading: isLoading, error: error?.message ?? null }
}

export function useTestimonials() {
  const { data: testimonials = [], isLoading, error } = useQuery({
    queryKey: queryKeys.testimonials,
    queryFn: async () => {
      const json = await fetchJSON<{ testimonials?: MetadataTestimonial[]; data?: MetadataTestimonial[] }>(
        '/api/testimonials'
      )
      return Array.isArray(json.testimonials)
        ? json.testimonials
        : (Array.isArray(json.data) ? json.data : [])
    },
    select: (data) => data,
  })

  return { testimonials, loading: isLoading, error: error?.message ?? null }
}

export function useTeacherModerators() {
  const { data: teachers = [], isLoading, error } = useQuery({
    queryKey: queryKeys.teachers,
    queryFn: async () => {
      const json = await fetchJSON<{ teachers?: MetadataTeacherModerator[] }>('/api/teacher-moderators')
      return Array.isArray(json.teachers) ? json.teachers : []
    },
    select: (data) => data,
  })

  return { teachers, loading: isLoading, error: error?.message ?? null }
}

export function useSiteConfig() {
  const { data: config = null, isLoading, error } = useQuery({
    queryKey: queryKeys.config,
    queryFn: async () => {
      const data = await fetchJSON<SiteConfig>('/api/config')
      if (!data || typeof data !== 'object' || !('siteName' in data)) {
        throw new Error('কনফিগ ডাটা ফরম্যাট ত্রুটি')
      }
      return data
    },
    select: (data) => data,
  })

  return { config, loading: isLoading, error: error?.message ?? null }
}

export function usePublicStats() {
  const { data: stats = null, isLoading, error } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => fetchJSON<PublicStats>('/api/stats'),
    placeholderData: defaultPublicStats,
  })

  return { stats: error ? null : stats, loading: isLoading, error: error?.message ?? null }
}
