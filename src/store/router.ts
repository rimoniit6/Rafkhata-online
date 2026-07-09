import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

const MAX_HISTORY = 50
let _scrollTimeout: ReturnType<typeof setTimeout> | null = null

export type RoutePath = 
  | 'home'
  | 'login'
  | 'register'
  | 'search'
  | 'class-list'
  | 'class-detail'
  | 'subject-detail'
  | 'chapter-detail'
  | 'lecture-list'
  | 'lecture-viewer'
  | 'exam-result'
  | 'cq-list'
  | 'cq-viewer'
  | 'board-questions'
  | 'notices'
  | 'notice-detail'
  | 'suggestions'
  | 'suggestion-detail'

  | 'premium'
  | 'payment'
  | 'user-dashboard'
  | 'create-exam'
  | 'exam-center'
  | 'exam-session'
  | 'exam-result'
  | 'mcq-exam-package-list'
  | 'mcq-exam-package-detail'
  | 'mcq-exam-history'
  | 'exam-creator-history'
  | 'exam-creator-result'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-content'
  | 'admin-mcq'
  | 'admin-cq'
  | 'admin-lectures'
  | 'admin-board'
  | 'admin-payments'
  | 'admin-settings'
  | 'admin-exams'
  | 'admin-banners'
  | 'admin-notifications'
  | 'admin-notices'
  | 'admin-suggestions'
  | 'admin-bundles'
  | 'admin-packages'
  | 'admin-hierarchy'
  | 'admin-bulk-import'
  | 'admin-featured'
  | 'admin-content-types'
  | 'admin-mcq-exam-packages'
  | 'admin-exam-results'
  | 'admin-mcq-exam-purchases'
  | 'admin-subscriptions'
  | 'admin-faqs'
  | 'admin-testimonials'
  | 'admin-notes'
  | 'admin-content-purchases'
  | 'admin-feedback'
  | 'admin-teacher-moderators'
  | 'admin-cq-exam-packages'
  | 'short-questions'
  | 'admin-knowledge-questions'
  | 'course-list'
  | 'course-detail'
  | 'course-viewer'
  | 'admin-courses'
  | 'cq-exam-package-list'
  | 'cq-exam-package-detail'
  | 'cq-exam-viewer'
  | 'cq-exam-result'
  | 'admin-analytics'
  | 'admin-analytics-revenue'
  | 'admin-analytics-students'
  | 'admin-analytics-retention'
  | 'admin-analytics-conversion'
  | 'admin-analytics-dropoff'
  | 'admin-analytics-courses'
  | 'admin-analytics-lectures'
  | 'admin-analytics-mcq'
  | 'admin-analytics-cq'
  | 'admin-analytics-payments'
  | 'admin-analytics-acquisition'
  | 'admin-analytics-search'
  | 'admin-analytics-devices'
  | 'admin-analytics-geo'
  | 'admin-analytics-realtime'
  | 'admin-analytics-reports'

// Single source of truth for admin routes — used by AppShell, page.tsx, and AdminLayout
export const ADMIN_ROUTES: Set<RoutePath> = new Set([
  'admin-dashboard',
  'admin-users',
  'admin-content',
  'admin-hierarchy',
  'admin-bulk-import',
  'admin-mcq',
  'admin-cq',
  'admin-knowledge-questions',
  'admin-lectures',
  'admin-board',
  'admin-notices',
  'admin-suggestions',
  'admin-payments',
  'admin-exams',
  'admin-bundles',
  'admin-packages',
  'admin-mcq-exam-packages',
  'admin-exam-results',
  'admin-mcq-exam-purchases',
  'admin-subscriptions',
  'admin-featured',
  'admin-content-types',
  'admin-banners',
  'admin-notifications',
  'admin-faqs',
  'admin-testimonials',
  'admin-notes',
  'admin-content-purchases',
  'admin-feedback',
  'admin-teacher-moderators',
  'admin-cq-exam-packages',
  'admin-settings',
  'admin-courses',
  'admin-analytics',
  'admin-analytics-revenue',
  'admin-analytics-students',
  'admin-analytics-retention',
  'admin-analytics-conversion',
  'admin-analytics-dropoff',
  'admin-analytics-courses',
  'admin-analytics-lectures',
  'admin-analytics-mcq',
  'admin-analytics-cq',
  'admin-analytics-payments',
  'admin-analytics-acquisition',
  'admin-analytics-search',
  'admin-analytics-devices',
  'admin-analytics-geo',
  'admin-analytics-realtime',
  'admin-analytics-reports',
])

export function isAdminRoute(route: RoutePath): boolean {
  return ADMIN_ROUTES.has(route)
}

export interface RouteParams {
  classId?: string
  classSlug?: string
  subjectId?: string
  subjectSlug?: string
  chapterId?: string
  chapterSlug?: string
  lectureId?: string
  mcqId?: string
  cqId?: string
  examId?: string
  boardName?: string
  boardId?: string
  year?: string
  paymentId?: string
  noticeId?: string
  suggestionId?: string
  tab?: string
  scrollTarget?: string
  searchQuery?: string
  // Payment params for per-content & bundle purchases
  planId?: string
  contentType?: string
  contentId?: string
  contentTitle?: string
  contentPrice?: string
  bundleId?: string
  classLevel?: string // For package purchases: which class the user selected
  source?: string // Navigation source (e.g., 'board' from board questions)
  initialTab?: string // Initial content pill to show in SubjectDetailPage
  packageId?: string // For MCQ exam package detail page
  resultId?: string // For exam result viewing
  startSetId?: string // Auto-start a specific exam set on mount
  courseSlug?: string // For course detail page
}

export interface RouterState {
  currentRoute: RoutePath
  params: RouteParams
  history: Array<{ route: RoutePath; params: RouteParams }>
  navigate: (route: RoutePath, params?: RouteParams) => void
  goBack: () => void
  updateParams: (params: Partial<RouteParams>) => void
  setRoute: (route: RoutePath, params?: RouteParams) => void
  /**
   * Register a callback that fires on every navigate() call.
   * Used by useAppNavigation to push URL changes to Next.js router.
   * Only one callback at a time; subsequent calls replace the previous.
   */
  _onNavigate: ((route: RoutePath, params: RouteParams) => void) | null
}

export const useRouterStore = create<RouterState>()((set, get) => ({
  currentRoute: 'home',
  params: {},
  history: [{ route: 'home', params: {} }],
  _onNavigate: null,
  setRoute: (route, params = {}) => {
    set({ currentRoute: route, params })
  },
  navigate: (route, params = {}) => {
    const { currentRoute, params: currentParams, history, _onNavigate } = get()
    set({
      currentRoute: route,
      params,
      history: [...history.slice(-(MAX_HISTORY - 1)), { route: currentRoute, params: currentParams }],
    })
    _onNavigate?.(route, params)
    if (params.scrollTarget) {
      if (_scrollTimeout) clearTimeout(_scrollTimeout)
      _scrollTimeout = setTimeout(() => {
        const element = document.getElementById(params.scrollTarget!)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 150)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
  goBack: () => {
    const { history, _onNavigate } = get()
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      const lastEntry = newHistory[newHistory.length - 1]
      set({
        currentRoute: lastEntry.route,
        params: lastEntry.params,
        history: newHistory,
      })
      _onNavigate?.(lastEntry.route, lastEntry.params)
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  },
  updateParams: (newParams) => {
    const { params, history } = get()
    const updatedParams = { ...params, ...newParams }
    const updatedHistory = [...history]
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        params: updatedParams,
      }
    }
    set({ params: updatedParams, history: updatedHistory })
  },
}))

export const useCurrentRoute = () => useRouterStore((s) => s.currentRoute)
export const useRouteParams = () => useRouterStore((s) => s.params)
export const useRouteParam = <K extends keyof RouteParams>(key: K) =>
  useRouterStore((s) => s.params[key])
export const useShallowRouter = () => useRouterStore(useShallow((s) => ({
  currentRoute: s.currentRoute,
  params: s.params,
})))
