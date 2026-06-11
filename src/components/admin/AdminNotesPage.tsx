'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  StickyNote,
  Trash2,
  Search,
  AlertTriangle,
  User,
  FileText,
  Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useTableSelection } from '@/hooks/use-table-selection'
import DataTable, { type ColumnDef, type BulkAction } from '@/components/shared/DataTable'
import { cn } from '@/lib/utils'

// ─── Data Model ───────────────────────────────────────────────
interface NoteUser {
  id: string
  name: string | null
  email: string
  avatar: string | null
}

interface NoteRecord {
  id: string
  userId: string
  contentId: string
  contentType: string
  content: string
  createdAt: string
  updatedAt: string
  user: NoteUser
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Content type labels ──────────────────────────────────────
const CONTENT_TYPE_LABELS: Record<string, string> = {
  lecture: 'লেকচার',
  mcq: 'MCQ',
  cq: 'CQ',
  exam: 'এক্সাম',
  suggestion: 'সাজেশন',
  'board-mcq': 'বোর্ড MCQ',
  'board-cq': 'বোর্ড CQ',
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  lecture: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  mcq: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  cq: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  exam: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  suggestion: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'board-mcq': 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  'board-cq': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
}

// ─── Helpers ──────────────────────────────────────────────────
function formatDateBn(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function truncate(text: string, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Component ────────────────────────────────────────────────
export default function AdminNotesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterContentType, setFilterContentType] = useState<string>('all')
  const [filterUserId, setFilterUserId] = useState('')

  // ── Fetch Notes ──
  const fetchNotes = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('limit', '20')
        if (filterContentType && filterContentType !== 'all')
          params.set('contentType', filterContentType)
        if (filterUserId) params.set('userId', filterUserId)
        if (searchQuery) params.set('search', searchQuery)

        const res = await fetch(`/api/admin/notes?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          setNotes(Array.isArray(json.data?.data) ? json.data.data : [])
          setPagination(json.data?.pagination || { page, limit: 20, total: 0, totalPages: 0 })
        }
      } catch {
        /* */
      } finally {
        setLoading(false)
      }
    },
    [filterContentType, filterUserId, searchQuery]
  )

  useEffect(() => {
    fetchNotes(1)
  }, [fetchNotes])

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/notes?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'নোট মুছে ফেলা হয়েছে' })
        setDeleteId(null)
        fetchNotes(pagination.page)
      } else {
        toast({ title: 'ত্রুটি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const selection = useTableSelection(notes)

  const handleBulkDelete = async (ids: string[]) => {
    const res = await fetch(`/api/admin/notes?ids=${ids.join(',')}`, { method: 'DELETE' })
    if (res.ok) { toast({ title: 'মুছে ফেলা হয়েছে' }); selection.clearSelection(); fetchNotes(pagination.page) }
    else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  // ── Stats ──
  const stats = {
    total: pagination.total,
    contentTypes: Array.from(new Set(notes.map((n) => n.contentType))).length,
    users: Array.from(new Set(notes.map((n) => n.userId))).length,
  }

  // ── Pagination ──
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    fetchNotes(page)
  }

  const columns: ColumnDef<NoteRecord>[] = [
    {
      key: 'user',
      header: 'ব্যবহারকারী',
      render: (note) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={note.user?.avatar || undefined} />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px]">
              {note.user?.name ? getInitials(note.user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[120px]">{note.user?.name || 'N/A'}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{note.user?.email || ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contentType',
      header: 'কন্টেন্ট টাইপ',
      headerClass: 'w-32',
      render: (note) => (
        <Badge className={cn('text-[10px] px-1.5 py-0', CONTENT_TYPE_COLORS[note.contentType] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300')}>
          {CONTENT_TYPE_LABELS[note.contentType] || note.contentType}
        </Badge>
      ),
    },
    {
      key: 'contentId',
      header: 'কন্টেন্ট ID',
      headerClass: 'w-28',
      render: (note) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{truncate(note.contentId, 12)}</code>,
    },
    {
      key: 'content',
      header: 'নোট প্রিভিউ',
      render: (note) => <p className="text-sm text-muted-foreground line-clamp-2 max-w-[300px]">{truncate(note.content.replace(/<[^>]*>/g, ''), 120)}</p>,
    },
    {
      key: 'createdAt',
      header: 'তারিখ',
      headerClass: 'w-36',
      render: (note) => <p className="text-xs text-muted-foreground">{formatDateBn(note.createdAt)}</p>,
    },
    {
      key: 'actions',
      header: '',
      headerClass: 'w-20',
      render: (note) => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(note.id)} title="মুছুন">
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const bulkActions: BulkAction[] = [
    {
      label: 'মুছুন',
      icon: <Trash2 className="size-4" />,
      variant: 'destructive',
      handler: handleBulkDelete,
    },
  ]

  const filters = (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="নোট খুঁজুন…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <Select value={filterContentType} onValueChange={setFilterContentType}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="কন্টেন্ট টাইপ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">সকল টাইপ</SelectItem>
          <SelectItem value="lecture">লেকচার</SelectItem>
          <SelectItem value="mcq">MCQ</SelectItem>
          <SelectItem value="cq">CQ</SelectItem>
          <SelectItem value="exam">এক্সাম</SelectItem>
          <SelectItem value="suggestion">সাজেশন</SelectItem>
          <SelectItem value="board-mcq">বোর্ড MCQ</SelectItem>
          <SelectItem value="board-cq">বোর্ড CQ</SelectItem>
        </SelectContent>
      </Select>
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="ইউজার ID" value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className="pl-9 w-full sm:w-40" />
      </div>
    </div>
  )

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <StickyNote className="h-6 w-6 text-emerald-600" />
            নোট ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {stats.total}টি নোট
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <StickyNote className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">মোট নোট</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                <FileText className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.contentTypes}</p>
                <p className="text-xs text-muted-foreground">কন্টেন্ট টাইপ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <User className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.users}</p>
                <p className="text-xs text-muted-foreground">ব্যবহারকারী</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={notes}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={(p) => goToPage(p)}
        loading={loading}
        selectable
        selectedIds={selection.selectedIds}
        onToggleOne={selection.toggleOne}
        onToggleAll={selection.toggleAll}
        allVisibleSelected={selection.allVisibleSelected}
        someVisibleSelected={selection.someVisibleSelected}
        bulkActions={bulkActions}
        emptyMessage="কোনো নোট পাওয়া যায়নি"
        filters={filters}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              নোট মুছুন
            </DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে এই নোট মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
