'use client'

import { useState, useEffect } from 'react'
import {
  PlayCircle, FileQuestion, ClipboardList, GraduationCap,
  Lightbulb, Award, Package, Crown, BookOpen,
  CircleDot, FileText, ClipboardCheck, Gift,
  Brain, BookOpenCheck, BarChart3,
  type LucideIcon,
} from 'lucide-react'

// Icon mapping from DB icon name to Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  PlayCircle,
  FileQuestion,
  ClipboardList,
  GraduationCap,
  Lightbulb,
  Award,
  Package,
  Crown,
  BookOpen,
  CircleDot,
  FileText,
  ClipboardCheck,
  Gift,
  Brain,
  BookOpenCheck,
  BarChart3,
}

export interface ContentTypeItem {
  id: string
  key: string
  labelBn: string
  labelEn: string
  description: string | null
  icon: string
  color: string
  lightColor: string | null
  textColor: string | null
  route: string | null
  paramKey: string | null
  buttonLabel: string | null
  showInChapterDetail: boolean
  isActive: boolean
  order: number
}

export interface ContentTypeWithIcon extends ContentTypeItem {
  Icon: LucideIcon
}

// Global cache to avoid repeated API calls — with TTL to prevent stale data
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
let cachedContentTypes: ContentTypeItem[] | null = null
let cacheTimestamp: number = 0
let fetchPromise: Promise<ContentTypeItem[]> | null = null

async function fetchContentTypes(): Promise<ContentTypeItem[]> {
  // Return cache if fresh
  if (cachedContentTypes && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedContentTypes
  }
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/content-types')
    .then(r => r.json())
    .then(j => {
      const data = Array.isArray(j.data) ? j.data : []
      cachedContentTypes = data
      cacheTimestamp = Date.now()
      return data
    })
    .catch(() => [])
    .finally(() => {
      fetchPromise = null
    })

  return fetchPromise
}

// Invalidate cache (e.g., after admin updates)
export function invalidateContentTypesCache() {
  cachedContentTypes = null
  cacheTimestamp = 0
}

export function useContentTypes() {
  const [contentTypes, setContentTypes] = useState<ContentTypeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContentTypes().then(data => {
      setContentTypes(data)
      setLoading(false)
    })
  }, [])

  // Get content types with resolved Lucide icon components
  const contentTypesWithIcons: ContentTypeWithIcon[] = contentTypes.map(ct => ({
    ...ct,
    Icon: ICON_MAP[ct.icon] || BookOpen,
  }))

  // Helper: get label by key
  const getLabel = (key: string): string => {
    const ct = contentTypes.find(c => c.key === key)
    return ct?.labelBn || key
  }

  // Helper: get button label by key
  const getButtonLabel = (key: string): string => {
    const ct = contentTypes.find(c => c.key === key)
    return ct?.buttonLabel || ct?.labelBn || key
  }

  // Helper: get color class by key
  const getColor = (key: string): string => {
    const ct = contentTypes.find(c => c.key === key)
    return ct?.color || 'bg-gray-500'
  }

  // Helper: get lightColor class by key
  const getLightColor = (key: string): string => {
    const ct = contentTypes.find(c => c.key === key)
    return ct?.lightColor || 'bg-gray-50 dark:bg-gray-950/30'
  }

  // Helper: get textColor class by key
  const getTextColor = (key: string): string => {
    const ct = contentTypes.find(c => c.key === key)
    return ct?.textColor || 'text-gray-600 dark:text-gray-400'
  }

  // Helper: get route by key
  const getRoute = (key: string): string | null => {
    const ct = contentTypes.find(c => c.key === key)
    return ct?.route || null
  }

  // Helper: get icon component by key
  const getIcon = (key: string): LucideIcon => {
    const ct = contentTypes.find(c => c.key === key)
    return ICON_MAP[ct?.icon || ''] || BookOpen
  }

  return {
    contentTypes,
    contentTypesWithIcons,
    loading,
    getLabel,
    getButtonLabel,
    getColor,
    getLightColor,
    getTextColor,
    getRoute,
    getIcon,
  }
}
