'use client'

import dynamic from 'next/dynamic'
import { useRouterStore, RoutePath, isAdminRoute } from '@/store/router'
import { useAuthStore } from '@/store/auth'
import { usePageMeta } from '@/hooks/use-page-meta'
import AppShell from '@/components/layout/AppShell'
import AdminLayout from '@/components/admin/AdminLayout'

// Dynamic imports for code splitting and performance
const HomePage = dynamic(() => import('@/components/home/HomePage'))
const SocialLoginPage = dynamic(() => import('@/components/auth/SocialLoginPage'))
const ClassDetailPage = dynamic(() => import('@/components/classes/ClassDetailPage'))
const SubjectDetailPage = dynamic(() => import('@/components/classes/SubjectDetailPage'))
const ChapterDetailPage = dynamic(() => import('@/components/classes/ChapterDetailPage'))
const LectureListPage = dynamic(() => import('@/components/lecture/LectureListPage'))
const LectureViewerPage = dynamic(() => import('@/components/lecture/LectureViewerPage'))
const MCQPracticePage = dynamic(() => import('@/components/mcq/MCQPracticePage'))
const MCQExamPage = dynamic(() => import('@/components/mcq/MCQExamPage'))
const MCQResultPage = dynamic(() => import('@/components/mcq/MCQResultPage'))
const CQViewerPage = dynamic(() => import('@/components/cq/CQViewerPage'))
const CQListPage = dynamic(() => import('@/components/cq/CQListPage'))
const BoardQuestionsPage = dynamic(() => import('@/components/board/BoardQuestionsPage'))
const NoticesPage = dynamic(() => import('@/components/notice/NoticesPage'))
const NoticeDetailPage = dynamic(() => import('@/components/notice/NoticeDetailPage'))
const SuggestionsPage = dynamic(() => import('@/components/suggestion/SuggestionsPage'))
const SuggestionDetailPage = dynamic(() => import('@/components/suggestion/SuggestionDetailPage'))
const PremiumPage = dynamic(() => import('@/components/premium/PremiumPage'))
const SearchResultsPage = dynamic(() => import('@/components/search/SearchResultsPage'))
const PaymentPage = dynamic(() => import('@/components/payment/PaymentPage'))
const UserDashboardPage = dynamic(() => import('@/components/user/UserDashboardPage'))
const UserExamListPage = dynamic(() => import('@/components/exam/UserExamListPage'))
const MCQExamPackageListPage = dynamic(() => import('@/components/exam/MCQExamPackageListPage'))
const MCQExamPackageDetailPage = dynamic(() => import('@/components/exam/MCQExamPackageDetailPage'))
const MCQExamHistoryPage = dynamic(() => import('@/components/exam/MCQExamHistoryPage'))
const CQExamPackageListPage = dynamic(() => import('@/components/cq-exam/CQExamPackageListPage'))
const CQExamPackageDetailPage = dynamic(() => import('@/components/cq-exam/CQExamPackageDetailPage'))
const CQExamViewerPage = dynamic(() => import('@/components/cq-exam/CQExamViewerPage'))
const CQExamResultPage = dynamic(() => import('@/components/cq-exam/CQExamResultPage'))
const KnowledgeQuestionsPage = dynamic(() => import('@/components/knowledge/KnowledgeQuestionsPage'))

function RouteRenderer() {
  usePageMeta()
  const { currentRoute } = useRouterStore()

  // Admin routes use their own layout
  if (isAdminRoute(currentRoute)) {
    return <AdminLayout />
  }

  // Map routes to components
  const routeMap: Partial<Record<RoutePath, React.ReactNode>> = {
    'home': <HomePage />,
    'login': <SocialLoginPage />,
    'register': <SocialLoginPage />,
    'class-list': <HomePage />, // shows class section
    'class-detail': <ClassDetailPage />,
    'subject-detail': <SubjectDetailPage />,
    'chapter-detail': <ChapterDetailPage />,
    'lecture-list': <LectureListPage />,
    'lecture-viewer': <LectureViewerPage />,
    'mcq-practice': <MCQPracticePage />,
    'mcq-exam': <MCQExamPage />,
    'mcq-result': <MCQResultPage />,
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
  }

  return routeMap[currentRoute] || <HomePage />
}

export default function Home() {
  return (
    <AppShell>
      <RouteRenderer />
    </AppShell>
  )
}
