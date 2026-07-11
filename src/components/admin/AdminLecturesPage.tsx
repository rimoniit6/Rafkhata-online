'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { deserializeBlocks, serializeBlocks } from '@/components/ui/content-block-editor'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useToast } from '@/hooks/use-toast'
import { useTableSelection } from '@/hooks/use-table-selection'
import { processContentBlocks } from '@/lib/math-converter'
import type { LectureRecord, ClassItem, SubjectItem, ChapterItem, StepNumber } from './lectures/types'
import { steps } from './lectures/types'
import ListView from './lectures/ListView'
import EditorView from './lectures/EditorView'
import DeleteConfirm from './lectures/DeleteConfirm'

export default function AdminLecturesPage() {
  const { toast } = useToast()
  const { classLevelLabels } = useHierarchyMetadata()
  const [loading, setLoading] = useState(true)
  const [lectures, setLectures] = useState<LectureRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [currentStep, setCurrentStep] = useState<StepNumber>(1)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid')

  const [formTitle, setFormTitle] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formChapterId, setFormChapterId] = useState('')
  const [formBlocks, setFormBlocks] = useState<import('@/components/ui/content-block-editor').ContentBlock[]>([])
  const [formVideoUrl, setFormVideoUrl] = useState('')
  const [formAudioUrl, setFormAudioUrl] = useState('')
  const [formPdfUrl, setFormPdfUrl] = useState('')
  const [formThumbnail, setFormThumbnail] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formIsPremium, setFormIsPremium] = useState(false)
  const [formPrice, setFormPrice] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  const [page, setPage] = useState(1)
  const perPage = 50

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  const selection = useTableSelection(lectures)

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

  const fetchLectures = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      params.set('page', String(page))
      params.set('limit', String(perPage))
      const res = await fetch(`/api/admin/lectures?${params}`)
      if (res.ok) {
        const json = await res.json()
        setLectures(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total || 0)
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'লেকচার লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    }
    finally { setLoading(false) }
  }, [search, page, toast])

  useEffect(() => { fetchLectures() }, [fetchLectures])

  useEffect(() => {
    if (formClassId) { fetchSubjects(formClassId); setFormSubjectId(''); setFormChapterId('') }
    else { setSubjects([]); setChapters([]) }
  }, [formClassId, fetchSubjects])

  useEffect(() => {
    if (formSubjectId) { fetchChapters(formSubjectId); setFormChapterId('') }
    else { setChapters([]) }
  }, [formSubjectId, fetchChapters])

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/lectures?ids=${ids.join(',')}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'মুছে ফেলা হয়েছে' })
        selection.clearSelection()
        fetchLectures()
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }, [selection, fetchLectures, toast])

  const resetForm = () => {
    setFormTitle('')
    setFormClassId('')
    setFormSubjectId('')
    setFormChapterId('')
    setFormBlocks([])
    setFormVideoUrl('')
    setFormAudioUrl('')
    setFormPdfUrl('')
    setFormThumbnail('')
    setFormDuration('')
    setFormIsPremium(false)
    setFormPrice('')
    setFormIsActive(true)
    setSubjects([])
    setChapters([])
    setCurrentStep(1)
  }

  const openCreate = () => {
    setEditId(null)
    resetForm()
    setViewMode('editor')
  }

  const openEdit = (lecture: LectureRecord) => {
    setEditId(lecture.id)
    setFormTitle(lecture.title)
    setFormChapterId(lecture.chapterId)
    setFormBlocks(deserializeBlocks(lecture.content))
    setFormVideoUrl(lecture.videoUrl || '')
    setFormAudioUrl(lecture.audioUrl || '')
    setFormPdfUrl(lecture.pdfUrl || '')
    setFormThumbnail(lecture.thumbnail || '')
    setFormDuration(String(lecture.duration))
    setFormIsPremium(lecture.isPremium)
    setFormPrice(lecture.price ? String(lecture.price) : '')
    setFormIsActive(lecture.isActive)
    const sub = lecture.chapter?.subject
    const cls = sub?.class
    if (cls?.id) {
      setFormClassId(cls.id)
      fetchSubjects(cls.id)
    } else if (cls?.slug) {
      const foundClass = classes.find(c => c.slug === cls.slug)
      if (foundClass) {
        setFormClassId(foundClass.id)
        fetchSubjects(foundClass.id)
      } else {
        setFormClassId(cls.slug)
        fetchSubjects(cls.slug)
      }
    }
    if (sub?.id) {
      setFormSubjectId(sub.id)
      fetchChapters(sub.id)
    }
    setCurrentStep(1)
    setViewMode('editor')
  }

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }
    if (!formChapterId) {
      toast({ title: 'ত্রুটি', description: 'অধ্যায় নির্বাচন করুন', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        title: formTitle,
        chapterId: formChapterId,
        content: formBlocks.length > 0 ? serializeBlocks(processContentBlocks(formBlocks)) : '<p>কন্টেন্ট যোগ করা হবে</p>',
        videoUrl: formVideoUrl || undefined,
        audioUrl: formAudioUrl || undefined,
        pdfUrl: formPdfUrl || undefined,
        thumbnail: formThumbnail || undefined,
        duration: parseInt(formDuration) || 0,
        isPremium: formIsPremium,
        price: formIsPremium ? parseFloat(formPrice) || 0 : 0,
        isActive: formIsActive,
      }

      const res = editId
        ? await fetch('/api/admin/lectures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/lectures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'লেকচার আপডেট হয়েছে' : 'লেকচার তৈরি হয়েছে' })
        setViewMode('list')
        fetchLectures()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'লেকচার সংরক্ষণ করতে সমস্যা হয়েছে। নেটওয়ার্ক সংযোগ পরীক্ষা করুন', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/lectures?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'লেকচার মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchLectures() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', description: 'লেকচার মুছতে সমস্যা হয়েছে', variant: 'destructive' }) }
  }

  const getContentPreview = (content: string) => {
    const stripMarkup = (text: string) =>
      text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    try {
      const blocks = deserializeBlocks(content)
      const textBlocks = blocks.filter(b => b.type === 'text' || b.type === 'heading' || b.type === 'math')
      if (textBlocks.length > 0) {
        const first = textBlocks[0] as { content: string }
        const plain = stripMarkup(first.content)
        return plain.slice(0, 80) + (plain.length > 80 ? '...' : '')
      }
    } catch { /* non-critical, just return fallback */ }
    const plain = stripMarkup(content || '')
    return plain.slice(0, 80) + (plain.length > 80 ? '...' : '')
  }

  const getBlockTypeBadges = (content: string) => {
    try {
      const blocks = deserializeBlocks(content)
      if (blocks.length > 0) {
        return [...new Set(blocks.map(b => b.type))]
      }
    } catch { /* non-critical, just return fallback */ }
    return []
  }

  const canGoNext = (): boolean => {
    if (currentStep === 1) {
      return !!(formTitle && formChapterId)
    }
    return true
  }

  const goNext = () => {
    if (currentStep < 3 && canGoNext()) setCurrentStep((s) => Math.min(s + 1, 3) as StepNumber)
  }

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep((s) => Math.max(s - 1, 1) as StepNumber)
  }

  const selectedClass = classes.find(c => c.id === formClassId)
  const selectedSubject = subjects.find(s => s.id === formSubjectId)
  const selectedChapter = chapters.find(c => c.id === formChapterId)

  return (
    <>
      {viewMode === 'list' ? (
        <ListView
          loading={loading}
          lectures={lectures}
          total={total}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          perPage={perPage}
          viewStyle={viewStyle}
          setViewStyle={setViewStyle}
          classLevelLabels={classLevelLabels}
          selection={selection}
          openEdit={openEdit}
          openCreate={openCreate}
          setDeleteId={setDeleteId}
          handleBulkDelete={handleBulkDelete}
          getContentPreview={getContentPreview}
          getBlockTypeBadges={getBlockTypeBadges}
        />
      ) : (
        <EditorView
          editId={editId}
          currentStep={currentStep}
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          formClassId={formClassId}
          setFormClassId={setFormClassId}
          formSubjectId={formSubjectId}
          setFormSubjectId={setFormSubjectId}
          formChapterId={formChapterId}
          setFormChapterId={setFormChapterId}
          formBlocks={formBlocks}
          setFormBlocks={setFormBlocks}
          formVideoUrl={formVideoUrl}
          setFormVideoUrl={setFormVideoUrl}
          formAudioUrl={formAudioUrl}
          setFormAudioUrl={setFormAudioUrl}
          formPdfUrl={formPdfUrl}
          setFormPdfUrl={setFormPdfUrl}
          formThumbnail={formThumbnail}
          setFormThumbnail={setFormThumbnail}
          formDuration={formDuration}
          setFormDuration={setFormDuration}
          formIsPremium={formIsPremium}
          setFormIsPremium={setFormIsPremium}
          formPrice={formPrice}
          setFormPrice={setFormPrice}
          formIsActive={formIsActive}
          setFormIsActive={setFormIsActive}
          classes={classes}
          subjects={subjects}
          chapters={chapters}
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
          selectedChapter={selectedChapter}
          setViewMode={setViewMode}
          resetForm={resetForm}
          handleSave={handleSave}
          canGoNext={canGoNext}
          goNext={goNext}
          goPrev={goPrev}
          saving={saving}
        />
      )}
      <DeleteConfirm
        deleteId={deleteId}
        setDeleteId={setDeleteId}
        handleDelete={handleDelete}
      />
    </>
  )
}
