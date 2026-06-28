'use client'

import { useEffect, useState } from 'react'
import {
  Clock, Crown, Package, ShoppingBag, Sparkles, Timer, Play, Trophy, Bookmark, CreditCard, MessageSquareText
} from 'lucide-react'
import { useRouterStore } from '@/store/router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useUserDashboard } from '@/hooks/user/use-user-dashboard'
import { api } from '@/lib/api-client'
import type { RecentLecture } from '@/types/user-dashboard'

// Import sub-components
import { StatCards } from './dashboard/StatCards'
import { PurchasedContent } from './dashboard/PurchasedContent'
import { LearningSection } from './dashboard/LearningSection'
import { ExamsSection } from './dashboard/ExamsSection'
import { BookmarksSection } from './dashboard/BookmarksSection'
import { PaymentHistory } from './dashboard/PaymentHistory'
import { BundleDetailDialog } from './dashboard/BundleDetailDialog'
import { EditProfileDialog } from './dashboard/EditProfileDialog'
import FeedbackSection from './dashboard/FeedbackSection'

export default function UserDashboardPage() {
  const { navigate } = useRouterStore()
  const {
    user,
    loading,
    dashboardData,
    activeTab,
    setActiveTab,
    bundleDialogOpen,
    setBundleDialogOpen,
    selectedBundleTitle,
    bundleItems,
    loadingBundleItems,
    realBookmarks,
    editProfileOpen,
    setEditProfileOpen,
    editName,
    setEditName,
    editMobile,
    setEditMobile,
    updatingProfile,
    navigateToContent,
    handleEditProfile,
    openEditProfile,
    deleteBookmark,
    approvedPayments,
    subscriptionPayments,
    bundlePayments,
    individualPayments,
    pendingPayments,
    rejectedPayments,
    activeSubscriptions,
    loadingPayments,
    payments,
  } = useUserDashboard()

  const [recentLectures, setRecentLectures] = useState<RecentLecture[]>([])

  useEffect(() => {
    api.get<RecentLecture[]>('user/recent-lectures')
      .then(d => setRecentLectures(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/20 dark:to-background">
        <div className="h-36 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
        <div className="max-w-5xl mx-auto px-4 -mt-20">
          <Skeleton className="h-28 rounded-2xl mb-6 bg-white/80 dark:bg-white/5 backdrop-blur-sm" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { stats, recentExams } = dashboardData
  const bookmarkedQuestions = realBookmarks.map(b => ({
    id: b.id,
    contentId: b.contentId,
    text: b.contentTitle,
    type: b.contentType,
  }))
  
  // recentLectures now comes from the enriched API fetch above

  const userName = user?.name || 'শিক্ষার্থী'
  const userInitials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-background dark:from-emerald-950/10 dark:to-background">
      {/* ═══════════════════ Hero Profile Section ═══════════════════ */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-400/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-white/20 rounded-full blur-md" />
              <Avatar className="size-18 sm:size-22 border-3 border-white/40 relative backdrop-blur-sm" style={{ width: '4.5rem', height: '4.5rem' }}>
                <AvatarFallback className="bg-white/25 text-white text-xl sm:text-2xl font-bold backdrop-blur-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0.5 right-0.5 size-4 bg-emerald-300 rounded-full border-2 border-white/50 shadow-lg shadow-emerald-400/50" />
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl font-bold text-white tracking-tight animate-fade-in"
              >
                স্বাগতম, {userName}!
              </h1>
              <p
                className="text-emerald-100/80 text-sm mt-0.5 flex items-center gap-2 animate-fade-in delay-100"
              >
                আপনার শিক্ষা যাত্রা চলুক
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                  onClick={openEditProfile}
                >
                  <Sparkles className="size-3 mr-1" />
                  এডিট
                </Button>
              </p>
              <div
                className="flex items-center gap-2 mt-2.5 flex-wrap animate-fade-in-up delay-200"
              >
                {activeSubscriptions.length > 0 && (
                  <Badge className="bg-purple-500/30 text-purple-100 gap-1.5 border-purple-400/20 backdrop-blur-sm hover:bg-purple-500/40 transition-colors">
                    <Crown className="size-3" />
                    {activeSubscriptions.length}টি সাবস্ক্রিপশন
                  </Badge>
                )}
                {bundlePayments.length > 0 && (
                  <Badge className="bg-teal-500/30 text-teal-100 gap-1.5 border-teal-400/20 backdrop-blur-sm hover:bg-teal-500/40 transition-colors">
                    <Package className="size-3" />
                    {bundlePayments.length}টি বান্ডেল
                  </Badge>
                )}
                {individualPayments.length > 0 && (
                  <Badge className="bg-white/20 text-white gap-1.5 border-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
                    <ShoppingBag className="size-3" />
                    {individualPayments.length}টি কেনা
                  </Badge>
                )}
                {pendingPayments.length > 0 && (
                  <Badge className="bg-amber-500/30 text-amber-100 gap-1.5 border-amber-400/20 backdrop-blur-sm hover:bg-amber-500/40 transition-colors">
                    <Clock className="size-3" />
                    {pendingPayments.length}টি অপেক্ষমাণ
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40V20C240 0 480 0 720 20C960 40 1200 40 1440 20V40H0Z" className="fill-emerald-50/30 dark:fill-emerald-950/10" />
          </svg>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4 relative z-20 pb-10">
        <StatCards
          stats={stats}
          approvedPaymentsCount={approvedPayments.length}
          onPurchasedClick={() => setActiveTab('purchased')}
        />

        {/* Active Subscription Banner */}
        {activeSubscriptions.length > 0 && (
          <div
            className="mb-8 animate-fade-in-up delay-300"
          >
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700">
              <CardContent className="p-5 sm:p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm shrink-0">
                    <Crown className="size-6 text-yellow-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      সাবস্ক্রিপশন সচল
                      <Badge className="bg-yellow-400/20 text-yellow-200 border-yellow-400/30 gap-1 text-xs">
                        <Sparkles className="size-3" />
                        PREMIUM
                      </Badge>
                    </h3>
                    <p className="text-purple-100/80 text-sm mt-1">
                      {activeSubscriptions.map(s => s.packageName).join(', ')}
                    </p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {activeSubscriptions.map(sub => (
                        <div key={sub.id} className="flex items-center gap-2 text-sm">
                          <Badge className="bg-white/15 text-white border-white/20 gap-1 text-xs backdrop-blur-sm">
                            <Timer className="size-3" />
                            {sub.daysRemaining > 0 ? `${sub.daysRemaining} দিন বাকি` : 'শেষ হচ্ছে'}
                          </Badge>
                          <span className="text-purple-200/70 text-xs">{sub.classLabel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto flex-wrap bg-muted/50 p-1 gap-0.5">
            <TabsTrigger value="purchased" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:shadow-emerald-500/20">
              <ShoppingBag className="size-4" />
              কেনা কন্টেন্ট
            </TabsTrigger>
            <TabsTrigger value="learning" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:shadow-emerald-500/20">
              <Play className="size-4" />
              লেখাপড়া
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:shadow-emerald-500/20">
              <Trophy className="size-4" />
              পরীক্ষা
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:shadow-emerald-500/20">
              <Bookmark className="size-4" />
              সেভ
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:shadow-emerald-500/20">
              <CreditCard className="size-4" />
              পেমেন্ট
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:shadow-emerald-500/20">
              <MessageSquareText className="size-4" />
              ফিডব্যাক
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchased">
            <PurchasedContent
              loading={loadingPayments}
              approvedPayments={approvedPayments}
              subscriptionPayments={subscriptionPayments}
              bundlePayments={bundlePayments}
              individualPayments={individualPayments}
              activeSubscriptions={activeSubscriptions}
              onNavigate={navigateToContent}
              onExplore={() => navigate('home')}
            />
          </TabsContent>

          <TabsContent value="learning">
            <LearningSection
              recentLectures={recentLectures}
              onNavigate={navigateToContent}
            />
          </TabsContent>

          <TabsContent value="exams">
            <ExamsSection
              recentExams={recentExams}
              onHistoryClick={() => navigate('mcq-exam-history')}
              onResultClick={(resultId) => navigate('exam-result', { resultId })}
            />
          </TabsContent>

          <TabsContent value="bookmarks">
            <BookmarksSection
              bookmarkedQuestions={bookmarkedQuestions}
              onNavigate={navigateToContent}
              onDelete={deleteBookmark}
              onExplore={() => navigate('home')}
            />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentHistory
              payments={payments}
              approvedPaymentsCount={approvedPayments.length}
              pendingPaymentsCount={pendingPayments.length}
              rejectedPaymentsCount={rejectedPayments.length}
            />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackSection />
          </TabsContent>
        </Tabs>
      </div>

      <BundleDetailDialog
        open={bundleDialogOpen}
        onOpenChange={setBundleDialogOpen}
        title={selectedBundleTitle}
        items={bundleItems}
        loading={loadingBundleItems}
        onNavigate={navigateToContent}
      />

      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        name={editName}
        setName={setEditName}
        mobile={editMobile}
        setMobile={setEditMobile}
        loading={updatingProfile}
        onSave={handleEditProfile}
      />
    </div>
  )
}
