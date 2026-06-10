'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ClipboardCheck,
  Edit,
  Trash2,
  Crown,
  Clock,
  BarChart3,
  Check,
  ChevronRight,
  ArrowLeft,
  Save,
  X,
  Sparkles,
  Search,
  FileQuestion,
  BookOpen,
  Users,
  Settings2,
  ListChecks,
  Eye,
  Send,
  Archive,
  RotateCcw,
  MoreVertical,
  AlertCircle,
  Sigma,
  Image as ImageIcon,
  CheckSquare,
  Upload,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import { cn } from '@/lib/utils'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ─── Types ──────────────────────────────────────────────────────

interface ExamQuestionRecord {
  id: string
  examId: string
  questionType: string
  questionId: string
  order: number
  marks: number
}

interface ExamRecord {
  id: string
  title: string
  description: string | null
  classLevel: string
  subjectId: string | null
  chapterIds: string | null
  type: string
  duration: number
  totalMarks: number
  marksPerMcq: number
  negativeMarks: number
  isPremium: boolean
  price: number
  isActive: boolean
  status: string
  instructions: string | null
  startsAt: string | null
  endsAt: string | null
  questions: ExamQuestionRecord[]
  _count?: { results: number }
}

interface MCQItem {
  id: string
  question: string
  correctAnswer: string
  difficulty: string
  classLevel: string
  subjectId: string
  topic: string | null
  chapter: { id: string; name: string } | null
}

interface CQItem {
  id: string
  uddeepok: string
  question1: string
  question2: string
  question3: string
  question4: string
  difficulty: string
  classLevel: string
  subjectId: string
  topic: string | null
  chapter: { id: string; name: string } | null
}

interface SelectedQuestion {
  questionType: 'mcq' | 'cq'
  questionId: string
  marks: number
  order: number
}

const typeLabels: Record<string, string> = { mcq: 'MCQ', cq: 'CQ', mixed: 'মিশ্র' }
const typeColors: Record<string, string> = {
  mcq: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  cq: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  mixed: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'খসড়া', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Edit },
  published: { label: 'প্রকাশিত', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', icon: Send },
  archived: { label: 'সংরক্ষিত', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Archive },
}

// classLevelLabels is now loaded from the database via useHierarchyMetadata()

const difficultyLabels: Record<string, string> = {
  easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন',
}

// ─── STEP CONFIG ────────────────────────────────────────────────

const steps = [
  { id: 1, label: 'মৌলিক তথ্য', icon: ClipboardCheck, description: 'এক্সামের নাম, ক্লাস, টাইপ' },
  { id: 2, label: 'প্রশ্ন যোগ', icon: ListChecks, description: 'প্রশ্ন ব্যাংক থেকে প্রশ্ন বাছাই' },
  { id: 3, label: 'সেটিংস', icon: Settings2, description: 'মার্কস, নেগেটিভ, প্রিমিয়াম' },
  { id: 4, label: 'পর্যালোচনা', icon: Eye, description: 'চূড়ান্ত যাচাই ও প্রকাশ' },
]

// ─── Component ──────────────────────────────────────────────────

export default function AdminExamsPage() {
  const { classOptions, classLevelLabels: classLabelMap, metadata, subjects: hierarchySubjects } = useHierarchyMetadata()
  const classes = metadata?.classes || []
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<ExamRecord[]>([])
  const [saving, setSaving] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Step 1: Basic info
  const [formTitle, setFormTitle] = useState('')
  // MCQ only - exam system is MCQ-only
  const formType: 'mcq' = 'mcq'
  const [formClassLevel, setFormClassLevel] = useState('')
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formDuration, setFormDuration] = useState('60')
  const [formDescription, setFormDescription] = useState('')

  // Step 2: Questions
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [questionBank, setQuestionBank] = useState<{ mcqs: MCQItem[]; cqs: CQItem[] }>({ mcqs: [], cqs: [] })
  const [questionSearch, setQuestionSearch] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Excel upload
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number; message: string; errors: string[] } | null>(null)

  // Step 3: Settings
  const [formMarksPerMcq, setFormMarksPerMcq] = useState('1')
  const [formNegativeMarks, setFormNegativeMarks] = useState('0')
  const [formInstructions, setFormInstructions] = useState('')
  const [formIsPremium, setFormIsPremium] = useState(false)
  const [formPrice, setFormPrice] = useState('')

  // Subjects for cascade — derived from hierarchy metadata, filtered by selected class
  const classSlugToId = Object.fromEntries(classes.map(c => [c.slug, c.id]))
  const filteredSubjects = formClassLevel
    ? hierarchySubjects.filter(s => s.classId === classSlugToId[formClassLevel])
    : hierarchySubjects

  const fetchExams = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/exams?limit=50', { signal })
      if (res.ok) {
        const json = await res.json()
        setExams(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchExams(controller.signal)
    return () => controller.abort()
  }, [fetchExams])

  // Handle Excel upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('classLevel', formClassLevel)
      if (formSubjectId && formSubjectId !== 'all') formData.append('subjectId', formSubjectId)
      const res = await fetch('/api/admin/mcq/bulk-upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setUploadResult(data)
        toast({ title: data.message })
        // Refresh question bank to show newly added questions
        if (currentStep === 2 && formClassLevel) {
          fetchQuestionBank()
        }
      } else {
        setUploadResult({ success: 0, failed: 0, message: data.error || 'আপলোড ব্যর্থ', errors: [] })
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' })
      }
    } catch {
      setUploadResult({ success: 0, failed: 0, message: 'নেটওয়ার্ক সমস্যা', errors: [] })
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setUploading(false)
      // Reset file input so same file can be re-uploaded
      e.target.value = ''
    }
  }

  // Fetch questions from bank
  const fetchQuestionBank = useCallback(async (signal?: AbortSignal) => {
    if (!formClassLevel) return
    setLoadingQuestions(true)
    try {
      const params = new URLSearchParams()
      params.set('classLevel', formClassLevel)
      if (formSubjectId) params.set('subjectId', formSubjectId)
      params.set('type', 'mcq')
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
      const res = await fetch(`/api/admin/exams/questions?${params}`, { signal })
      if (res.ok) {
        const data = await res.json()
        setQuestionBank(data)
      }
    } catch { /* */ }
    finally { setLoadingQuestions(false) }
  }, [formClassLevel, formSubjectId, debouncedSearchQuery])

  useEffect(() => {
    const controller = new AbortController()
    if (viewMode === 'editor' && currentStep === 2 && formClassLevel) {
      fetchQuestionBank(controller.signal)
    }
    return () => controller.abort()
  }, [viewMode, currentStep, formClassLevel, formSubjectId, debouncedSearchQuery, fetchQuestionBank])

  const resetForm = () => {
    setFormTitle('')
    setFormClassLevel('')
    setFormSubjectId('')
    setFormDuration('60')
    setFormDescription('')
    setSelectedQuestions([])
    setQuestionBank({ mcqs: [], cqs: [] })
    setQuestionSearch('')
    setDebouncedSearchQuery('')
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }
    setFormMarksPerMcq('1')
    setFormNegativeMarks('0')
    setFormInstructions('')
    setFormIsPremium(false)
    setFormPrice('')
    setUploadResult(null)
    setCurrentStep(1)
  }

  const openCreate = () => {
    setEditId(null)
    resetForm()
    setViewMode('editor')
  }

  const openEdit = (exam: ExamRecord) => {
    setEditId(exam.id)
    setFormTitle(exam.title)
    // formType is always 'mcq' — skip setting from exam.type
    setFormClassLevel(exam.classLevel)
    setFormSubjectId(exam.subjectId || '')
    setFormDuration(String(exam.duration))
    setFormDescription(exam.description || '')
    setSelectedQuestions(
      exam.questions.map(q => ({
        questionType: q.questionType as 'mcq' | 'cq',
        questionId: q.questionId,
        marks: q.marks,
        order: q.order,
      }))
    )
    setFormMarksPerMcq(String(exam.marksPerMcq))
    setFormNegativeMarks(String(exam.negativeMarks))
    setFormInstructions(exam.instructions || '')
    setFormIsPremium(exam.isPremium)
    setFormPrice(exam.price ? String(exam.price) : '')
    setCurrentStep(1)
    setViewMode('editor')
  }

  const isQuestionSelected = (type: string, id: string) => {
    return selectedQuestions.some(q => q.questionType === type && q.questionId === id)
  }

  const toggleQuestion = (type: 'mcq' | 'cq', id: string) => {
    if (isQuestionSelected(type, id)) {
      setSelectedQuestions(selectedQuestions.filter(q => !(q.questionType === type && q.questionId === id)))
    } else {
      const marks = type === 'mcq' ? parseFloat(formMarksPerMcq) || 1 : 4
      setSelectedQuestions([...selectedQuestions, {
        questionType: type,
        questionId: id,
        marks,
        order: selectedQuestions.length,
      }])
    }
  }

  const selectAllMcqs = () => {
    const mcqs = questionBank.mcqs || []
    const currentMcqIds = new Set(selectedQuestions.filter(q => q.questionType === 'mcq').map(q => q.questionId))
    const marks = parseFloat(formMarksPerMcq) || 1
    const newMcqs = mcqs
      .filter(m => !currentMcqIds.has(m.id))
      .map((m, idx) => ({
        questionType: 'mcq' as const,
        questionId: m.id,
        marks,
        order: selectedQuestions.length + idx,
      }))
    setSelectedQuestions([...selectedQuestions, ...newMcqs])
  }

  const deselectAllMcqs = () => {
    setSelectedQuestions(selectedQuestions.filter(q => q.questionType !== 'cq' ? q.questionType !== 'mcq' : true))
    // Since MCQ only, just clear all
    setSelectedQuestions([])
  }

  const calculateTotalMarks = () => {
    return selectedQuestions.reduce((sum, q) => sum + q.marks, 0)
  }

  const handleSave = async (publishStatus?: string) => {
    if (!formTitle || !formClassLevel || !formDuration) {
      toast({ title: 'ত্রুটি', description: 'প্রয়োজনীয় ফিল্ড পূরণ করুন', variant: 'destructive' })
      setCurrentStep(1)
      return
    }

    setSaving(true)
    try {
      const body = {
        title: formTitle,
        type: formType,
        classLevel: formClassLevel,
        subjectId: formSubjectId || undefined,
        duration: parseInt(formDuration) || 60,
        totalMarks: calculateTotalMarks(),
        marksPerMcq: parseFloat(formMarksPerMcq) || 1,
        negativeMarks: parseFloat(formNegativeMarks) || 0,
        isPremium: formIsPremium,
        price: formIsPremium ? parseFloat(formPrice) || 0 : 0,
        description: formDescription || undefined,
        instructions: formInstructions || undefined,
        status: publishStatus || 'draft',
        questions: selectedQuestions.map((q, idx) => ({
          questionType: q.questionType,
          questionId: q.questionId,
          marks: q.marks,
          order: idx,
        })),
      }

      const res = editId
        ? await fetch('/api/admin/exams', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'এক্সাম আপডেট হয়েছে' : 'এক্সাম তৈরি হয়েছে' })
        setViewMode('list')
        fetchExams()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/exams?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'এক্সাম মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchExams() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const handleStatusChange = async (examId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: examId, status: newStatus }),
      })
      if (res.ok) {
        toast({ title: `এক্সাম ${newStatus === 'published' ? 'প্রকাশিত' : newStatus === 'archived' ? 'সংরক্ষিত' : 'খসড়া'} হয়েছে` })
        fetchExams()
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  // ─── STEP 1: Basic Info ──────────────────────────────────────

  const StepBasicInfo = () => (
    <Card className="border-border/50 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-emerald-600" /> এক্সামের মৌলিক তথ্য
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">এক্সামের নাম, শ্রেণি, বিষয় ও ধরন নির্ধারণ করুন</p>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>শিরোনাম *</Label>
          <Input placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৫ - গণিত" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>ক্লাস *</Label>
            <Select value={formClassLevel} onValueChange={(v) => { setFormClassLevel(v); setFormSubjectId('') }}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>
                {classOptions.map((cls) => (
                  <SelectItem key={cls.value} value={cls.value}>{cls.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>বিষয়</Label>
            <Select value={formSubjectId} onValueChange={setFormSubjectId} disabled={!formClassLevel}>
              <SelectTrigger><SelectValue placeholder="সকল বিষয়" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল বিষয়</SelectItem>
                {filteredSubjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>এক্সামের ধরন</Label>
            <div className="h-9 flex items-center px-3 rounded-md border bg-muted/30 text-sm font-medium">
              MCQ (বহুনির্বাচনী)
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>সময়কাল (মিনিট) *</Label>
            <Input type="number" placeholder="60" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>বিবরণ</Label>
            <Input placeholder="ঐচ্ছিক বিবরণ..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ─── STEP 2: Question Selection ──────────────────────────────

  const StepQuestions = () => {
    const mcqs = questionBank.mcqs || []
    const selectedMcqs = selectedQuestions.filter(q => q.questionType === 'mcq')

    return (
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-violet-600" /> প্রশ্ন যোগ করুন
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">প্রশ্ন ব্যাংক থেকে এক্সামের জন্য প্রশ্ন বাছাই করুন</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedMcqs.length > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
                  <FileQuestion className="h-3 w-3" /> {selectedMcqs.length} MCQ
                </Badge>
              )}
              {/* CQ badge removed - MCQ only */}
              <Badge variant="outline" className="text-xs">
                মোট নম্বর: {calculateTotalMarks()}
              </Badge>
            </div>
          </div>
        </div>
        <CardContent className="p-4 space-y-4">
          {!formClassLevel ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">আগে ক্লাস নির্বাচন করুন</p>
              <p className="text-xs mt-1">প্রশ্ন ব্যাংক থেকে প্রশ্ন আনতে ক্লাস ও বিষয় নির্বাচন আবশ্যক</p>
            </div>
          ) : (
            <>
              {/* Search + Upload bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="প্রশ্ন খুঁজুন..."
                    value={questionSearch}
                    onChange={(e) => {
                      setQuestionSearch(e.target.value)
                      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
                      searchDebounceRef.current = setTimeout(() => {
                        setDebouncedSearchQuery(e.target.value)
                      }, 400)
                    }}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs gap-1.5"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = '/api/admin/mcq/bulk-upload'
                      a.download = 'mcq-demo-template.xlsx'
                      a.click()
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> ডেমো এক্সেল
                  </Button>
                  <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 cursor-pointer transition-all shadow-sm">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? 'আপলোড হচ্ছে...' : 'এক্সেল আপলোড'}
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleExcelUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Upload result */}
              {uploadResult && (
                <div className={cn(
                  'p-3 rounded-xl border text-xs',
                  uploadResult.failed > 0
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/30 dark:border-amber-800/20'
                    : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-800/20'
                )}>
                  <p className={cn(
                    'font-semibold flex items-center gap-1.5 mb-1',
                    uploadResult.failed > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                  )}>
                    {uploadResult.failed > 0 ? <AlertCircle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {uploadResult.message}
                  </p>
                  {uploadResult.errors.length > 0 && (
                    <div className="mt-1 max-h-24 overflow-y-auto space-y-0.5 text-amber-600 dark:text-amber-400">
                      {uploadResult.errors.slice(0, 10).map((err, idx) => (
                        <p key={idx}>• {err}</p>
                      ))}
                      {uploadResult.errors.length > 10 && (
                        <p>... আরও {uploadResult.errors.length - 10}টি ত্রুটি</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Selected questions summary */}
              {selectedQuestions.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                    <Check className="h-3 w-3" /> নির্বাচিত প্রশ্ন ({selectedQuestions.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMcqs.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <FileQuestion className="h-2.5 w-2.5" /> {selectedMcqs.length} MCQ
                      </Badge>
                    )}
                    {/* CQ count removed - MCQ only */}
                    <button
                      type="button"
                      className="text-[10px] text-destructive hover:underline"
                      onClick={() => setSelectedQuestions([])}
                    >
                      সব সরান
                    </button>
                  </div>
                </div>
              )}

              {loadingQuestions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : (
                <>
                  {/* MCQ Questions */}
                  {mcqs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                          <FileQuestion className="h-3 w-3" /> MCQ প্রশ্ন ({mcqs.length})
                        </h4>
                        <div className="flex items-center gap-1.5">
                          {mcqs.every(m => isQuestionSelected('mcq', m.id)) ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] gap-1 text-destructive hover:text-destructive"
                              onClick={deselectAllMcqs}
                            >
                              <X className="h-3 w-3" /> সব সরান
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700"
                              onClick={selectAllMcqs}
                            >
                              <CheckSquare className="h-3 w-3" /> সব নির্বাচন
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                        {mcqs.map((mcq) => {
                          const selected = isQuestionSelected('mcq', mcq.id)
                          return (
                            <button
                              key={mcq.id}
                              type="button"
                              className={cn(
                                'w-full text-left p-3 rounded-xl border transition-all',
                                selected
                                  ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                                  : 'border-border/40 hover:border-border hover:bg-muted/30',
                              )}
                              onClick={() => toggleQuestion('mcq', mcq.id)}
                            >
                              <div className="flex items-start gap-2">
                                <div className={cn(
                                  'mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                                  selected
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : 'border-muted-foreground/30',
                                )}>
                                  {selected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm line-clamp-2">
                                    <RichContentRenderer content={mcq.question} inline />
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {mcq.chapter && (
                                      <Badge variant="outline" className="text-[9px] h-4 px-1">{mcq.chapter.name}</Badge>
                                    )}
                                    {mcq.topic && (
                                      <span className="text-[10px] text-muted-foreground">{mcq.topic}</span>
                                    )}
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                      {difficultyLabels[mcq.difficulty] || mcq.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                                {selected && (
                                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] shrink-0">
                                    {formMarksPerMcq} নম্বর
                                  </Badge>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty states */}
                  {mcqs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">এই ক্লাস/বিষয়ে কোনো প্রশ্ন পাওয়া যায়নি</p>
                      <p className="text-xs mt-1">আগে MCQ ব্যবস্থাপনা থেকে প্রশ্ন যোগ করুন</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // ─── STEP 3: Settings ────────────────────────────────────────

  const StepSettings = () => (
    <Card className="border-border/50 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 px-4 py-3 border-b border-border/30">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-orange-600" /> এক্সাম সেটিংস
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">মার্কস বণ্টন, নেগেটিভ মার্কিং ও অন্যান্য সেটিংস</p>
      </div>
      <CardContent className="p-4 space-y-4">
        {/* Marks distribution */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">মার্কস বণ্টন</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">প্রতি MCQ নম্বর</Label>
              <Input
                type="number"
                placeholder="1"
                value={formMarksPerMcq}
                onChange={(e) => {
                  setFormMarksPerMcq(e.target.value)
                  // Update selected MCQ marks
                  setSelectedQuestions(prev => prev.map(q =>
                    q.questionType === 'mcq' ? { ...q, marks: parseFloat(e.target.value) || 1 } : q
                  ))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">নেগেটিভ মার্কিং (ভুল প্রতি)</Label>
              <Input
                type="number"
                placeholder="0"
                step="0.25"
                value={formNegativeMarks}
                onChange={(e) => setFormNegativeMarks(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">স্বয়ংক্রিয় মোট নম্বর</Label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted/30 text-sm font-semibold">
                {calculateTotalMarks()} নম্বর
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Instructions */}
        <div className="space-y-2">
          <Label className="text-xs">পরীক্ষার্থীদের নির্দেশনা</Label>
          <Textarea
            placeholder="পরীক্ষার্থীদের জন্য নির্দেশনা লিখুন... (যেমন: সকল প্রশ্নের উত্তর দিন, নেগেটিভ মার্কিং আছে...)"
            value={formInstructions}
            onChange={(e) => setFormInstructions(e.target.value)}
            rows={3}
          />
        </div>

        <Separator />

        {/* Premium */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <Label className="text-sm font-medium">প্রিমিয়াম এক্সাম</Label>
              <p className="text-xs text-muted-foreground">প্রিমিয়াম হিসেবে চিহ্নিত করুন</p>
            </div>
          </div>
          <Switch checked={formIsPremium} onCheckedChange={setFormIsPremium} />
        </div>
        {formIsPremium && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
            <Label className="text-xs">মূল্য (৳)</Label>
            <Input placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
          </motion.div>
        )}
      </CardContent>
    </Card>
  )

  // ─── STEP 4: Review ──────────────────────────────────────────

  const StepReview = () => {
    const mcqCount = selectedQuestions.filter(q => q.questionType === 'mcq').length
    const cqCount = selectedQuestions.filter(q => q.questionType === 'cq').length
    const totalQ = selectedQuestions.length
    const isValid = formTitle && formClassLevel && formDuration && totalQ > 0

    return (
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-600" /> চূড়ান্ত পর্যালোচনা
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">সব তথ্য ঠিক আছে কিনা যাচাই করুন, তারপর প্রকাশ করুন</p>
        </div>
        <CardContent className="p-4 space-y-4">
          {/* Summary card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-2xl font-bold text-emerald-600">{totalQ}</p>
              <p className="text-[10px] text-muted-foreground">মোট প্রশ্ন</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-2xl font-bold text-violet-600">{calculateTotalMarks()}</p>
              <p className="text-[10px] text-muted-foreground">মোট নম্বর</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-2xl font-bold text-amber-600">{formDuration}</p>
              <p className="text-[10px] text-muted-foreground">মিনিট</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-2xl font-bold text-rose-600">{formNegativeMarks || 0}</p>
              <p className="text-[10px] text-muted-foreground">নেগেটিভ</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">শিরোনাম</span>
              <span className="text-sm font-medium">{formTitle}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">ক্লাস</span>
              <Badge variant="outline">{classLabelMap[formClassLevel] || formClassLevel}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">ধরন</span>
              <Badge className={typeColors.mcq}>{typeLabels.mcq}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">প্রশ্ন বিবরণ</span>
              <div className="flex items-center gap-1.5">
                {mcqCount > 0 && <Badge variant="secondary" className="text-xs gap-0.5"><FileQuestion className="h-2.5 w-2.5" />{mcqCount} MCQ</Badge>}
                {/* CQ badge removed - MCQ only */}
              </div>
            </div>
            {formIsPremium && (
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">প্রিমিয়াম</span>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
                  <Crown className="h-3 w-3" /> ৳{formPrice || 0}
                </Badge>
              </div>
            )}
          </div>

          {/* Validation warnings */}
          {!isValid && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/20">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> নিচের তথ্য পূরণ করুন:
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-red-600 dark:text-red-400">
                {!formTitle && <li>• শিরোনাম আবশ্যক</li>}
                {!formClassLevel && <li>• ক্লাস নির্বাচন আবশ্যক</li>}
                {totalQ === 0 && <li>• কমপক্ষে ১টি প্রশ্ন যোগ করুন</li>}
              </ul>
            </div>
          )}

          {/* Publish options */}
          {isValid && (
            <div className="p-4 rounded-xl border border-emerald-200/40 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-600" /> এক্সাম সংরক্ষণ করুন
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleSave('published')}
                  disabled={saving}
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : <><Send className="h-4 w-4" /> প্রকাশ করুন</>}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : <><Edit className="h-4 w-4" /> খসড়া হিসেবে সংরক্ষণ</>}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ─── LIST VIEW ────────────────────────────────────────────────

  const ListView = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </div>
      )
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              এক্সাম ব্যবস্থাপনা
            </h1>
            <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {exams.length}টি এক্সাম</p>
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/20"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> নতুন এক্সাম
          </Button>
        </div>

        {/* Flow explanation */}
        <Card className="border-border/50 bg-gradient-to-r from-violet-50/30 to-purple-50/30 dark:from-violet-950/10 dark:to-purple-950/10">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">এক্সাম তৈরির ধাপ</p>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { icon: ClipboardCheck, label: 'মৌলিক তথ্য', desc: 'নাম, ক্লাস, টাইপ' },
                { icon: ListChecks, label: 'প্রশ্ন যোগ', desc: 'ব্যাংক থেকে বাছাই' },
                { icon: Settings2, label: 'সেটিংস', desc: 'মার্কস, নেগেটিভ' },
                { icon: Send, label: 'প্রকাশ', desc: 'চূড়ান্ত যাচাই' },
              ].map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/60 border border-border/30">
                    <step.icon className="h-4 w-4 text-violet-600" />
                    <div>
                      <p className="text-xs font-semibold">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                  {idx < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 hidden sm:block" />}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exam grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam, idx) => {
            const statusCfg = statusConfig[exam.status] || statusConfig.draft
            const StatusIcon = statusCfg.icon
            const mcqCount = exam.questions?.filter(q => q.questionType === 'mcq').length || 0
            const cqCount = exam.questions?.filter(q => q.questionType === 'cq').length || 0

            return (
              <motion.div key={exam.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="hover:shadow-lg hover:shadow-violet-500/5 transition-all border-border/50 h-full">
                  <CardContent className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={typeColors[exam.type] || ''}>{typeLabels[exam.type] || exam.type}</Badge>
                        <Badge className={statusCfg.color}>
                          <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                          {statusCfg.label}
                        </Badge>
                        {exam.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm mb-2 line-clamp-1">{exam.title}</h3>

                    {/* Questions info */}
                    <div className="flex items-center gap-2 mb-3">
                      {(mcqCount > 0 || cqCount > 0) ? (
                        <>
                          {mcqCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-0.5 h-5">
                              <FileQuestion className="h-2.5 w-2.5" /> {mcqCount} MCQ
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-5 text-amber-600 border-amber-300">
                          কোনো প্রশ্ন নেই
                        </Badge>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration} মিনিট</span>
                      <span>{classLabelMap[exam.classLevel] || exam.classLevel}</span>
                      <span>{exam.totalMarks} নম্বর</span>
                    </div>

                    {/* Stats + Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {exam._count?.results || 0} জন অংশগ্রহণ
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-50 dark:hover:bg-violet-950/30" onClick={() => openEdit(exam)} title="সম্পাদনা">
                          <Edit className="h-3.5 w-3.5 text-violet-600" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {exam.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(exam.id, 'published')}>
                                <Send className="h-4 w-4 mr-2" /> প্রকাশ করুন
                              </DropdownMenuItem>
                            )}
                            {exam.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(exam.id, 'archived')}>
                                <Archive className="h-4 w-4 mr-2" /> সংরক্ষণ করুন
                              </DropdownMenuItem>
                            )}
                            {exam.status === 'archived' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(exam.id, 'draft')}>
                                <RotateCcw className="h-4 w-4 mr-2" /> খসড়ায় ফেরান
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(exam.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> মুছুন
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          {exams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">কোনো এক্সাম পাওয়া যায়নি</p>
              <p className="text-sm mt-1">নতুন এক্সাম তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // ─── EDITOR VIEW ──────────────────────────────────────────────

  const EditorView = () => (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: 'easeOut' } as const}
      className="space-y-0"
    >
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => { setViewMode('list'); resetForm() }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {editId ? <><Edit className="h-5 w-5 text-violet-600" /> এক্সাম সম্পাদনা</> : <><Sparkles className="h-5 w-5 text-violet-600" /> নতুন এক্সাম</>}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setViewMode('list'); resetForm() }}>
            <X className="h-4 w-4" /> বাতিল
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-1">
          {steps.map((step, idx) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    isActive && 'bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 font-semibold',
                    isCompleted && 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
                    !isActive && !isCompleted && 'text-muted-foreground hover:bg-muted/30',
                  )}
                  onClick={() => {
                    // Allow navigating to completed or current steps
                    if (isCompleted || isActive) setCurrentStep(step.id)
                  }}
                >
                  <div className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                    isActive && 'bg-violet-600 text-white',
                    isCompleted && 'bg-emerald-600 text-white',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                  )}>
                    {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs leading-tight">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{step.description?.replace(/<[^>]*>/g, '')}</p>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && StepBasicInfo()}
          {currentStep === 2 && StepQuestions()}
          {currentStep === 3 && StepSettings()}
          {currentStep === 4 && StepReview()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4" /> আগের ধাপ
        </Button>
        {currentStep < 4 ? (
          <Button
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
          >
            পরের ধাপ <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => handleSave('draft')} disabled={saving}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : <><Edit className="h-4 w-4" /> খসড়া সংরক্ষণ</>}
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={() => handleSave('published')} disabled={saving}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : <><Send className="h-4 w-4" /> প্রকাশ করুন</>}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )

  // ─── DELETE CONFIRMATION ──────────────────────────────────────

  const DeleteConfirm = () => (
    <AnimatePresence>
      {!!deleteId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">এক্সাম মুছুন</h3>
              <p className="text-sm text-muted-foreground mb-6">আপনি কি নিশ্চিত? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="outline" onClick={() => setDeleteId(null)} className="min-w-20">বাতিল</Button>
                <Button variant="destructive" onClick={handleDelete} className="min-w-20">মুছুন</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ─── MAIN RENDER ──────────────────────────────────────────────

  return (
    <>
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? <React.Fragment key="list">{ListView()}</React.Fragment> : <React.Fragment key="editor">{EditorView()}</React.Fragment>}
      </AnimatePresence>
      {DeleteConfirm()}
    </>
  )
}
