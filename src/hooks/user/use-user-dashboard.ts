import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthUser } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { api } from '@/lib/api-client'
import { bookmarkService, type BookmarkItem } from '@/services/api/bookmark.service'
import { 
  DashboardData, 
  DetailedPayment, 
  SubscriptionData, 
  BookmarkData, 
  RecentlyViewedItem,
  BundleItemData
} from '@/types/user-dashboard'
import { getPurchaseCategory } from '@/components/user/dashboard/DashboardConstants'

export function useUserDashboard() {
  const user = useAuthUser()
  const navigate = useRouterStore((s) => s.navigate)
  
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [payments, setPayments] = useState<DetailedPayment[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('purchased')
  
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false)
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null)
  const [selectedBundleTitle, setSelectedBundleTitle] = useState('')
  const [bundleItems, setBundleItems] = useState<BundleItemData[]>([])
  const [loadingBundleItems, setLoadingBundleItems] = useState(false)
  
  const [realBookmarks, setRealBookmarks] = useState<BookmarkData[]>([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [realRecentlyViewed, setRealRecentlyViewed] = useState<RecentlyViewedItem[]>([])
  
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editMobile, setEditMobile] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)

  const fetchPayments = useCallback(async () => {
    if (!user?.id) return
    setLoadingPayments(true)
    try {
      const [paymentsData, subsData] = await Promise.all([
        api.get<DetailedPayment[] | { payments?: DetailedPayment[] }>(
          'user/payments',
          undefined,
          { retries: 1, retryDelay: 1500 }  // idempotent GET — safe to retry
        ),
        api.get<{ subscriptions: SubscriptionData[]; activeCount: number; expiringSoon: { id: string; daysRemaining: number }[] }>('user/subscriptions'),
      ])
      setPayments(Array.isArray(paymentsData) ? paymentsData : paymentsData?.payments || [])
      setSubscriptions(subsData?.subscriptions || [])
    } catch (err) {
      console.error('[useUserDashboard] Failed to fetch payments:', err)
    } finally {
      setLoadingPayments(false)
    }
  }, [user?.id])

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const response = await api.get<DashboardData>('user/dashboard')
      setDashboardData(response)
    } catch {
      setDashboardData({
        stats: { completedLectures: 0, totalLectures: 0, avgMcqScore: 0, savedQuestions: 0, isPremium: false, premiumExpiry: null },
        recentExams: [],
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchBookmarksAndRecent = useCallback(async () => {
    if (!user?.id) return
    setLoadingBookmarks(true)
    try {
      const [bookmarksJson, recentJson] = await Promise.all([
        bookmarkService.list({ limit: 50 }),
        api.get<{ items: RecentlyViewedItem[] }>('recently-viewed', { limit: 10 }),
      ])
      const rawBookmarks: BookmarkItem[] = bookmarksJson?.bookmarks || []
      setRealBookmarks(rawBookmarks.map((b) => ({
        id: b.id,
        contentId: b.contentId,
        contentType: b.contentType,
        contentTitle: b.title || '',
        createdAt: b.createdAt,
      })))
      setRealRecentlyViewed(recentJson.items || [])
    } catch (err) {
      console.error('[useUserDashboard] Failed to fetch bookmarks:', err)
    } finally {
      setLoadingBookmarks(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
    fetchPayments()
    fetchBookmarksAndRecent()
  }, [fetchData, fetchPayments, fetchBookmarksAndRecent])

  const navigateToContent = useCallback((contentType: string, contentId: string) => {
    switch (contentType) {
      case 'mcq':
      case 'board-mcq':
        navigate('board-questions', { mcqId: contentId })
        break
      case 'cq':
      case 'board-cq':
        navigate('cq-viewer', { cqId: contentId })
        break
      case 'lecture':
        navigate('lecture-viewer', { lectureId: contentId })
        break
      case 'suggestion':
        navigate('suggestion-detail', { suggestionId: contentId })
        break
      case 'bundle':
        setSelectedBundleId(contentId)
        setSelectedBundleTitle('')
        setBundleDialogOpen(true)
        break
      case 'exam':
        navigate('exam-session', { examId: contentId })
        break
      case 'mcq-exam-package':
        navigate('mcq-exam-package-detail', { packageId: contentId })
        break
      default:
        if (contentId) navigate('home')
        break
    }
  }, [navigate])

  const fetchBundleItems = useCallback(async () => {
    if (!bundleDialogOpen || !selectedBundleId) return
    setLoadingBundleItems(true)
    try {
      const data = await api.get<{ items: BundleItemData[]; title: string }>(`bundles/${selectedBundleId}`)
      setSelectedBundleTitle(data.title || 'বান্ডেল')
      setBundleItems(data.items || [])
    } catch {
      setBundleItems([])
    } finally {
      setLoadingBundleItems(false)
    }
  }, [bundleDialogOpen, selectedBundleId])

  useEffect(() => { fetchBundleItems() }, [fetchBundleItems])

  const handleEditProfile = useCallback(async () => {
    if (!user?.id) return
    setUpdatingProfile(true)
    try {
      await api.patch('user/profile', { name: editName, phone: editMobile })
      window.location.reload()
    } catch (err) {
      console.error('[useUserDashboard] Failed to update profile:', err)
    } finally {
      setUpdatingProfile(false)
    }
  }, [user?.id, editName, editMobile])

  const openEditProfile = useCallback(() => {
    setEditName(user?.name || '')
    setEditMobile((user as any)?.phone || (user as any)?.mobile || '')
    setEditProfileOpen(true)
  }, [user])

  const deleteBookmark = useCallback(async (contentId: string, contentType: string) => {
    try {
      await bookmarkService.remove(contentId, contentType)
      setRealBookmarks(prev => prev.filter(b => !(b.contentId === contentId && b.contentType === contentType)))
    } catch { /* ignore */ }
  }, [])

  const categorizedPayments = useMemo(() => {
    const approved = payments.filter(p => p.status === 'approved')
    return {
      approvedPayments: approved,
      subscriptionPayments: approved.filter(p => getPurchaseCategory(p.contentType) === 'subscription'),
      bundlePayments: approved.filter(p => getPurchaseCategory(p.contentType) === 'bundle'),
      individualPayments: approved.filter(p => getPurchaseCategory(p.contentType) === 'individual'),
      pendingPayments: payments.filter(p => p.status === 'pending'),
      rejectedPayments: payments.filter(p => p.status === 'rejected'),
    }
  }, [payments])

  const subscriptionStatus = useMemo(() => ({
    activeSubscriptions: subscriptions.filter(s => s.isActive && !s.isExpired),
    expiredSubscriptions: subscriptions.filter(s => s.isExpired),
  }), [subscriptions])

  return {
    user,
    loading,
    dashboardData,
    payments,
    subscriptions,
    loadingPayments,
    activeTab,
    setActiveTab,
    bundleDialogOpen,
    setBundleDialogOpen,
    selectedBundleTitle,
    bundleItems,
    loadingBundleItems,
    realBookmarks,
    loadingBookmarks,
    realRecentlyViewed,
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
    ...categorizedPayments,
    ...subscriptionStatus
  }
}
