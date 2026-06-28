'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { AnimatePresence,motion } from 'framer-motion'
import {
AlignLeft,
BookMarked,
BookOpen,
Building2,
Check,
ChevronDown,
ChevronUp,
Edit,
FileQuestion,
GripVertical,
Layers,
Loader2,
Plus,
Trash2
} from 'lucide-react'
import { useCallback,useEffect,useMemo,useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────

interface ClassItem {
  id: string
  name: string
  slug: string
  order: number
  icon?: string | null
  color?: string | null
  description?: string | null
  isActive: boolean
  _count?: { subjects: number }
}

interface SubjectItem {
  id: string
  name: string
  slug: string
  classId: string
  order: number
  icon?: string | null
  color?: string | null
  description?: string | null
  isActive: boolean
  class?: { id: string; name: string; slug: string }
  _count?: { chapters: number }
}

interface ChapterItem {
  id: string
  name: string
  slug: string
  subjectId: string
  order: number
  description?: string | null
  isActive: boolean
  subject?: { id: string; name: string; slug: string; classId: string }
  _count?: { lectures: number; mcqs: number; cqs: number }
}

interface BoardItem {
  id: string
  name: string
  slug: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

// ─── Slug Helper ────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Animation Variants ─────────────────────────────────────────

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const _cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.01 },
}

// ─── Main Component ─────────────────────────────────────────────

export default function AdminHierarchyPage() {
  const { toast } = useToast()

  // ─── Data State ────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])
  const [boards, setBoards] = useState<BoardItem[]>([])

  // ─── Selection State ───────────────────────────────────────
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)

  // ─── Loading State ─────────────────────────────────────────
  const [classesLoading, setClassesLoading] = useState(true)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [boardsLoading, setBoardsLoading] = useState(true)

  // ─── Dialog State ──────────────────────────────────────────
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false)
  const [boardDialogOpen, setBoardDialogOpen] = useState(false)

  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null)
  const [editingChapter, setEditingChapter] = useState<ChapterItem | null>(null)
  const [editingBoard, setEditingBoard] = useState<BoardItem | null>(null)

  // ─── Delete Confirmation ───────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'class' | 'subject' | 'chapter' | 'board'
    id: string
    name: string
  } | null>(null)

  // ─── Form State ────────────────────────────────────────────
  const [classForm, setClassForm] = useState({
    name: '',
    slug: '',
    icon: '',
    color: '',
    description: '',
    order: 0,
    isActive: true,
  })
  const [classFormOrder, setClassFormOrder] = useState('0')

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    slug: '',
    icon: '',
    color: '',
    description: '',
    order: 0,
    isActive: true,
  })
  const [subjectFormOrder, setSubjectFormOrder] = useState('0')

  const [chapterForm, setChapterForm] = useState({
    name: '',
    slug: '',
    description: '',
    order: 0,
    isActive: true,
  })
  const [chapterFormOrder, setChapterFormOrder] = useState('0')

  const [boardForm, setBoardForm] = useState({
    name: '',
    slug: '',
    isActive: true,
    order: 0,
  })
  const [boardFormOrder, setBoardFormOrder] = useState('0')

  const [saving, setSaving] = useState(false)

  // ─── Chapter Content Counts ───────────────────────────────
  const [chapterCounts, setChapterCounts] = useState<Array<{
    chapterId: string; chapterName: string; subjectName: string
    mcqTotal: number; mcqPremium: number; mcqFree: number
    cqTotal: number; cqPremium: number; cqFree: number
  }>>([])

  // Fetch chapter content counts when subject changes
  useEffect(() => {
    const fetchCounts = async () => {
      if (!selectedSubjectId) { setChapterCounts([]); return }
      try {
        const res = await fetch(`/api/admin/chapters/content-counts?subjectId=${selectedSubjectId}`)
        if (res.ok) {
          const json = await res.json()
          setChapterCounts(Array.isArray(json.data) ? json.data : [])
        }
      } catch { /* ignore */ }
    }
    fetchCounts()
  }, [selectedSubjectId])

  // Build lookup map for quick access
  const chapterCountsMap = useMemo(() => {
    const map = new Map<string, typeof chapterCounts[0]>()
    for (const c of chapterCounts) map.set(c.chapterId, c)
    return map
  }, [chapterCounts])

  // ─── Fetch Classes ─────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    setClassesLoading(true)
    try {
      const res = await fetch('/api/admin/classes')
      if (res.ok) {
        const json = await res.json()
        setClasses(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'শ্রেণি লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setClassesLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  // ─── Fetch Boards ─────────────────────────────────────────
  const fetchBoards = useCallback(async () => {
    setBoardsLoading(true)
    try {
      const res = await fetch('/api/admin/boards')
      if (res.ok) {
        const json = await res.json()
        setBoards(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'বোর্ড লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setBoardsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  // ─── Fetch Subjects ────────────────────────────────────────
  const fetchSubjects = useCallback(async (classId: string) => {
    setSubjectsLoading(true)
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`)
      if (res.ok) {
        const json = await res.json()
        setSubjects(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'বিষয় লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setSubjectsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (selectedClassId) {
      fetchSubjects(selectedClassId)
    } else {
      setSubjects([])
      setSelectedSubjectId(null)
    }
  }, [selectedClassId, fetchSubjects])

  // ─── Fetch Chapters ────────────────────────────────────────
  const fetchChapters = useCallback(async (subjectId: string) => {
    setChaptersLoading(true)
    try {
      const res = await fetch(`/api/admin/chapters?subjectId=${subjectId}`)
      if (res.ok) {
        const json = await res.json()
        setChapters(Array.isArray(json.data) ? json.data : [])
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'অধ্যায় লোড করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setChaptersLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (selectedSubjectId) {
      fetchChapters(selectedSubjectId)
    } else {
      setChapters([])
    }
  }, [selectedSubjectId, fetchChapters])

  // ─── Class CRUD ────────────────────────────────────────────
  const openClassCreate = () => {
    setEditingClass(null)
    setClassForm({ name: '', slug: '', icon: '', color: '', description: '', order: classes.length, isActive: true })
    setClassFormOrder(String(classes.length))
    setClassDialogOpen(true)
  }

  const openClassEdit = (cls: ClassItem) => {
    setEditingClass(cls)
    setClassForm({
      name: cls.name,
      slug: cls.slug,
      icon: cls.icon || '',
      color: cls.color || '',
      description: cls.description || '',
      order: cls.order,
      isActive: cls.isActive,
    })
    setClassFormOrder(String(cls.order))
    setClassDialogOpen(true)
  }

  const saveClass = async () => {
    if (!classForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'শ্রেণির নাম আবশ্যক', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const slug = classForm.slug || generateSlug(classForm.name)
      const body = {
        ...(editingClass ? { id: editingClass.id } : {}),
        name: classForm.name,
        slug,
        icon: classForm.icon || null,
        color: classForm.color || null,
        description: classForm.description || null,
        order: parseInt(classFormOrder) || 0,
        isActive: classForm.isActive,
      }

      const res = editingClass
        ? await fetch('/api/admin/classes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editingClass ? 'শ্রেণি আপডেট হয়েছে' : 'শ্রেণি তৈরি হয়েছে' })
        setClassDialogOpen(false)
        fetchClasses()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteClass = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/classes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'শ্রেণি মুছে ফেলা হয়েছে' })
        if (selectedClassId === id) {
          setSelectedClassId(null)
          setSelectedSubjectId(null)
        }
        fetchClasses()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'মুছতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }

  const reorderClass = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...classes].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((c) => c.id === id)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const current = sorted[idx]
    const swap = sorted[swapIdx]

    // Optimistic update
    setClasses((prev) => {
      const updated = [...prev]
      const ci = updated.findIndex((c) => c.id === current.id)
      const si = updated.findIndex((c) => c.id === swap.id)
      if (ci >= 0) updated[ci] = { ...updated[ci], order: swap.order }
      if (si >= 0) updated[si] = { ...updated[si], order: current.order }
      return updated.sort((a, b) => a.order - b.order)
    })

    try {
      await fetch('/api/admin/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: current.id, order: swap.order }),
      })
      await fetch('/api/admin/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swap.id, order: current.order }),
      })
    } catch {
      toast({ title: 'ত্রুটি', description: 'শ্রেণির ক্রম পরিবর্তন করতে সমস্যা হয়েছে', variant: 'destructive' })
      fetchClasses()
    }
  }

  // ─── Subject CRUD ──────────────────────────────────────────
  const openSubjectCreate = () => {
    if (!selectedClassId) {
      toast({ title: 'ত্রুটি', description: 'প্রথমে একটি শ্রেণি নির্বাচন করুন', variant: 'destructive' })
      return
    }
    setEditingSubject(null)
    setSubjectForm({ name: '', slug: '', icon: '', color: '', description: '', order: subjects.length, isActive: true })
    setSubjectFormOrder(String(subjects.length))
    setSubjectDialogOpen(true)
  }

  const openSubjectEdit = (subj: SubjectItem) => {
    setEditingSubject(subj)
    setSubjectForm({
      name: subj.name,
      slug: subj.slug,
      icon: subj.icon || '',
      color: subj.color || '',
      description: subj.description || '',
      order: subj.order,
      isActive: subj.isActive,
    })
    setSubjectFormOrder(String(subj.order))
    setSubjectDialogOpen(true)
  }

  const saveSubject = async () => {
    if (!subjectForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'বিষয়ের নাম আবশ্যক', variant: 'destructive' })
      return
    }
    if (!selectedClassId) {
      toast({ title: 'ত্রুটি', description: 'শ্রেণি নির্বাচন করুন', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const slug = subjectForm.slug || generateSlug(subjectForm.name)
      const body = {
        ...(editingSubject ? { id: editingSubject.id } : {}),
        name: subjectForm.name,
        slug,
        classId: selectedClassId,
        icon: subjectForm.icon || null,
        color: subjectForm.color || null,
        description: subjectForm.description || null,
        order: parseInt(subjectFormOrder) || 0,
        isActive: subjectForm.isActive,
      }

      const res = editingSubject
        ? await fetch('/api/admin/subjects', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editingSubject ? 'বিষয় আপডেট হয়েছে' : 'বিষয় তৈরি হয়েছে' })
        setSubjectDialogOpen(false)
        if (selectedClassId) fetchSubjects(selectedClassId)
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteSubject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/subjects?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'বিষয় মুছে ফেলা হয়েছে' })
        if (selectedSubjectId === id) setSelectedSubjectId(null)
        if (selectedClassId) fetchSubjects(selectedClassId)
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'মুছতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }

  const reorderSubject = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...subjects].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((s) => s.id === id)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const current = sorted[idx]
    const swap = sorted[swapIdx]

    setSubjects((prev) => {
      const updated = [...prev]
      const ci = updated.findIndex((s) => s.id === current.id)
      const si = updated.findIndex((s) => s.id === swap.id)
      if (ci >= 0) updated[ci] = { ...updated[ci], order: swap.order }
      if (si >= 0) updated[si] = { ...updated[si], order: current.order }
      return updated.sort((a, b) => a.order - b.order)
    })

    try {
      await fetch('/api/admin/subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: current.id, order: swap.order }),
      })
      await fetch('/api/admin/subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swap.id, order: current.order }),
      })
    } catch {
      toast({ title: 'ত্রুটি', description: 'বিষয়ের ক্রম পরিবর্তন করতে সমস্যা হয়েছে', variant: 'destructive' })
      if (selectedClassId) fetchSubjects(selectedClassId)
    }
  }

  // ─── Chapter CRUD ──────────────────────────────────────────
  const openChapterCreate = () => {
    if (!selectedSubjectId) {
      toast({ title: 'ত্রুটি', description: 'প্রথমে একটি বিষয় নির্বাচন করুন', variant: 'destructive' })
      return
    }
    setEditingChapter(null)
    setChapterForm({ name: '', slug: '', description: '', order: chapters.length, isActive: true })
    setChapterFormOrder(String(chapters.length))
    setChapterDialogOpen(true)
  }

  const openChapterEdit = (ch: ChapterItem) => {
    setEditingChapter(ch)
    setChapterForm({
      name: ch.name,
      slug: ch.slug,
      description: ch.description || '',
      order: ch.order,
      isActive: ch.isActive,
    })
    setChapterFormOrder(String(ch.order))
    setChapterDialogOpen(true)
  }

  const saveChapter = async () => {
    if (!chapterForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'অধ্যায়ের নাম আবশ্যক', variant: 'destructive' })
      return
    }
    if (!selectedSubjectId) {
      toast({ title: 'ত্রুটি', description: 'বিষয় নির্বাচন করুন', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const slug = chapterForm.slug || generateSlug(chapterForm.name)
      const body = {
        ...(editingChapter ? { id: editingChapter.id } : {}),
        name: chapterForm.name,
        slug,
        subjectId: selectedSubjectId,
        description: chapterForm.description || null,
        order: parseInt(chapterFormOrder) || 0,
        isActive: chapterForm.isActive,
      }

      const res = editingChapter
        ? await fetch('/api/admin/chapters', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/chapters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editingChapter ? 'অধ্যায় আপডেট হয়েছে' : 'অধ্যায় তৈরি হয়েছে' })
        setChapterDialogOpen(false)
        if (selectedSubjectId) fetchChapters(selectedSubjectId)
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteChapter = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/chapters?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'অধ্যায় মুছে ফেলা হয়েছে' })
        if (selectedSubjectId) fetchChapters(selectedSubjectId)
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'মুছতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }

  const reorderChapter = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...chapters].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((c) => c.id === id)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const current = sorted[idx]
    const swap = sorted[swapIdx]

    setChapters((prev) => {
      const updated = [...prev]
      const ci = updated.findIndex((c) => c.id === current.id)
      const si = updated.findIndex((c) => c.id === swap.id)
      if (ci >= 0) updated[ci] = { ...updated[ci], order: swap.order }
      if (si >= 0) updated[si] = { ...updated[si], order: current.order }
      return updated.sort((a, b) => a.order - b.order)
    })

    try {
      await fetch('/api/admin/chapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: current.id, order: swap.order }),
      })
      await fetch('/api/admin/chapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swap.id, order: current.order }),
      })
    } catch {
      toast({ title: 'ত্রুটি', description: 'অধ্যায়ের ক্রম পরিবর্তন করতে সমস্যা হয়েছে', variant: 'destructive' })
      if (selectedSubjectId) fetchChapters(selectedSubjectId)
    }
  }

  // ─── Board CRUD ────────────────────────────────────────────
  const openBoardCreate = () => {
    setEditingBoard(null)
    setBoardForm({ name: '', slug: '', isActive: true, order: boards.length })
    setBoardFormOrder(String(boards.length))
    setBoardDialogOpen(true)
  }

  const openBoardEdit = (board: BoardItem) => {
    setEditingBoard(board)
    setBoardForm({
      name: board.name,
      slug: board.slug,
      isActive: board.isActive,
      order: board.order,
    })
    setBoardFormOrder(String(board.order))
    setBoardDialogOpen(true)
  }

  const saveBoard = async () => {
    if (!boardForm.name.trim()) {
      toast({ title: 'ত্রুটি', description: 'বোর্ডের নাম আবশ্যক', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const slug = boardForm.slug || generateSlug(boardForm.name)
      const body = {
        ...(editingBoard ? { id: editingBoard.id } : {}),
        name: boardForm.name,
        slug,
        isActive: boardForm.isActive,
        order: parseInt(boardFormOrder) || 0,
      }

      const res = editingBoard
        ? await fetch('/api/admin/boards', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (res.ok) {
        toast({ title: editingBoard ? 'বোর্ড আপডেট হয়েছে' : 'বোর্ড তৈরি হয়েছে' })
        setBoardDialogOpen(false)
        fetchBoards()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteBoard = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/boards?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'বোর্ড মুছে ফেলা হয়েছে' })
        fetchBoards()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error || 'মুছতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'নেটওয়ার্ক সমস্যা', variant: 'destructive' })
    }
  }

  const reorderBoard = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...boards].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((b) => b.id === id)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const current = sorted[idx]
    const swap = sorted[swapIdx]

    setBoards((prev) => {
      const updated = [...prev]
      const ci = updated.findIndex((b) => b.id === current.id)
      const si = updated.findIndex((b) => b.id === swap.id)
      if (ci >= 0) updated[ci] = { ...updated[ci], order: swap.order }
      if (si >= 0) updated[si] = { ...updated[si], order: current.order }
      return updated.sort((a, b) => a.order - b.order)
    })

    try {
      await fetch('/api/admin/boards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: current.id, order: swap.order }),
      })
      await fetch('/api/admin/boards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swap.id, order: current.order }),
      })
    } catch {
      toast({ title: 'ত্রুটি', description: 'বোর্ডের ক্রম পরিবর্তন করতে সমস্যা হয়েছে', variant: 'destructive' })
      fetchBoards()
    }
  }

  // ─── Handle Delete Confirmation ────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'class') await deleteClass(deleteConfirm.id)
    else if (deleteConfirm.type === 'subject') await deleteSubject(deleteConfirm.id)
    else if (deleteConfirm.type === 'chapter') await deleteChapter(deleteConfirm.id)
    else if (deleteConfirm.type === 'board') await deleteBoard(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  // ─── Render Section ────────────────────────────────────────
  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">হায়ারার্কি ব্যবস্থাপনা</h1>
          <p className="text-sm text-muted-foreground">শ্রেণি → বিষয় → অধ্যায় → বোর্ড ব্যবস্থাপনা</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button
          onClick={() => { setSelectedClassId(null); setSelectedSubjectId(null) }}
          className="text-muted-foreground hover:text-emerald-600 transition-colors"
        >
          সকল শ্রেণি
        </button>
        {selectedClass && (
          <>
            <span className="text-muted-foreground">/</span>
            <button
              onClick={() => setSelectedSubjectId(null)}
              className={selectedSubjectId ? 'text-muted-foreground hover:text-emerald-600 transition-colors' : 'text-emerald-600 font-medium'}
            >
              {selectedClass.name}
            </button>
          </>
        )}
        {selectedSubject && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-emerald-600 font-medium">{selectedSubject.name}</span>
          </>
        )}
      </div>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="border-border/50 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-5 py-3.5 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                <Label className="text-sm font-semibold">শ্রেণি</Label>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {classes.length}
                </Badge>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={openClassCreate}>
                <Plus className="h-3 w-3" /> যোগ করুন
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            {classesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Layers className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">কোনো শ্রেণি নেই</p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
                <AnimatePresence>
                  {classes
                    .sort((a, b) => a.order - b.order)
                    .map((cls, idx) => (
                      <motion.div
                        key={cls.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className={cn(
                          'group border-b border-border/30 last:border-b-0 transition-colors cursor-pointer',
                          selectedClassId === cls.id
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/20'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => {
                          setSelectedClassId(cls.id)
                          setSelectedSubjectId(null)
                        }}
                      >
                        <div className="flex items-center gap-2 px-4 py-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />

                          {/* Color dot */}
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cls.color || '#10b981' }}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{cls.name}</span>
                              {!cls.isActive && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-muted text-muted-foreground">
                                  নিষ্ক্রিয়
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{cls.slug}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">ক্রম: {cls.order}</span>
                              {cls._count && (
                                <>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                    {cls._count.subjects} বিষয়
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); reorderClass(cls.id, 'up') }}
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); reorderClass(cls.id, 'down') }}
                              disabled={idx === classes.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); openClassEdit(cls) }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'class', id: cls.id, name: cls.name }) }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Active indicator */}
                          {selectedClassId === cls.id && (
                            <div className="w-1.5 h-6 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════════ Subjects Column ═══════════ */}
        <Card className="border-border/50 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50/80 to-cyan-50/80 dark:from-teal-950/30 dark:to-cyan-950/30 px-5 py-3.5 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-teal-600" />
                <Label className="text-sm font-semibold">বিষয়</Label>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {subjects.length}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={openSubjectCreate}
                disabled={!selectedClassId}
              >
                <Plus className="h-3 w-3" /> যোগ করুন
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            {!selectedClassId ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookOpen className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">একটি শ্রেণি নির্বাচন করুন</p>
              </div>
            ) : subjectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookOpen className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">কোনো বিষয় নেই</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs gap-1" onClick={openSubjectCreate}>
                  <Plus className="h-3 w-3" /> বিষয় যোগ করুন
                </Button>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
                <AnimatePresence>
                  {subjects
                    .sort((a, b) => a.order - b.order)
                    .map((subj, idx) => (
                      <motion.div
                        key={subj.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className={cn(
                          'group border-b border-border/30 last:border-b-0 transition-colors cursor-pointer',
                          selectedSubjectId === subj.id
                            ? 'bg-teal-50/80 dark:bg-teal-950/20'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedSubjectId(subj.id)}
                      >
                        <div className="flex items-center gap-2 px-4 py-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />

                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: subj.color || '#14b8a6' }}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{subj.name}</span>
                              {!subj.isActive && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-muted text-muted-foreground">
                                  নিষ্ক্রিয়
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{subj.slug}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">ক্রম: {subj.order}</span>
                              {subj._count && (
                                <>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-teal-600 dark:text-teal-400">
                                    {subj._count.chapters} অধ্যায়
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); reorderSubject(subj.id, 'up') }}
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); reorderSubject(subj.id, 'down') }}
                              disabled={idx === subjects.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); openSubjectEdit(subj) }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'subject', id: subj.id, name: subj.name }) }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {selectedSubjectId === subj.id && (
                            <div className="w-1.5 h-6 rounded-full bg-teal-500 shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════════ Chapters Column ═══════════ */}
        <Card className="border-border/50 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-50/80 to-sky-50/80 dark:from-cyan-950/30 dark:to-sky-950/30 px-5 py-3.5 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-cyan-600" />
                <Label className="text-sm font-semibold">অধ্যায়</Label>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {chapters.length}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={openChapterCreate}
                disabled={!selectedSubjectId}
              >
                <Plus className="h-3 w-3" /> যোগ করুন
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            {!selectedSubjectId ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookMarked className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">একটি বিষয় নির্বাচন করুন</p>
              </div>
            ) : chaptersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
              </div>
            ) : chapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookMarked className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">কোনো অধ্যায় নেই</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs gap-1" onClick={openChapterCreate}>
                  <Plus className="h-3 w-3" /> অধ্যায় যোগ করুন
                </Button>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
                <AnimatePresence>
                  {chapters
                    .sort((a, b) => a.order - b.order)
                    .map((ch, idx) => (
                      <motion.div
                        key={ch.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className="group border-b border-border/30 last:border-b-0 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 px-4 py-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{ch.name}</span>
                              {!ch.isActive && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-muted text-muted-foreground">
                                  নিষ্ক্রিয়
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {ch._count && (
                                <>
                                  {(() => {
                                    const counts = chapterCountsMap.get(ch.id)
                                    return counts ? (
                                      <>
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                                          <FileQuestion className="h-2.5 w-2.5" />
                                          MCQ: <span className="font-semibold">{counts.mcqFree}</span>
                                          <span className="text-muted-foreground">/</span>
                                          <span className="text-amber-600 dark:text-amber-400 font-semibold">{counts.mcqPremium}</span>
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">·</span>
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-teal-600 dark:text-teal-400">
                                          <AlignLeft className="h-2.5 w-2.5" />
                                          CQ: <span className="font-semibold">{counts.cqFree}</span>
                                          <span className="text-muted-foreground">/</span>
                                          <span className="text-amber-600 dark:text-amber-400 font-semibold">{counts.cqPremium}</span>
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">·</span>
                                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                                          {ch._count.lectures} লেকচার
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                                        {ch._count.mcqs} MCQ · {ch._count.cqs} CQ · {ch._count.lectures} লেকচার
                                      </span>
                                    )
                                  })()}
                                </>
                              )}
                            </div>
                            {/* Premium/Free legend for chapters */}
                            {ch._count && chapterCountsMap.get(ch.id) && idx === 0 && (
                              <div className="flex items-center gap-2 px-4 pb-1.5 text-[9px] text-muted-foreground">
                                <span className="inline-flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ফ্রি</span>
                                <span className="inline-flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> প্রিমিয়াম</span>
                                <span>(ফ্রি / প্রিমিয়াম)</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); reorderChapter(ch.id, 'up') }}
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); reorderChapter(ch.id, 'down') }}
                              disabled={idx === chapters.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); openChapterEdit(ch) }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'chapter', id: ch.id, name: ch.name }) }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Board Management - Horizontal Card Grid */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-3.5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              <Label className="text-sm font-semibold">বোর্ড</Label>
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {boards.length}
              </Badge>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={openBoardCreate}>
              <Plus className="h-3 w-3" /> যোগ করুন
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          {boardsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">কোনো বোর্ড নেই</p>
              <Button size="sm" variant="outline" className="mt-2 text-xs gap-1" onClick={openBoardCreate}>
                <Plus className="h-3 w-3" /> বোর্ড যোগ করুন
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {boards
                .sort((a, b) => a.order - b.order)
                .map((board, idx) => (
                  <motion.div
                    key={board.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="group relative rounded-lg border border-border/50 p-3 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-medium text-sm truncate">{board.name}</span>
                      {!board.isActive && (
                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1 bg-muted text-muted-foreground ml-auto shrink-0">
                          নিষ্ক্রিয়
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mb-2">{board.slug}</p>
                    {/* Actions - show on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => { e.stopPropagation(); reorderBoard(board.id, 'up') }}
                        disabled={idx === 0}
                      >
                        <ChevronUp className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => { e.stopPropagation(); reorderBoard(board.id, 'down') }}
                        disabled={idx === boards.length - 1}
                      >
                        <ChevronDown className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => { e.stopPropagation(); openBoardEdit(board) }}
                      >
                        <Edit className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'board', id: board.id, name: board.name }) }}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Class Dialog ═══════════ */}
      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600" />
              {editingClass ? 'শ্রেণি সম্পাদনা' : 'নতুন শ্রেণি যোগ করুন'}
            </DialogTitle>
            <DialogDescription>
              {editingClass ? 'শ্রেণির তথ্য আপডেট করুন' : 'নতুন শ্রেণির তথ্য দিন'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">নাম <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="শ্রেণির নাম লিখুন"
                  value={classForm.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setClassForm((f) => ({
                      ...f,
                      name,
                      slug: f.slug === generateSlug(f.name) ? generateSlug(name) : f.slug,
                    }))
                  }}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">স্লাগ</Label>
                <Input
                  placeholder="auto-generated-slug"
                  value={classForm.slug}
                  onChange={(e) => setClassForm((f) => ({ ...f, slug: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">আইকন</Label>
                <Input
                  placeholder="আইকনের নাম (ঐচ্ছিক)"
                  value={classForm.icon}
                  onChange={(e) => setClassForm((f) => ({ ...f, icon: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">রঙ</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="#10b981"
                    value={classForm.color}
                    onChange={(e) => setClassForm((f) => ({ ...f, color: e.target.value }))}
                    className="flex-1"
                  />
                  {classForm.color && (
                    <div
                      className="w-9 h-9 rounded-md border shrink-0"
                      style={{ backgroundColor: classForm.color }}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">বিবরণ</Label>
                <Textarea
                  placeholder="শ্রেণির বিবরণ (ঐচ্ছিক)"
                  value={classForm.description}
                  onChange={(e) => setClassForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">ক্রম</Label>
                <Input
                  type="number"
                  min={0}
                  value={classFormOrder}
                  onChange={(e) => setClassFormOrder(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">সক্রিয়</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={classForm.isActive}
                    onCheckedChange={(v) => setClassForm((f) => ({ ...f, isActive: v }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {classForm.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassDialogOpen(false)} disabled={saving}>
              বাতিল
            </Button>
            <Button onClick={saveClass} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {editingClass ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Subject Dialog ═══════════ */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-600" />
              {editingSubject ? 'বিষয় সম্পাদনা' : 'নতুন বিষয় যোগ করুন'}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? 'বিষয়ের তথ্য আপডেট করুন'
                : `${selectedClass?.name || 'শ্রেণি'}-এর জন্য নতুন বিষয় যোগ করুন`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">নাম <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="বিষয়ের নাম লিখুন"
                  value={subjectForm.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setSubjectForm((f) => ({
                      ...f,
                      name,
                      slug: f.slug === generateSlug(f.name) ? generateSlug(name) : f.slug,
                    }))
                  }}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">স্লাগ</Label>
                <Input
                  placeholder="auto-generated-slug"
                  value={subjectForm.slug}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, slug: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">আইকন</Label>
                <Input
                  placeholder="আইকনের নাম (ঐচ্ছিক)"
                  value={subjectForm.icon}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, icon: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">রঙ</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="#14b8a6"
                    value={subjectForm.color}
                    onChange={(e) => setSubjectForm((f) => ({ ...f, color: e.target.value }))}
                    className="flex-1"
                  />
                  {subjectForm.color && (
                    <div
                      className="w-9 h-9 rounded-md border shrink-0"
                      style={{ backgroundColor: subjectForm.color }}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">বিবরণ</Label>
                <Textarea
                  placeholder="বিষয়ের বিবরণ (ঐচ্ছিক)"
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">ক্রম</Label>
                <Input
                  type="number"
                  min={0}
                  value={subjectFormOrder}
                  onChange={(e) => setSubjectFormOrder(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">সক্রিয়</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={subjectForm.isActive}
                    onCheckedChange={(v) => setSubjectForm((f) => ({ ...f, isActive: v }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {subjectForm.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialogOpen(false)} disabled={saving}>
              বাতিল
            </Button>
            <Button onClick={saveSubject} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {editingSubject ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Chapter Dialog ═══════════ */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-cyan-600" />
              {editingChapter ? 'অধ্যায় সম্পাদনা' : 'নতুন অধ্যায় যোগ করুন'}
            </DialogTitle>
            <DialogDescription>
              {editingChapter
                ? 'অধ্যায়ের তথ্য আপডেট করুন'
                : `${selectedSubject?.name || 'বিষয়'}-এর জন্য নতুন অধ্যায় যোগ করুন`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">নাম <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="অধ্যায়ের নাম লিখুন"
                  value={chapterForm.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setChapterForm((f) => ({
                      ...f,
                      name,
                      slug: f.slug === generateSlug(f.name) ? generateSlug(name) : f.slug,
                    }))
                  }}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">স্লাগ</Label>
                <Input
                  placeholder="auto-generated-slug"
                  value={chapterForm.slug}
                  onChange={(e) => setChapterForm((f) => ({ ...f, slug: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">বিবরণ</Label>
                <Textarea
                  placeholder="অধ্যায়ের বিবরণ (ঐচ্ছিক)"
                  value={chapterForm.description}
                  onChange={(e) => setChapterForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">ক্রম</Label>
                <Input
                  type="number"
                  min={0}
                  value={chapterFormOrder}
                  onChange={(e) => setChapterFormOrder(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">সক্রিয়</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={chapterForm.isActive}
                    onCheckedChange={(v) => setChapterForm((f) => ({ ...f, isActive: v }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {chapterForm.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterDialogOpen(false)} disabled={saving}>
              বাতিল
            </Button>
            <Button onClick={saveChapter} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {editingChapter ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Board Dialog ═══════════ */}
      <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              {editingBoard ? 'বোর্ড সম্পাদনা' : 'নতুন বোর্ড যোগ করুন'}
            </DialogTitle>
            <DialogDescription>
              {editingBoard ? 'বোর্ডের তথ্য আপডেট করুন' : 'নতুন বোর্ডের তথ্য দিন'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">নাম <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="বোর্ডের নাম লিখুন"
                  value={boardForm.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setBoardForm((f) => ({
                      ...f,
                      name,
                      slug: f.slug === generateSlug(f.name) ? generateSlug(name) : f.slug,
                    }))
                  }}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium">স্লাগ</Label>
                <Input
                  placeholder="auto-generated-slug"
                  value={boardForm.slug}
                  onChange={(e) => setBoardForm((f) => ({ ...f, slug: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">ক্রম</Label>
                <Input
                  type="number"
                  min={0}
                  value={boardFormOrder}
                  onChange={(e) => setBoardFormOrder(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">সক্রিয়</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={boardForm.isActive}
                    onCheckedChange={(v) => setBoardForm((f) => ({ ...f, isActive: v }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {boardForm.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoardDialogOpen(false)} disabled={saving}>
              বাতিল
            </Button>
            <Button onClick={saveBoard} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {editingBoard ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Delete Confirmation Dialog ═══════════ */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              মুছে ফেলার নিশ্চিতকরণ
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === 'class' && (
                <>
                  <strong>{deleteConfirm?.name}</strong> শ্রেণি মুছে ফেলতে চান? এর সকল বিষয় ও অধ্যায়ও মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
                </>
              )}
              {deleteConfirm?.type === 'subject' && (
                <>
                  <strong>{deleteConfirm?.name}</strong> বিষয় মুছে ফেলতে চান? এর সকল অধ্যায়ও মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
                </>
              )}
              {deleteConfirm?.type === 'chapter' && (
                <>
                  <strong>{deleteConfirm?.name}</strong> অধ্যায় মুছে ফেলতে চান? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
                </>
              )}
              {deleteConfirm?.type === 'board' && (
                <>
                  <strong>{deleteConfirm?.name}</strong> বোর্ড মুছে ফেলতে চান? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
