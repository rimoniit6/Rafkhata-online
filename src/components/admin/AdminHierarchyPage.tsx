'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Layers, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BoardManager } from './hierarchy/BoardManager'
import { ChapterManager } from './hierarchy/ChapterManager'
import { ClassManager } from './hierarchy/ClassManager'
import { SubjectManager } from './hierarchy/SubjectManager'
import type {
  BoardItem,
  ChapterCountItem,
  ChapterItem,
  ClassItem,
  DeleteConfirm,
  SubjectItem,
} from './hierarchy/types'

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

  // ─── Delete Confirmation ───────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null)

  // ─── Chapter Content Counts ───────────────────────────────
  const [chapterCounts, setChapterCounts] = useState<ChapterCountItem[]>([])

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

  const chapterCountsMap = useMemo(() => {
    const map = new Map<string, ChapterCountItem>()
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

  // ─── Delete Functions ──────────────────────────────────────
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
        <ClassManager
          classes={classes}
          setClasses={setClasses}
          classesLoading={classesLoading}
          selectedClassId={selectedClassId}
          onSelectClass={(id) => { setSelectedClassId(id); setSelectedSubjectId(null) }}
          onDeleteConfirm={setDeleteConfirm}
          refreshClasses={fetchClasses}
        />
        <SubjectManager
          subjects={subjects}
          setSubjects={setSubjects}
          subjectsLoading={subjectsLoading}
          selectedClassId={selectedClassId}
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={setSelectedSubjectId}
          onDeleteConfirm={setDeleteConfirm}
          refreshSubjects={fetchSubjects}
          selectedClassName={selectedClass?.name}
        />
        <ChapterManager
          chapters={chapters}
          setChapters={setChapters}
          chaptersLoading={chaptersLoading}
          selectedSubjectId={selectedSubjectId}
          chapterCountsMap={chapterCountsMap}
          onDeleteConfirm={setDeleteConfirm}
          refreshChapters={fetchChapters}
          selectedSubjectName={selectedSubject?.name}
        />
      </div>

      <BoardManager
        boards={boards}
        setBoards={setBoards}
        boardsLoading={boardsLoading}
        onDeleteConfirm={setDeleteConfirm}
        refreshBoards={fetchBoards}
      />

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
