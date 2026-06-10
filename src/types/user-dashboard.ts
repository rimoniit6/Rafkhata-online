export interface RecentLecture {
  id: string
  title: string
  subject: string
  chapter?: string
  progress: number
  viewedAt?: string
}

export interface ExamResultData {
  id: string
  subject: string
  score: number
  total: number
  date: string
}

export interface DetailedPayment {
  id: string
  contentType: string
  contentId: string
  contentTitle: string
  amount: number
  method: string
  transactionId: string
  status: string
  adminNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface BundleItemData {
  id: string
  contentType: string
  contentId: string
  contentTitle: string | null
  contentPrice: number
  order: number
}

export interface SubscriptionData {
  id: string
  packageId: string
  packageName: string
  packageThumbnail: string | null
  durationLabel: string
  classLevel: string
  classLabel: string
  startDate: string
  endDate: string
  isActive: boolean
  isExpired: boolean
  daysRemaining: number
  paymentId: string | null
}

export interface DashboardData {
  stats: {
    completedLectures: number
    totalLectures: number
    avgMcqScore: number
    savedQuestions: number
    isPremium: boolean
    premiumExpiry: string | null
  }
  recentLectures: RecentLecture[]
  recentExams: ExamResultData[]
  bookmarkedQuestions: { id: string; text: string; type: 'mcq' | 'cq' }[]
  paymentHistory: { id: string; planName: string; amount: number; date: string; status: 'completed' | 'pending' | 'failed' }[]
}

export interface BookmarkData {
  id: string
  contentId: string
  contentType: string
  contentTitle: string
  createdAt: string
}

export interface RecentlyViewedItem {
  id: string
  contentId: string
  contentType: string
  title: string
  viewedAt: string
}
