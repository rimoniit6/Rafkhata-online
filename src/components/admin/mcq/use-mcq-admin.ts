'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { emptyForm, STEPS } from './constants'
import type { MCQRecord, MCQFormData, ClassItem, SubjectItem, ChapterItem, ViewMode, StepNumber } from './types'

const PER_PAGE = 10

interface UseMCQAdminReturn {
  loading: boolean; mcqs: MCQRecord[]; total: number
  search: string; setSearch: (v: string) => void
  classFilter: string; setClassFilter: (v: string) => void
  boardFilter: string; setBoardFilter: (v: string) => void
  yearFilter: string; setYearFilter: (v: string) => void
  difficultyFilter: string; setDifficultyFilter: (v: string) => void
  premiumFilter: string; setPremiumFilter: (v: string) => void
  page: number; setPage: (v: number) => void; totalPages: number
  deleteId: string | null; setDeleteId: (v: string | null) => void
  bulkImportOpen: boolean; setBulkImportOpen: (v: boolean) => void
  viewMode: ViewMode; currentStep: StepNumber
  setCurrentStep: (v: StepNumber) => void
  editId: string | null; saving: boolean
  form: MCQFormData; setForm: (v: MCQFormData | ((prev: MCQFormData) => MCQFormData)) => void
  classes: ClassItem[]; subjects: SubjectItem[]; chapters: ChapterItem[]
  formClassSlug: string
  isStep1Valid: boolean; isStep2Valid: boolean
  canGoNext: () => boolean
  boardOptions: { value: string; label: string }[]
  classLabelMap: Record<string, string>
  boardLabelMap: Record<string, string>
  openCreate: () => void
  openEdit: (mcq: MCQRecord) => void
  handleNext: () => void
  handlePrev: () => void
  saveMCQ: () => Promise<void>
  deleteMCQ: (id: string) => Promise<void>
  refreshMCQs: () => void
  fetchMcqs: (signal?: AbortSignal) => Promise<void>
  setViewMode: (v: ViewMode) => void
  setSubjects: (v: SubjectItem[] | ((prev: SubjectItem[]) => SubjectItem[])) => void
  setChapters: (v: ChapterItem[] | ((prev: ChapterItem[]) => ChapterItem[])) => void
}

export function useMCQAdmin(): UseMCQAdminReturn {
  const { toast } = useToast()
  const { boardOptions, classLevelLabels: classLabelMap, boardSlugToLabel: boardLabelMap } = useHierarchyMetadata()

  const [loading, setLoading] = useState(true)
  const [mcqs, setMcqs] = useState<MCQRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [boardFilter, setBoardFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [premiumFilter, setPremiumFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const perPage = PER_PAGE

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentStep, setCurrentStep] = useState<StepNumber>(1)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  const formClassSlug = useMemo(
    () => classes.find((c) => c.id === form.classId)?.slug || '',
    [classes, form.classId]
  )

  useEffect(() => {
    fetch('/api/admin/classes')
      .then((res) => res.json())
      .then((json) => setClasses(Array.isArray(json.data) ? json.data : []))
      .catch(() => {
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

  const fetchMcqs = useCallback(async (signal?: AbortSignal) => {
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

      const res = await fetch(`/api/admin/mcq?${params}`, { signal })
      if (res.ok) {
        const json = await res.json()
        setMcqs(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total ?? 0)
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'MCQ লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, classFilter, boardFilter, yearFilter, difficultyFilter, premiumFilter])

  useEffect(() => {
    const controller = new AbortController()
    fetchMcqs(controller.signal)
    return () => controller.abort()
  }, [fetchMcqs])

  useEffect(() => {
    if (form.classId) {
      fetchSubjects(form.classId)
      setForm((f) => ({ ...f, subjectId: '', chapterId: '' }))
    } else {
      setSubjects([]); setChapters([])
    }
  }, [form.classId, fetchSubjects])

  useEffect(() => {
    if (form.subjectId) {
      fetchChapters(form.subjectId)
      setForm((f) => ({ ...f, chapterId: '' }))
    } else {
      setChapters([])
    }
  }, [form.subjectId, fetchChapters])

  const totalPages = useMemo(() => Math.ceil(total / perPage), [total, perPage])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setSubjects([])
    setChapters([])
    setCurrentStep(1)
    setViewMode('editor')
  }

  const openEdit = (mcq: MCQRecord) => {
    setEditId(mcq.id)
    const matchedClass = classes.find((c) => c.slug === mcq.classLevel)
    const resolvedClassId = matchedClass?.id || mcq.classLevel
    setForm({
      question: mcq.question, questionImage: mcq.questionImage || '',
      optionA: mcq.optionA, optionAImage: mcq.optionAImage || '',
      optionB: mcq.optionB, optionBImage: mcq.optionBImage || '',
      optionC: mcq.optionC, optionCImage: mcq.optionCImage || '',
      optionD: mcq.optionD, optionDImage: mcq.optionDImage || '',
      correctAnswer: mcq.correctAnswer, explanation: mcq.explanation || '',
      explanationImage: mcq.explanationImage || '', classId: resolvedClassId,
      subjectId: mcq.subjectId, chapterId: mcq.chapterId,
      board: mcq.board || 'none', year: mcq.year || '', topic: mcq.topic || '',
      difficulty: mcq.difficulty, isPremium: mcq.isPremium,
      price: mcq.price ? String(mcq.price) : '', tags: mcq.tags || '',
    })
    if (resolvedClassId) fetchSubjects(resolvedClassId)
    if (mcq.subjectId) fetchChapters(mcq.subjectId)
    setCurrentStep(1)
    setViewMode('editor')
  }

  const isStep1Valid = useMemo(
    () => !!(form.question.trim() && form.optionA.trim() && form.optionB.trim() && form.optionC.trim() && form.optionD.trim() && form.correctAnswer),
    [form.question, form.optionA, form.optionB, form.optionC, form.optionD, form.correctAnswer]
  )
  const isStep2Valid = useMemo(
    () => !!(form.classId && form.subjectId && form.chapterId && form.difficulty),
    [form.classId, form.subjectId, form.chapterId, form.difficulty]
  )

  const canGoNext = useCallback(() => {
    if (currentStep === 1) return isStep1Valid
    if (currentStep === 2) return isStep2Valid
    return true
  }, [currentStep, isStep1Valid, isStep2Valid])

  const handleNext = () => { if (canGoNext() && currentStep < 3) setCurrentStep((currentStep + 1) as StepNumber) }
  const handlePrev = () => { if (currentStep > 1) setCurrentStep((currentStep - 1) as StepNumber) }

  const saveMCQ = async () => {
    const payload = {
      ...(editId ? { id: editId } : {}),
      question: form.question,
      questionImage: form.questionImage || null,
      optionA: form.optionA, optionAImage: form.optionAImage || null,
      optionB: form.optionB, optionBImage: form.optionBImage || null,
      optionC: form.optionC, optionCImage: form.optionCImage || null,
      optionD: form.optionD, optionDImage: form.optionDImage || null,
      correctAnswer: form.correctAnswer,
      explanation: form.explanation || null, explanationImage: form.explanationImage || null,
      classLevel: formClassSlug, subjectId: form.subjectId, chapterId: form.chapterId,
      board: form.board === 'none' ? null : form.board, year: form.year || null,
      topic: form.topic || null, difficulty: form.difficulty,
      isPremium: form.isPremium, price: form.price ? Number(form.price) : 0,
      tags: form.tags || null, isActive: true,
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/mcq', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok) {
        toast({ title: editId ? 'MCQ আপডেট হয়েছে' : 'MCQ তৈরি হয়েছে' })
        setViewMode('list')
        setPage(1)
        const controller = new AbortController()
        fetchMcqs(controller.signal)
      } else {
        toast({ title: 'ত্রুটি', description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteMCQ = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/mcq?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'MCQ মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        const controller = new AbortController()
        fetchMcqs(controller.signal)
      } else {
        toast({ title: 'ত্রুটি', description: 'মুছতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }

  const refreshMCQs = () => {
    const controller = new AbortController()
    fetchMcqs(controller.signal)
  }

  return {
    loading, mcqs, total,
    search, setSearch, classFilter, setClassFilter,
    boardFilter, setBoardFilter, yearFilter, setYearFilter,
    difficultyFilter, setDifficultyFilter, premiumFilter, setPremiumFilter,
    page, setPage, totalPages,
    deleteId, setDeleteId, bulkImportOpen, setBulkImportOpen,
    viewMode, currentStep, setCurrentStep,
    editId, saving, form, setForm,
    classes, subjects, chapters, formClassSlug,
    isStep1Valid, isStep2Valid, canGoNext,
    boardOptions, classLabelMap, boardLabelMap,
    openCreate, openEdit, handleNext, handlePrev, saveMCQ, deleteMCQ, refreshMCQs,
    fetchMcqs, setViewMode, setSubjects, setChapters,
  }
}
