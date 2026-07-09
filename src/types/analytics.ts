export interface AnalyticsRevenue {
  totalRevenue: number
  revenueToday: number
  revenueYesterday: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueGrowth: number
  averageOrderValue: number
  revenuePerStudent: number
  revenueByCourse: Array<{ id: string; title: string; revenue: number; count: number }>
  revenueByLecture: Array<{ id: string; title: string; revenue: number; count: number }>
  revenueByBundle: Array<{ id: string; title: string; revenue: number; count: number }>
  revenueByExam: Array<{ id: string; title: string; revenue: number; count: number }>
  revenueBySuggestion: Array<{ id: string; title: string; revenue: number; count: number }>
  revenueByMethod: Array<{ method: string; revenue: number; count: number }>
  pendingRevenue: number
  approvedRevenue: number
  rejectedAmount: number
  refunds: number
  dailyRevenue: Array<{ date: string; revenue: number }>
  monthlyRevenue: Array<{ month: string; revenue: number }>
  revenueTrend: Array<{ date: string; revenue: number; movingAvg: number }>
  revenueForecast: Array<{ month: string; predicted: number; lower: number; upper: number }>
  topSources: Array<{ source: string; revenue: number; percentage: number }>
  heatmap: Array<{ day: string; hour: number; revenue: number }>
}

export interface AnalyticsStudents {
  totalStudents: number
  newStudents: number
  returningStudents: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  averageStudyTime: number
  averageSessionDuration: number
  mostActiveTime: string
  mostActiveDay: string
  mostActiveClass: string
  mostActiveSubject: string
  mostActiveChapter: string
  studentGrowthRate: number
  studentLifetimeValue: number
  engagementScore: number
  dau: Array<{ date: string; count: number }>
  wau: Array<{ week: string; count: number }>
  mau: Array<{ month: string; count: number }>
  retentionCurve: Array<{ day: number; rate: number }>
  growth: Array<{ month: string; students: number; newStudents: number }>
}

export interface RetentionData {
  day1: number
  day7: number
  day14: number
  day30: number
  day60: number
  day90: number
  returnedStudents: number
  lostStudents: number
  churnRate: number
  reactivatedUsers: number
  retentionPercent: number
  cohorts: Array<{ cohort: string; periods: Array<{ period: string; rate: number }> }>
  retentionHeatmap: Array<{ cohort: string; period: string; rate: number }>
}

export interface ConversionFunnel {
  steps: Array<{
    name: string
    count: number
    conversionRate: number
    dropRate: number
  }>
  totalVisitors: number
  totalSignups: number
  totalVerified: number
  totalFirstLogin: number
  totalFirstLecture: number
  totalFirstMcq: number
  totalFirstPurchase: number
  totalCourseCompleted: number
  totalCertificates: number
}

export interface DropOffData {
  exitAfterLogin: { rate: number; avgTime: number }
  exitAfterLecture: { rate: number; avgTime: number }
  exitBeforePurchase: { rate: number; avgTime: number }
  exitDuringPayment: { rate: number; avgTime: number }
  exitDuringExam: { rate: number; avgTime: number }
  exitBeforeCompletion: { rate: number; avgTime: number }
  suggestions: Array<{ stage: string; reason: string; improvement: string }>
}

export interface CourseAnalytics {
  mostPopular: { id: string; title: string; enrollments: number }
  leastPopular: { id: string; title: string; enrollments: number }
  highestRevenue: { id: string; title: string; revenue: number }
  highestCompletion: { id: string; title: string; rate: number }
  lowestCompletion: { id: string; title: string; rate: number }
  averageProgress: number
  enrollmentTrend: Array<{ date: string; count: number }>
  completionTrend: Array<{ date: string; count: number }>
  averageRating: number
  revenuePerCourse: Array<{ id: string; title: string; revenue: number; enrollments: number }>
}

export interface LectureAnalytics {
  mostViewed: { id: string; title: string; views: number }
  averageWatchTime: number
  completionPercent: number
  dropOffTime: number
  totalBookmarks: number
  totalNotes: number
  aiChatUsage: number
  totalDownloads: number
}

export interface McqAnalytics {
  questionsSolved: number
  accuracy: number
  wrongPercent: number
  correctPercent: number
  skippedPercent: number
  mostDifficult: { id: string; question: string; wrongRate: number }
  mostEasy: { id: string; question: string; correctRate: number }
  averageScore: number
}

export interface CqAnalytics {
  totalSubmissions: number
  averageMarks: number
  teacherReviewTime: number
  pendingReview: number
  passRate: number
  failRate: number
}

export interface PaymentAnalytics {
  dailyPurchases: Array<{ date: string; count: number; revenue: number }>
  pendingPayments: number
  approvedPayments: number
  rejectedPayments: number
  averagePurchase: number
  popularPaymentMethod: string
  conversionRate: number
}

export interface AcquisitionData {
  signupSource: Array<{ source: string; count: number; percentage: number }>
  googleLogin: number
  emailSignup: number
  referral: number
  organic: number
  campaign: number
}

export interface SearchAnalytics {
  mostSearched: Array<{ query: string; count: number }>
  noResultSearches: Array<{ query: string; count: number }>
  popularKeywords: Array<{ keyword: string; count: number }>
  trendingSearches: Array<{ query: string; count: number; growth: number }>
}

export interface DeviceAnalytics {
  desktop: number
  tablet: number
  mobile: number
  browsers: Array<{ browser: string; count: number; percentage: number }>
  os: Array<{ os: string; count: number; percentage: number }>
  screenResolutions: Array<{ resolution: string; count: number }>
}

export interface GeoAnalytics {
  countries: Array<{ country: string; count: number; percentage: number }>
  divisions: Array<{ division: string; count: number; percentage: number }>
  districts: Array<{ district: string; count: number; percentage: number }>
  timezones: Array<{ timezone: string; count: number }>
}

export interface RealtimeData {
  currentlyOnline: number
  livePurchases: number
  liveRegistrations: number
  livePayments: number
  liveEnrollments: number
  liveExams: number
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
}

export interface AiInsight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  title: string
  description: string
  metric: string
  change: number
  action?: string
}

export interface PredictionData {
  nextMonthRevenue: { predicted: number; lower: number; upper: number; confidence: number }
  expectedPurchases: number
  expectedSignups: number
  expectedChurn: number
  topFutureCourse: { id: string; title: string; score: number }
}

export interface AlertData {
  id: string
  name: string
  metric: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  value: number
  threshold: number
  triggeredAt: string
  enabled: boolean
}

export type AnalyticsSection =
  | 'revenue'
  | 'students'
  | 'retention'
  | 'conversion'
  | 'dropoff'
  | 'courses'
  | 'lectures'
  | 'mcq'
  | 'cq'
  | 'payments'
  | 'acquisition'
  | 'search'
  | 'devices'
  | 'geo'
  | 'realtime'
