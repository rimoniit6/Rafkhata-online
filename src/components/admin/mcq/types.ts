export interface MCQRecord {
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
  explanation?: string
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
  tags?: string
  isActive: boolean
  chapter?: { id: string; name: string }
}

export interface MCQFormData {
  question: string
  questionImage: string
  optionA: string
  optionAImage: string
  optionB: string
  optionBImage: string
  optionC: string
  optionCImage: string
  optionD: string
  optionDImage: string
  correctAnswer: string
  explanation: string
  explanationImage: string
  classId: string
  subjectId: string
  chapterId: string
  board: string
  year: string
  topic: string
  difficulty: string
  isPremium: boolean
  price: string
  tags: string
}

export interface ClassItem {
  id: string; name: string; slug: string
}

export interface SubjectItem {
  id: string; name: string; slug: string; classId: string
}

export interface ChapterItem {
  id: string; name: string; slug: string; subjectId: string
}

export type ViewMode = 'list' | 'editor'
export type StepNumber = 1 | 2 | 3
