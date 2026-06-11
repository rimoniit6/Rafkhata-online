'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Box, Edit, Trash2, Search, ArrowLeft, Save, X,
  Check, Power, Tag, AlertCircle, Loader2, Crown, Image as ImageIcon,
  Clock, GraduationCap, Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useTableSelection } from '@/hooks/use-table-selection'
import DataTable, { type ColumnDef, type BulkAction } from '@/components/shared/DataTable'
import ImageUploader from '@/components/ui/image-uploader'
import { cn } from '@/lib/utils'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

// ─── Types ──────────────────────────────────────────────────────

interface PackageRecord {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  originalPrice: number
  duration: number
  durationLabel: string
  classLevel: string | null
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  _count?: {
    subscriptions: number
  }
}

// ─── Constants ──────────────────────────────────────────────────

const durationOptions = [
  { value: 30, label: '৩০ দিন' },
  { value: 90, label: '৩ মাস' },
  { value: 180, label: '৬ মাস' },
  { value: 365, label: '১ বছর' },
] as const

const durationLabelMap: Record<number, string> = {
  30: '৩০ দিন',
  90: '৩ মাস',
  180: '৬ মাস',
  365: '১ বছর',
}



// ─── Component ──────────────────────────────────────────────────

export default function AdminPackagesPage() {
  const { toast } = useToast()
  const { classOptions: classLevelOptions, classLevelLabels, classLevelColors } = useHierarchyMetadata()
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<PackageRecord[]>([])
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterClassLevel, setFilterClassLevel] = useState('')

  // Debounced search (for API calls only — input stays immediate)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  // Form fields
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formThumbnail, setFormThumbnail] = useState('')
  const [formDuration, setFormDuration] = useState(30)
  const [formDurationLabel, setFormDurationLabel] = useState('৩০ দিন')
  const [formClassLevel, setFormClassLevel] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formOriginalPrice, setFormOriginalPrice] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formOrder, setFormOrder] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const selection = useTableSelection(packages)

  const handleBulkDelete = async (ids: string[]) => {
    const res = await fetch(`/api/admin/packages?ids=${ids.join(',')}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'মুছে ফেলা হয়েছে' }); selection.clearSelection(); fetchPackages() }
  }

  const handleBulkToggle = async (ids: string[], isActive: boolean) => {
    const res = await fetch(`/api/admin/packages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, isActive }),
    })
    if (res.ok) { toast({ title: 'আপডেট হয়েছে' }); selection.clearSelection(); fetchPackages() }
  }

  // ─── Fetch Packages ────────────────────────────────────────────

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filterClassLevel) params.set('classLevel', filterClassLevel)
      params.set('page', String(page))
      params.set('limit', String(perPage))
      const res = await fetch(`/api/admin/packages?${params}`)
      if (res.ok) {
        const json = await res.json()
        setPackages(json.data.packages || [])
        setTotal(json.data.pagination?.total || 0)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [debouncedSearch, filterClassLevel, page, perPage])

  useEffect(() => { fetchPackages() }, [fetchPackages])

  // ─── Form Helpers ─────────────────────────────────────────────

  const handleDurationChange = (value: string) => {
    const numValue = parseInt(value, 10)
    setFormDuration(numValue)
    setFormDurationLabel(durationLabelMap[numValue] || value)
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormThumbnail('')
    setFormDuration(30)
    setFormDurationLabel('৩০ দিন')
    setFormClassLevel('')
    setFormPrice('')
    setFormOriginalPrice('')
    setFormIsActive(true)
    setFormOrder('')
  }

  const openCreate = () => {
    setEditId(null)
    resetForm()
    setViewMode('editor')
  }

  const openEdit = (pkg: PackageRecord) => {
    setEditId(pkg.id)
    setFormTitle(pkg.title)
    setFormDescription(pkg.description || '')
    setFormThumbnail(pkg.thumbnail || '')
    setFormDuration(pkg.duration)
    setFormDurationLabel(pkg.durationLabel || durationLabelMap[pkg.duration] || '')
    setFormClassLevel(pkg.classLevel || '')
    setFormPrice(pkg.price ? String(pkg.price) : '')
    setFormOriginalPrice(pkg.originalPrice ? String(pkg.originalPrice) : '')
    setFormIsActive(pkg.isActive)
    setFormOrder(String(pkg.order))
    setViewMode('editor')
  }

  // ─── Save ─────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formTitle) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম আবশ্যক', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const body = {
        title: formTitle,
        description: formDescription || undefined,
        thumbnail: formThumbnail || undefined,
        duration: formDuration,
        durationLabel: formDurationLabel,
        classLevel: formClassLevel || undefined,
        price: parseFloat(formPrice) || 0,
        originalPrice: parseFloat(formOriginalPrice) || 0,
        isActive: formIsActive,
        order: parseInt(formOrder) || 0,
      }

      const res = editId
        ? await fetch('/api/admin/packages', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (res.ok) {
        toast({ title: editId ? 'প্যাকেজ আপডেট হয়েছে' : 'প্যাকেজ তৈরি হয়েছে' })
        setViewMode('list')
        fetchPackages()
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
      const res = await fetch(`/api/admin/packages?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'প্যাকেজ মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        fetchPackages()
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const toggleActive = async (pkg: PackageRecord) => {
    try {
      const res = await fetch('/api/admin/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pkg.id, isActive: !pkg.isActive }),
      })
      if (res.ok) {
        toast({ title: pkg.isActive ? 'প্যাকেজ নিষ্ক্রিয় করা হয়েছে' : 'প্যাকেজ সক্রিয় করা হয়েছে' })
        fetchPackages()
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  // ─── List View ────────────────────────────────────────────────

  const columns: ColumnDef<PackageRecord>[] = [
    { key: 'title', header: 'শিরোনাম', render: (p) => <span className="font-medium truncate block max-w-[250px]">{p.title}</span> },
    { key: 'classLevel', header: 'শ্রেণি', cellClass: 'hidden sm:table-cell', render: (p) => (
      <Badge variant="outline" className={cn('text-xs gap-1', p.classLevel ? classLevelColors[p.classLevel] : '')}>
        <GraduationCap className="h-3 w-3" />
        {p.classLevel ? (classLevelLabels[p.classLevel] || p.classLevel) : 'সকল শ্রেণি'}
      </Badge>
    )},
    { key: 'duration', header: 'মেয়াদ', render: (p) => (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs gap-1">
        <Clock className="h-3 w-3" />{p.durationLabel}
      </Badge>
    )},
    { key: 'price', header: 'মূল্য', render: (p) => <>৳{p.price}</> },
    { key: 'subscribers', header: 'সাবস্ক্রাইবার', cellClass: 'hidden md:table-cell', render: (p) => (
      <Badge variant="secondary" className="text-xs gap-1">
        <Users className="h-3 w-3" />{p._count?.subscriptions ?? 0}
      </Badge>
    )},
    { key: 'isActive', header: 'স্ট্যাটাস', cellClass: 'hidden sm:table-cell', render: (p) => (
      <Badge className={cn('text-xs', p.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
        {p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
      </Badge>
    )},
    { key: 'actions', header: '', render: (p) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(p)} title={p.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}>
          <Power className={cn('h-4 w-4', p.isActive ? 'text-emerald-600' : 'text-muted-foreground')} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(p.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )},
  ]

  const bulkActions: BulkAction[] = [
    { label: 'সক্রিয় করুন', handler: (ids) => handleBulkToggle(ids, true) },
    { label: 'নিষ্ক্রিয় করুন', handler: (ids) => handleBulkToggle(ids, false) },
    { label: 'মুছে ফেলুন', variant: 'destructive', handler: handleBulkDelete },
  ]

  const filters = (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="প্যাকেজ খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterClassLevel || '_all'} onValueChange={(v) => setFilterClassLevel(v === '_all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">সকল শ্রেণি</SelectItem>
              {classLevelOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  const ListView = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Box className="h-5 w-5 text-emerald-600" /> প্যাকেজ ব্যবস্থাপনা
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">মোট: {total}টি প্যাকেজ</p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="h-4 w-4" /> নতুন প্যাকেজ
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={packages}
        total={total}
        page={page}
        pageSize={perPage}
        onPageChange={setPage}
        onPageSizeChange={setPerPage}
        loading={loading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো প্যাকেজ পাওয়া যায়নি"
        filters={filters}
      />
    </div>
  )

  // ─── Editor View ──────────────────────────────────────────────

  const EditorView = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{editId ? 'প্যাকেজ সম্পাদনা' : 'নতুন প্যাকেজ'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">প্যাকেজের তথ্য পূরণ করুন</p>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Box className="h-4 w-4 text-emerald-600" /> প্যাকেজের মৌলিক তথ্য
          </Label>
        </div>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>শিরোনাম *</Label>
            <Input
              placeholder="যেমন: এসএসসি গণিত কমপ্লিট প্যাকেজ"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>বিবরণ</Label>
            <Textarea
              placeholder="প্যাকেজের বিবরণ লিখুন..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
            />
          </div>

          <ImageUploader
            value={formThumbnail}
            onChange={setFormThumbnail}
            label="থাম্বনেইল"
            placeholder="প্যাকেজের থাম্বনেইল ছবি আপলোড করুন"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" /> মেয়াদকাল *
              </Label>
              <Select value={String(formDuration)} onValueChange={handleDurationChange}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                <SelectContent>
                  {durationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label} ({opt.value} দিন)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">মেয়াদকাল লেবেল: <span className="font-medium text-emerald-600">{formDurationLabel}</span></p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-emerald-600" /> শ্রেণি
              </Label>
              <Select value={formClassLevel || '_none'} onValueChange={(v) => setFormClassLevel(v === '_none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">সকল শ্রেণি</SelectItem>
                  {classLevelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">খালি রাখলে সকল শ্রেণির জন্য প্রযোজ্য হবে</p>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" /> মূল্য নির্ধারণ
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>মূল্য (৳) *</Label>
                <Input
                  type="number"
                  placeholder="প্যাকেজের মূল্য"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>আসল মূল্য (৳)</Label>
                <Input
                  type="number"
                  placeholder="আসল মূল্য (ছাড়ের আগে)"
                  value={formOriginalPrice}
                  onChange={(e) => setFormOriginalPrice(e.target.value)}
                />
              </div>
            </div>

            {parseFloat(formPrice) > 0 && parseFloat(formOriginalPrice) > parseFloat(formPrice) && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {Math.round(((parseFloat(formOriginalPrice) - parseFloat(formPrice)) / parseFloat(formOriginalPrice)) * 100)}% ছাড়!
                  <span className="text-xs text-muted-foreground ml-2">
                    (৳{parseFloat(formOriginalPrice)} → ৳{parseFloat(formPrice)}, সাশ্রয় ৳{parseFloat(formOriginalPrice) - parseFloat(formPrice)})
                  </span>
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Active toggle & Order */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Power className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <Label className="text-sm font-medium">সক্রিয়</Label>
                <p className="text-xs text-muted-foreground">প্যাকেজ সক্রিয় বা নিষ্ক্রিয় করুন</p>
              </div>
            </div>
            <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
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

          {/* Save Button */}
          <div className="flex gap-3 pt-2">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
            <Button variant="outline" onClick={() => setViewMode('list')}>বাতিল</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {viewMode === 'list' ? ListView() : EditorView()}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>প্যাকেজ ডিলিট</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত এই প্যাকেজ মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              ডিলিট করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
