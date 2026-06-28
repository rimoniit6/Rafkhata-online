export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  error?: string
  code?: string
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface MCQ {
  id: string
  question: string
  questionImage?: string | null
  optionA: string
  optionAImage?: string | null
  optionB: string
  optionBImage?: string | null
  optionC: string
  optionCImage?: string | null
  optionD: string
  optionDImage?: string | null
  correctAnswer: string
  explanation?: string | null
  explanationImage?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  board?: string | null
  year?: string | null
  topic?: string | null
  difficulty: string
  isPremium: boolean
  price: number
  isActive: boolean
  tags?: string | null
  createdAt: string
  chapter?: { id: string; name: string; slug: string }
}

export interface CQ {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  question1: string
  question1Image?: string | null
  question2: string
  question2Image?: string | null
  question3: string
  question3Image?: string | null
  question4: string
  question4Image?: string | null
  answer1: string
  answer1Image?: string | null
  answer2: string
  answer2Image?: string | null
  answer3: string
  answer3Image?: string | null
  answer4: string
  answer4Image?: string | null
  chapterId: string
  classLevel: string
  subjectId: string
  board?: string | null
  year?: string | null
  topic?: string | null
  difficulty: string
  isPremium: boolean
  price: number
  isActive: boolean
  tags?: string | null
  createdAt: string
  chapter?: { id: string; name: string; slug: string }
}

export interface Lecture {
  id: string
  title: string
  content?: string | null
  videoUrl?: string | null
  pdfUrl?: string | null
  chapterId?: string
  isPremium?: boolean
  price?: number
  duration?: number | null
  order?: number
  chapterName?: string
  subjectName?: string
  className?: string
  classSlug?: string
  subjectId?: string
  isActive?: boolean
  thumbnail?: string | null
  createdAt?: string
}

export interface UserRecord {
  id: string
  name: string | null
  email: string
  role: string
  isPremium: boolean
  createdAt: string
  image?: string | null
}

export interface ClassItem {
  id: string
  name: string
  slug: string
  order: number
  icon?: string | null
  color?: string | null
  description?: string | null
  isActive: boolean
  _count?: { subjects: number }
}

export interface SubjectItem {
  id: string
  name: string
  slug: string
  classId: string
  order: number
  icon?: string | null
  color?: string | null
  description?: string | null
  isActive: boolean
  class?: { id: string; name: string; slug: string }
  _count?: { chapters: number }
}

export interface ChapterItem {
  id: string
  name: string
  slug: string
  subjectId: string
  order: number
  description?: string | null
  isActive: boolean
  subject?: { id: string; name: string; slug: string; classId: string }
  _count?: { lectures: number; mcqs: number; cqs: number }
}

export interface BoardItem {
  id: string
  name: string
  slug: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface BannerItem {
  id: string
  title: string
  subtitle?: string | null
  image?: string | null
  link?: string | null
  buttonText?: string | null
  isActive: boolean
  order: number
  startDate?: string | null
  endDate?: string | null
  createdAt: string
}

export interface TestimonialItem {
  id: string
  name: string
  role?: string | null
  content: string
  rating: number
  image?: string | null
  isActive: boolean
  order: number
  createdAt: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string | null
  order: number
  isActive: boolean
  createdAt: string
}

export interface DashboardStats {
  users: { total: number; students: number; premium: number; today: number }
  content: { mcqs: number; cqs: number; lectures: number; classes: number; subjects: number; chapters: number }
  payments: { total: number; pending: number; approved: number; totalRevenue: number }
  recentPayments: Array<{
    id: string; amount: number; method: string; status: string; createdAt: string
    user: { id: string; name: string; email: string }
  }>
  monthlyRevenue: Record<string, number>
}
