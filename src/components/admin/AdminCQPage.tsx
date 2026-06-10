'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Crown,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  Check,
  ChevronDown,
  Eye,
  ImageIcon,
  Sigma,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import ImageUploader from '@/components/ui/image-uploader'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import BulkImportDialog from '@/components/admin/BulkImportDialog'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CQRecord {
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
  chapter?: { id: string; name: string }
}

interface ClassItem { id: string; name: string; slug: string }
interface SubjectItem { id: string; name: string; slug: string; classId: string }
interface ChapterItem { id: string; name: string; slug: string; subjectId: string }

type ViewMode = 'list' | 'editor'
type StepNumber = 1 | 2 | 3

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const difficultyLabels: Record<string, string> = { easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন' }
const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

// boardOptions and classLevelLabels are now loaded from the database via useHierarchyMetadata()

const steps: { num: StepNumber; label: string; icon: React.ElementType }[] = [
  { num: 1, label: 'উদ্দীপক ও প্রশ্ন', icon: AlignLeft },
  { num: 2, label: 'হায়ারার্কি ও মেটাডাটা', icon: BookOpen },
  { num: 3, label: 'প্রিভিউ ও প্রকাশ', icon: Eye },
]

const emptyForm = {
  uddeepok: '',
  uddeepokImage: '',
  question1: '', question2: '', question3: '', question4: '',
  question1Image: '', question2Image: '', question3Image: '', question4Image: '',
  answer1: '', answer2: '', answer3: '', answer4: '',
  answer1Image: '', answer2Image: '', answer3Image: '', answer4Image: '',
  classId: '', subjectId: '', chapterId: '',
  board: 'none',
  year: '',
  topic: '',
  difficulty: 'easy' as 'easy' | 'medium' | 'hard',
  isPremium: false,
  price: '',
}

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ currentStep }: { currentStep: StepNumber }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative overflow-x-auto">
        {/* Background connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted z-0" />
        {/* Active connecting line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
          style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
        />

        {steps.map((step) => {
          const isActive = step.num === currentStep
          const isCompleted = step.num < currentStep
          const Icon = step.icon

          return (
            <div key={step.num} className="flex flex-col items-center z-10 relative">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isActive
                    ? 'bg-background border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/20'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                  isActive ? 'text-emerald-600' : isCompleted ? 'text-emerald-500' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Question-Answer Pair Card                                          */
/* ------------------------------------------------------------------ */

function QAPairCard({
  number,
  question,
  questionImage,
  answer,
  answerImage,
  onQuestionChange,
  onQuestionImageChange,
  onAnswerChange,
  onAnswerImageChange,
}: {
  number: 1 | 2 | 3 | 4
  question: string
  questionImage: string
  answer: string
  answerImage: string
  onQuestionChange: (v: string) => void
  onQuestionImageChange: (v: string) => void
  onAnswerChange: (v: string) => void
  onAnswerImageChange: (v: string) => void
}) {
  const [open, setOpen] = useState(number === 1)
  const bengaliNums: Record<number, string> = { 1: '১', 2: '২', 3: '৩', 4: '৪' }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden border-2 hover:border-emerald-300 transition-colors">
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-950/40 dark:to-emerald-950/20">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm">
                  {bengaliNums[number]}
                </span>
                <div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    প্রশ্ন {bengaliNums[number]}
                  </span>
                  {question && (
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                      {question.substring(0, 60)}{question.length > 60 ? '...' : ''}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Question */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">প্রশ্ন {bengaliNums[number]}</Label>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sigma className="h-3 w-3" /> $...$ দিয়ে ম্যাথ লিখুন
                </span>
              </div>
              <Textarea
                placeholder={`প্রশ্ন ${bengaliNums[number]} লিখুন... (ম্যাথের জন্য $x^2$ ব্যবহার করুন)`}
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                rows={3}
                className="text-base min-h-[80px]"
              />
              <ImageUploader
                value={questionImage}
                onChange={onQuestionImageChange}
                placeholder={`প্রশ্ন ${bengaliNums[number]}-এর ছবি`}
              />
            </div>

            <Separator />

            {/* Answer */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">উত্তর {bengaliNums[number]}</Label>
              <Textarea
                placeholder={`উত্তর ${bengaliNums[number]} লিখুন... (ম্যাথের জন্য $x^2$ ব্যবহার করুন)`}
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                rows={5}
                className="text-base min-h-[120px]"
              />
              <ImageUploader
                value={answerImage}
                onChange={onAnswerImageChange}
                placeholder={`উত্তর ${bengaliNums[number]}-এর ছবি`}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminCQPage() {
  const { toast } = useToast()

  /* List state */
  const [loading, setLoading] = useState(true)
  const [cqs, setCqs] = useState<CQRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [boardFilter, setBoardFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [premiumFilter, setPremiumFilter] = useState('all')
  const [page, setPage] = useState(1)
  const perPage = 10

  /* View mode */
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentStep, setCurrentStep] = useState<StepNumber>(1)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  /* Hierarchy data */
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  /* Metadata from DB */
  const { boardOptions, classLevelLabels: classLabelMap, boardSlugToLabel: boardLabelMap } = useHierarchyMetadata()

  /* Derived classSlug from classes array */
  const classSlug = classes.find((c) => c.id === form.classId)?.slug || ''

  /* ---- Data fetching ---- */

  useEffect(() => {
    fetch('/api/admin/classes').then(r => r.json()).then(j => setClasses(Array.isArray(j.data) ? j.data : [])).catch(() => {
      toast({ title: 'ত্রুটি', description: 'ক্লাস লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    })
  }, [])



  const fetchSubjects = useCallback(async (classId: string) => {
    if (!classId) { setSubjects([]); return }
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`)
      const json = await res.json()
      setSubjects(Array.isArray(json.data) ? json.data : [])
    } catch {
      toast({ title: 'ত্রুটি', description: 'বিষয় লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
  }, [])

  const fetchChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) { setChapters([]); return }
    try {
      const res = await fetch(`/api/admin/chapters?subjectId=${subjectId}`)
      const json = await res.json()
      setChapters(Array.isArray(json.data) ? json.data : [])
    } catch {
      toast({ title: 'ত্রুটি', description: 'অধ্যায় লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
  }, [])

  const fetchCqs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(perPage))
      if (search) params.set('q', search)
      if (classFilter !== 'all') params.set('classLevel', classFilter)
      if (boardFilter !== 'all') params.set('board', boardFilter)
      if (yearFilter !== 'all') params.set('year', yearFilter)
      if (difficultyFilter !== 'all') params.set('difficulty', difficultyFilter)
      if (premiumFilter === 'premium') params.set('isPremium', 'true')
      else if (premiumFilter === 'free') params.set('isPremium', 'false')

      const res = await fetch(`/api/admin/cq?${params}`)
      if (res.ok) {
        const json = await res.json()
        setCqs(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total || 0)
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'CQ লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
    finally { setLoading(false) }
  }, [page, search, classFilter, boardFilter, yearFilter, difficultyFilter, premiumFilter])

  useEffect(() => { fetchCqs() }, [fetchCqs])

  /* Cascade: classId → subjects */
  useEffect(() => {
    if (form.classId) {
      fetchSubjects(form.classId)
      setForm(f => ({ ...f, subjectId: '', chapterId: '' }))
    } else { setSubjects([]); setChapters([]) }
  }, [form.classId, fetchSubjects])

  /* Cascade: subjectId → chapters */
  useEffect(() => {
    if (form.subjectId) {
      fetchChapters(form.subjectId)
      setForm(f => ({ ...f, chapterId: '' }))
    } else { setChapters([]) }
  }, [form.subjectId, fetchChapters])

  const totalPages = Math.ceil(total / perPage)

  /* ---- Handlers ---- */

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setSubjects([])
    setChapters([])
    setCurrentStep(1)
    setViewMode('editor')
  }

  const openEdit = (cq: CQRecord) => {
    setEditId(cq.id)
    /* Find the classId (CUID) from the classes array using classLevel slug */
    const classObj = classes.find((c) => c.slug === cq.classLevel)
    const resolvedClassId = classObj?.id || cq.classLevel

    setForm({
      uddeepok: cq.uddeepok,
      uddeepokImage: cq.uddeepokImage || '',
      question1: cq.question1, question2: cq.question2,
      question3: cq.question3, question4: cq.question4,
      question1Image: cq.question1Image || '', question2Image: cq.question2Image || '',
      question3Image: cq.question3Image || '', question4Image: cq.question4Image || '',
      answer1: cq.answer1, answer2: cq.answer2,
      answer3: cq.answer3, answer4: cq.answer4,
      answer1Image: cq.answer1Image || '', answer2Image: cq.answer2Image || '',
      answer3Image: cq.answer3Image || '', answer4Image: cq.answer4Image || '',
      classId: resolvedClassId,
      subjectId: cq.subjectId,
      chapterId: cq.chapterId,
      board: cq.board || 'none',
      year: cq.year || '',
      topic: cq.topic || '',
      difficulty: cq.difficulty as 'easy' | 'medium' | 'hard',
      isPremium: cq.isPremium,
      price: cq.price ? String(cq.price) : '',
    })
    if (resolvedClassId) fetchSubjects(resolvedClassId)
    if (cq.subjectId) fetchChapters(cq.subjectId)
    setCurrentStep(1)
    setViewMode('editor')
  }

  const handleSave = async () => {
    if (!form.uddeepok.trim()) {
      toast({ title: 'ত্রুটি', description: 'উদ্দীপক আবশ্যক', variant: 'destructive' })
      return
    }
    if (!form.question1.trim()) {
      toast({ title: 'ত্রুটি', description: 'প্রশ্ন ১ আবশ্যক', variant: 'destructive' })
      return
    }
    if (!form.answer1.trim()) {
      toast({ title: 'ত্রুটি', description: 'উত্তর ১ আবশ্যক', variant: 'destructive' })
      return
    }
    if (!form.classId || !form.subjectId || !form.chapterId) {
      toast({ title: 'ত্রুটি', description: 'শ্রেণি, বিষয় ও অধ্যায় নির্বাচন করুন', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        uddeepok: form.uddeepok,
        uddeepokImage: form.uddeepokImage || undefined,
        question1: form.question1, question2: form.question2,
        question3: form.question3, question4: form.question4,
        question1Image: form.question1Image || undefined, question2Image: form.question2Image || undefined,
        question3Image: form.question3Image || undefined, question4Image: form.question4Image || undefined,
        answer1: form.answer1, answer2: form.answer2,
        answer3: form.answer3, answer4: form.answer4,
        answer1Image: form.answer1Image || undefined, answer2Image: form.answer2Image || undefined,
        answer3Image: form.answer3Image || undefined, answer4Image: form.answer4Image || undefined,
        chapterId: form.chapterId,
        classLevel: classSlug,
        subjectId: form.subjectId,
        board: form.board === 'none' ? null : form.board,
        year: form.year || null,
        topic: form.topic || undefined,
        difficulty: form.difficulty,
        isPremium: form.isPremium,
        price: form.isPremium ? parseFloat(form.price) || 0 : 0,
      }

      const res = editId
        ? await fetch('/api/admin/cq', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/cq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'CQ আপডেট হয়েছে' : 'CQ তৈরি হয়েছে' })
        setViewMode('list')
        fetchCqs()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'CQ সংরক্ষণ করতে সমস্যা হয়েছে। নেটওয়ার্ক সংযোগ পরীক্ষা করুন', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/cq?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'CQ মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchCqs() }
      else { toast({ title: 'ত্রুটি', description: 'CQ মুছতে সমস্যা হয়েছে', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' }) }
  }

  /* Step navigation helpers */
  const canGoNext = (): boolean => {
    if (currentStep === 1) {
      return !!(form.uddeepok && form.question1 && form.answer1)
    }
    if (currentStep === 2) {
      return !!(form.classId && form.subjectId && form.chapterId && form.difficulty)
    }
    return true
  }

  const goNext = () => {
    if (currentStep < 3 && canGoNext()) setCurrentStep((s) => Math.min(s + 1, 3) as StepNumber)
  }

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((s) => Math.max(s - 1, 1) as StepNumber)
  }

  /* ---- Loading skeleton ---- */
  if (loading && cqs.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  /* ================================================================ */
  /*  EDITOR VIEW                                                      */
  /* ================================================================ */

  if (viewMode === 'editor') {
    const bengaliNums: Record<number, string> = { 1: '১', 2: '২', 3: '৩', 4: '৪' }
    const selectedSubject = subjects.find((s) => s.id === form.subjectId)
    const selectedChapter = chapters.find((ch) => ch.id === form.chapterId)
    const selectedClass = classes.find((c) => c.id === form.classId)

    return (
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {editId ? 'CQ সম্পাদনা' : 'নতুন CQ যোগ করুন'}
              </h1>
              <p className="text-sm text-muted-foreground">ধাপ {currentStep}/৩</p>
            </div>
          </div>
          {editId && (
            <Badge variant="outline" className="text-xs">ID: {editId.slice(-8)}</Badge>
          )}
        </div>

        {/* Step Indicator */}
        <Card>
          <CardContent className="p-6">
            <StepIndicator currentStep={currentStep} />
          </CardContent>
        </Card>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* ---- STEP 1: উদ্দীপক ও প্রশ্ন ---- */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Uddeepok */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlignLeft className="h-5 w-5 text-emerald-600" />
                    উদ্দীপক
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">উদ্দীপক লিখুন *</Label>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Sigma className="h-3 w-3" /> $...$ দিয়ে ম্যাথ লিখুন
                      </span>
                    </div>
                    <Textarea
                      placeholder="উদ্দীপক লিখুন... (ম্যাথের জন্য $x^2$ ব্যবহার করুন)"
                      value={form.uddeepok}
                      onChange={(e) => setForm({ ...form, uddeepok: e.target.value })}
                      rows={6}
                      className="text-base min-h-[150px]"
                    />
                  </div>
                  <ImageUploader
                    value={form.uddeepokImage}
                    onChange={(url) => setForm({ ...form, uddeepokImage: url })}
                    label="উদ্দীপকের ছবি"
                    placeholder="উদ্দীপকের ছবি আপলোড করুন"
                  />
                </CardContent>
              </Card>

              {/* Question-Answer Pairs */}
              {[1, 2, 3, 4].map((n) => (
                <QAPairCard
                  key={n}
                  number={n as 1 | 2 | 3 | 4}
                  question={form[`question${n}` as keyof typeof form] as string}
                  questionImage={form[`question${n}Image` as keyof typeof form] as string}
                  answer={form[`answer${n}` as keyof typeof form] as string}
                  answerImage={form[`answer${n}Image` as keyof typeof form] as string}
                  onQuestionChange={(v) => setForm({ ...form, [`question${n}`]: v })}
                  onQuestionImageChange={(v) => setForm({ ...form, [`question${n}Image`]: v })}
                  onAnswerChange={(v) => setForm({ ...form, [`answer${n}`]: v })}
                  onAnswerImageChange={(v) => setForm({ ...form, [`answer${n}Image`]: v })}
                />
              ))}

              {!form.uddeepok && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  * উদ্দীপক, প্রশ্ন ১ ও উত্তর ১ আবশ্যক
                </p>
              )}
            </motion.div>
          )}

          {/* ---- STEP 2: হায়ারার্কি ও মেটাডাটা ---- */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Hierarchy */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    শ্রেণি, বিষয় ও অধ্যায়
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Class - uses c.id as value */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">শ্রেণি *</Label>
                      <Select
                        value={form.classId}
                        onValueChange={(v) => setForm({ ...form, classId: v, subjectId: '', chapterId: '' })}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="শ্রেণি নির্বাচন" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.classId && classSlug && (
                        <p className="text-xs text-muted-foreground">Slug: {classSlug}</p>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">বিষয় *</Label>
                      <Select
                        value={form.subjectId}
                        onValueChange={(v) => setForm({ ...form, subjectId: v, chapterId: '' })}
                        disabled={!form.classId}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="বিষয় নির্বাচন" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chapter */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">অধ্যায় *</Label>
                      <Select
                        value={form.chapterId}
                        onValueChange={(v) => setForm({ ...form, chapterId: v })}
                        disabled={!form.subjectId}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="অধ্যায় নির্বাচন" />
                        </SelectTrigger>
                        <SelectContent>
                          {chapters.map((ch) => (
                            <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                    মেটাডাটা
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Board */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">বোর্ড</Label>
                      <Select
                        value={form.board}
                        onValueChange={(v) => setForm({ ...form, board: v })}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="বোর্ড নির্বাচন" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">কোনোটি নয়</SelectItem>
                          {boardOptions.map((b) => (
                            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Year */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">সাল</Label>
                      <Input
                        type="text"
                        placeholder="সাল লিখুন (যেমন: 2024)"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                        className="h-11 text-base"
                      />
                    </div>

                    {/* Topic */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">টপিক</Label>
                      <Input
                        placeholder="টপিক লিখুন (ঐচ্ছিক)"
                        value={form.topic}
                        onChange={(e) => setForm({ ...form, topic: e.target.value })}
                        className="h-11 text-base"
                      />
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">কঠিনতা *</Label>
                      <Select
                        value={form.difficulty}
                        onValueChange={(v) => setForm({ ...form, difficulty: v as 'easy' | 'medium' | 'hard' })}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">সহজ</SelectItem>
                          <SelectItem value="medium">মাঝারি</SelectItem>
                          <SelectItem value="hard">কঠিন</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Premium toggle + price */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">প্রিমিয়াম</Label>
                        <Switch
                          checked={form.isPremium}
                          onCheckedChange={(v) => setForm({ ...form, isPremium: v })}
                        />
                      </div>
                      {form.isPremium && (
                        <Input
                          placeholder="মূল্য (৳)"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="h-11 text-base"
                          type="number"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(!form.classId || !form.subjectId || !form.chapterId) && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  * শ্রেণি, বিষয় ও অধ্যায় আবশ্যক
                </p>
              )}
            </motion.div>
          )}

          {/* ---- STEP 3: প্রিভিউ ও প্রকাশ ---- */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Preview Card */}
              <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Eye className="h-5 w-5 text-emerald-600" />
                      CQ প্রিভিউ
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {form.isPremium && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1">
                          <Crown className="h-3 w-3" /> প্রিমিয়াম {form.price ? `৳${form.price}` : ''}
                        </Badge>
                      )}
                      <Badge className={difficultyColors[form.difficulty] || ''}>
                        {difficultyLabels[form.difficulty] || form.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Metadata row */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    {selectedClass && <Badge variant="outline">{selectedClass.name}</Badge>}
                    {selectedSubject && <Badge variant="outline">{selectedSubject.name}</Badge>}
                    {selectedChapter && <Badge variant="outline">{selectedChapter.name}</Badge>}
                    {form.board && form.board !== 'none' && (
                      <Badge variant="outline">{boardLabelMap[form.board] || form.board}</Badge>
                    )}
                    {form.year && (
                      <Badge variant="outline">{form.year}</Badge>
                    )}
                    {form.topic && <Badge variant="outline">{form.topic}</Badge>}
                  </div>

                  <Separator />

                  {/* Uddeepok */}
                  {form.uddeepok && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">উদ্দীপক</h3>
                      <div className="rounded-lg bg-muted/50 p-4 border">
                        <RichContentRenderer content={form.uddeepok} className="text-base leading-relaxed" />
                      </div>
                      {form.uddeepokImage && (
                        <div className="rounded-lg overflow-hidden border bg-muted/30">
                          <img src={form.uddeepokImage} alt="উদ্দীপকের ছবি" className="max-h-64 object-contain mx-auto" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question-Answer pairs */}
                  {[1, 2, 3, 4].map((n) => {
                    const q = form[`question${n}` as keyof typeof form] as string
                    const qImg = form[`question${n}Image` as keyof typeof form] as string
                    const a = form[`answer${n}` as keyof typeof form] as string
                    const aImg = form[`answer${n}Image` as keyof typeof form] as string
                    if (!q && !a) return null

                    return (
                      <div key={n} className="space-y-3">
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-muted-foreground">
                            প্রশ্ন {bengaliNums[n]}
                          </h4>
                          {q && (
                            <div className="rounded-lg bg-muted/50 p-3 border">
                              <RichContentRenderer content={q} className="text-base" />
                            </div>
                          )}
                          {qImg && (
                            <div className="rounded-lg overflow-hidden border bg-muted/30">
                              <img src={qImg} alt={`প্রশ্ন ${bengaliNums[n]}-এর ছবি`} className="max-h-48 object-contain mx-auto" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-muted-foreground">
                            উত্তর {bengaliNums[n]}
                          </h4>
                          {a && (
                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-200 dark:border-emerald-800">
                              <RichContentRenderer content={a} className="text-base" />
                            </div>
                          )}
                          {aImg && (
                            <div className="rounded-lg overflow-hidden border bg-muted/30">
                              <img src={aImg} alt={`উত্তর ${bengaliNums[n]}-এর ছবি`} className="max-h-48 object-contain mx-auto" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Premium & Publish */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                    প্রকাশনা সেটিংস
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3 flex-1">
                      <Switch
                        checked={form.isPremium}
                        onCheckedChange={(v) => setForm({ ...form, isPremium: v })}
                      />
                      <div>
                        <Label className="text-base font-semibold cursor-pointer">প্রিমিয়াম কন্টেন্ট</Label>
                        <p className="text-xs text-muted-foreground">প্রিমিয়াম সক্রিয় করলে শুধুমাত্র অর্থপ্রদানকারী ব্যবহারকারী দেখতে পাবেন</p>
                      </div>
                    </div>
                    {form.isPremium && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap">মূল্য:</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                          <Input
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            className="pl-7 h-11 w-32 text-base"
                            type="number"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {form.isPremium && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700 dark:text-amber-400">
                        এই CQ টি প্রিমিয়াম হিসেবে প্রকাশিত হবে {form.price ? `(৳${form.price})` : '(মূল্য নির্ধারণ করুন)'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Navigation Footer */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={goPrev} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> পূর্ববর্তী
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setViewMode('list')}>
              বাতিল
            </Button>
            {currentStep < 3 ? (
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={goNext}
                disabled={!canGoNext()}
              >
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 min-w-[160px]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট করুন' : 'প্রকাশ করুন'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  /* ================================================================ */
  /*  LIST VIEW                                                        */
  /* ================================================================ */

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlignLeft className="h-6 w-6 text-emerald-600" /> CQ ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">মোট {total}টি CQ</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setBulkImportOpen(true)}
          >
            <Upload className="h-4 w-4" /> বাল্ক ইম্পোর্ট
          </Button>
          <BulkImportDialog
            open={bulkImportOpen}
            onOpenChange={setBulkImportOpen}
            defaultType="cq"
            onSuccess={fetchCqs}
          />
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="h-4 w-4" /> নতুন CQ যোগ করুন
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="উদ্দীপক দিয়ে খুঁজুন..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="ক্লাস" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ক্লাস</SelectItem>
                {classes.map((c) => (<SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>))}
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
              onChange={(e) => {
                setYearFilter(e.target.value || 'all')
                setPage(1)
              }}
              className="w-full sm:w-32"
            />
            <Select value={difficultyFilter} onValueChange={(v) => { setDifficultyFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="কঠিনতা" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="easy">সহজ</SelectItem>
                <SelectItem value="medium">মাঝারি</SelectItem>
                <SelectItem value="hard">কঠিন</SelectItem>
              </SelectContent>
            </Select>
            <Select value={premiumFilter} onValueChange={(v) => { setPremiumFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="প্রিমিয়াম" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                <SelectItem value="free">ফ্রি</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>উদ্দীপক</TableHead>
                <TableHead className="hidden sm:table-cell">ক্লাস</TableHead>
                <TableHead className="hidden md:table-cell">অধ্যায়</TableHead>
                <TableHead className="hidden lg:table-cell">বোর্ড</TableHead>
                <TableHead className="hidden lg:table-cell">সাল</TableHead>
                <TableHead>কঠিনতা</TableHead>
                <TableHead>প্রিমিয়াম</TableHead>
                <TableHead className="w-20">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cqs.map((cq) => (
                <TableRow key={cq.id}>
                  <TableCell className="font-medium max-w-[200px] truncate"><RichContentRenderer content={cq.uddeepok} inline /></TableCell>
                  <TableCell className="hidden sm:table-cell">{classLabelMap[cq.classLevel] || cq.classLevel}</TableCell>
                  <TableCell className="hidden md:table-cell">{cq.chapter?.name || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {cq.board ? (boardLabelMap[cq.board] || cq.board) : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {cq.year || '-'}
                  </TableCell>
                  <TableCell><Badge className={difficultyColors[cq.difficulty] || ''}>{difficultyLabels[cq.difficulty] || cq.difficulty}</Badge></TableCell>
                  <TableCell>
                    {cq.isPremium ? (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 gap-1"><Crown className="h-3 w-3" />প্রিমিয়াম</Badge>
                    ) : (
                      <Badge variant="secondary">ফ্রি</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cq)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cq.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {cqs.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">কোনো CQ পাওয়া যায়নি</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} / {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CQ মুছুন</DialogTitle>
            <DialogDescription>আপনি কি নিশ্চিত যে এই CQ মুছে ফেলতে চান?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleDelete}>মুছুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
