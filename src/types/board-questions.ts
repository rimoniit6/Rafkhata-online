export interface BoardQuestionItem {
  id: string
  type: 'mcq' | 'cq'
  board: string
  year: string
  classLevel: string
  subjectId: string
  subjectName: string
  chapterId: string
  chapterName: string
  title: string
  question: string
  questionImage?: string | null
  // MCQ fields
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  optionAImage?: string | null
  optionBImage?: string | null
  optionCImage?: string | null
  optionDImage?: string | null
  correctAnswer?: string
  explanation?: string
  explanationImage?: string | null
  // CQ fields
  question1?: string
  question1Image?: string | null
  question2?: string
  question2Image?: string | null
  question3?: string
  question3Image?: string | null
  question4?: string
  question4Image?: string | null
  answer1?: string
  answer1Image?: string | null
  answer2?: string
  answer2Image?: string | null
  answer3?: string
  answer3Image?: string | null
  answer4?: string
  answer4Image?: string | null
  isPremium: boolean
  price: number
  difficulty: string
  questionCount: number
  boardColor: string
  isBookmarked?: boolean
  isAttempted?: boolean
}

export interface BoardQuestionFilters {
  searchQuery: string
  classLevels: string[]
  boards: string[]
  years: string[]
  subjects: string[]
  chapters: string[]
  questionTypes: string[]
  difficulty: string[]
  topics: string[]
  status: string[]
  contentAccess: 'all' | 'free' | 'premium' | 'unlocked'
  sortBy: 'year_desc' | 'year_asc' | 'popularity' | 'recently_viewed'
}

export interface FilterOption {
  value: string
  label: string
  count?: number
  disabled?: boolean
}

export interface FilterSection {
  id: keyof BoardQuestionFilters
  label: string
  icon?: string
  multi: boolean
  searchable: boolean
  options: FilterOption[]
}

export interface FilterChip {
  key: string
  value: string
  label: string
  onRemove: () => void
}

export interface AnalyticsData {
  totalQuestions: number
  accessibleQuestions: number
  premiumQuestions: number
  unlockedQuestions: number
  availableBoards: number
  availableSubjects: number
  availableChapters: number
  questionsPracticed: number
  questionsRemaining: number
  accuracyRate: number
}

export interface BoardQuestionsResponse {
  data: BoardQuestionItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  analytics: AnalyticsData
}

export interface SearchSuggestion {
  text: string
  type: 'subject' | 'board' | 'chapter' | 'year' | 'question'
  icon?: string
}

export type PurchaseStatusType = 'free' | 'purchased' | 'pending' | 'locked'

export interface PurchaseStatus {
  purchased: boolean
  pendingPayment: boolean
  reason?: string | null
}

/** Package info for conversion display */
export interface PackageOffer {
  id: string
  title: string
  slug: string
  price: number
  originalPrice: number
  discount: number
  duration: number
  durationLabel: string
  type: 'package'
}

/** Bundle info for conversion display */
export interface BundleOffer {
  id: string
  title: string
  slug: string
  price: number
  originalPrice: number
  discount: number
  type: 'bundle'
  description?: string | null
  thumbnail?: string | null
}

/** Access status for a single question */
export interface AccessStatus {
  questionId: string
  accessType: PurchaseStatusType
  purchaseReason: string | null
  // If locked, what packages/bundles can unlock it
  packages?: PackageOffer[]
  bundles?: BundleOffer[]
}
