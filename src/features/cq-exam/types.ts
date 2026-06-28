import type { Annotation } from '@/components/ui/image-annotator'

export interface CQExamPackageRecord {
  id: string
  title: string
  description: string | null
  classId: string
  class: { id: string; name: string; slug: string }
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

export interface CQExamSetRecord {
  id: string
  packageId: string
  title: string
  description: string | null
  scheduledDate: string
  startTime: string
  endTime: string
  duration: number
  marksPerQ: number
  totalMarks: number
  totalQuestions: number
  instructions: string | null
  status: string
  allowRetake: boolean
  answerMode: string
  showAnnotatedImages: boolean
  autoPublishResults: boolean
  maxImagesPerAnswer: number
  gradingDeadline: string | null
  passMarks: number
  showCorrectAnswers: boolean
  enablePartialGrading: boolean
  order: number
  createdAt: string
  updatedAt: string
  _count?: {
    questions: number
    submissions: number
  }
  questions?: CQExamSetQuestionRecord[]
}

export interface CQExamSetQuestionRecord {
  id: string
  setId: string
  cqId: string | null
  marks: number
  order: number
  type: string
  subMarks: number[] | null
  stem: string | null
  stemImage: string | null
  config: Record<string, unknown> | null
  typedUddeepok: string | null
  typedUddeepokImage: string | null
  typedQuestion1: string | null
  typedQuestion1Image: string | null
  typedQuestion2: string | null
  typedQuestion2Image: string | null
  typedQuestion3: string | null
  typedQuestion3Image: string | null
  typedQuestion4: string | null
  typedQuestion4Image: string | null
  cq: {
    id: string
    uddeepok: string
    uddeepokImage: string | null
    question1: string
    question1Image: string | null
    question2: string
    question2Image: string | null
    question3: string
    question3Image: string | null
    question4: string
    question4Image: string | null
    answer1: string
    answer1Image: string | null
    answer2: string
    answer2Image: string | null
    answer3: string
    answer3Image: string | null
    answer4: string
    answer4Image: string | null
    classLevel: string
    subjectId: string
    chapterId: string
    chapter?: { id: string; name: string }
  } | null
}

export interface CQSearchResult {
  id: string
  uddeepok: string
  question1: string
  classLevel: string
  subjectId: string
  chapterId: string
  chapter: { id: string; name: string }
  subjectName: string | null
  difficulty: string
}

export interface CQExamSubmissionRecord {
  id: string
  userId: string
  setId: string
  totalMarks: number
  obtainedMarks: number
  timeTaken: number
  status: string
  canRetake: boolean
  startedAt: string | null
  submittedAt: string | null
  gradedAt: string | null
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    classLevel: string | null
  }
  answers: CQExamAnswerRecord[]
}

export interface CQExamAnswerRecord {
  id: string
  submissionId: string
  questionId: string
  subIndex: number
  answerText: string | null
  obtainedMarks: number
  maxMarks: number
  feedback: string | null
  gradedAt: string | null
  images: CQExamAnswerImageRecord[]
}

export interface CQExamAnswerImageRecord {
  id: string
  answerId: string
  imageUrl: string
  annotations: Annotation[] | null
  order: number
}

export interface CQExamRetakeRequestRecord {
  id: string
  userId: string
  setId: string
  reason: string | null
  status: string // pending, approved, rejected
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

export type ViewMode = 'list' | 'package-editor' | 'package-detail' | 'set-editor' | 'question-manager' | 'create-question' | 'submissions' | 'grading' | 'bulk-grading' | 'leaderboard' | 'retake-requests'
