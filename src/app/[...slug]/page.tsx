'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useRouterStore, useRouteParams, useCurrentRoute, RoutePath, isAdminRoute } from '@/store/router'
import { usePageMeta } from '@/hooks/use-page-meta'
import AppShell from '@/components/layout/AppShell'
import { parseUrl } from '@/lib/urls'
import { usePathname, useSearchParams } from 'next/navigation'

const HomePage = dynamic(() => import('@/components/home/HomePage'))
const SocialLoginPage = dynamic(() => import('@/components/auth/SocialLoginPage'))
const ClassCategories = dynamic(() => import('@/components/home/ClassCategories'))
const ClassHubPage = dynamic(() => import('@/components/class-hub/ClassHubPage'))
const SubjectHubPage = dynamic(() => import('@/components/subject-hub/SubjectHubPage'))
const ChapterHubPage = dynamic(() => import('@/components/chapter-hub/ChapterHubPage'))
const LectureListPage = dynamic(() => import('@/components/lecture/LectureListPage'))
const LectureViewerPage = dynamic(() => import('@/components/lecture/LectureViewerPage'))
const CQViewerPage = dynamic(() => import('@/components/cq/CQViewerPage'))
const CQListPage = dynamic(() => import('@/components/cq/CQListPage'))
const BoardQuestionsPage = dynamic(() => import('@/components/board/v2').then((m) => m.BoardPage))
const NoticesPage = dynamic(() => import('@/components/notice/NoticesPage'))
const NoticeDetailPage = dynamic(() => import('@/components/notice/NoticeDetailPage'))
const SuggestionsPage = dynamic(() => import('@/components/suggestion/SuggestionsPage'))
const SuggestionDetailPage = dynamic(() => import('@/components/suggestion/SuggestionDetailPage'))
const PremiumPage = dynamic(() => import('@/components/premium/PremiumPage'))
const SearchResultsPage = dynamic(() => import('@/components/search/SearchResultsPage'))
const PaymentPage = dynamic(() => import('@/components/payment/PaymentPage'))
const UserDashboardPage = dynamic(() => import('@/components/user/UserDashboardPage'))
const UserExamListPage = dynamic(() => import('@/components/exam/UserExamListPage'))
const ExamSessionPage = dynamic(() => import('@/components/exam/ExamSessionPage'))
const CreateExamPage = dynamic(() => import('@/components/create-exam/CreateExamPage'))
const CreatorExamHistoryPage = dynamic(() => import('@/components/exam/CreatorExamHistoryPage'))
const CreatorExamResultReviewPage = dynamic(() => import('@/components/exam/CreatorExamResultReviewPage'))
const MCQExamPackageListPage = dynamic(() => import('@/components/exam/MCQExamPackageListPage'))
const MCQExamPackageDetailPage = dynamic(() => import('@/components/exam/MCQExamPackageDetailPage'))
const MCQExamHistoryPage = dynamic(() => import('@/components/exam/MCQExamHistoryPage'))
const CQExamPackageListPage = dynamic(() => import('@/components/cq-exam/CQExamPackageListPage'))
const CQExamPackageDetailPage = dynamic(() => import('@/components/cq-exam/CQExamPackageDetailPage'))
const CQExamViewerPage = dynamic(() => import('@/components/cq-exam/CQExamViewerPage'))
const CQExamResultPage = dynamic(() => import('@/components/cq-exam/CQExamResultPage'))
const KnowledgeQuestionsPage = dynamic(() => import('@/components/knowledge/KnowledgeQuestionsPage'))
const CourseListPage = dynamic(() => import('@/components/course/CourseListPage'))
const StudentCourseDetailPage = dynamic(() => import('@/features/course/student/components/StudentCourseDetailPage'))
const ExamResultPage = dynamic(() => import('@/components/exam/ExamResultPage'))
const AdminLayout = dynamic(() => import('@/components/admin/AdminLayout'), { ssr: false })

function StudentCourseDetailWrapper() {
  const params = useRouteParams()
  return <StudentCourseDetailPage slug={params.courseSlug || ''} />
}

function RouteRenderer() {
  usePageMeta()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const storeRoute = useCurrentRoute()

  // Derive route from URL first (correct on fresh load), fall back to store
  // (updated after RouteSync runs). This prevents the default 'home' value
  // from causing a flash of the wrong page/layout on initial render.
  const parsed = parseUrl(pathname, searchParams ?? undefined)
  const currentRoute: RoutePath = parsed?.route ?? storeRoute

  if (isAdminRoute(currentRoute)) {
    return <AdminLayout />
  }

  const routeMap: Partial<Record<RoutePath, React.ReactNode>> = {
    'home': <HomePage />,
    'login': <SocialLoginPage />,
    'register': <SocialLoginPage />,
    'class-list': <ClassCategories />,
    'class-detail': <ClassHubPage />,
    'subject-detail': <SubjectHubPage />,
    'chapter-detail': <ChapterHubPage />,
    'lecture-list': <LectureListPage />,
    'lecture-viewer': <LectureViewerPage />,
    'cq-list': <CQListPage />,
    'cq-viewer': <CQViewerPage />,
    'board-questions': <BoardQuestionsPage />,
    'notices': <NoticesPage />,
    'notice-detail': <NoticeDetailPage />,
    'suggestions': <SuggestionsPage />,
    'suggestion-detail': <SuggestionDetailPage />,
    'search': <SearchResultsPage />,
    'premium': <PremiumPage />,
    'payment': <PaymentPage />,
    'user-dashboard': <UserDashboardPage />,
    'exam-center': <UserExamListPage />,
    'mcq-exam-package-list': <MCQExamPackageListPage />,
    'mcq-exam-package-detail': <MCQExamPackageDetailPage />,
    'mcq-exam-history': <MCQExamHistoryPage />,
    'cq-exam-package-list': <CQExamPackageListPage />,
    'cq-exam-package-detail': <CQExamPackageDetailPage />,
    'cq-exam-viewer': <CQExamViewerPage />,
    'cq-exam-result': <CQExamResultPage />,
    'short-questions': <KnowledgeQuestionsPage />,
    'course-list': <CourseListPage />,
    'course-detail': <StudentCourseDetailWrapper />,
    'course-viewer': <StudentCourseDetailWrapper />,
    'exam-session': <ExamSessionPage />,
    'create-exam': <CreateExamPage />,
    'exam-creator-history': <CreatorExamHistoryPage />,
    'exam-creator-result': <CreatorExamResultReviewPage />,
    'exam-result': <ExamResultPage />,
  }

  return routeMap[currentRoute] || <HomePage />
}

export default function CatchAll() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <RouteRenderer />
      </Suspense>
    </AppShell>
  )
}
