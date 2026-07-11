'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useTableSelection } from '@/hooks/use-table-selection'
import { useToast } from '@/hooks/use-toast'
import { AlignLeft } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import type { CQRecord, ClassItem, SubjectItem, ChapterItem, ViewMode, StepNumber } from './cq/types'
import { emptyForm } from './cq/types'
import CQEditorView from './cq/CQEditorView'
import CQListView from './cq/CQListView'

export default function AdminCQPage() {
  const { toast } = useToast()

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

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentStep, setCurrentStep] = useState<StepNumber>(1)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  const { boardOptions, classLevelLabels: classLabelMap, boardSlugToLabel: boardLabelMap } = useHierarchyMetadata()

  const classSlug = classes.find((c) => c.id === form.classId)?.slug || ''

  const selection = useTableSelection(cqs)

  useEffect(() => {
    fetch('/api/admin/classes').then(r => r.json()).then(j => setClasses(Array.isArray(j.data) ? j.data : [])).catch(() => {
      toast({ title: 'ত্রুটি', description: 'ক্লাস লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    })
  }, [toast])

  const fetchSubjects = useCallback(async (classId: string) => {
    if (!classId) { setSubjects([]); return }
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`)
      const json = await res.json()
      setSubjects(Array.isArray(json.data) ? json.data : [])
    } catch {
      toast({ title: 'ত্রুটি', description: 'বিষয় লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
  }, [toast])

  const fetchChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) { setChapters([]); return }
    try {
      const res = await fetch(`/api/admin/chapters?subjectId=${subjectId}`)
      const json = await res.json()
      setChapters(Array.isArray(json.data) ? json.data : [])
    } catch {
      toast({ title: 'ত্রুটি', description: 'অধ্যায় লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
  }, [toast])

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
  }, [page, search, classFilter, boardFilter, yearFilter, difficultyFilter, premiumFilter, toast])

  useEffect(() => { fetchCqs() }, [fetchCqs])

  useEffect(() => {
    if (form.classId) {
      fetchSubjects(form.classId)
      setForm(f => ({ ...f, subjectId: '', chapterId: '' }))
    } else { setSubjects([]); setChapters([]) }
  }, [form.classId, fetchSubjects])

  useEffect(() => {
    if (form.subjectId) {
      fetchChapters(form.subjectId)
      setForm(f => ({ ...f, chapterId: '' }))
    } else { setChapters([]) }
  }, [form.subjectId, fetchChapters])

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/cq?ids=${ids.join(',')}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'মুছে ফেলা হয়েছে' })
        selection.clearSelection()
        fetchCqs()
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }, [selection, fetchCqs, toast])

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

  if (loading && cqs.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (viewMode === 'editor') {
    return (
      <CQEditorView
        editId={editId}
        currentStep={currentStep}
        form={form}
        setForm={setForm}
        classes={classes}
        subjects={subjects}
        chapters={chapters}
        boardOptions={boardOptions}
        boardLabelMap={boardLabelMap}
        classSlug={classSlug}
        setViewMode={setViewMode}
        handleSave={handleSave}
        canGoNext={canGoNext}
        goNext={goNext}
        goPrev={goPrev}
        saving={saving}
      />
    )
  }

  return (
    <CQListView
      total={total}
      cqs={cqs}
      loading={loading}
      page={page}
      perPage={perPage}
      setPage={setPage}
      search={search}
      setSearch={setSearch}
      classFilter={classFilter}
      setClassFilter={setClassFilter}
      boardFilter={boardFilter}
      setBoardFilter={setBoardFilter}
      yearFilter={yearFilter}
      setYearFilter={setYearFilter}
      difficultyFilter={difficultyFilter}
      setDifficultyFilter={setDifficultyFilter}
      premiumFilter={premiumFilter}
      setPremiumFilter={setPremiumFilter}
      classes={classes}
      boardOptions={boardOptions}
      classLabelMap={classLabelMap}
      boardLabelMap={boardLabelMap}
      selection={selection}
      openEdit={openEdit}
      openCreate={openCreate}
      setDeleteId={setDeleteId}
      handleBulkDelete={handleBulkDelete}
      fetchCqs={fetchCqs}
      bulkImportOpen={bulkImportOpen}
      setBulkImportOpen={setBulkImportOpen}
      deleteId={deleteId}
      handleDelete={handleDelete}
    />
  )
}
