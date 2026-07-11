'use client'

import DataTable,{ type BulkAction,type ColumnDef } from '@/components/shared/DataTable'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { useContentTypes } from '@/hooks/use-content-types'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useTableSelection } from '@/hooks/use-table-selection'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { toDecimal } from '@/lib/decimal'
import { Edit,Power,Search,Trash2 } from 'lucide-react'
import React,{ useCallback,useEffect,useMemo,useRef,useState } from 'react'
import EditorView from './bundles/EditorView'
import ListView from './bundles/ListView'
import { type BundleRecord,type ContentItem,type SelectedContentItem,typeLabels,typeColors } from './bundles/types'

// ─── Component ──────────────────────────────────────────────────

export default function AdminBundlesPage() {
  const { toast } = useToast()
  const { classLevelLabels, classOptions, boardOptions: hookBoardOptions, yearOptions: hookYearOptions } = useHierarchyMetadata()
  const { getLabel, getIcon, getTextColor } = useContentTypes()
  const [loading, setLoading] = useState(true)
  const [bundles, setBundles] = useState<BundleRecord[]>([])
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)

  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [search, setSearch] = useState('')
  const [filterClassLevel, setFilterClassLevel] = useState<string[]>([])
  const [filterType, setFilterType] = useState<string[]>([])

  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formThumbnail, setFormThumbnail] = useState('')
  const [formType, setFormType] = useState<string[]>(['mixed'])
  const [formClassLevel, setFormClassLevel] = useState<string[]>([])
  const [formBoard, setFormBoard] = useState<string[]>([])
  const [formYear, setFormYear] = useState<string[]>([])

  const [selectedItems, setSelectedItems] = useState<SelectedContentItem[]>([])
  const [contentTab, setContentTab] = useState('mcq')
  const [contentSearch, setContentSearch] = useState('')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

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

  const [formPrice, setFormPrice] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formOrder, setFormOrder] = useState('')

  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedContentSearch, setDebouncedContentSearch] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  useEffect(() => {
    if (contentSearchTimerRef.current) clearTimeout(contentSearchTimerRef.current)
    contentSearchTimerRef.current = setTimeout(() => setDebouncedContentSearch(contentSearch), 400)
    return () => { if (contentSearchTimerRef.current) clearTimeout(contentSearchTimerRef.current) }
  }, [contentSearch])

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const selection = useTableSelection(bundles)

  const handleBulkDelete = async (ids: string[]) => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/bundles?ids=${ids.join(',')}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'মুছে ফেলা হয়েছে' }); selection.clearSelection(); fetchBundles() }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkToggle = async (ids: string[], isActive: boolean) => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/bundles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isActive }),
      })
      if (res.ok) { toast({ title: 'আপডেট হয়েছে' }); selection.clearSelection(); fetchBundles() }
    } finally {
      setIsProcessing(false)
    }
  }

  const fetchBundles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filterClassLevel.length > 0) params.set('classLevel', filterClassLevel.join(','))
      if (filterType.length > 0) params.set('type', filterType.join(','))
      params.set('page', String(page))
      params.set('limit', String(perPage))
      const res = await fetch(`/api/admin/bundles?${params}`)
      if (res.ok) {
        const json = await res.json()
        setBundles(Array.isArray(json.data) ? json.data : [])
        setTotal(json.pagination?.total || 0)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [debouncedSearch, filterClassLevel, filterType, page, perPage])

  useEffect(() => { fetchBundles() }, [fetchBundles])

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
            subject: item.subject as { id: string; name: string } | null | undefined,
          }))
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

  const filteredSubjects = useMemo(() => {
    if (!hierarchyClassId) return []
    return hierarchyData.subjects.filter(s => s.classId === hierarchyClassId)
  }, [hierarchyClassId, hierarchyData.subjects])

  const filteredChapters = useMemo(() => {
    if (!hierarchySubjectId) return []
    return hierarchyData.chapters.filter(c => c.subjectId === hierarchySubjectId)
  }, [hierarchySubjectId, hierarchyData.chapters])

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

    const enrichedItems: SelectedContentItem[] = []
    for (const item of bundle.items) {
      let title = ''
      let price = 0
      try {
        let _endpoint = ''
        switch (item.contentType) {
          case 'mcq': _endpoint = `/api/admin/mcq?q=&limit=1`; break
          case 'cq': _endpoint = `/api/admin/cq?q=&limit=1`; break
          case 'lecture': _endpoint = `/api/admin/lectures?q=&limit=1`; break
          case 'suggestion': _endpoint = `/api/admin/suggestions?search=&limit=1`; break
          case 'exam': _endpoint = `/api/admin/exams?limit=1`; break
        }
        switch (item.contentType) {
          case 'mcq': {
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
    return selectedItems.reduce((sum, item) => sum + toDecimal(item.price || 0), 0)
  }

  const calculateDiscount = () => {
    const original = calculateOriginalPrice()
    const bundle = parseFloat(formPrice) || 0
    if (original <= 0) return 0
    return Math.round(((original - bundle) / original) * 100)
  }

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

  const columns: ColumnDef<BundleRecord>[] = [
    { key: 'title', header: 'শিরোনাম', render: (b) => <span className="font-medium truncate block max-w-[250px]">{b.title}</span> },
    { key: 'type', header: 'ধরন', render: (b) => <Badge className={typeColors[b.type] || typeColors.mixed}>{typeLabels[b.type] || b.type}</Badge> },
    { key: 'classLevel', header: 'শ্রেণি', cellClass: 'hidden md:table-cell', render: (b) => <>{b.classLevel ? (classLevelLabels[b.classLevel] || b.classLevel) : '-'}</> },
    { key: 'price', header: 'মূল্য', render: (b) => <>৳{b.price}</> },
    { key: 'items', header: 'আইটেম', cellClass: 'hidden sm:table-cell', render: (b) => <>{(b.items || []).length}</> },
    { key: 'isActive', header: 'স্ট্যাটাস', cellClass: 'hidden sm:table-cell', render: (b) => (
      <Badge className={b.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}>
        {b.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
      </Badge>
    )},
    { key: 'actions', header: '', render: (b) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(b)} title={b.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}>
          <Power className={cn('h-3.5 w-3.5', b.isActive ? 'text-emerald-600' : 'text-muted-foreground')} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)} title="সম্পাদনা">
          <Edit className="h-3.5 w-3.5 text-amber-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(b.id)} aria-label="মুছুন">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )},
  ]

  const bulkActions: BulkAction[] = [
    { label: 'সক্রিয় করুন', handler: (ids) => handleBulkToggle(ids, true), disabled: isProcessing },
    { label: 'নিষ্ক্রিয় করুন', handler: (ids) => handleBulkToggle(ids, false), disabled: isProcessing },
    { label: 'মুছে ফেলুন', variant: 'destructive', handler: handleBulkDelete, disabled: isProcessing },
  ]

  const filters = (
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
  )

  return (
    <>
      {viewMode === 'list' && (
        <ListView
          loading={loading}
          bundles={bundles}
          total={total}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          selection={selection}
          columns={columns}
          bulkActions={bulkActions}
          filters={filters}
          openCreate={openCreate}
        />
      )}
      {viewMode === 'editor' && (
        <EditorView
          editId={editId}
          saving={saving}
          handleSave={handleSave}
          setViewMode={setViewMode}
          resetForm={resetForm}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          stepBundleInfoProps={{
            formTitle, setFormTitle,
            formDescription, setFormDescription,
            formThumbnail, setFormThumbnail,
            formType, setFormType,
            formClassLevel, setFormClassLevel,
            formBoard, setFormBoard,
            formYear, setFormYear,
            classOptions, boardOptions: hookBoardOptions, yearOptions: hookYearOptions,
          }}
          stepAddContentProps={{
            hierarchyClassId, setHierarchyClassId,
            hierarchySubjectId, setHierarchySubjectId,
            hierarchyChapterId, setHierarchyChapterId,
            hierarchyData, chapterCounts,
            filteredSubjects, filteredChapters,
            selectAllTypeFromChapter, selectAllFromChapter,
            contentTab, setContentTab,
            contentSearch, setContentSearch,
            contentItems, loadingContent,
            selectedItems, isItemSelected, toggleItem, removeItem,
            calculateOriginalPrice,
            getIcon, getLabel, classLevelLabels,
          }}
          stepPricingProps={{
            selectedItems, formPrice, setFormPrice,
            formOrder, setFormOrder,
            formIsActive, setFormIsActive,
            formTitle, editId, saving, handleSave,
            calculateOriginalPrice, calculateDiscount,
            getIcon, getLabel, getTextColor,
          }}
        />
      )}

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
