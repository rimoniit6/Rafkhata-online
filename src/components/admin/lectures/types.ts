import {
  BookOpen,
  Code2,
  Eye,
  Heading1,
  Image as ImageIcon,
  LayoutGrid,
  Sigma,
  Sparkles,
  Table2,
  Type,
} from 'lucide-react'

export type StepNumber = 1 | 2 | 3

export interface LectureRecord {
  id: string
  title: string
  slug: string
  chapterId: string
  content: string
  videoUrl: string | null
  audioUrl: string | null
  pdfUrl: string | null
  thumbnail: string | null
  duration: number
  isPremium: boolean
  price: number
  viewCount: number
  isActive: boolean
  chapter?: { id: string; name: string; subjectId: string; subject?: { id: string; name: string; classId: string; class?: { id: string; name: string; slug: string } } }
  _count?: { resources: number }
}

export interface ClassItem { id: string; name: string; slug: string }
export interface SubjectItem { id: string; name: string; slug: string; classId: string }
export interface ChapterItem { id: string; name: string; slug: string; subjectId: string }

export const blockTypeIcons: Record<string, React.ElementType> = {
  math: Sigma,
  image: ImageIcon,
  data: Table2,
  code: Code2,
  heading: Heading1,
  text: Type,
  divider: Sparkles,
}

export const steps: { num: StepNumber; label: string; icon: React.ElementType }[] = [
  { num: 1, label: 'মৌলিক তথ্য', icon: BookOpen },
  { num: 2, label: 'কন্টেন্ট ব্লক ও মিডিয়া', icon: LayoutGrid },
  { num: 3, label: 'প্রিভিউ ও প্রকাশ', icon: Eye },
]
