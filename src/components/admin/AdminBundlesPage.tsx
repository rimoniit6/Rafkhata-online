'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Package,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  Save,
  X,
  ChevronRight,
  Check,
  Crown,
  FileQuestion,
  AlignLeft,
  BookOpen,
  Lightbulb,
  ClipboardCheck,
  Tag,
  Percent,
  ShoppingCart,
  Image as ImageIcon,
  MoreVertical,
  Eye,
  Power,
  Sparkles,
  AlertCircle,
  ListChecks,
  IndianRupee,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MultiSelect } from '@/components/ui/multi-select'
import { useToast } from '@/hooks/use-toast'
import ImageUploader from '@/components/ui/image-uploader'
import { cn } from '@/lib/utils'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useContentTypes } from '@/hooks/use-content-types'
import RichContentRenderer from '@/components/ui/rich-content-renderer'

// ─── Types ──────────────────────────────────────────────────────

interface BundleItemRecord {
  id: string
  bundleId: string
  contentType: string
  contentId: string
  order: number
  createdAt: string
}

interface BundleRecord {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  originalPrice: number
  classLevel: string | null
  board: string | null
  year: string | null
  type: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  items: BundleItemRecord[]
}

interface ContentItem {
  id: string
  title?: string
  question?: string
  uddeepok?: string
  price: number
  isPremium?: boolean
  classLevel?: string
  thumbnail?: string | null
  chapter?: { id: string; name: string } | null
  subject?: { id: string; name: string } | null
}

interface SelectedContentItem {
  contentType: string
  contentId: string
  title: string
  price: number
  order: number
}

// ─── Constants ──────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  mcq: 'MCQ',
  cq: 'CQ',
  lecture: 'লেকচার',
  board: 'বোর্ড',
  mixed: 'মিশ্র',
}

const typeColors: Record<string, string> = {
  mcq: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  cq: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  lecture: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  board: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  mixed: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
}



// Content type labels, icons, and colors are now provided dynamically via useContentTypes() hook

const steps = [
  { id: 1, label: 'বান্ডেল তথ্য', icon: Package, description: 'নাম, বিবরণ, ধরন' },
  { id: 2, label: 'কন্টেন্ট যোগ', icon: ListChecks, description: 'কন্টেন্ট আইটেম বাছাই' },
  { id: 3, label: 'মূল্য ও প্রকাশ', icon: Tag, description: 'মূল্য নির্ধারণ ও প্রকাশ' },
]

// ─── Component ──────────────────────────────────────────────────

export default function AdminBundlesPage() {
  const { toast } = useToast()
  const { classLevelLabels, classOptions, boardOptions: hookBoardOptions, yearOptions: hookYearOptions } = useHierarchyMetadata()
  const { getLabel, getIcon, getTextColor } = useContentTypes()
  const [loading, setLoading] = useState(true)
  const [bundles, setBundles] = useState<BundleRecord[]>([])
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterClassLevel, setFilterClassLevel] = useState<string[]>([])
  const [filterType, setFilterType] = useState<string[]>([])

  // Step 1: Bundle Info
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formThumbnail, setFormThumbnail] = useState('')
  const [formType, setFormType] = useState<string[]>(['mixed'])
  const [formClassLevel, setFormClassLevel] = useState<string[]>([])
  const [formBoard, setFormBoard] = useState<string[]>([])
  const [formYear, setFormYear] = useState<string[]>([])

  // Step 2: Content items
  const [selectedItems, setSelectedItems] = useState<SelectedContentItem[]>([])
  const [contentTab, setContentTab] = useState('mcq')
  const [contentSearch, setContentSearch] = useState('')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

  // Chapter-based quick selection
  const [hierarchyClassId, setHierarchyClassId] = useState('')
  const [hierarchySubjectId, setHierarchySubjectId] = useState('')
  const [hierarchyChapterId, setHierarchyChapterId] = useState('')
  const [hierarchyData, setHierarchyData] = useState<{
    classes: { id: string; name: string; slug: string }[]
    subjects: { id: string; name: string; slug: string; classId: string }[]
    chapters: { id: string; name: string; slug: string; subjectId: string }[]
  }>({ classes: [], subjects: [], chapters: [] })
  const [chapterCounts, setChapterCounts] = useState<Array<{
    chapterId: string; chapterName: string; subjectName: string
    mcqTotal: number; mcqPremium: number; mcqFree: number
    cqTotal: number; cqPremium: number; cqFree: number
  }>>([])

  // Step 3: Pricing
  const [formPrice, setFormPrice] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formOrder, setFormOrder] = useState('')

  // Debounced search values (for API calls only)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedContentSearch, setDebouncedContentSearch] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search for API calls
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  // Debounce content search for API calls
  useEffect(() => {
    if (contentSearchTimerRef.current) clearTimeout(contentSearchTimerRef.current)
    contentSearchTimerRef.current = setTimeout(() => setDebouncedContentSearch(contentSearch), 400)
    return () => { if (contentSearchTimerRef.current) clearTimeout(contentSearchTimerRef.current) }
  }, [contentSearch])

  // ─── Fetch Bundles ────────────────────────────────────────────

  const fetchBundles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filterClassLevel.length > 0) params.set('classLevel', filterClassLevel.join(','))
      if (filterType.length > 0) params.set('type', filterType.join(','))
      params.set('page', '1')
      params.set('limit', '50')
      const res = await fetch(`/api/admin/bundles?${params}`)
      if (res.ok) {
        const json = await res.json()
        setBundles(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total || 0)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [debouncedSearch, filterClassLevel, filterType])

  useEffect(() => { fetchBundles() }, [fetchBundles])

  // ─── Fetch Content Items for Step 2 ───────────────────────────

  const fetchContentItems = useCallback(async () => {
    setLoadingContent(true)
    try {
      const params = new URLSearchParams()
      params.set('isPremium', 'true')
      params.set('limit', '30')

      let endpoint = ''
      switch (contentTab) {
        case 'mcq':
          endpoint = '/api/admin/mcq'
          if (debouncedContentSearch) { params.set('q', debouncedContentSearch) }
          break
        case 'cq':
          endpoint = '/api/admin/cq'
          if (debouncedContentSearch) { params.set('q', debouncedContentSearch) }
          break
        case 'lecture':
          endpoint = '/api/admin/lectures'
          if (debouncedContentSearch) { params.set('q', debouncedContentSearch) }
          break
        case 'suggestion':
          endpoint = '/api/admin/suggestions'
          if (debouncedContentSearch) { params.set('search', debouncedContentSearch) }
          break
        case 'exam':
          endpoint = '/api/admin/exams'
          if (debouncedContentSearch) { params.set('q', debouncedContentSearch) }
          break
      }

      const res = await fetch(`${endpoint}?${params}`)
      if (res.ok) {
        const json = await res.json()
        const items: ContentItem[] = (Array.isArray(json.data) ? json.data : [])
          .map((item: Record<string, unknown>) => ({
            id: item.id as string,
            title: (item.title || item.question || item.uddeepok || '') as string,
            question: item.question as string | undefined,
            uddeepok: item.uddeepok as string | undefined,
            price: (item.price as number) || 0,
            isPremium: item.isPremium as boolean | undefined,
            classLevel: item.classLevel as string | undefined,
            thumbnail: (item.thumbnail || null) as string | null,
            chapter: item.chapter as { id: string; name: string } | null | undefined,
          }))
          // Client-side filter: only premium content with price > 0
          .filter((item: ContentItem) => item.isPremium === true && item.price > 0)
        setContentItems(items)
      }
    } catch { /* */ }
    finally { setLoadingContent(false) }
  }, [contentTab, debouncedContentSearch])

  useEffect(() => {
    if (viewMode === 'editor' && currentStep === 2) {
      fetchContentItems()
    }
  }, [viewMode, currentStep, contentTab, debouncedContentSearch, fetchContentItems])

  // Fetch hierarchy metadata for quick selection
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const res = await fetch('/api/hierarchy/metadata')
        const json = await res.json()
        if (json.success && json.data) {
          setHierarchyData({
            classes: json.data.classes || [],
            subjects: json.data.subjects || [],
            chapters: json.data.chapters || [],
          })
        }
      } catch { /* ignore */ }
    }
    fetchHierarchy()
  }, [])

  // Fetch chapter content counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const params = new URLSearchParams()
        if (hierarchyClassId) params.set('classLevel', hierarchyData.classes.find(c => c.id === hierarchyClassId)?.slug || '')
        if (hierarchySubjectId) params.set('subjectId', hierarchySubjectId)
        const res = await fetch(`/api/admin/chapters/content-counts?${params}`)
        if (res.ok) {
          const json = await res.json()
          setChapterCounts(Array.isArray(json.data) ? json.data : [])
        }
      } catch { /* ignore */ }
    }
    if (hierarchyData.classes.length > 0) fetchCounts()
  }, [hierarchyClassId, hierarchySubjectId, hierarchyData])

  // Cascade filtering
  const filteredSubjects = useMemo(() => {
    if (!hierarchyClassId) return []
    return hierarchyData.subjects.filter(s => s.classId === hierarchyClassId)
  }, [hierarchyClassId, hierarchyData.subjects])

  const filteredChapters = useMemo(() => {
    if (!hierarchySubjectId) return []
    return hierarchyData.chapters.filter(c => c.subjectId === hierarchySubjectId)
  }, [hierarchySubjectId, hierarchyData.chapters])

  // ─── Form Helpers ─────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormThumbnail('')
    setFormType(['mixed'])
    setFormClassLevel([])
    setFormBoard([])
    setFormYear([])
    setSelectedItems([])
    setContentItems([])
    setContentSearch('')
    setContentTab('mcq')
    setFormPrice('')
    setFormIsActive(true)
    setFormOrder('')
    setCurrentStep(1)
  }

  const openCreate = () => {
    setEditId(null)
    resetForm()
    setViewMode('editor')
  }

  const openEdit = async (bundle: BundleRecord) => {
    setEditId(bundle.id)
    setFormTitle(bundle.title)
    setFormDescription(bundle.description || '')
    setFormThumbnail(bundle.thumbnail || '')
    setFormType(bundle.type ? [bundle.type] : ['mixed'])
    setFormClassLevel(bundle.classLevel ? [bundle.classLevel] : [])
    setFormBoard(bundle.board ? bundle.board.split(',').map(b => b.trim()).filter(Boolean) : [])
    setFormYear(bundle.year ? bundle.year.split(',').map(y => y.trim()).filter(Boolean) : [])
    setFormPrice(bundle.price ? String(bundle.price) : '')
    setFormIsActive(bundle.isActive)
    setFormOrder(String(bundle.order))
    setCurrentStep(1)

    // Fetch details for each item to get titles and prices
    const enrichedItems: SelectedContentItem[] = []
    for (const item of bundle.items) {
      let title = ''
      let price = 0
      try {
        let endpoint = ''
        switch (item.contentType) {
          case 'mcq': endpoint = `/api/admin/mcq?q=&limit=1`; break
          case 'cq': endpoint = `/api/admin/cq?q=&limit=1`; break
          case 'lecture': endpoint = `/api/admin/lectures?q=&limit=1`; break
          case 'suggestion': endpoint = `/api/admin/suggestions?search=&limit=1`; break
          case 'exam': endpoint = `/api/admin/exams?limit=1`; break
        }
        // Fetch individual item - we'll use a simpler approach with batch fetch
        switch (item.contentType) {
          case 'mcq': {
            // Search by content ID to avoid fetching all items
            const mcqParams = new URLSearchParams({ q: item.contentId, limit: '10' })
            const mcq = await fetch(`/api/admin/mcq?${mcqParams}`).then(r => r.json())
            const foundMcq = (Array.isArray(mcq.data) ? mcq.data : []).find((m: { id: string }) => m.id === item.contentId)
            if (foundMcq) { title = foundMcq.question?.slice(0, 60) || 'MCQ'; price = foundMcq.price || 0 }
            break
          }
          case 'cq': {
            const cqParams = new URLSearchParams({ q: item.contentId, limit: '10' })
            const cq = await fetch(`/api/admin/cq?${cqParams}`).then(r => r.json())
            const foundCq = (Array.isArray(cq.data) ? cq.data : []).find((c: { id: string }) => c.id === item.contentId)
            if (foundCq) { title = foundCq.uddeepok?.slice(0, 60) || 'CQ'; price = foundCq.price || 0 }
            break
          }
          case 'lecture': {
            const lecParams = new URLSearchParams({ q: item.contentId, limit: '10' })
            const lec = await fetch(`/api/admin/lectures?${lecParams}`).then(r => r.json())
            const foundLec = (Array.isArray(lec.data) ? lec.data : []).find((l: { id: string }) => l.id === item.contentId)
            if (foundLec) { title = foundLec.title || 'লেকচার'; price = foundLec.price || 0 }
            break
          }
          case 'suggestion': {
            const sugParams = new URLSearchParams({ search: item.contentId, limit: '10' })
            const sug = await fetch(`/api/admin/suggestions?${sugParams}`).then(r => r.json())
            const foundSug = (Array.isArray(sug.data) ? sug.data : []).find((s: { id: string }) => s.id === item.contentId)
            if (foundSug) { title = foundSug.title || 'সাজেশন'; price = foundSug.price || 0 }
            break
          }
          case 'exam': {
            const examParams = new URLSearchParams({ q: item.contentId, limit: '10' })
            const exam = await fetch(`/api/admin/exams?${examParams}`).then(r => r.json())
            const foundExam = (Array.isArray(exam.data) ? exam.data : []).find((e: { id: string }) => e.id === item.contentId)
            if (foundExam) { title = foundExam.title || 'এক্সাম'; price = foundExam.price || 0 }
            break
          }
        }
      } catch { /* ignore */ }

      if (!title) {
        title = `${getLabel(item.contentType) || item.contentType} #${item.contentId.slice(0, 8)}`
      }

      enrichedItems.push({
        contentType: item.contentType,
        contentId: item.contentId,
        title,
        price,
        order: item.order,
      })
    }

    setSelectedItems(enrichedItems)
    setViewMode('editor')
  }

  const isItemSelected = (contentType: string, contentId: string) => {
    return selectedItems.some(i => i.contentType === contentType && i.contentId === contentId)
  }

  const toggleItem = (contentType: string, item: ContentItem) => {
    if (isItemSelected(contentType, item.id)) {
      setSelectedItems(selectedItems.filter(i => !(i.contentType === contentType && i.contentId === item.id)))
    } else {
      const title = item.title || item.question?.slice(0, 60) || item.uddeepok?.slice(0, 60) || `${getLabel(contentType) || contentType} #${item.id.slice(0, 8)}`
      setSelectedItems([...selectedItems, {
        contentType,
        contentId: item.id,
        title,
        price: item.price || 0,
        order: selectedItems.length,
      }])
    }
  }

  const removeItem = (contentType: string, contentId: string) => {
    setSelectedItems(selectedItems.filter(i => !(i.contentType === contentType && i.contentId === contentId)))
  }

  const selectAllFromChapter = async (type: 'mcq' | 'cq', chapId: string) => {
    try {
      const params = new URLSearchParams()
      params.set('type', type)
      params.set('chapterId', chapId)
      params.set('limit', '50')
      const res = await fetch(`/api/admin/bundles/content?${params}`)
      if (res.ok) {
        const json = await res.json()
        const items = (Array.isArray(json.data) ? json.data : []).filter((item: { isPremium: boolean; price: number }) => item.isPremium && item.price > 0)
        const newItems: SelectedContentItem[] = items
          .filter((item: { id: string }) => !isItemSelected(type, item.id))
          .map((item: { id: string; title: string; price: number }, idx: number) => ({
            contentType: type,
            contentId: item.id,
            title: item.title?.slice(0, 60) || `${getLabel(type) || type} #${item.id.slice(0, 8)}`,
            price: item.price || 0,
            order: selectedItems.length + idx,
          }))
        if (newItems.length > 0) {
          setSelectedItems(prev => [...prev, ...newItems])
          toast({ title: `${newItems.length}টি ${type === 'mcq' ? 'MCQ' : 'CQ'} যোগ হয়েছে` })
        } else {
          toast({ title: 'নতুন কোনো আইটেম নেই', description: 'সব আইটেম আগেই নির্বাচিত আছে' })
        }
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'আইটেম আনতে সমস্যা', variant: 'destructive' })
    }
  }

  const selectAllTypeFromChapter = async (type: 'mcq' | 'cq') => {
    // Select all items of this type from the filtered chapters
    const targetChapters = hierarchyChapterId && hierarchyChapterId !== '__all__'
      ? [hierarchyChapterId]
      : filteredChapters.map(c => c.id)

    if (targetChapters.length === 0) {
      toast({ title: 'অধ্যায় নির্বাচন করুন' })
      return
    }

    let totalAdded = 0
    for (const chapId of targetChapters) {
      const params = new URLSearchParams()
      params.set('type', type)
      params.set('chapterId', chapId)
      params.set('limit', '50')
      try {
        const res = await fetch(`/api/admin/bundles/content?${params}`)
        if (res.ok) {
          const json = await res.json()
          const items = (Array.isArray(json.data) ? json.data : []).filter((item: { isPremium: boolean; price: number }) => item.isPremium && item.price > 0)
          const newItems: SelectedContentItem[] = items
            .filter((item: { id: string }) => !isItemSelected(type, item.id))
            .map((item: { id: string; title: string; price: number }) => ({
              contentType: type,
              contentId: item.id,
              title: item.title?.slice(0, 60) || `${getLabel(type) || type} #${item.id.slice(0, 8)}`,
              price: item.price || 0,
              order: 0,
            }))
          totalAdded += newItems.length
          if (newItems.length > 0) {
            setSelectedItems(prev => [...prev, ...newItems])
          }
        }
      } catch { /* continue */ }
    }

    if (totalAdded > 0) {
      toast({ title: `${totalAdded}টি ${type === 'mcq' ? 'MCQ' : 'CQ'} যোগ হয়েছে` })
    } else {
      toast({ title: 'নতুন কোনো আইটেম নেই' })
    }
  }

  const calculateOriginalPrice = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price || 0), 0)
  }

  const calculateDiscount = () => {
    const original = calculateOriginalPrice()
    const bundle = parseFloat(formPrice) || 0
    if (original <= 0) return 0
    return Math.round(((original - bundle) / original) * 100)
  }

  // ─── Save ─────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formTitle) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      setCurrentStep(1)
      return
    }

    if (selectedItems.length === 0) {
      toast({ title: 'ত্রুটি', description: 'কমপক্ষে ১টি কন্টেন্ট আইটেম যোগ করুন', variant: 'destructive' })
      setCurrentStep(2)
      return
    }

    setSaving(true)
    try {
      const body = {
        title: formTitle,
        description: formDescription || undefined,
        thumbnail: formThumbnail || undefined,
        type: formType.join(',') || 'mixed',
        classLevel: formClassLevel.join(',') || undefined,
        board: formBoard.join(',') || undefined,
        year: formYear.join(',') || undefined,
        price: parseFloat(formPrice) || 0,
        originalPrice: calculateOriginalPrice(),
        isActive: formIsActive,
        order: parseInt(formOrder) || 0,
        items: selectedItems.map((item, idx) => ({
          contentType: item.contentType,
          contentId: item.contentId,
          order: idx,
        })),
      }

      const res = editId
        ? await fetch('/api/admin/bundles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/bundles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'বান্ডেল আপডেট হয়েছে' : 'বান্ডেল তৈরি হয়েছে' })
        setViewMode('list')
        fetchBundles()
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
      const res = await fetch(`/api/admin/bundles?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'বান্ডেল মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        fetchBundles()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const toggleActive = async (bundle: BundleRecord) => {
    try {
      const res = await fetch('/api/admin/bundles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bundle.id, isActive: !bundle.isActive }),
      })
      if (res.ok) {
        toast({ title: bundle.isActive ? 'বান্ডেল নিষ্ক্রিয় করা হয়েছে' : 'বান্ডেল সক্রিয় করা হয়েছে' })
        fetchBundles()
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  // ─── STEP 1: Bundle Info ──────────────────────────────────────

  const StepBundleInfo = () => (
    <Card className="border-border/50 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-emerald-600" /> বান্ডেলের মৌলিক তথ্য
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">বান্ডেলের নাম, বিবরণ, ধরন ও শ্রেণি নির্ধারণ করুন</p>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>শিরোনাম *</Label>
          <Input
            placeholder="যেমন: এসএসসি গণিত কমপ্লিট বান্ডেল"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>বিবরণ</Label>
          <Textarea
            placeholder="বান্ডেলের বিবরণ লিখুন..."
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
          />
        </div>

        <ImageUploader
          value={formThumbnail}
          onChange={setFormThumbnail}
          label="থাম্বনেইল"
          placeholder="বান্ডেলের থাম্বনেইল ছবি আপলোড করুন"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>ধরন *</Label>
            <MultiSelect
              options={[
                { label: 'MCQ', value: 'mcq' },
                { label: 'CQ', value: 'cq' },
                { label: 'লেকচার', value: 'lecture' },
                { label: 'বোর্ড', value: 'board' },
                { label: 'মিশ্র', value: 'mixed' },
              ]}
              selectedValues={formType}
              onChange={setFormType}
              placeholder="ধরন নির্বাচন"
            />
          </div>
          <div className="space-y-2">
            <Label>শ্রেণি</Label>
            <MultiSelect
              options={classOptions.map(c => ({ label: c.label, value: c.value }))}
              selectedValues={formClassLevel}
              onChange={setFormClassLevel}
              placeholder="শ্রেণি নির্বাচন"
            />
          </div>
          <div className="space-y-2">
            <Label>বোর্ড</Label>
            <MultiSelect
              options={hookBoardOptions.map(b => ({ label: b.label, value: b.value }))}
              selectedValues={formBoard}
              onChange={setFormBoard}
              placeholder="বোর্ড নির্বাচন"
            />
          </div>
          <div className="space-y-2">
            <Label>সাল</Label>
            <MultiSelect
              options={hookYearOptions.map(y => ({ label: y.label, value: y.value }))}
              selectedValues={formYear}
              onChange={setFormYear}
              placeholder="সাল নির্বাচন"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ─── STEP 2: Add Content ──────────────────────────────────────

  const StepAddContent = () => {
    const contentTypes = ['mcq', 'cq', 'lecture', 'suggestion', 'exam'] as const

    return (
      <div className="space-y-4">
        {/* ─── Quick Selection Section ─── */}
        <Card className="border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" /> দ্রুত নির্বাচন
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">অধ্যায় ভিত্তিক দ্রুত MCQ/CQ সিলেকশন — সব একসাথে যোগ করুন</p>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Hierarchy Cascade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">ক্লাস</Label>
                <Select value={hierarchyClassId} onValueChange={(v) => { setHierarchyClassId(v); setHierarchySubjectId(''); setHierarchyChapterId('') }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="ক্লাস নির্বাচন" /></SelectTrigger>
                  <SelectContent>
                    {hierarchyData.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">বিষয়</Label>
                <Select value={hierarchySubjectId} onValueChange={(v) => { setHierarchySubjectId(v); setHierarchyChapterId('') }} disabled={!hierarchyClassId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={hierarchyClassId ? 'বিষয় নির্বাচন' : 'আগে ক্লাস নির্বাচন'} /></SelectTrigger>
                  <SelectContent>
                    {filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">অধ্যায়</Label>
                <Select value={hierarchyChapterId} onValueChange={setHierarchyChapterId} disabled={!hierarchySubjectId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={hierarchySubjectId ? 'অধ্যায় নির্বাচন' : 'আগে বিষয় নির্বাচন'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">সব অধ্যায়</SelectItem>
                    {filteredChapters.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chapter cards with counts */}
            {hierarchySubjectId && chapterCounts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">অধ্যায় ভিত্তিক কাউন্ট</p>
                  {/* Bulk add buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                      onClick={() => selectAllTypeFromChapter('mcq')}
                      disabled={!hierarchySubjectId}
                    >
                      <FileQuestion className="h-3 w-3" />
                      সব MCQ যোগ করুন
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400"
                      onClick={() => selectAllTypeFromChapter('cq')}
                      disabled={!hierarchySubjectId}
                    >
                      <AlignLeft className="h-3 w-3" />
                      সব CQ যোগ করুন
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {(hierarchyChapterId && hierarchyChapterId !== '__all__'
                    ? chapterCounts.filter(c => c.chapterId === hierarchyChapterId)
                    : chapterCounts.filter(c => filteredChapters.some(ch => ch.id === c.chapterId))
                  ).map((chap) => (
                    <div key={chap.chapterId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{chap.chapterName}</p>
                        <p className="text-[10px] text-muted-foreground">{chap.subjectName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* MCQ Count */}
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] h-5 px-1.5 gap-0.5 border-emerald-200 dark:border-emerald-800">
                            <FileQuestion className="h-2.5 w-2.5 text-emerald-600" />
                            {chap.mcqTotal > 0 ? (
                              <span>
                                <span className="text-emerald-600 font-semibold">{chap.mcqFree}</span>
                                <span className="text-muted-foreground mx-0.5">/</span>
                                <span className="text-amber-600 font-semibold">{chap.mcqPremium}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </Badge>
                          {chap.mcqPremium > 0 && (
                            <button
                              type="button"
                              className="h-5 px-1.5 rounded text-[9px] font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900 transition-colors"
                              onClick={() => selectAllFromChapter('mcq', chap.chapterId)}
                            >
                              সব MCQ
                            </button>
                          )}
                        </div>
                        {/* CQ Count */}
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] h-5 px-1.5 gap-0.5 border-teal-200 dark:border-teal-800">
                            <AlignLeft className="h-2.5 w-2.5 text-teal-600" />
                            {chap.cqTotal > 0 ? (
                              <span>
                                <span className="text-teal-600 font-semibold">{chap.cqFree}</span>
                                <span className="text-muted-foreground mx-0.5">/</span>
                                <span className="text-amber-600 font-semibold">{chap.cqPremium}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </Badge>
                          {chap.cqPremium > 0 && (
                            <button
                              type="button"
                              className="h-5 px-1.5 rounded text-[9px] font-medium bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:hover:bg-teal-900 transition-colors"
                              onClick={() => selectAllFromChapter('cq', chap.chapterId)}
                            >
                              সব CQ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    ফ্রি
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    প্রিমিয়াম
                  </div>
                  <span className="mx-1">|</span>
                  <span>ফরম্যাট: ফ্রি / প্রিমিয়াম</span>
                </div>
              </div>
            )}

            {hierarchySubjectId && chapterCounts.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                এই বিষয়ে কোনো কন্টেন্ট নেই
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Individual Selection Section ─── */}
        <Card className="border-border/50 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-violet-600" /> কন্টেন্ট যোগ করুন
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">বিভিন্ন কন্টেন্ট থেকে আইটেম বাছাই করুন</p>
                <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-800/30">
                  <Crown className="h-3 w-3 text-amber-500" />
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">শুধুমাত্র প্রিমিয়াম কন্টেন্ট যোগ করা যাবে</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedItems.length > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
                    <Check className="h-3 w-3" /> {selectedItems.length} আইটেম
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  মূল্য: ৳{calculateOriginalPrice()}
                </Badge>
              </div>
            </div>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Content type tabs */}
            <Tabs value={contentTab} onValueChange={setContentTab}>
              <TabsList className="w-full grid grid-cols-5 h-9">
                {contentTypes.map((type) => {
                  const Icon = getIcon(type)
                  const count = selectedItems.filter(i => i.contentType === type).length
                  return (
                    <TabsTrigger key={type} value={type} className="text-xs gap-1 relative">
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{getLabel(type)}</span>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center">
                          {count}
                        </span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {contentTypes.map((type) => (
                <TabsContent key={type} value={type} className="mt-3 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`${getLabel(type) || type} খুঁজুন...`}
                      value={contentSearch}
                      onChange={(e) => setContentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Selected items for this type */}
                  {selectedItems.filter(i => i.contentType === type).length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                        <Check className="h-3 w-3" /> নির্বাচিত {getLabel(type) || type} ({selectedItems.filter(i => i.contentType === type).length})
                      </p>
                      <div className="space-y-1">
                        {selectedItems.filter(i => i.contentType === type).map((item) => (
                          <div key={`${item.contentType}-${item.contentId}`} className="flex items-center justify-between gap-2 py-1 px-2 rounded-md bg-white/60 dark:bg-white/5 text-xs">
                            <span className="truncate flex-1 min-w-0">{item.title}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="outline" className="text-[9px] h-4 px-1">৳{item.price}</Badge>
                              <button
                                type="button"
                                className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                onClick={() => removeItem(item.contentType, item.contentId)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available items */}
                  {loadingContent ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                    </div>
                  ) : contentItems.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {contentItems.map((item) => {
                        const selected = isItemSelected(type, item.id)
                        const itemTitle = item.title || item.question?.slice(0, 80) || item.uddeepok?.slice(0, 80) || `${getLabel(type) || type} #${item.id.slice(0, 8)}`
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={cn(
                              'w-full text-left p-3 rounded-xl border transition-all',
                              selected
                                ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                                : 'border-border/40 hover:border-border hover:bg-muted/30',
                            )}
                            onClick={() => toggleItem(type, item)}
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
                                <p className="text-sm line-clamp-2">{itemTitle}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {item.classLevel && (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                                      {classLevelLabels[item.classLevel] || item.classLevel}
                                    </Badge>
                                  )}
                                  {item.chapter && (
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                      {item.chapter.name}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-[9px] h-4 px-1">
                                    ৳{item.price || 0}
                                  </Badge>
                                  {item.isPremium && (
                                    <Crown className="h-3 w-3 text-amber-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">কোনো {getLabel(type) || type} পাওয়া যায়নি</p>
                      <p className="text-xs mt-1">অন্য সার্চ টার্ম দিয়ে চেষ্টা করুন</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── STEP 3: Pricing & Publish ────────────────────────────────

  const StepPricing = () => {
    const originalPrice = calculateOriginalPrice()
    const bundlePrice = parseFloat(formPrice) || 0
    const discount = calculateDiscount()
    const isValid = formTitle && selectedItems.length > 0

    return (
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 px-4 py-3 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Tag className="h-4 w-4 text-amber-600" /> মূল্য ও প্রকাশ
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">বান্ডেলের মূল্য নির্ধারণ করুন ও প্রকাশ করুন</p>
        </div>
        <CardContent className="p-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-2xl font-bold text-emerald-600">{selectedItems.length}</p>
              <p className="text-[10px] text-muted-foreground">মোট আইটেম</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-2xl font-bold text-amber-600">৳{originalPrice}</p>
              <p className="text-[10px] text-muted-foreground">আসল মূল্য</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className="text-2xl font-bold text-violet-600">৳{bundlePrice}</p>
              <p className="text-[10px] text-muted-foreground">বান্ডেল মূল্য</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <p className={cn(
                "text-2xl font-bold",
                discount > 0 ? "text-rose-600" : "text-muted-foreground"
              )}>
                {discount > 0 ? `${discount}%` : '0%'}
              </p>
              <p className="text-[10px] text-muted-foreground">ছাড়</p>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="h-3 w-3" /> আইটেম বিবরণ
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {selectedItems.map((item, idx) => {
                const Icon = getIcon(item.contentType)
                return (
                  <div key={`${item.contentType}-${item.contentId}-${idx}`} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-border/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", getTextColor(item.contentType))} />
                      <span className="text-xs truncate min-w-0">{item.title}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                        {getLabel(item.contentType) || item.contentType}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">৳{item.price}</Badge>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 font-semibold text-sm">
              <span>আসল মূল্য (সকল আইটেমের যোগফল)</span>
              <span className="text-amber-600">৳{originalPrice}</span>
            </div>
          </div>

          <Separator />

          {/* Bundle Price */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="h-3 w-3" /> মূল্য নির্ধারণ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>বান্ডেল মূল্য (৳) *</Label>
                <Input
                  type="number"
                  placeholder="বান্ডেলের মূল্য লিখুন"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ক্রম (Order)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formOrder}
                  onChange={(e) => setFormOrder(e.target.value)}
                />
              </div>
            </div>

            {bundlePrice > 0 && originalPrice > 0 && (
              <div className={cn(
                'p-3 rounded-xl border',
                discount > 0
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-800/20'
                  : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/30 dark:border-amber-800/20'
              )}>
                <div className="flex items-center gap-2 text-sm">
                  {discount > 0 ? (
                    <>
                      <Percent className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{discount}% ছাড়!</span>
                      <span className="text-muted-foreground text-xs">
                        (৳{originalPrice} → ৳{bundlePrice}, সাশ্রয় ৳{originalPrice - bundlePrice})
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-700 dark:text-amber-400 text-xs">
                        বান্ডেল মূল্য আসল মূল্যের সমান বা বেশি। ছাড় দিতে বান্ডেল মূল্য কম করুন।
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Power className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">সক্রিয়</Label>
                <p className="text-xs text-muted-foreground">বান্ডেল সক্রিয় বা নিষ্ক্রিয় করুন</p>
              </div>
            </div>
            <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
          </div>

          {/* Validation warnings */}
          {!isValid && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/20">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> নিচের তথ্য পূরণ করুন:
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-red-600 dark:text-red-400">
                {!formTitle && <li>• শিরোনাম আবশ্যক</li>}
                {selectedItems.length === 0 && <li>• কমপক্ষে ১টি কন্টেন্ট আইটেম যোগ করুন</li>}
              </ul>
            </div>
          )}

          {/* Publish button */}
          {isValid && (
            <div className="p-4 rounded-xl border border-emerald-200/40 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" /> বান্ডেল সংরক্ষণ করুন
              </p>
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : <><Save className="h-4 w-4" /> {editId ? 'আপডেট করুন' : 'তৈরি ও প্রকাশ করুন'}</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ─── LIST VIEW ────────────────────────────────────────────────

  const ListView = () => {
    if (loading && bundles.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
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
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
                <Package className="h-5 w-5" />
              </div>
              বান্ডেল ব্যবস্থাপনা
            </h1>
            <p className="text-muted-foreground text-sm mt-2 ml-12">মোট {total}টি বান্ডেল</p>
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-600/20 transition-all hover:shadow-xl hover:shadow-amber-600/30"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> নতুন বান্ডেল
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="বান্ডেল খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-card border-border/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <MultiSelect
              options={classOptions.map(c => ({ label: c.label, value: c.value }))}
              selectedValues={filterClassLevel}
              onChange={setFilterClassLevel}
              placeholder="শ্রেণি"
              className="w-[160px]"
            />
            <MultiSelect
              options={[
                { label: 'MCQ', value: 'mcq' },
                { label: 'CQ', value: 'cq' },
                { label: 'লেকচার', value: 'lecture' },
                { label: 'বোর্ড', value: 'board' },
                { label: 'মিশ্র', value: 'mixed' },
              ]}
              selectedValues={filterType}
              onChange={setFilterType}
              placeholder="ধরন"
              className="w-[150px]"
            />
          </div>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map((bundle, idx) => {
            const discount = bundle.originalPrice > 0
              ? Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100)
              : 0
            return (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
                className="group"
              >
                <Card className={cn(
                  'hover:shadow-lg transition-all duration-300 border-border/50 h-full overflow-hidden',
                  'border-l-4',
                  bundle.isActive
                    ? 'border-l-amber-400 hover:shadow-amber-500/5'
                    : 'border-l-gray-300 hover:shadow-gray-500/5 opacity-75',
                )}>
                  {/* Thumbnail or gradient header */}
                  {bundle.thumbnail ? (
                    <div className="relative h-36 overflow-hidden">
                      <img src={bundle.thumbnail} alt={bundle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-1 drop-shadow-md">{bundle.title}</h3>
                      </div>
                      {discount > 0 && (
                        <Badge className="absolute top-2 right-2 bg-rose-500/90 text-white border-0 gap-1 text-[10px]">
                          <Percent className="h-2.5 w-2.5" /> {discount}% ছাড়
                        </Badge>
                      )}
                      {!bundle.isActive && (
                        <Badge className="absolute top-2 left-2 bg-gray-500/90 text-white border-0 text-[10px]">
                          নিষ্ক্রিয়
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      'h-28 relative flex items-center justify-center',
                      bundle.isActive
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/40 dark:to-gray-900/40',
                    )}>
                      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-sm">
                        <Package className="h-8 w-8 text-amber-600/60" />
                      </div>
                      {discount > 0 && (
                        <Badge className="absolute top-2 right-2 bg-rose-500/90 text-white border-0 gap-1 text-[10px]">
                          <Percent className="h-2.5 w-2.5" /> {discount}% ছাড়
                        </Badge>
                      )}
                      {!bundle.isActive && (
                        <Badge className="absolute top-2 left-2 bg-gray-500/90 text-white border-0 text-[10px]">
                          নিষ্ক্রিয়
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4">
                    {!bundle.thumbnail && (
                      <h3 className="font-semibold text-sm line-clamp-1 mb-2">{bundle.title}</h3>
                    )}

                    {/* Description */}
                    {bundle.description && (
                      <div className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2rem]">
                        <RichContentRenderer content={bundle.description} />
                      </div>
                    )}

                    {/* Meta badges */}
                    <div className="flex items-center flex-wrap gap-1.5 mb-3">
                      <Badge className={cn("text-[10px] h-5 px-1.5", typeColors[bundle.type] || typeColors.mixed)}>
                        {typeLabels[bundle.type] || bundle.type}
                      </Badge>
                      {bundle.classLevel && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {classLevelLabels[bundle.classLevel] || bundle.classLevel}
                        </Badge>
                      )}
                      {bundle.board && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">
                          {bundle.board}
                        </Badge>
                      )}
                      {bundle.year && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {bundle.year}
                        </Badge>
                      )}
                    </div>

                    {/* Price & Items */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px] gap-0.5">
                            ৳{bundle.price}
                          </Badge>
                          {bundle.originalPrice > bundle.price && (
                            <span className="text-[10px] text-muted-foreground line-through">৳{bundle.originalPrice}</span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[10px] gap-0.5">
                          <Package className="h-2.5 w-2.5" /> {bundle.items.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          onClick={() => toggleActive(bundle)}
                          title={bundle.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                        >
                          <Power className={cn("h-3.5 w-3.5", bundle.isActive ? "text-emerald-600" : "text-muted-foreground")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          onClick={() => openEdit(bundle)}
                          title="সম্পাদনা"
                        >
                          <Edit className="h-3.5 w-3.5 text-amber-600" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(bundle)}>
                              <Edit className="h-4 w-4 mr-2" /> সম্পাদনা
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(bundle.id)}>
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
          {bundles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">কোনো বান্ডেল পাওয়া যায়নি</p>
              <p className="text-sm mt-1">নতুন বান্ডেল তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // ─── EDITOR VIEW ──────────────────────────────────────────────

  const EditorView = () => (
    <div
      className="space-y-0"
    >
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => { setViewMode('list'); resetForm() }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              {editId ? (
                <><Edit className="h-5 w-5 text-amber-600" /> বান্ডেল সম্পাদনা</>
              ) : (
                <><Sparkles className="h-5 w-5 text-amber-600" /> নতুন বান্ডেল যোগ করুন</>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              কন্টেন্ট আইটেম একত্রিত করে বান্ডেল তৈরি করুন
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setViewMode('list'); resetForm() }}>
            <X className="h-4 w-4" /> বাতিল
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md shadow-amber-600/20"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সংরক্ষণ হচ্ছে...</>
            ) : (
              <><Save className="h-4 w-4" /> {editId ? 'আপডেট' : 'তৈরি করুন'}</>
            )}
          </Button>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 mb-6">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          return (
            <React.Fragment key={step.id}>
              {idx > 0 && (
                <div className={cn(
                  'flex-1 h-0.5 transition-colors',
                  currentStep > step.id ? 'bg-emerald-400' : 'bg-border/50'
                )} />
              )}
              <button
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
                  isActive && 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
                  isCompleted && 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
                  !isActive && !isCompleted && 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold',
                  isActive && 'bg-amber-500 text-white',
                  isCompleted && 'bg-emerald-500 text-white',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                )}>
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Step Content */}
      {currentStep === 1 && <div>{StepBundleInfo()}</div>}
      {currentStep === 2 && <div>{StepAddContent()}</div>}
      {currentStep === 3 && <div>{StepPricing()}</div>}

      {/* Step Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4" /> আগের ধাপ
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          ধাপ {currentStep} / {steps.length}
        </div>
        {currentStep < steps.length ? (
          <Button
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
          >
            পরের ধাপ <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : <><Save className="h-4 w-4" /> সংরক্ষণ করুন</>}
          </Button>
        )}
      </div>
    </div>
  )

  // ─── RENDER ───────────────────────────────────────────────────

  return (
    <>
      {viewMode === 'list' && <div>{ListView()}</div>}
      {viewMode === 'editor' && <div>{EditorView()}</div>}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বান্ডেল মুছে ফেলুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে এই বান্ডেলটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। বান্ডেলের সকল আইটেমও মুছে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
