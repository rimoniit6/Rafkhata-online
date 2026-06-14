import { create } from 'zustand'

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
  | 'mcq-practice'
  | 'mcq-exam'
  | 'mcq-result'
  | 'cq-list'
  | 'cq-viewer'
  | 'board-questions'
  | 'notices'
  | 'notice-detail'
  | 'suggestions'
  | 'suggestion-detail'
  | 'suggestion-view'
  | 'premium'
  | 'payment'
  | 'user-dashboard'
  | 'exam-center'
  | 'mcq-exam-package-list'
  | 'mcq-exam-package-detail'
  | 'mcq-exam-history'
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
  | 'cq-exam-package-list'
  | 'cq-exam-package-detail'
  | 'cq-exam-viewer'
  | 'cq-exam-result'
// Single source of truth for admin routes — used by AppShell, page.tsx, and AdminLayout
export const ADMIN_ROUTES: RoutePath[] = [
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
]

export function isAdminRoute(route: RoutePath): boolean {
  return ADMIN_ROUTES.includes(route)
}

interface RouteParams {
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
}

interface RouterState {
  currentRoute: RoutePath
  params: RouteParams
  history: Array<{ route: RoutePath; params: RouteParams }>
  navigate: (route: RoutePath, params?: RouteParams) => void
  goBack: () => void
  updateParams: (params: Partial<RouteParams>) => void
}

const MAX_HISTORY = 50

export const useRouterStore = create<RouterState>((set, get) => ({
  currentRoute: 'home',
  params: {},
  history: [{ route: 'home', params: {} }],
  navigate: (route, params = {}) => {
    const { currentRoute, params: currentParams, history } = get()
    set({
      currentRoute: route,
      params,
      history: [...history.slice(-(MAX_HISTORY - 1)), { route: currentRoute, params: currentParams }],
    })
    if (params.scrollTarget) {
      // Delay to allow component to render before scrolling
      setTimeout(() => {
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
    const { history } = get()
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      const lastEntry = newHistory[newHistory.length - 1]
      set({
        currentRoute: lastEntry.route,
        params: lastEntry.params,
        history: newHistory,
      })
    }
  },
  updateParams: (newParams) => {
    const { params, history } = get()
    const updatedParams = { ...params, ...newParams }
    // Also update the last history entry so goBack preserves these params
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
