'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  BookOpen,
  BookMarked,
  Hash,
  Calendar,
  Search,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ─── Board Options (now loaded from DB via useHierarchyMetadata) ──


// ─── Types ──────────────────────────────────────────────────────

interface ClassItem {
  id: string
  name: string
  slug: string
  order: number
  icon: string | null
  color: string | null
  description: string | null
  isActive: boolean
  _count: { subjects: number }
}

interface SubjectItem {
  id: string
  name: string
  slug: string
  classId: string
  order: number
  icon: string | null
  color: string | null
  description: string | null
  isActive: boolean
  class: { id: string; name: string; slug: string }
  _count: { chapters: number }
}

interface ChapterItem {
  id: string
  name: string
  slug: string
  subjectId: string
  order: number
  description: string | null
  isActive: boolean
  subject: { id: string; name: string; slug: string; classId: string; class: { id: string; name: string; slug: string } }
  _count: { topics: number }
}

interface TopicItem {
  id: string
  name: string
  slug: string
  chapterId: string
  order: number
  description: string | null
  isActive: boolean
  chapter: { id: string; name: string; slug: string; subjectId: string; subject: { id: string; name: string; slug: string; classId: string; class: { id: string; name: string; slug: string } } }
}

interface BoardYearItem {
  id: string
  board: string
  year: string
  isActive: boolean
}

// ─── Helper: generate slug ──────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Main Component ─────────────────────────────────────────────

export default function AdminContentHierarchyPage() {
  const { toast } = useToast()
  const { boardOptions, boardSlugToLabel } = useHierarchyMetadata()
  const [activeTab, setActiveTab] = useState('classes')

  // ═══════════════════════════════════════════════════════════
  // SHARED STATE
  // ═══════════════════════════════════════════════════════════

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [chapters, setChapters] = useState<ChapterItem[]>([])
  const [chaptersLoading, setChaptersLoading] = useState(true)
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [boardYears, setBoardYears] = useState<BoardYearItem[]>([])
  const [boardYearsLoading, setBoardYearsLoading] = useState(true)

  // ═══════════════════════════════════════════════════════════
  // FETCH CLASSES
  // ═══════════════════════════════════════════════════════════

  const fetchClasses = useCallback(async () => {
    setClassesLoading(true)
    try {
      const res = await fetch('/api/admin/classes')
      if (res.ok) {
        const json = await res.json()
        setClasses(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setClassesLoading(false) }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // FETCH SUBJECTS
  // ═══════════════════════════════════════════════════════════

  const [subjectClassFilter, setSubjectClassFilter] = useState<string>('all')

  const fetchSubjects = useCallback(async (classId?: string) => {
    setSubjectsLoading(true)
    try {
      const url = classId && classId !== 'all' ? `/api/admin/subjects?classId=${classId}` : '/api/admin/subjects'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setSubjects(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setSubjectsLoading(false) }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // FETCH CHAPTERS
  // ═══════════════════════════════════════════════════════════

  const [chapterClassFilter, setChapterClassFilter] = useState<string>('all')
  const [chapterSubjectFilter, setChapterSubjectFilter] = useState<string>('all')

  const fetchChapters = useCallback(async (subjectId?: string) => {
    setChaptersLoading(true)
    try {
      const url = subjectId && subjectId !== 'all' ? `/api/admin/chapters?subjectId=${subjectId}` : '/api/admin/chapters'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setChapters(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setChaptersLoading(false) }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // FETCH TOPICS
  // ═══════════════════════════════════════════════════════════

  const [topicClassFilter, setTopicClassFilter] = useState<string>('all')
  const [topicSubjectFilter, setTopicSubjectFilter] = useState<string>('all')
  const [topicChapterFilter, setTopicChapterFilter] = useState<string>('all')

  const fetchTopics = useCallback(async (chapterId?: string) => {
    setTopicsLoading(true)
    try {
      const url = chapterId && chapterId !== 'all' ? `/api/admin/topics?chapterId=${chapterId}` : '/api/admin/topics'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setTopics(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setTopicsLoading(false) }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // FETCH BOARD YEARS
  // ═══════════════════════════════════════════════════════════

  const fetchBoardYears = useCallback(async () => {
    setBoardYearsLoading(true)
    try {
      const res = await fetch('/api/admin/board-years')
      if (res.ok) {
        const json = await res.json()
        setBoardYears(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setBoardYearsLoading(false) }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // INITIAL LOADS
  // ═══════════════════════════════════════════════════════════

  useEffect(() => { fetchClasses() }, [fetchClasses])
  useEffect(() => { fetchSubjects(subjectClassFilter) }, [fetchSubjects, subjectClassFilter])
  useEffect(() => { fetchChapters(chapterSubjectFilter) }, [fetchChapters, chapterSubjectFilter])
  useEffect(() => { fetchTopics(topicChapterFilter) }, [fetchTopics, topicChapterFilter])
  useEffect(() => { fetchBoardYears() }, [fetchBoardYears])

  // ═══════════════════════════════════════════════════════════
  // DERIVED DATA FOR CASCADE
  // ═══════════════════════════════════════════════════════════

  const filteredSubjectsForChapters = subjects.filter(s => {
    if (chapterClassFilter === 'all') return true
    return s.classId === chapterClassFilter
  })

  const filteredSubjectsForTopics = subjects.filter(s => {
    if (topicClassFilter === 'all') return true
    return s.classId === topicClassFilter
  })

  const filteredChaptersForTopics = chapters.filter(c => {
    if (topicSubjectFilter === 'all') return true
    return c.subjectId === topicSubjectFilter
  })

  // ═══════════════════════════════════════════════════════════
  // CLASS CRUD
  // ═══════════════════════════════════════════════════════════

  const emptyClassForm = { name: '', slug: '', order: 0, icon: '', color: '', description: '', isActive: true }
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [classEditId, setClassEditId] = useState<string | null>(null)
  const [classForm, setClassForm] = useState(emptyClassForm)
  const [classFormOrder, setClassFormOrder] = useState('0')
  const [classDeleteId, setClassDeleteId] = useState<string | null>(null)
  const [classSaving, setClassSaving] = useState(false)
  const [classSearch, setClassSearch] = useState('')

  const openCreateClass = () => { setClassEditId(null); setClassForm(emptyClassForm); setClassFormOrder('0'); setClassDialogOpen(true) }
  const openEditClass = (item: ClassItem) => {
    setClassEditId(item.id)
    setClassForm({
      name: item.name,
      slug: item.slug,
      order: item.order,
      icon: item.icon || '',
      color: item.color || '',
      description: item.description || '',
      isActive: item.isActive,
    })
    setClassFormOrder(String(item.order))
    setClassDialogOpen(true)
  }

  const handleClassSave = async () => {
    if (!classForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'শ্রেণির নাম আবশ্যক', variant: 'destructive' })
      return
    }
    setClassSaving(true)
    try {
      const slug = classForm.slug.trim() || generateSlug(classForm.name)
      const body = {
        name: classForm.name,
        slug,
        order: parseInt(classFormOrder) || 0,
        icon: classForm.icon || undefined,
        color: classForm.color || undefined,
        description: classForm.description || undefined,
        isActive: classForm.isActive,
      }

      const res = classEditId
        ? await fetch('/api/admin/classes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: classEditId, ...body }) })
        : await fetch('/api/admin/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: classEditId ? 'শ্রেণি আপডেট হয়েছে' : 'শ্রেণি তৈরি হয়েছে' })
        setClassDialogOpen(false)
        fetchClasses()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setClassSaving(false) }
  }

  const handleClassDelete = async () => {
    if (!classDeleteId) return
    try {
      const res = await fetch(`/api/admin/classes?id=${classDeleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'শ্রেণি মুছে ফেলা হয়েছে' }); setClassDeleteId(null); fetchClasses() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  // ═══════════════════════════════════════════════════════════
  // SUBJECT CRUD
  // ═══════════════════════════════════════════════════════════

  const emptySubjectForm = { name: '', classId: '', slug: '', order: 0, icon: '', color: '', description: '', isActive: true }
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [subjectEditId, setSubjectEditId] = useState<string | null>(null)
  const [subjectForm, setSubjectForm] = useState(emptySubjectForm)
  const [subjectFormOrder, setSubjectFormOrder] = useState('0')
  const [subjectDeleteId, setSubjectDeleteId] = useState<string | null>(null)
  const [subjectSaving, setSubjectSaving] = useState(false)
  const [subjectSearch, setSubjectSearch] = useState('')

  const openCreateSubject = () => { setSubjectEditId(null); setSubjectForm(emptySubjectForm); setSubjectFormOrder('0'); setSubjectDialogOpen(true) }
  const openEditSubject = (item: SubjectItem) => {
    setSubjectEditId(item.id)
    setSubjectForm({
      name: item.name,
      classId: item.classId,
      slug: item.slug,
      order: item.order,
      icon: item.icon || '',
      color: item.color || '',
      description: item.description || '',
      isActive: item.isActive,
    })
    setSubjectFormOrder(String(item.order))
    setSubjectDialogOpen(true)
  }

  const handleSubjectSave = async () => {
    if (!subjectForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'বিষয়ের নাম আবশ্যক', variant: 'destructive' })
      return
    }
    if (!subjectForm.classId) {
      toast({ title: 'ত্রুটি', description: 'ক্লাস নির্বাচন আবশ্যক', variant: 'destructive' })
      return
    }
    setSubjectSaving(true)
    try {
      const slug = subjectForm.slug.trim() || generateSlug(subjectForm.name)
      const body = {
        name: subjectForm.name,
        classId: subjectForm.classId,
        slug,
        order: parseInt(subjectFormOrder) || 0,
        icon: subjectForm.icon || undefined,
        color: subjectForm.color || undefined,
        description: subjectForm.description || undefined,
        isActive: subjectForm.isActive,
      }

      const res = subjectEditId
        ? await fetch('/api/admin/subjects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: subjectEditId, ...body }) })
        : await fetch('/api/admin/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: subjectEditId ? 'বিষয় আপডেট হয়েছে' : 'বিষয় তৈরি হয়েছে' })
        setSubjectDialogOpen(false)
        fetchSubjects(subjectClassFilter)
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setSubjectSaving(false) }
  }

  const handleSubjectDelete = async () => {
    if (!subjectDeleteId) return
    try {
      const res = await fetch(`/api/admin/subjects?id=${subjectDeleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'বিষয় মুছে ফেলা হয়েছে' }); setSubjectDeleteId(null); fetchSubjects(subjectClassFilter) }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  // ═══════════════════════════════════════════════════════════
  // CHAPTER CRUD
  // ═══════════════════════════════════════════════════════════

  const emptyChapterForm = { name: '', subjectId: '', slug: '', order: 0, description: '', isActive: true }
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false)
  const [chapterEditId, setChapterEditId] = useState<string | null>(null)
  const [chapterForm, setChapterForm] = useState(emptyChapterForm)
  const [chapterFormOrder, setChapterFormOrder] = useState('0')
  const [chapterDeleteId, setChapterDeleteId] = useState<string | null>(null)
  const [chapterSaving, setChapterSaving] = useState(false)
  const [chapterSearch, setChapterSearch] = useState('')

  // For chapter create/edit dialog cascade
  const [chapterDialogClassFilter, setChapterDialogClassFilter] = useState<string>('')

  const openCreateChapter = () => {
    setChapterEditId(null)
    setChapterForm(emptyChapterForm)
    setChapterFormOrder('0')
    setChapterDialogClassFilter('')
    setChapterDialogOpen(true)
  }
  const openEditChapter = (item: ChapterItem) => {
    setChapterEditId(item.id)
    setChapterForm({
      name: item.name,
      subjectId: item.subjectId,
      slug: item.slug,
      order: item.order,
      description: item.description || '',
      isActive: item.isActive,
    })
    setChapterFormOrder(String(item.order))
    setChapterDialogClassFilter(item.subject.classId)
    setChapterDialogOpen(true)
  }

  const handleChapterSave = async () => {
    if (!chapterForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'অধ্যায়ের নাম আবশ্যক', variant: 'destructive' })
      return
    }
    if (!chapterForm.subjectId) {
      toast({ title: 'ত্রুটি', description: 'বিষয় নির্বাচন আবশ্যক', variant: 'destructive' })
      return
    }
    setChapterSaving(true)
    try {
      const slug = chapterForm.slug.trim() || generateSlug(chapterForm.name)
      const body = {
        name: chapterForm.name,
        subjectId: chapterForm.subjectId,
        slug,
        order: parseInt(chapterFormOrder) || 0,
        description: chapterForm.description || undefined,
        isActive: chapterForm.isActive,
      }

      const res = chapterEditId
        ? await fetch('/api/admin/chapters', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: chapterEditId, ...body }) })
        : await fetch('/api/admin/chapters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: chapterEditId ? 'অধ্যায় আপডেট হয়েছে' : 'অধ্যায় তৈরি হয়েছে' })
        setChapterDialogOpen(false)
        fetchChapters(chapterSubjectFilter)
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setChapterSaving(false) }
  }

  const handleChapterDelete = async () => {
    if (!chapterDeleteId) return
    try {
      const res = await fetch(`/api/admin/chapters?id=${chapterDeleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'অধ্যায় মুছে ফেলা হয়েছে' }); setChapterDeleteId(null); fetchChapters(chapterSubjectFilter) }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  // ═══════════════════════════════════════════════════════════
  // TOPIC CRUD
  // ═══════════════════════════════════════════════════════════

  const emptyTopicForm = { name: '', chapterId: '', slug: '', order: 0, description: '', isActive: true }
  const [topicDialogOpen, setTopicDialogOpen] = useState(false)
  const [topicEditId, setTopicEditId] = useState<string | null>(null)
  const [topicForm, setTopicForm] = useState(emptyTopicForm)
  const [topicFormOrder, setTopicFormOrder] = useState('0')
  const [topicDeleteId, setTopicDeleteId] = useState<string | null>(null)
  const [topicSaving, setTopicSaving] = useState(false)
  const [topicSearch, setTopicSearch] = useState('')

  // For topic create/edit dialog cascade
  const [topicDialogClassFilter, setTopicDialogClassFilter] = useState<string>('')
  const [topicDialogSubjectFilter, setTopicDialogSubjectFilter] = useState<string>('')

  const openCreateTopic = () => {
    setTopicEditId(null)
    setTopicForm(emptyTopicForm)
    setTopicFormOrder('0')
    setTopicDialogClassFilter('')
    setTopicDialogSubjectFilter('')
    setTopicDialogOpen(true)
  }
  const openEditTopic = (item: TopicItem) => {
    setTopicEditId(item.id)
    setTopicForm({
      name: item.name,
      chapterId: item.chapterId,
      slug: item.slug,
      order: item.order,
      description: item.description || '',
      isActive: item.isActive,
    })
    setTopicFormOrder(String(item.order))
    setTopicDialogClassFilter(item.chapter.subject.classId)
    setTopicDialogSubjectFilter(item.chapter.subjectId)
    setTopicDialogOpen(true)
  }

  const handleTopicSave = async () => {
    if (!topicForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'টপিকের নাম আবশ্যক', variant: 'destructive' })
      return
    }
    if (!topicForm.chapterId) {
      toast({ title: 'ত্রুটি', description: 'অধ্যায় নির্বাচন আবশ্যক', variant: 'destructive' })
      return
    }
    setTopicSaving(true)
    try {
      const slug = topicForm.slug.trim() || generateSlug(topicForm.name)
      const body = {
        name: topicForm.name,
        chapterId: topicForm.chapterId,
        slug,
        order: parseInt(topicFormOrder) || 0,
        description: topicForm.description || undefined,
        isActive: topicForm.isActive,
      }

      const res = topicEditId
        ? await fetch('/api/admin/topics', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: topicEditId, ...body }) })
        : await fetch('/api/admin/topics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: topicEditId ? 'টপিক আপডেট হয়েছে' : 'টপিক তৈরি হয়েছে' })
        setTopicDialogOpen(false)
        fetchTopics(topicChapterFilter)
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setTopicSaving(false) }
  }

  const handleTopicDelete = async () => {
    if (!topicDeleteId) return
    try {
      const res = await fetch(`/api/admin/topics?id=${topicDeleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'টপিক মুছে ফেলা হয়েছে' }); setTopicDeleteId(null); fetchTopics(topicChapterFilter) }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  // ═══════════════════════════════════════════════════════════
  // BOARD YEAR CRUD
  // ═══════════════════════════════════════════════════════════

  const emptyBoardYearForm = { board: '', year: '', isActive: true }
  const [boardYearDialogOpen, setBoardYearDialogOpen] = useState(false)
  const [boardYearEditId, setBoardYearEditId] = useState<string | null>(null)
  const [boardYearForm, setBoardYearForm] = useState(emptyBoardYearForm)
  const [boardYearDeleteId, setBoardYearDeleteId] = useState<string | null>(null)
  const [boardYearSaving, setBoardYearSaving] = useState(false)
  const [boardYearSearch, setBoardYearSearch] = useState('')

  const openCreateBoardYear = () => { setBoardYearEditId(null); setBoardYearForm(emptyBoardYearForm); setBoardYearDialogOpen(true) }
  const openEditBoardYear = (item: BoardYearItem) => {
    setBoardYearEditId(item.id)
    setBoardYearForm({
      board: item.board,
      year: item.year,
      isActive: item.isActive,
    })
    setBoardYearDialogOpen(true)
  }

  const handleBoardYearSave = async () => {
    if (!boardYearForm.board) {
      toast({ title: 'ত্রুটি', description: 'বোর্ড নির্বাচন আবশ্যক', variant: 'destructive' })
      return
    }
    if (!boardYearForm.year.trim()) {
      toast({ title: 'ত্রুটি', description: 'সাল আবশ্যক', variant: 'destructive' })
      return
    }
    setBoardYearSaving(true)
    try {
      const body = {
        board: boardYearForm.board,
        year: boardYearForm.year,
        isActive: boardYearForm.isActive,
      }

      const res = boardYearEditId
        ? await fetch('/api/admin/board-years', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: boardYearEditId, ...body }) })
        : await fetch('/api/admin/board-years', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: boardYearEditId ? 'বোর্ড সাল আপডেট হয়েছে' : 'বোর্ড সাল তৈরি হয়েছে' })
        setBoardYearDialogOpen(false)
        fetchBoardYears()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setBoardYearSaving(false) }
  }

  const handleBoardYearDelete = async () => {
    if (!boardYearDeleteId) return
    try {
      const res = await fetch(`/api/admin/board-years?id=${boardYearDeleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'বোর্ড সাল মুছে ফেলা হয়েছে' }); setBoardYearDeleteId(null); fetchBoardYears() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER: Status Badge
  // ═══════════════════════════════════════════════════════════

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    isActive
      ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">সক্রিয়</Badge>
      : <Badge variant="destructive">নিষ্ক্রিয়</Badge>
  )

  // ═══════════════════════════════════════════════════════════
  // HELPER: Stats Card
  // ═══════════════════════════════════════════════════════════

  const StatCard = ({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: string }) => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )

  // ═══════════════════════════════════════════════════════════
  // HELPER: Delete Dialog
  // ═══════════════════════════════════════════════════════════

  const DeleteDialog = ({ open, onClose, onConfirm, title, description }: {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
  }) => (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>বাতিল</Button>
          <Button variant="destructive" onClick={onConfirm}>মুছুন</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // ═══════════════════════════════════════════════════════════
  // HELPER: Table Action Buttons
  // ═══════════════════════════════════════════════════════════

  const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="সম্পাদনা"><Edit className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} aria-label="মুছুন"><Trash2 className="h-4 w-4" /></Button>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // LOADING SKELETON
  // ═══════════════════════════════════════════════════════════

  const TableSkeleton = () => (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // FILTERED DATA
  // ═══════════════════════════════════════════════════════════

  const filteredClasses = classes.filter(c =>
    !classSearch || c.name.toLowerCase().includes(classSearch.toLowerCase()) || c.slug.toLowerCase().includes(classSearch.toLowerCase())
  )

  const filteredSubjects = subjects.filter(s =>
    !subjectSearch || s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  )

  const filteredChapters = chapters.filter(c =>
    !chapterSearch || c.name.toLowerCase().includes(chapterSearch.toLowerCase())
  )

  const filteredTopics = topics.filter(t =>
    !topicSearch || t.name.toLowerCase().includes(topicSearch.toLowerCase())
  )

  const filteredBoardYears = boardYears.filter(by =>
    !boardYearSearch || boardSlugToLabel[by.board]?.includes(boardYearSearch) || by.year.includes(boardYearSearch)
  )

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6 text-emerald-600" />
          কন্টেন্ট হায়ারার্কি ব্যবস্থাপনা
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          ক্লাস → বিষয় → অধ্যায় → টপিক হায়ারার্কি এবং বোর্ড সাল ব্যবস্থাপনা
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="classes" className="gap-1.5 text-xs sm:text-sm">
              <GraduationCap className="h-4 w-4" /> ক্লাস
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" /> বিষয়
            </TabsTrigger>
            <TabsTrigger value="chapters" className="gap-1.5 text-xs sm:text-sm">
              <BookMarked className="h-4 w-4" /> অধ্যায়
            </TabsTrigger>
            <TabsTrigger value="topics" className="gap-1.5 text-xs sm:text-sm">
              <Hash className="h-4 w-4" /> টপিক
            </TabsTrigger>
            <TabsTrigger value="board-years" className="gap-1.5 text-xs sm:text-sm">
              <Calendar className="h-4 w-4" /> বোর্ড সাল
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 1: ক্লাস (Classes)                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="classes" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={GraduationCap} label="মোট শ্রেণি" count={classes.length} color="bg-emerald-600" />
            <StatCard icon={GraduationCap} label="সক্রিয় শ্রেণি" count={classes.filter(c => c.isActive).length} color="bg-teal-600" />
            <StatCard icon={BookOpen} label="মোট বিষয়" count={classes.reduce((acc, c) => acc + c._count.subjects, 0)} color="bg-amber-600" />
          </div>

          {/* Search & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="শ্রেণি খুঁজুন..."
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchClasses()}>
                <RefreshCw className="h-3.5 w-3.5" /> রিফ্রেশ
              </Button>
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={openCreateClass}>
                <Plus className="h-4 w-4" /> নতুন শ্রেণি
              </Button>
            </div>
          </div>

          {/* Table */}
          {classesLoading ? <TableSkeleton /> : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>নাম</TableHead>
                      <TableHead>স্লাগ</TableHead>
                      <TableHead className="text-center">বিষয় সংখ্যা</TableHead>
                      <TableHead className="text-center">ক্রম</TableHead>
                      <TableHead className="text-center">সক্রিয়</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredClasses.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.color && (
                                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{item.slug}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item._count.subjects}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{item.order}</TableCell>
                          <TableCell className="text-center"><StatusBadge isActive={item.isActive} /></TableCell>
                          <TableCell className="text-right">
                            <ActionButtons onEdit={() => openEditClass(item)} onDelete={() => setClassDeleteId(item.id)} />
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredClasses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          কোনো শ্রেণি পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 2: বিষয় (Subjects)                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="subjects" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={BookOpen} label="মোট বিষয়" count={subjects.length} color="bg-emerald-600" />
            <StatCard icon={BookOpen} label="সক্রিয় বিষয়" count={subjects.filter(s => s.isActive).length} color="bg-teal-600" />
            <StatCard icon={BookMarked} label="মোট অধ্যায়" count={subjects.reduce((acc, s) => acc + s._count.chapters, 0)} color="bg-amber-600" />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="বিষয় খুঁজুন..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={subjectClassFilter} onValueChange={setSubjectClassFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="ক্লাস ফিল্টার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব ক্লাস</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchSubjects(subjectClassFilter)}>
                <RefreshCw className="h-3.5 w-3.5" /> রিফ্রেশ
              </Button>
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={openCreateSubject}>
                <Plus className="h-4 w-4" /> নতুন বিষয়
              </Button>
            </div>
          </div>

          {/* Table */}
          {subjectsLoading ? <TableSkeleton /> : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>নাম</TableHead>
                      <TableHead>ক্লাস</TableHead>
                      <TableHead className="text-center">অধ্যায় সংখ্যা</TableHead>
                      <TableHead className="text-center">ক্রম</TableHead>
                      <TableHead className="text-center">সক্রিয়</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredSubjects.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.color && (
                                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.class.name}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item._count.chapters}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{item.order}</TableCell>
                          <TableCell className="text-center"><StatusBadge isActive={item.isActive} /></TableCell>
                          <TableCell className="text-right">
                            <ActionButtons onEdit={() => openEditSubject(item)} onDelete={() => setSubjectDeleteId(item.id)} />
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredSubjects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          কোনো বিষয় পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 3: অধ্যায় (Chapters)                         */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="chapters" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={BookMarked} label="মোট অধ্যায়" count={chapters.length} color="bg-emerald-600" />
            <StatCard icon={BookMarked} label="সক্রিয় অধ্যায়" count={chapters.filter(c => c.isActive).length} color="bg-teal-600" />
            <StatCard icon={Hash} label="মোট টপিক" count={chapters.reduce((acc, c) => acc + (c._count?.topics || 0), 0)} color="bg-amber-600" />
          </div>

          {/* Cascade Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="অধ্যায় খুঁজুন..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={chapterClassFilter} onValueChange={(v) => {
                setChapterClassFilter(v)
                setChapterSubjectFilter('all')
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="ক্লাস ফিল্টার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব ক্লাস</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={chapterSubjectFilter} onValueChange={setChapterSubjectFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="বিষয় ফিল্টার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব বিষয়</SelectItem>
                  {filteredSubjectsForChapters.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchChapters(chapterSubjectFilter)}>
                <RefreshCw className="h-3.5 w-3.5" /> রিফ্রেশ
              </Button>
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={openCreateChapter}>
                <Plus className="h-4 w-4" /> নতুন অধ্যায়
              </Button>
            </div>
          </div>

          {/* Table */}
          {chaptersLoading ? <TableSkeleton /> : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>নাম</TableHead>
                      <TableHead>বিষয়</TableHead>
                      <TableHead>ক্লাস</TableHead>
                      <TableHead className="text-center">ক্রম</TableHead>
                      <TableHead className="text-center">সক্রিয়</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredChapters.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.subject.name}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.subject.class.name}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{item.order}</TableCell>
                          <TableCell className="text-center"><StatusBadge isActive={item.isActive} /></TableCell>
                          <TableCell className="text-right">
                            <ActionButtons onEdit={() => openEditChapter(item)} onDelete={() => setChapterDeleteId(item.id)} />
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredChapters.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          কোনো অধ্যায় পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 4: টপিক (Topics)                              */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="topics" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Hash} label="মোট টপিক" count={topics.length} color="bg-emerald-600" />
            <StatCard icon={Hash} label="সক্রিয় টপিক" count={topics.filter(t => t.isActive).length} color="bg-teal-600" />
            <StatCard icon={BookMarked} label="অধ্যায়" count={new Set(topics.map(t => t.chapterId)).size} color="bg-amber-600" />
          </div>

          {/* Cascade Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 max-w-sm min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="টপিক খুঁজুন..."
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={topicClassFilter} onValueChange={(v) => {
                setTopicClassFilter(v)
                setTopicSubjectFilter('all')
                setTopicChapterFilter('all')
              }}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="ক্লাস" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব ক্লাস</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={topicSubjectFilter} onValueChange={(v) => {
                setTopicSubjectFilter(v)
                setTopicChapterFilter('all')
              }}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="বিষয়" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব বিষয়</SelectItem>
                  {filteredSubjectsForTopics.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={topicChapterFilter} onValueChange={setTopicChapterFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="অধ্যায়" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব অধ্যায়</SelectItem>
                  {filteredChaptersForTopics.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchTopics(topicChapterFilter)}>
                <RefreshCw className="h-3.5 w-3.5" /> রিফ্রেশ
              </Button>
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={openCreateTopic}>
                <Plus className="h-4 w-4" /> নতুন টপিক
              </Button>
            </div>
          </div>

          {/* Table */}
          {topicsLoading ? <TableSkeleton /> : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>নাম</TableHead>
                      <TableHead>অধ্যায়</TableHead>
                      <TableHead>বিষয়</TableHead>
                      <TableHead className="text-center">ক্রম</TableHead>
                      <TableHead className="text-center">সক্রিয়</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredTopics.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.chapter.name}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.chapter.subject.name}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{item.order}</TableCell>
                          <TableCell className="text-center"><StatusBadge isActive={item.isActive} /></TableCell>
                          <TableCell className="text-right">
                            <ActionButtons onEdit={() => openEditTopic(item)} onDelete={() => setTopicDeleteId(item.id)} />
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredTopics.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          কোনো টপিক পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 5: বোর্ড সাল (Board Years)                    */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="board-years" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={Calendar} label="মোট বোর্ড সাল" count={boardYears.length} color="bg-emerald-600" />
            <StatCard icon={Calendar} label="সক্রিয়" count={boardYears.filter(by => by.isActive).length} color="bg-teal-600" />
            <StatCard icon={GraduationCap} label="বোর্ড সংখ্যা" count={new Set(boardYears.map(by => by.board)).size} color="bg-amber-600" />
          </div>

          {/* Search & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="বোর্ড বা সাল খুঁজুন..."
                value={boardYearSearch}
                onChange={(e) => setBoardYearSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchBoardYears()}>
                <RefreshCw className="h-3.5 w-3.5" /> রিফ্রেশ
              </Button>
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={openCreateBoardYear}>
                <Plus className="h-4 w-4" /> নতুন বোর্ড সাল
              </Button>
            </div>
          </div>

          {/* Table */}
          {boardYearsLoading ? <TableSkeleton /> : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>বোর্ড</TableHead>
                      <TableHead>সাল</TableHead>
                      <TableHead className="text-center">সক্রিয়</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredBoardYears.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {boardSlugToLabel[item.board] || item.board}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.year}</TableCell>
                          <TableCell className="text-center"><StatusBadge isActive={item.isActive} /></TableCell>
                          <TableCell className="text-right">
                            <ActionButtons onEdit={() => openEditBoardYear(item)} onDelete={() => setBoardYearDeleteId(item.id)} />
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredBoardYears.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          কোনো বোর্ড সাল পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* ─── Class Dialog ──────────────────────────────────── */}
      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{classEditId ? 'শ্রেণি সম্পাদনা' : 'নতুন শ্রেণি'}</DialogTitle>
            <DialogDescription>{classEditId ? 'শ্রেণির তথ্য পরিবর্তন করুন' : 'একটি নতুন শ্রেণি তৈরি করুন'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-2 pr-4">
              <div className="space-y-2">
                <Label>নাম *</Label>
                <Input placeholder="যেমন: ষষ্ঠ শ্রেণি" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>স্লাগ</Label>
                <Input placeholder="auto-generate হবে" value={classForm.slug} onChange={(e) => setClassForm({ ...classForm, slug: e.target.value })} />
                <p className="text-xs text-muted-foreground">খালি রাখলে নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
              </div>
              <div className="space-y-2">
                <Label>ক্রম</Label>
                <Input type="number" value={classFormOrder} onChange={(e) => setClassFormOrder(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>আইকন</Label>
                  <Input placeholder="আইকন নাম" value={classForm.icon} onChange={(e) => setClassForm({ ...classForm, icon: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>রং</Label>
                  <div className="flex gap-2">
                    <Input placeholder="#000000" value={classForm.color} onChange={(e) => setClassForm({ ...classForm, color: e.target.value })} />
                    {classForm.color && (
                      <div className="h-10 w-10 rounded-md border shrink-0" style={{ backgroundColor: classForm.color }} />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>বিবরণ</Label>
                <Input placeholder="শ্রেণির বিবরণ" value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>সক্রিয়</Label>
                <Switch checked={classForm.isActive} onCheckedChange={(v) => setClassForm({ ...classForm, isActive: v })} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassDialogOpen(false)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleClassSave} disabled={classSaving}>
              {classSaving ? 'সংরক্ষণ হচ্ছে...' : classEditId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Subject Dialog ────────────────────────────────── */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{subjectEditId ? 'বিষয় সম্পাদনা' : 'নতুন বিষয়'}</DialogTitle>
            <DialogDescription>{subjectEditId ? 'বিষয়ের তথ্য পরিবর্তন করুন' : 'একটি নতুন বিষয় তৈরি করুন'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-2 pr-4">
              <div className="space-y-2">
                <Label>নাম *</Label>
                <Input placeholder="যেমন: গণিত" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ক্লাস *</Label>
                <Select value={subjectForm.classId} onValueChange={(v) => setSubjectForm({ ...subjectForm, classId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>স্লাগ</Label>
                <Input placeholder="auto-generate হবে" value={subjectForm.slug} onChange={(e) => setSubjectForm({ ...subjectForm, slug: e.target.value })} />
                <p className="text-xs text-muted-foreground">খালি রাখলে নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
              </div>
              <div className="space-y-2">
                <Label>ক্রম</Label>
                <Input type="number" value={subjectFormOrder} onChange={(e) => setSubjectFormOrder(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>আইকন</Label>
                  <Input placeholder="আইকন নাম" value={subjectForm.icon} onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>রং</Label>
                  <div className="flex gap-2">
                    <Input placeholder="#000000" value={subjectForm.color} onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })} />
                    {subjectForm.color && (
                      <div className="h-10 w-10 rounded-md border shrink-0" style={{ backgroundColor: subjectForm.color }} />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>বিবরণ</Label>
                <Input placeholder="বিষয়ের বিবরণ" value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>সক্রিয়</Label>
                <Switch checked={subjectForm.isActive} onCheckedChange={(v) => setSubjectForm({ ...subjectForm, isActive: v })} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialogOpen(false)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubjectSave} disabled={subjectSaving}>
              {subjectSaving ? 'সংরক্ষণ হচ্ছে...' : subjectEditId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Chapter Dialog ────────────────────────────────── */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{chapterEditId ? 'অধ্যায় সম্পাদনা' : 'নতুন অধ্যায়'}</DialogTitle>
            <DialogDescription>{chapterEditId ? 'অধ্যায়ের তথ্য পরিবর্তন করুন' : 'একটি নতুন অধ্যায় তৈরি করুন'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-2 pr-4">
              <div className="space-y-2">
                <Label>নাম *</Label>
                <Input placeholder="যেমন: প্রথম অধ্যায়" value={chapterForm.name} onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ক্লাস *</Label>
                <Select value={chapterDialogClassFilter} onValueChange={(v) => {
                  setChapterDialogClassFilter(v)
                  setChapterForm({ ...chapterForm, subjectId: '' })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>বিষয় *</Label>
                <Select value={chapterForm.subjectId} onValueChange={(v) => setChapterForm({ ...chapterForm, subjectId: v })} disabled={!chapterDialogClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={chapterDialogClassFilter ? 'বিষয় নির্বাচন করুন' : 'প্রথমে ক্লাস নির্বাচন করুন'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects
                      .filter(s => s.classId === chapterDialogClassFilter)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>স্লাগ</Label>
                <Input placeholder="auto-generate হবে" value={chapterForm.slug} onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })} />
                <p className="text-xs text-muted-foreground">খালি রাখলে নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
              </div>
              <div className="space-y-2">
                <Label>ক্রম</Label>
                <Input type="number" value={chapterFormOrder} onChange={(e) => setChapterFormOrder(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>বিবরণ</Label>
                <Input placeholder="অধ্যায়ের বিবরণ" value={chapterForm.description} onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>সক্রিয়</Label>
                <Switch checked={chapterForm.isActive} onCheckedChange={(v) => setChapterForm({ ...chapterForm, isActive: v })} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterDialogOpen(false)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleChapterSave} disabled={chapterSaving}>
              {chapterSaving ? 'সংরক্ষণ হচ্ছে...' : chapterEditId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Topic Dialog ──────────────────────────────────── */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{topicEditId ? 'টপিক সম্পাদনা' : 'নতুন টপিক'}</DialogTitle>
            <DialogDescription>{topicEditId ? 'টপিকের তথ্য পরিবর্তন করুন' : 'একটি নতুন টপিক তৈরি করুন'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-2 pr-4">
              <div className="space-y-2">
                <Label>নাম *</Label>
                <Input placeholder="যেমন: বাস্তব সংখ্যা" value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ক্লাস *</Label>
                <Select value={topicDialogClassFilter} onValueChange={(v) => {
                  setTopicDialogClassFilter(v)
                  setTopicDialogSubjectFilter('')
                  setTopicForm({ ...topicForm, chapterId: '' })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="ক্লাস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>বিষয় *</Label>
                <Select value={topicDialogSubjectFilter} onValueChange={(v) => {
                  setTopicDialogSubjectFilter(v)
                  setTopicForm({ ...topicForm, chapterId: '' })
                }} disabled={!topicDialogClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={topicDialogClassFilter ? 'বিষয় নির্বাচন করুন' : 'প্রথমে ক্লাস নির্বাচন করুন'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects
                      .filter(s => s.classId === topicDialogClassFilter)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>অধ্যায় *</Label>
                <Select value={topicForm.chapterId} onValueChange={(v) => setTopicForm({ ...topicForm, chapterId: v })} disabled={!topicDialogSubjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={topicDialogSubjectFilter ? 'অধ্যায় নির্বাচন করুন' : 'প্রথমে বিষয় নির্বাচন করুন'} />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters
                      .filter(c => c.subjectId === topicDialogSubjectFilter)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>স্লাগ</Label>
                <Input placeholder="auto-generate হবে" value={topicForm.slug} onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })} />
                <p className="text-xs text-muted-foreground">খালি রাখলে নাম থেকে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
              </div>
              <div className="space-y-2">
                <Label>ক্রম</Label>
                <Input type="number" value={topicFormOrder} onChange={(e) => setTopicFormOrder(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>বিবরণ</Label>
                <Input placeholder="টপিকের বিবরণ" value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>সক্রিয়</Label>
                <Switch checked={topicForm.isActive} onCheckedChange={(v) => setTopicForm({ ...topicForm, isActive: v })} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleTopicSave} disabled={topicSaving}>
              {topicSaving ? 'সংরক্ষণ হচ্ছে...' : topicEditId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Board Year Dialog ─────────────────────────────── */}
      <Dialog open={boardYearDialogOpen} onOpenChange={setBoardYearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{boardYearEditId ? 'বোর্ড সাল সম্পাদনা' : 'নতুন বোর্ড সাল'}</DialogTitle>
            <DialogDescription>{boardYearEditId ? 'বোর্ড সালের তথ্য পরিবর্তন করুন' : 'একটি নতুন বোর্ড সাল তৈরি করুন'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>বোর্ড *</Label>
              <Select value={boardYearForm.board} onValueChange={(v) => setBoardYearForm({ ...boardYearForm, board: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="বোর্ড নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {boardOptions.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>সাল *</Label>
              <Input placeholder="যেমন: 2024" value={boardYearForm.year} onChange={(e) => setBoardYearForm({ ...boardYearForm, year: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>সক্রিয়</Label>
              <Switch checked={boardYearForm.isActive} onCheckedChange={(v) => setBoardYearForm({ ...boardYearForm, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoardYearDialogOpen(false)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleBoardYearSave} disabled={boardYearSaving}>
              {boardYearSaving ? 'সংরক্ষণ হচ্ছে...' : boardYearEditId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialogs ────────────────────────────────── */}
      <DeleteDialog
        open={!!classDeleteId}
        onClose={() => setClassDeleteId(null)}
        onConfirm={handleClassDelete}
        title="শ্রেণি মুছুন"
        description="আপনি কি নিশ্চিত যে এই শ্রেণি মুছে ফেলতে চান? এই শ্রেণির সকল বিষয়ও মুছে যাবে।"
      />
      <DeleteDialog
        open={!!subjectDeleteId}
        onClose={() => setSubjectDeleteId(null)}
        onConfirm={handleSubjectDelete}
        title="বিষয় মুছুন"
        description="আপনি কি নিশ্চিত যে এই বিষয় মুছে ফেলতে চান? এই বিষয়ের সকল অধ্যায়ও মুছে যাবে।"
      />
      <DeleteDialog
        open={!!chapterDeleteId}
        onClose={() => setChapterDeleteId(null)}
        onConfirm={handleChapterDelete}
        title="অধ্যায় মুছুন"
        description="আপনি কি নিশ্চিত যে এই অধ্যায় মুছে ফেলতে চান? এই অধ্যায়ের সকল টপিকও মুছে যাবে।"
      />
      <DeleteDialog
        open={!!topicDeleteId}
        onClose={() => setTopicDeleteId(null)}
        onConfirm={handleTopicDelete}
        title="টপিক মুছুন"
        description="আপনি কি নিশ্চিত যে এই টপিক মুছে ফেলতে চান?"
      />
      <DeleteDialog
        open={!!boardYearDeleteId}
        onClose={() => setBoardYearDeleteId(null)}
        onConfirm={handleBoardYearDelete}
        title="বোর্ড সাল মুছুন"
        description="আপনি কি নিশ্চিত যে এই বোর্ড সাল মুছে ফেলতে চান?"
      />
    </motion.div>
  )
}
