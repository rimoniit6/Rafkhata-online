'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { deserializeBlocks, serializeBlocks } from '@/components/ui/content-block-editor'
import { processContentBlocks } from '@/lib/math-converter'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { ListView } from './suggestions/ListView'
import { EditorView } from './suggestions/EditorView'
import { DeleteConfirm } from './suggestions/DeleteConfirm'
import type { SuggestionRecord, ClassItem, SubjectItem, ChapterItem } from './suggestions/types'
import type { ContentBlock } from '@/components/ui/content-block-editor'

export default function AdminSuggestionPage() {
  const { toast } = useToast()
  const { classLevelLabels } = useHierarchyMetadata()
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Filters
  const [filterClassId, setFilterClassId] = useState('')
  const [filterIsPremium, setFilterIsPremium] = useState('')

  // View mode: 'list' | 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid')

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formChapterId, setFormChapterId] = useState('')
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>([])
  const [formPdfUrl, setFormPdfUrl] = useState('')
  const [formThumbnail, setFormThumbnail] = useState('')
  const [formIsPremium, setFormIsPremium] = useState(false)
  const [formPrice, setFormPrice] = useState('')
  const [formOrder, setFormOrder] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit')

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  useEffect(() => {
    fetch('/api/admin/classes').then(r => r.json()).then(j => setClasses(Array.isArray(j.data) ? j.data : [])).catch((err) => {
      console.error('[AdminSuggestion] Failed to load classes:', err)
    })
  }, [])

  const fetchSubjects = useCallback(async (classId: string) => {
    if (!classId) { setSubjects([]); return }
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`)
      const json = await res.json()
      setSubjects(Array.isArray(json.data) ? json.data : [])
    } catch { /* */ }
  }, [])

  const fetchChapters = useCallback(async (subjectId: string) => {
    if (!subjectId) { setChapters([]); return }
    try {
      const res = await fetch(`/api/admin/chapters?subjectId=${subjectId}`)
      const json = await res.json()
      setChapters(Array.isArray(json.data) ? json.data : [])
    } catch { /* */ }
  }, [])

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterClassId) params.set('classId', filterClassId)
      if (filterIsPremium) params.set('isPremium', filterIsPremium)
      params.set('page', '1')
      params.set('limit', '20')
      const res = await fetch(`/api/admin/suggestions?${params}`)
      if (res.ok) {
        const json = await res.json()
        const suggestionsData = json.data?.suggestions ?? json.data ?? []
        setSuggestions(suggestionsData.filter((s: SuggestionRecord) => s.id))
        setTotal(json.data?.pagination?.total ?? json.pagination?.total ?? 0)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [search, filterClassId, filterIsPremium])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  // Cascade: classId -> subjects
  useEffect(() => {
    if (formClassId) { fetchSubjects(formClassId); setFormSubjectId(''); setFormChapterId('') }
    else { setSubjects([]); setChapters([]) }
  }, [formClassId, fetchSubjects])

  // Cascade: subjectId -> chapters
  useEffect(() => {
    if (formSubjectId) { fetchChapters(formSubjectId); setFormChapterId('') }
    else { setChapters([]) }
  }, [formSubjectId, fetchChapters])

  const resetForm = () => {
    setFormTitle('')
    setFormClassId('')
    setFormSubjectId('')
    setFormChapterId('')
    setFormBlocks([])
    setFormPdfUrl('')
    setFormThumbnail('')
    setFormIsPremium(false)
    setFormPrice('')
    setFormOrder('')
    setFormIsActive(true)
    setSubjects([])
    setChapters([])
    setEditorTab('edit')
  }

  const openCreate = () => {
    setEditId(null)
    resetForm()
    setViewMode('editor')
  }

  const openEdit = (suggestion: SuggestionRecord) => {
    setEditId(suggestion.id)
    setFormTitle(suggestion.title)
    setFormBlocks(deserializeBlocks(suggestion.content))
    setFormPdfUrl(suggestion.pdfUrl || '')
    setFormThumbnail(suggestion.thumbnail || '')
    setFormIsPremium(suggestion.isPremium)
    setFormPrice(suggestion.price ? String(suggestion.price) : '')
    setFormOrder(String(suggestion.order))
    setFormIsActive(suggestion.isActive)

    if (suggestion.class?.id) {
      setFormClassId(suggestion.class.id)
      fetchSubjects(suggestion.class.id)
    } else if (suggestion.class?.slug) {
      setFormClassId(suggestion.class.slug)
      fetchSubjects(suggestion.class.slug)
    } else {
      setFormClassId('')
    }
    if (suggestion.subject?.id) {
      setFormSubjectId(suggestion.subject.id)
      fetchChapters(suggestion.subject.id)
    } else {
      setFormSubjectId('')
    }
    if (suggestion.chapterId) {
      setFormChapterId(suggestion.chapterId)
    } else {
      setFormChapterId('')
    }

    setEditorTab('edit')
    setViewMode('editor')
  }

  const handleSave = async () => {
    if (!formTitle) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        title: formTitle,
        content: formBlocks.length > 0 ? serializeBlocks(processContentBlocks(formBlocks)) : '<p>কন্টেন্ট যোগ করা হবে</p>',
        classId: formClassId || undefined,
        subjectId: formSubjectId || undefined,
        chapterId: formChapterId || undefined,
        thumbnail: formThumbnail || undefined,
        pdfUrl: formPdfUrl || undefined,
        isPremium: formIsPremium,
        price: formIsPremium ? parseFloat(formPrice) || 0 : 0,
        order: parseInt(formOrder) || 0,
        isActive: formIsActive,
      }

      const res = editId
        ? await fetch('/api/admin/suggestions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'সাজেশন আপডেট হয়েছে' : 'সাজেশন তৈরি হয়েছে' })
        setViewMode('list')
        fetchSuggestions()
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
      const res = await fetch(`/api/admin/suggestions?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'সাজেশন মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchSuggestions() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  return (
    <AnimatePresence mode="wait">
      {viewMode === 'list' ? (
        <ListView
          loading={loading}
          suggestions={suggestions}
          total={total}
          search={search}
          setSearch={setSearch}
          filterClassId={filterClassId}
          setFilterClassId={setFilterClassId}
          filterIsPremium={filterIsPremium}
          setFilterIsPremium={setFilterIsPremium}
          viewStyle={viewStyle}
          setViewStyle={setViewStyle}
          classes={classes}
          openCreate={openCreate}
          openEdit={openEdit}
          setDeleteId={setDeleteId}
        />
      ) : (
        <EditorView
          editId={editId}
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
          formPdfUrl={formPdfUrl}
          setFormPdfUrl={setFormPdfUrl}
          formThumbnail={formThumbnail}
          setFormThumbnail={setFormThumbnail}
          formIsPremium={formIsPremium}
          setFormIsPremium={setFormIsPremium}
          formPrice={formPrice}
          setFormPrice={setFormPrice}
          formOrder={formOrder}
          setFormOrder={setFormOrder}
          formIsActive={formIsActive}
          setFormIsActive={setFormIsActive}
          editorTab={editorTab}
          setEditorTab={setEditorTab}
          classes={classes}
          subjects={subjects}
          chapters={chapters}
          saving={saving}
          setViewMode={setViewMode}
          resetForm={resetForm}
          handleSave={handleSave}
        />
      )}
      <DeleteConfirm deleteId={deleteId} setDeleteId={setDeleteId} handleDelete={handleDelete} />
    </AnimatePresence>
  )
}
