import type { RouteParams,RoutePath } from '@/store/router'

type _SegmentValue = string | undefined

interface RouteDef {
  path: string
  queryParams: (keyof RouteParams)[]
}

const ROUTE_DEFS: Record<RoutePath, RouteDef> = {
  home: { path: '/', queryParams: [] },
  login: { path: '/login', queryParams: [] },
  register: { path: '/register', queryParams: [] },

  search: { path: '/search', queryParams: ['searchQuery'] },
  'class-list': { path: '/classes', queryParams: ['scrollTarget'] },
  'class-detail': { path: '/class/{classSlug}', queryParams: ['scrollTarget'] },
  'subject-detail': { path: '/class/{classSlug}/{subjectSlug}', queryParams: ['initialTab', 'source', 'scrollTarget'] },
  'chapter-detail': { path: '/class/{classSlug}/{subjectSlug}/{chapterSlug}', queryParams: ['initialTab', 'scrollTarget'] },
  'lecture-list': { path: '/lectures', queryParams: ['scrollTarget'] },
  'lecture-viewer': { path: '/lecture/{lectureId}', queryParams: ['scrollTarget'] },
  'exam-session': { path: '/mcq/exam', queryParams: ['scrollTarget'] },
  'exam-result': { path: '/mcq/result/{resultId}', queryParams: ['scrollTarget'] },
  'cq-list': { path: '/cq', queryParams: ['scrollTarget'] },
  'cq-viewer': { path: '/cq/{cqId}', queryParams: ['scrollTarget'] },
  'board-questions': { path: '/board-questions', queryParams: ['boardName', 'year', 'source', 'scrollTarget'] },
  notices: { path: '/notices', queryParams: ['scrollTarget'] },
  'notice-detail': { path: '/notices/{noticeId}', queryParams: ['scrollTarget'] },
  suggestions: { path: '/suggestions', queryParams: ['classId', 'scrollTarget'] },
  'suggestion-detail': { path: '/suggestions/{suggestionId}', queryParams: ['scrollTarget'] },
  premium: { path: '/premium', queryParams: ['scrollTarget'] },
  payment: { path: '/payment', queryParams: ['contentType', 'contentId', 'contentTitle', 'contentPrice', 'bundleId', 'planId', 'classLevel', 'source'] },
  'user-dashboard': { path: '/dashboard', queryParams: ['tab', 'scrollTarget'] },
  'create-exam': { path: '/create-exam', queryParams: [] },
  'exam-center': { path: '/exams', queryParams: ['scrollTarget'] },
  'mcq-exam-package-list': { path: '/exams/mcq-packages', queryParams: ['scrollTarget'] },
  'mcq-exam-package-detail': { path: '/exams/mcq-packages/{packageId}', queryParams: ['scrollTarget', 'startSetId'] },
  'mcq-exam-history': { path: '/exams/history', queryParams: ['scrollTarget'] },
  'cq-exam-package-list': { path: '/exams/cq-packages', queryParams: ['scrollTarget'] },
  'cq-exam-package-detail': { path: '/exams/cq-packages/{packageId}', queryParams: ['scrollTarget'] },
  'cq-exam-viewer': { path: '/exams/cq-packages/{packageId}/take', queryParams: ['scrollTarget'] },
  'cq-exam-result': { path: '/exams/cq-packages/{packageId}/result/{resultId}', queryParams: ['scrollTarget'] },
  'short-questions': { path: '/knowledge-questions', queryParams: ['scrollTarget'] },
  'admin-dashboard': { path: '/admin', queryParams: [] },
  'admin-users': { path: '/admin/users', queryParams: [] },
  'admin-content': { path: '/admin/content', queryParams: [] },
  'admin-mcq': { path: '/admin/mcq', queryParams: [] },
  'admin-cq': { path: '/admin/cq', queryParams: [] },
  'admin-lectures': { path: '/admin/lectures', queryParams: [] },
  'admin-board': { path: '/admin/board', queryParams: [] },
  'admin-payments': { path: '/admin/payments', queryParams: [] },
  'admin-settings': { path: '/admin/settings', queryParams: [] },
  'admin-exams': { path: '/admin/exams', queryParams: [] },
  'admin-banners': { path: '/admin/banners', queryParams: [] },
  'admin-notifications': { path: '/admin/notifications', queryParams: [] },
  'admin-notices': { path: '/admin/notices', queryParams: [] },
  'admin-suggestions': { path: '/admin/suggestions', queryParams: [] },
  'admin-bundles': { path: '/admin/bundles', queryParams: [] },
  'admin-packages': { path: '/admin/packages', queryParams: [] },
  'admin-hierarchy': { path: '/admin/hierarchy', queryParams: [] },
  'admin-bulk-import': { path: '/admin/bulk-import', queryParams: [] },
  'admin-featured': { path: '/admin/featured', queryParams: [] },
  'admin-content-types': { path: '/admin/content-types', queryParams: [] },
  'admin-mcq-exam-packages': { path: '/admin/mcq-exam-packages', queryParams: [] },
  'admin-exam-results': { path: '/admin/exam-results', queryParams: [] },
  'admin-mcq-exam-purchases': { path: '/admin/mcq-exam-purchases', queryParams: [] },
  'admin-subscriptions': { path: '/admin/subscriptions', queryParams: [] },
  'admin-faqs': { path: '/admin/faqs', queryParams: [] },
  'admin-testimonials': { path: '/admin/testimonials', queryParams: [] },
  'admin-notes': { path: '/admin/notes', queryParams: [] },
  'admin-content-purchases': { path: '/admin/content-purchases', queryParams: [] },
  'admin-feedback': { path: '/admin/feedback', queryParams: [] },
  'admin-teacher-moderators': { path: '/admin/teacher-moderators', queryParams: [] },
  'admin-cq-exam-packages': { path: '/admin/cq-exam-packages', queryParams: [] },
  'admin-knowledge-questions': { path: '/admin/knowledge-questions', queryParams: [] },
  'course-list': { path: '/courses', queryParams: ['classId', 'subjectId', 'scrollTarget'] },
  'course-detail': { path: '/courses/{courseSlug}', queryParams: ['scrollTarget'] },
  'course-viewer': { path: '/courses/{courseSlug}/view', queryParams: ['scrollTarget'] },
  'admin-courses': { path: '/admin/courses', queryParams: [] },
  'admin-analytics': { path: '/admin/analytics', queryParams: [] },
  'admin-analytics-revenue': { path: '/admin/analytics/revenue', queryParams: [] },
  'admin-analytics-students': { path: '/admin/analytics/students', queryParams: [] },
  'admin-analytics-retention': { path: '/admin/analytics/retention', queryParams: [] },
  'admin-analytics-conversion': { path: '/admin/analytics/conversion', queryParams: [] },
  'admin-analytics-dropoff': { path: '/admin/analytics/dropoff', queryParams: [] },
  'admin-analytics-courses': { path: '/admin/analytics/courses', queryParams: [] },
  'admin-analytics-lectures': { path: '/admin/analytics/lectures', queryParams: [] },
  'admin-analytics-mcq': { path: '/admin/analytics/mcq', queryParams: [] },
  'admin-analytics-cq': { path: '/admin/analytics/cq', queryParams: [] },
  'admin-analytics-payments': { path: '/admin/analytics/payments', queryParams: [] },
  'admin-analytics-acquisition': { path: '/admin/analytics/acquisition', queryParams: [] },
  'admin-analytics-search': { path: '/admin/analytics/search', queryParams: [] },
  'admin-analytics-devices': { path: '/admin/analytics/devices', queryParams: [] },
  'admin-analytics-geo': { path: '/admin/analytics/geo', queryParams: [] },
  'admin-analytics-realtime': { path: '/admin/analytics/realtime', queryParams: [] },
  'admin-analytics-reports': { path: '/admin/analytics/reports', queryParams: [] },
}

const PARAM_REGEX = /\{(\w+)\}/g

export function routeToUrl(route: RoutePath, params: RouteParams): string {
  const def = ROUTE_DEFS[route]
  if (!def) return '/'

  let path = def.path
  const usedParams = new Set<string>()

  path = path.replace(PARAM_REGEX, (_, key: keyof RouteParams) => {
    usedParams.add(key)
    return encodeURIComponent(params[key] || '')
  })

  const qsParams: string[] = []
  for (const key of def.queryParams) {
    const val = params[key]
    if (val !== undefined && val !== '') {
      qsParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
    }
  }

  if (qsParams.length > 0) {
    path += '?' + qsParams.join('&')
  }

  return path
}

function matchPath(pathname: string, pattern: string): Record<string, string> | null {
  const pathParts = pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  const patternParts = pattern.replace(/^\/+/, '').split('/').filter(Boolean)

  if (pathParts.length !== patternParts.length) return null

  const matches: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const paramMatch = patternPart.match(/^\{(\w+)\}$/)

    if (paramMatch) {
      matches[paramMatch[1]] = decodeURIComponent(pathParts[i])
    } else if (patternPart !== pathParts[i]) {
      return null
    }
  }

  return matches
}

export function parseUrl(
  pathname: string,
  searchParams?: URLSearchParams,
): { route: RoutePath; params: RouteParams } | null {
  const entries = Object.entries(ROUTE_DEFS) as [RoutePath, RouteDef][]

  entries.sort((a, b) => {
    const aDepth = (a[1].path.match(/\//g) || []).length
    const bDepth = (b[1].path.match(/\//g) || []).length
    return bDepth - aDepth
  })

  for (const [route, def] of entries) {
    const pathParams = matchPath(pathname, def.path)
    if (pathParams === null) continue

    const params: RouteParams = { ...pathParams }

    if (searchParams) {
      for (const key of def.queryParams) {
        const val = searchParams.get(key)
        if (val !== null) {
          ;(params as any)[key] = val
        }
      }
    }

    return { route, params }
  }

  return null
}

export function getSiteUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
