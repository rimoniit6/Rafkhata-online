export interface CourseOverviewData {
  title: string
  slug: string
  description: string
  thumbnail: string
  teacherName: string
  classId: string
  subjectId: string
  isPremium: boolean
  price: number
  originalPrice?: number
  status: 'draft' | 'published'
  features: string
  requirements: string
  targetStudents: string
  hasCertificate: boolean
  duration: number | null
  language: string
  difficulty: string
}

export interface CourseLessonRecord {
  id: string
  courseId: string
  title: string
  description: string | null
  lessonType: string
  meetingLink: string | null
  meetingId: string | null
  platform: string | null
  password: string | null
  videoUrl: string | null
  previewVideo: string | null
  duration: number | null
  displayOrder: number
  assignments: LessonAssignmentRecord[]
  schedules: LessonScheduleRecord[]
  notes: LessonNoteRecord[]
  resources: LessonResourceRecord[]
}

export interface CourseExamScheduleRecord {
  id: string
  courseId: string
  examType: 'MCQ' | 'CQ'
  packageId: string
  examDate: string
  startTime: string
  endTime: string
  autoFilledFromPackage: boolean
  overrideAllowed: boolean
  packageName?: string | null
}

export interface LessonAssignmentRecord {
  id: string
  lessonId: string
  title: string
  description: string | null
  deadline: string | null
  attachment: string | null
  displayOrder: number
}

export interface LessonScheduleRecord {
  id: string
  lessonId: string
  date: string | null
  startTime: string | null
  endTime: string | null
}

export interface LessonNoteRecord {
  id: string
  lessonId: string
  title: string
  type: string
  content: string | null
  fileUrl: string | null
  link: string | null
  displayOrder: number
}

export interface LessonResourceRecord {
  id: string
  lessonId: string
  title: string
  type: string
  fileUrl: string | null
  link: string | null
  displayOrder: number
}

export interface CourseDetailRecord {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  isPremium: boolean
  price: number | null
  originalPrice?: number | null
  status: string
  teacherName: string | null
  features: string | null
  requirements: string | null
  targetStudents: string | null
  hasCertificate: boolean
  duration: number | null
  language: string | null
  difficulty: string | null
  classId: string | null
  subjectId: string | null
  classCategory?: { id: string; name: string; slug: string } | null
  subject?: { id: string; name: string; slug: string } | null
  lessons: CourseLessonRecord[]
  _count?: { lessons: number; purchases: number }
  createdAt?: string
}

export interface SyllabusRow {
  contentId: string
  title: string
  lessonType: string
  dayOfWeek: number | null
  date: string | null
  startTime: string | null
  endTime: string | null
  mcqExams: Array<{ packageId: string; packageName: string | null; setId: string; setTitle: string; setDate: string | null; setStartTime: string | null; setEndTime: string | null }>
  cqExams: Array<{ packageId: string; packageName: string | null; setId: string; setTitle: string; setDate: string | null; setStartTime: string | null; setEndTime: string | null }>
  hasAssignments: boolean
  displayOrder: number
}

export interface ExamCalendarEntry {
  id: string
  type: 'MCQ' | 'CQ'
  packageId: string
  packageName: string | null
  setId?: string
  setTitle?: string
  scheduledDate: string
  startTime: string
  endTime: string
  autoFilledFromPackage: boolean
  overrideAllowed: boolean
}

export interface SyllabusSummary {
  totalLessons: number
  totalLiveClasses: number
  totalRecordedClasses: number
  totalMcqExams: number
  totalCqExams: number
  totalAssignments: number
  totalNotes: number
  totalResources: number
  teacherName: string | null
}
