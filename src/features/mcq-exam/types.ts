export interface ClassCategory {
  id: string
  name: string
  slug: string
}

export interface SubjectOption {
  id: string
  name: string
  slug: string
}

export interface MCQExamPackageRecord {
  id: string
  title: string
  description: string | null
  classId: string
  class: ClassCategory
  subjectIds: string[]
  price: number
  originalPrice: number
  isPremium: boolean
  thumbnail: string | null
  totalSets: number
  status: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  _count?: {
    examSets: number
    purchases: number
  }
}

export interface MCQExamSetRecord {
  id: string
  packageId: string
  title: string
  description: string | null
  scheduledDate: string
  startTime: string
  endTime: string
  duration: number
  marksPerQ: number
  negativeMarks: number
  totalMarks: number
  totalQuestions: number
  instructions: string | null
  allowRetake: boolean
  status: string
  order: number
  createdAt: string
  updatedAt: string
  _count?: {
    questions: number
    results: number
  }
}

export interface MCQExamSetQuestionRecord {
  id: string
  setId: string
  mcqId: string
  marks: number
  order: number
  mcq: {
    id: string
    question: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctAnswer: string
    questionImage: string | null
    difficulty: string
    classLevel: string
    subjectId: string
    chapterId: string
  }
}

export interface MCQSearchResult {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  questionImage: string | null
  difficulty: string
  classLevel: string
  subjectId: string
  chapterId: string
  chapter: { id: string; name: string }
  subjectName: string | null
}

export interface MCQExamSetResultRecord {
  id: string
  userId: string
  setId: string
  answers: Record<string, string>
  totalCorrect: number
  totalWrong: number
  totalSkipped: number
  marksObtained: number
  totalMarks: number
  timeTaken: number
  startedAt: string | null
  submittedAt: string | null
  status: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    classLevel: string | null
  }
}

export interface MCQExamRetakeRequestRecord {
  id: string
  userId: string
  setId: string
  reason: string | null
  status: string
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    classLevel: string | null
  }
  set: {
    id: string
    title: string
  }
}

export type ViewMode = 'list' | 'editor' | 'detail' | 'set-editor' | 'question-manager' | 'results' | 'leaderboard' | 'retake-requests'
