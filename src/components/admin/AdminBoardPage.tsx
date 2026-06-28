'use client'

import BulkImportDialog from '@/components/admin/BulkImportDialog'
import DataTable,{ type BulkAction,type ColumnDef } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card'
import ImageUploader from '@/components/ui/image-uploader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs,TabsList,TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useTableSelection } from '@/hooks/use-table-selection'
import { useToast } from '@/hooks/use-toast'
import {
AlertCircle,
Archive,
ArrowLeft,
ArrowRight,
BookOpen,
Check,
Crown,
Edit,
Eye,
FileQuestion,
Layers,
PenLine,
Plus,
Search,
Sigma,
Trash2,
Upload
} from 'lucide-react'
import Image from 'next/image'
import { useCallback,useEffect,useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface BoardQuestion {
  id: string
  type: 'mcq' | 'cq'
  board: string | null
  year: string | null
  topic: string | null
  classLevel: string
  subjectId: string
  chapterId: string
  title: string
  difficulty: string
  isPremium: boolean
  isActive: boolean
  createdAt: string
  chapter: { id: string; name: string; slug: string; subject: { id: string; name: string; slug: string } } | null
  subject: { id: string; name: string; slug: string } | null
}

interface ClassItem { id: string; name: string; slug: string }
interface SubjectItem { id: string; name: string; slug: string; classId: string }
interface ChapterItem { id: string; name: string; slug: string; subjectId: string }

// ─── Constants ──────────────────────────────────────────────────────────────

const difficultyLabels: Record<string, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

// boardOptions and classLevelLabels are now loaded from the database via useHierarchyMetadata()

const typeLabels: Record<string, string> = {
  mcq: 'MCQ',
  cq: 'CQ',
}

const typeColors: Record<string, string> = {
  mcq: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  cq: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
}

// ─── Step Definitions ───────────────────────────────────────────────────────

const stepInfo = [
  { num: 1, title: 'প্রশ্নের ধরন ও বিষয়বস্তু', icon: PenLine },
  { num: 2, title: 'হায়ারার্কি ও মেটাডাটা', icon: Layers },
  { num: 3, title: 'প্রিভিউ ও প্রকাশ', icon: Eye },
]

// ─── Empty Form State ───────────────────────────────────────────────────────

interface FormState {
  type: 'mcq' | 'cq'
  // Common fields
  board: string
  year: string
  topic: string
  classId: string
  subjectId: string
  chapterId: string
  difficulty: string
  isPremium: boolean
  price: string
  tags: string
  // MCQ fields
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string
  // CQ fields
  uddeepok: string
  question1: string
  question2: string
  question3: string
  question4: string
  answer1: string
  answer2: string
  answer3: string
  answer4: string
  // MCQ image fields
  questionImage: string
  optionAImage: string
  optionBImage: string
  optionCImage: string
  optionDImage: string
  explanationImage: string
  // CQ image fields
  uddeepokImage: string
  question1Image: string
  question2Image: string
  question3Image: string
  question4Image: string
  answer1Image: string
  answer2Image: string
  answer3Image: string
  answer4Image: string
}

const emptyForm: FormState = {
  type: 'mcq',
  board: '',
  year: '',
  topic: '',
  classId: '',
  subjectId: '',
  chapterId: '',
  difficulty: 'easy',
  isPremium: false,
  price: '',
  tags: '',
  question: '',
  questionImage: '',
  optionA: '',
  optionAImage: '',
  optionB: '',
  optionBImage: '',
  optionC: '',
  optionCImage: '',
  optionD: '',
  optionDImage: '',
  correctAnswer: 'A',
  explanation: '',
  explanationImage: '',
  uddeepok: '',
  uddeepokImage: '',
  question1: '',
  question1Image: '',
  question2: '',
  question2Image: '',
  question3: '',
  question3Image: '',
  question4: '',
  question4Image: '',
  answer1: '',
  answer1Image: '',
  answer2: '',
  answer2Image: '',
  answer3: '',
  answer3Image: '',
  answer4: '',
  answer4Image: '',
}

const resetMcqFields = {
  question: '',
  questionImage: '',
  optionA: '',
  optionAImage: '',
  optionB: '',
  optionBImage: '',
  optionC: '',
  optionCImage: '',
  optionD: '',
  optionDImage: '',
  correctAnswer: 'A',
  explanation: '',
  explanationImage: '',
}

const resetCqFields = {
  uddeepok: '',
  uddeepokImage: '',
  question1: '',
  question1Image: '',
  question2: '',
  question2Image: '',
  question3: '',
  question3Image: '',
  question4: '',
  question4Image: '',
  answer1: '',
  answer1Image: '',
  answer2: '',
  answer2Image: '',
  answer3: '',
  answer3Image: '',
  answer4: '',
  answer4Image: '',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminBoardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<BoardQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [mcqCount, setMcqCount] = useState(0)
  const [cqCount, setCqCount] = useState(0)
  const [boardCount, setBoardCount] = useState(0)

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')

  // Filters (list view)
  const [search, setSearch] = useState('')
  const [boardFilter, setBoardFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Pagination
  const [page, setPage] = useState(1)
  const perPage = 10

  // Editor state
  const [step, setStep] = useState(1)
  const [editId, setEditId] = useState<string | null>(null)
  const [editType, setEditType] = useState<'mcq' | 'cq' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete
  const [deleteInfo, setDeleteInfo] = useState<{ id: string; type: 'mcq' | 'cq' } | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  // Cascade select data
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])
  // Filter-level subjects
  const [filterSubjects, setFilterSubjects] = useState<SubjectItem[]>([])

  // Metadata from DB
  const { boardOptions, classLevelLabels: classLabelMap, boardSlugToLabel: boardLabelMap } = useHierarchyMetadata()

  // ─── Fetch classes ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/classes')
      .then((res) => res.json())
      .then((json) => setClasses(Array.isArray(json.data) ? json.data : []))
      .catch(() => {})
  }, [])



  // ─── Fetch subjects for filter ───────────────────────────────────────────
  useEffect(() => {
    if (classFilter && classFilter !== 'all') {
      fetch(`/api/admin/subjects?classId=${classFilter}`)
        .then((res) => res.json())
        .then((json) => {
          setFilterSubjects(Array.isArray(json.data) ? json.data : [])
          setSubjectFilter('all')
        })
        .catch(() => {})
    } else {
      setFilterSubjects([])
      setSubjectFilter('all')
    }
  }, [classFilter])

  // ─── Cascade: form subjects ──────────────────────────────────────────────
  const fetchSubjects = useCallback(async (classId: string) => {
    if (!classId) {
      setSubjects([])
      return
    }
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`)
      const json = await res.json()
      setSubjects(Array.isArray(json.data) ? json.data : [])
    } catch {
      /* ignore */
    }
  }, [])

  // ─── Cascade: form chapters ──────────────────────────────────────────────
  const fetchChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) {
      setChapters([])
      return
    }
    try {
      const res = await fetch(`/api/admin/chapters?subjectId=${subjectId}`)
      const json = await res.json()
      setChapters(Array.isArray(json.data) ? json.data : [])
    } catch {
      /* ignore */
    }
  }, [])

  // ─── Fetch board questions ───────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(perPage))
      if (search) params.set('q', search)
      if (boardFilter !== 'all') params.set('board', boardFilter)
      if (yearFilter !== 'all') params.set('year', yearFilter)
      if (classFilter !== 'all') params.set('classLevel', classFilter)
      if (subjectFilter !== 'all') params.set('subjectId', subjectFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const res = await fetch(`/api/admin/board-questions?${params}`)
      if (res.ok) {
        const json = await res.json()
        const data: BoardQuestion[] = Array.isArray(json.data) ? json.data : []
        setQuestions(data)
        setTotal(json.pagination?.total || 0)
        setMcqCount(data.filter((d) => d.type === 'mcq').length)
        setCqCount(data.filter((d) => d.type === 'cq').length)
        const uniqueBoards = new Set(data.map((d) => d.board).filter(Boolean))
        setBoardCount(uniqueBoards.size)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [page, search, boardFilter, yearFilter, classFilter, subjectFilter, typeFilter])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const selection = useTableSelection(questions)

  const handleBulkDelete = async (ids: string[]) => {
    const res = await fetch(`/api/admin/board-questions?ids=${ids.join(',')}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'মুছে ফেলা হয়েছে' }); selection.clearSelection(); fetchQuestions() }
  }

  // ─── Form cascade: when classId changes ──────────────────────────────────
  useEffect(() => {
    if (form.classId) {
      fetchSubjects(form.classId)
      setForm((f) => ({ ...f, subjectId: '', chapterId: '' }))
    } else {
      setSubjects([])
      setChapters([])
    }
  }, [form.classId, fetchSubjects])

  // ─── Form cascade: when subjectId changes ────────────────────────────────
  useEffect(() => {
    if (form.subjectId) {
      fetchChapters(form.subjectId)
      setForm((f) => ({ ...f, chapterId: '' }))
    } else {
      setChapters([])
    }
  }, [form.subjectId, fetchChapters])

  const _totalPages = Math.ceil(total / perPage)

  // ─── Helper: get class slug from classId ─────────────────────────────────
  const getClassSlug = (classId: string): string => {
    const cls = classes.find((c) => c.id === classId)
    return cls?.slug || classId
  }

  // ─── Open create editor ──────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null)
    setEditType(null)
    setForm(emptyForm)
    setSubjects([])
    setChapters([])
    setStep(1)
    setViewMode('editor')
  }

  // ─── Open edit editor ────────────────────────────────────────────────────
  const openEdit = (q: BoardQuestion) => {
    setEditId(q.id)
    setEditType(q.type)
    setForm({
      type: q.type,
      board: q.board || '',
      year: q.year || '',
      topic: q.topic || '',
      classId: q.classLevel,
      subjectId: q.subjectId,
      chapterId: q.chapterId,
      difficulty: q.difficulty || 'easy',
      isPremium: q.isPremium,
      price: '',
      tags: '',
      question: q.type === 'mcq' ? q.title : '',
      questionImage: '',
      optionA: '',
      optionAImage: '',
      optionB: '',
      optionBImage: '',
      optionC: '',
      optionCImage: '',
      optionD: '',
      optionDImage: '',
      correctAnswer: 'A',
      explanation: '',
      explanationImage: '',
      uddeepok: q.type === 'cq' ? q.title : '',
      uddeepokImage: '',
      question1: '',
      question1Image: '',
      question2: '',
      question2Image: '',
      question3: '',
      question3Image: '',
      question4: '',
      question4Image: '',
      answer1: '',
      answer1Image: '',
      answer2: '',
      answer2Image: '',
      answer3: '',
      answer3Image: '',
      answer4: '',
      answer4Image: '',
    })
    // Load cascade data
    if (q.classLevel) fetchSubjects(q.classLevel)
    if (q.subjectId) fetchChapters(q.subjectId)
    setStep(1)
    setViewMode('editor')
  }

  // ─── Handle type change in form ──────────────────────────────────────────
  const handleTypeChange = (newType: 'mcq' | 'cq') => {
    setForm((prev) => ({
      ...prev,
      type: newType,
      ...(newType === 'mcq' ? resetMcqFields : resetCqFields),
    }))
  }

  // ─── Step validation ─────────────────────────────────────────────────────
  const validateStep1 = (): string | null => {
    if (form.type === 'mcq') {
      if (!form.question.trim()) return 'প্রশ্ন লিখুন'
      if (!form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
        return 'সব অপশন (ক, খ, গ, ঘ) পূরণ করুন'
      }
      if (!form.correctAnswer) return 'সঠিক উত্তর নির্বাচন করুন'
    } else {
      if (!form.uddeepok.trim()) return 'উদ্দীপক লিখুন'
      if (!form.question1.trim()) return 'প্রশ্ন ১ লিখুন'
      if (!form.answer1.trim()) return 'উত্তর ১ লিখুন'
    }
    return null
  }

  const validateStep2 = (): string | null => {
    if (!form.board) return 'বোর্ড নির্বাচন করুন (বোর্ড প্রশ্নের জন্য আবশ্যক)'
    if (!form.year) return 'সাল নির্বাচন করুন (বোর্ড প্রশ্নের জন্য আবশ্যক)'
    if (!form.classId) return 'ক্লাস নির্বাচন করুন'
    if (!form.subjectId) return 'বিষয় নির্বাচন করুন'
    if (!form.chapterId) return 'অধ্যায় নির্বাচন করুন'
    return null
  }

  const goNext = () => {
    if (step === 1) {
      const err = validateStep1()
      if (err) {
        toast({ title: 'ত্রুটি', description: err, variant: 'destructive' })
        return
      }
      setStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) {
        toast({ title: 'ত্রুটি', description: err, variant: 'destructive' })
        return
      }
      setStep(3)
    }
  }

  const goPrev = () => {
    if (step > 1) setStep(step - 1)
  }

  // ─── Handle save (create/update) ─────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const classSlug = getClassSlug(form.classId)
      let body: Record<string, unknown>

      if (form.type === 'mcq') {
        body = {
          type: 'mcq',
          question: form.question,
          questionImage: form.questionImage || undefined,
          optionA: form.optionA,
          optionAImage: form.optionAImage || undefined,
          optionB: form.optionB,
          optionBImage: form.optionBImage || undefined,
          optionC: form.optionC,
          optionCImage: form.optionCImage || undefined,
          optionD: form.optionD,
          optionDImage: form.optionDImage || undefined,
          correctAnswer: form.correctAnswer,
          explanation: form.explanation || undefined,
          explanationImage: form.explanationImage || undefined,
          chapterId: form.chapterId,
          classLevel: classSlug,
          subjectId: form.subjectId,
          board: form.board,
          year: form.year,
          topic: form.topic || undefined,
          difficulty: form.difficulty,
          isPremium: form.isPremium,
          price: form.isPremium ? parseFloat(form.price) || 0 : 0,
          tags: form.tags || undefined,
        }
      } else {
        body = {
          type: 'cq',
          uddeepok: form.uddeepok,
          uddeepokImage: form.uddeepokImage || undefined,
          question1: form.question1,
          question1Image: form.question1Image || undefined,
          question2: form.question2 || '',
          question2Image: form.question2Image || undefined,
          question3: form.question3 || '',
          question3Image: form.question3Image || undefined,
          question4: form.question4 || '',
          question4Image: form.question4Image || undefined,
          answer1: form.answer1,
          answer1Image: form.answer1Image || undefined,
          answer2: form.answer2 || '',
          answer2Image: form.answer2Image || undefined,
          answer3: form.answer3 || '',
          answer3Image: form.answer3Image || undefined,
          answer4: form.answer4 || '',
          answer4Image: form.answer4Image || undefined,
          chapterId: form.chapterId,
          classLevel: classSlug,
          subjectId: form.subjectId,
          board: form.board,
          year: form.year,
          topic: form.topic || undefined,
          difficulty: form.difficulty,
          isPremium: form.isPremium,
          price: form.isPremium ? parseFloat(form.price) || 0 : 0,
          tags: form.tags || undefined,
        }
      }

      const res = editId
        ? await fetch('/api/admin/board-questions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, type: editType || form.type, ...body }),
          })
        : await fetch('/api/admin/board-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({
          title: editId ? 'বোর্ড প্রশ্ন আপডেট হয়েছে' : 'বোর্ড প্রশ্ন তৈরি হয়েছে',
          description: 'সফলভাবে সংরক্ষিত হয়েছে',
        })
        setViewMode('list')
        fetchQuestions()
      } else {
        const json = await res.json()
        toast({
          title: 'ত্রুটি',
          description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ─── Handle delete ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteInfo) return
    try {
      const res = await fetch(
        `/api/admin/board-questions?id=${deleteInfo.id}&type=${deleteInfo.type}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        toast({ title: 'বোর্ড প্রশ্ন মুছে ফেলা হয়েছে' })
        setDeleteInfo(null)
        fetchQuestions()
      } else {
        toast({ title: 'ত্রুটি', description: 'মুছতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }

  // ─── Loading skeleton ────────────────────────────────────────────────────
  if (loading && questions.length === 0 && viewMode === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDITOR VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'editor') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        {/* ─── Editor Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {editId ? 'বোর্ড প্রশ্ন সম্পাদনা' : 'নতুন বোর্ড প্রশ্ন তৈরি'}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                ধাপ {step} / ৩ — {stepInfo[step - 1].title}
              </p>
            </div>
          </div>
          <Badge className={`${form.type === 'mcq' ? typeColors.mcq : typeColors.cq} text-sm px-3 py-1`}>
            {typeLabels[form.type]}
          </Badge>
        </div>

        {/* ─── Progress Bar ──────────────────────────────────────────────── */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            {stepInfo.map((s, i) => {
              const Icon = s.icon
              const isActive = step === s.num
              const isCompleted = step > s.num
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isActive
                        ? 'border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-muted-foreground/30 text-muted-foreground/50'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-sm font-medium ${
                      isActive
                        ? 'text-emerald-600'
                        : isCompleted
                        ? 'text-emerald-600'
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    {s.title}
                  </span>
                  {i < stepInfo.length - 1 && (
                    <div
                      className={`hidden sm:block w-12 lg:w-20 h-0.5 mx-1 ${
                        step > s.num ? 'bg-emerald-600' : 'bg-muted-foreground/20'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {/* Mobile progress bar */}
          <div className="sm:hidden flex gap-1 mt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= s ? 'bg-emerald-600' : 'bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ─── Step Content ──────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-6">
            {/* ═══════════════════ STEP 1: Type & Content ═══════════════════ */}
            {step === 1 && (
              <div className="space-y-6 animate-slide-in-right">
                {/* Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">প্রশ্নের ধরন নির্বাচন করুন</Label>
                  <Tabs
                    value={form.type}
                    onValueChange={(v) => handleTypeChange(v as 'mcq' | 'cq')}
                  >
                    <TabsList className="grid w-full grid-cols-2 h-12">
                      <TabsTrigger value="mcq" className="gap-2 text-sm">
                        <FileQuestion className="h-4 w-4" />
                        MCQ (বহুনির্বাচনী)
                      </TabsTrigger>
                      <TabsTrigger value="cq" className="gap-2 text-sm">
                        <BookOpen className="h-4 w-4" />
                        CQ (সৃজনশীল)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="border-t pt-6" />

                {/* MCQ Form */}
                {form.type === 'mcq' && (
                  <div className="space-y-5">
                    {/* Question */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        প্রশ্ন <span className="text-xs text-destructive">(আবশ্যক)</span>
                        <Sigma className="h-4 w-4 text-muted-foreground" />
                      </Label>
                      <Textarea
                        placeholder="প্রশ্ন লিখুন... (গণিতের জন্য $...$ ব্যবহার করুন)"
                        value={form.question}
                        onChange={(e) => setForm({ ...form, question: e.target.value })}
                        rows={3}
                      />
                      <ImageUploader
                        value={form.questionImage}
                        onChange={(url) => setForm({ ...form, questionImage: url })}
                        label="প্রশ্নের ছবি (ঐচ্ছিক)"
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">অপশনসমূহ</Label>
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const key = `option${opt}` as keyof FormState
                        const imgKey = `option${opt}Image` as keyof FormState
                        const labels: Record<string, string> = { A: 'ক', B: 'খ', C: 'গ', D: 'ঘ' }
                        return (
                          <div key={opt} className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                                {labels[opt]}
                              </span>
                              অপশন {labels[opt]} <span className="text-xs text-destructive">(আবশ্যক)</span>
                            </Label>
                            <Input
                              placeholder={`অপশন ${labels[opt]} লিখুন...`}
                              value={form[key] as string}
                              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            />
                            <ImageUploader
                              value={form[imgKey] as string}
                              onChange={(url) => setForm({ ...form, [imgKey]: url })}
                              label="ছবি (ঐচ্ছিক)"
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Correct Answer */}
                    <div className="space-y-2">
                      <Label>
                        সঠিক উত্তর <span className="text-xs text-destructive">(আবশ্যক)</span>
                      </Label>
                      <RadioGroup
                        value={form.correctAnswer}
                        onValueChange={(v) => setForm({ ...form, correctAnswer: v })}
                        className="flex gap-4"
                      >
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                          const labels: Record<string, string> = { A: 'ক', B: 'খ', C: 'গ', D: 'ঘ' }
                          return (
                            <div key={opt} className="flex items-center space-x-2">
                              <RadioGroupItem value={opt} id={`correct-${opt}`} />
                              <Label htmlFor={`correct-${opt}`} className="cursor-pointer">
                                {labels[opt]}
                              </Label>
                            </div>
                          )
                        })}
                      </RadioGroup>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        ব্যাখ্যা (ঐচ্ছিক)
                        <Sigma className="h-4 w-4 text-muted-foreground" />
                      </Label>
                      <Textarea
                        placeholder="ব্যাখ্যা লিখুন... (গণিতের জন্য $...$ ব্যবহার করুন)"
                        value={form.explanation}
                        onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                        rows={3}
                      />
                      <ImageUploader
                        value={form.explanationImage}
                        onChange={(url) => setForm({ ...form, explanationImage: url })}
                        label="ব্যাখ্যার ছবি (ঐচ্ছিক)"
                      />
                    </div>
                  </div>
                )}

                {/* CQ Form */}
                {form.type === 'cq' && (
                  <div className="space-y-5">
                    {/* Uddeepok */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        উদ্দীপক <span className="text-xs text-destructive">(আবশ্যক)</span>
                        <Sigma className="h-4 w-4 text-muted-foreground" />
                      </Label>
                      <Textarea
                        placeholder="উদ্দীপক লিখুন... (গণিতের জন্য $...$ ব্যবহার করুন)"
                        value={form.uddeepok}
                        onChange={(e) => setForm({ ...form, uddeepok: e.target.value })}
                        rows={4}
                      />
                      <ImageUploader
                        value={form.uddeepokImage}
                        onChange={(url) => setForm({ ...form, uddeepokImage: url })}
                        label="উদ্দীপকের ছবি (ঐচ্ছিক)"
                      />
                    </div>

                    <div className="border-t pt-4" />
                    <Label className="text-base font-semibold">প্রশ্ন-উত্তর জোড়া</Label>

                    {/* Question-Answer Pairs */}
                    {([1, 2, 3, 4] as const).map((n) => {
                      const qKey = `question${n}` as keyof FormState
                      const aKey = `answer${n}` as keyof FormState
                      const qImgKey = `question${n}Image` as keyof FormState
                      const aImgKey = `answer${n}Image` as keyof FormState
                      const banglaNums: Record<number, string> = { 1: '১', 2: '২', 3: '৩', 4: '৪' }
                      const isRequired = n === 1
                      return (
                        <Card key={n} className="border-l-4 border-l-teal-400">
                          <CardContent className="p-4 space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-bold">
                                {banglaNums[n]}
                              </span>
                              প্রশ্ন {banglaNums[n]}
                              {isRequired && <span className="text-xs text-destructive">(আবশ্যক)</span>}
                              {n > 1 && <span className="text-xs text-muted-foreground">(ঐচ্ছিক)</span>}
                            </h4>
                            <Textarea
                              placeholder={`প্রশ্ন ${banglaNums[n]} লিখুন...`}
                              value={form[qKey] as string}
                              onChange={(e) => setForm({ ...form, [qKey]: e.target.value })}
                              rows={2}
                            />
                            <ImageUploader
                              value={form[qImgKey] as string}
                              onChange={(url) => setForm({ ...form, [qImgKey]: url })}
                              label="প্রশ্নের ছবি (ঐচ্ছিক)"
                            />
                            <h5 className="font-medium text-sm mt-2">
                              উত্তর {banglaNums[n]}
                              {isRequired && <span className="text-xs text-destructive ml-1">(আবশ্যক)</span>}
                            </h5>
                            <Textarea
                              placeholder={`উত্তর ${banglaNums[n]} লিখুন...`}
                              value={form[aKey] as string}
                              onChange={(e) => setForm({ ...form, [aKey]: e.target.value })}
                              rows={2}
                            />
                            <ImageUploader
                              value={form[aImgKey] as string}
                              onChange={(url) => setForm({ ...form, [aImgKey]: url })}
                              label="উত্তরের ছবি (ঐচ্ছিক)"
                            />
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════ STEP 2: Hierarchy & Metadata ══════════════ */}
            {step === 2 && (
              <div className="space-y-6 animate-slide-in-right">
                {/* Board & Year - Required */}
                <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">বোর্ড প্রশ্নের জন্য বোর্ড ও সাল আবশ্যক</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        বোর্ড <span className="text-xs text-destructive">(আবশ্যক)</span>
                      </Label>
                      <Select
                        value={form.board}
                        onValueChange={(v) => setForm({ ...form, board: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="বোর্ড নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                    <SelectItem value="none">কোনোটি নয়</SelectItem>
                          {boardOptions.map((b) => (
                            <SelectItem key={b.value} value={b.value}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        সাল <span className="text-xs text-destructive">(আবশ্যক)</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="সাল লিখুন (যেমন: 2024)"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Class → Subject → Chapter Cascade */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">শ্রেণি → বিষয় → অধ্যায়</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>
                        শ্রেণি <span className="text-xs text-destructive">(আবশ্যক)</span>
                      </Label>
                      <Select
                        value={form.classId}
                        onValueChange={(v) => setForm({ ...form, classId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="শ্রেণি নির্বাচন" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        বিষয় <span className="text-xs text-destructive">(আবশ্যক)</span>
                      </Label>
                      <Select
                        value={form.subjectId}
                        onValueChange={(v) => setForm({ ...form, subjectId: v })}
                        disabled={!form.classId || subjects.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={form.classId ? 'বিষয় নির্বাচন' : 'প্রথমে শ্রেণি নির্বাচন করুন'} />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        অধ্যায় <span className="text-xs text-destructive">(আবশ্যক)</span>
                      </Label>
                      <Select
                        value={form.chapterId}
                        onValueChange={(v) => setForm({ ...form, chapterId: v })}
                        disabled={!form.subjectId || chapters.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={form.subjectId ? 'অধ্যায় নির্বাচন' : 'প্রথমে বিষয় নির্বাচন করুন'} />
                        </SelectTrigger>
                        <SelectContent>
                          {chapters.map((ch) => (
                            <SelectItem key={ch.id} value={ch.id}>
                              {ch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <Label>টপিক (ঐচ্ছিক)</Label>
                  <Input
                    placeholder="টপিক বা থিম লিখুন..."
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label>কঠিনতা</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) => setForm({ ...form, difficulty: v })}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">সহজ</SelectItem>
                      <SelectItem value="medium">মাঝারি</SelectItem>
                      <SelectItem value="hard">কঠিন</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ═══════════════════ STEP 3: Preview & Publish ═════════════════ */}
            {step === 3 && (
              <div className="space-y-6 animate-slide-in-right">
                {/* Preview Card */}
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">প্রশ্নের প্রিভিউ</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={typeColors[form.type]}>
                          {typeLabels[form.type]}
                        </Badge>
                        <Badge className={difficultyColors[form.difficulty] || ''}>
                          {difficultyLabels[form.difficulty] || form.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Archive className="h-3.5 w-3.5" />
                        {boardLabelMap[form.board] || form.board}
                      </span>
                      <span>•</span>
                      <span>{form.year}</span>
                      <span>•</span>
                      <span>{classes.find((c) => c.id === form.classId)?.name || form.classId}</span>
                      <span>•</span>
                      <span>{subjects.find((s) => s.id === form.subjectId)?.name || form.subjectId}</span>
                      {form.chapterId && (
                        <>
                          <span>•</span>
                          <span>{chapters.find((ch) => ch.id === form.chapterId)?.name || form.chapterId}</span>
                        </>
                      )}
                      {form.topic && (
                        <>
                          <span>•</span>
                          <span>{form.topic}</span>
                        </>
                      )}
                    </div>

                    <div className="border-t" />

                    {/* MCQ Preview */}
                    {form.type === 'mcq' && (
                      <div className="space-y-4">
                        {/* Question */}
                        <div>
                          <h4 className="font-semibold mb-1">প্রশ্ন:</h4>
                          <RichContentRenderer content={form.question} className="text-sm" />
                          {form.questionImage && (
                            <Image src={form.questionImage} alt="প্রশ্নের ছবি" width={400} height={300} className="mt-2 max-h-48 rounded border" unoptimized />
                          )}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <h4 className="font-semibold mb-1">অপশন:</h4>
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const labels: Record<string, string> = { A: 'ক', B: 'খ', C: 'গ', D: 'ঘ' }
                            const val = form[`option${opt}` as keyof FormState] as string
                            const img = form[`option${opt}Image` as keyof FormState] as string
                            const isCorrect = form.correctAnswer === opt
                            return (
                              <div
                                key={opt}
                                className={`p-3 rounded-lg border ${
                                  isCorrect
                                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                    : 'border-border'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span
                                    className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {labels[opt]}
                                  </span>
                                  <div className="flex-1">
                                    <RichContentRenderer content={val} className="text-sm" />
                                    {img && (
                                      <Image src={img} alt={`অপশন ${labels[opt]}`} width={256} height={128} className="mt-1 max-h-32 rounded" unoptimized />
                                    )}
                                  </div>
                                  {isCorrect && (
                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs shrink-0">
                                      সঠিক
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Explanation */}
                        {(form.explanation || form.explanationImage) && (
                          <div>
                            <h4 className="font-semibold mb-1">ব্যাখ্যা:</h4>
                            {form.explanation && (
                              <RichContentRenderer content={form.explanation} className="text-sm text-muted-foreground" />
                            )}
                            {form.explanationImage && (
                              <Image src={form.explanationImage} alt="ব্যাখ্যার ছবি" width={400} height={300} className="mt-2 max-h-48 rounded border" unoptimized />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CQ Preview */}
                    {form.type === 'cq' && (
                      <div className="space-y-4">
                        {/* Uddeepok */}
                        <div>
                          <h4 className="font-semibold mb-1">উদ্দীপক:</h4>
                          <RichContentRenderer content={form.uddeepok} className="text-sm" />
                          {form.uddeepokImage && (
                            <Image src={form.uddeepokImage} alt="উদ্দীপকের ছবি" width={400} height={300} className="mt-2 max-h-48 rounded border" unoptimized />
                          )}
                        </div>

                        {/* Question-Answer Pairs */}
                        {([1, 2, 3, 4] as const).map((n) => {
                          const q = form[`question${n}` as keyof FormState] as string
                          const a = form[`answer${n}` as keyof FormState] as string
                          const qImg = form[`question${n}Image` as keyof FormState] as string
                          const aImg = form[`answer${n}Image` as keyof FormState] as string
                          const banglaNums: Record<number, string> = { 1: '১', 2: '২', 3: '৩', 4: '৪' }
                          if (!q && !a) return null
                          return (
                            <div key={n} className="border-l-4 border-l-teal-400 pl-4 space-y-2">
                              <h4 className="font-semibold text-sm">প্রশ্ন {banglaNums[n]}:</h4>
                              <RichContentRenderer content={q} className="text-sm" />
                              {qImg && (
                                <Image src={qImg} alt={`প্রশ্ন ${banglaNums[n]}`} width={256} height={128} className="mt-1 max-h-32 rounded" unoptimized />
                              )}
                              {a && (
                                <>
                                  <h5 className="font-medium text-sm text-teal-700 dark:text-teal-300">
                                    উত্তর {banglaNums[n]}:
                                  </h5>
                                  <RichContentRenderer content={a} className="text-sm text-muted-foreground" />
                                  {aImg && (
                                    <Image src={aImg} alt={`উত্তর ${banglaNums[n]}`} width={256} height={128} className="mt-1 max-h-32 rounded" unoptimized />
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Premium & Price */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2 text-base">
                          <Crown className="h-4 w-4 text-amber-500" />
                          প্রিমিয়াম প্রশ্ন
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          প্রিমিয়াম প্রশ্ন শুধুমাত্র সাবস্ক্রাইব করা ব্যবহারকারীরা দেখতে পাবেন
                        </p>
                      </div>
                      <Switch
                        checked={form.isPremium}
                        onCheckedChange={(v) => setForm({ ...form, isPremium: v })}
                      />
                    </div>
                    {form.isPremium && (
                      <div className="space-y-2">
                        <Label>মূল্য (টাকা)</Label>
                        <Input
                          type="number"
                          placeholder="মূল্য লিখুন"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="w-full sm:w-48"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── Step Navigation Buttons ─────────────────────────────────── */}
            <div className="flex items-center justify-between pt-6 border-t mt-6">
              <div className="flex gap-2">
                {step > 1 && (
                  <Button variant="outline" onClick={goPrev} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    আগের ধাপ
                  </Button>
                )}
                {step === 1 && (
                  <Button variant="outline" onClick={() => setViewMode('list')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    বাতিল
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 3 && (
                  <Button
                    onClick={goNext}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    পরবর্তী ধাপ
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                {step === 3 && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        সংরক্ষণ হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {editId ? 'আপডেট করুন' : 'প্রকাশ করুন'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const columns: ColumnDef<BoardQuestion>[] = [
    { key: 'title', header: 'শিরোনাম', render: (q) => <span className="font-medium max-w-[200px] truncate block">{q.title}</span> },
    { key: 'type', header: 'ধরন', render: (q) => <Badge className={typeColors[q.type]}>{typeLabels[q.type]}</Badge> },
    { key: 'board', header: 'বোর্ড', cellClass: 'hidden sm:table-cell', render: (q) => <>{q.board ? boardLabelMap[q.board] || q.board : '-'}</> },
    { key: 'year', header: 'সাল', cellClass: 'hidden sm:table-cell', render: (q) => <>{q.year || '-'}</> },
    { key: 'classLevel', header: 'ক্লাস', cellClass: 'hidden md:table-cell', render: (q) => <>{classLabelMap[q.classLevel] || q.classLevel}</> },
    { key: 'subject', header: 'বিষয়', cellClass: 'hidden lg:table-cell', render: (q) => <>{q.subject?.name || q.chapter?.subject?.name || '-'}</> },
    { key: 'difficulty', header: 'কঠিনতা', cellClass: 'hidden md:table-cell', render: (q) => <Badge className={difficultyColors[q.difficulty]}>{difficultyLabels[q.difficulty] || q.difficulty}</Badge> },
    { key: 'isPremium', header: 'প্রিমিয়াম', cellClass: 'hidden lg:table-cell', render: (q) => q.isPremium ? <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1"><Crown className="h-3 w-3" />প্রিমিয়াম</Badge> : <Badge variant="secondary">ফ্রি</Badge> },
    { key: 'actions', header: '', render: (q) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(q)} aria-label="সম্পাদনা">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteInfo({ id: q.id, type: q.type })} aria-label="মুছুন">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )},
  ]

  const bulkActions: BulkAction[] = [
    { label: 'মুছে ফেলুন', variant: 'destructive', handler: handleBulkDelete },
  ]

  const filters = (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="বোর্ড প্রশ্ন খুঁজুন..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="ধরন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ধরন</SelectItem>
              <SelectItem value="mcq">MCQ</SelectItem>
              <SelectItem value="cq">CQ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={boardFilter} onValueChange={(v) => { setBoardFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="বোর্ড" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব বোর্ড</SelectItem>
              {boardOptions.map((b) => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="সাল"
            value={yearFilter === 'all' ? '' : yearFilter}
            onChange={(e) => { setYearFilter(e.target.value || 'all'); setPage(1) }}
            className="w-full sm:w-32"
          />
          <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="ক্লাস" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ক্লাস</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterSubjects.length > 0 && (
            <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="বিষয়" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব বিষয়</SelectItem>
                {filterSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="h-6 w-6 text-emerald-600" />
            বোর্ড প্রশ্ন ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {total}টি বোর্ড প্রশ্ন
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setBulkImportOpen(true)}
          >
            <Upload className="h-4 w-4" />
            বাল্ক ইম্পোর্ট
          </Button>
          <BulkImportDialog
            open={bulkImportOpen}
            onOpenChange={setBulkImportOpen}
            defaultType="board-mcq"
            onSuccess={fetchQuestions}
          />
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            নতুন বোর্ড প্রশ্ন
          </Button>
        </div>
      </div>

      {/* ─── Statistics Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileQuestion className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">মোট বোর্ড প্রশ্ন</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Archive className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-muted-foreground">বোর্ড সংখ্যা</p>
            </div>
            <p className="text-2xl font-bold text-teal-600">{boardCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileQuestion className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">MCQ</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{mcqCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-muted-foreground">CQ</p>
            </div>
            <p className="text-2xl font-bold text-teal-600">{cqCount}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={questions}
        total={total}
        page={page}
        pageSize={perPage}
        onPageChange={setPage}
        loading={loading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো বোর্ড প্রশ্ন পাওয়া যায়নি"
        filters={filters}
      />

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}
      {deleteInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">মুছে ফেলার নিশ্চিতকরণ</h3>
              <p className="text-sm text-muted-foreground">
                আপনি কি নিশ্চিত যে এই বোর্ড প্রশ্নটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteInfo(null)}>
                  বাতিল
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  মুছে ফেলুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
