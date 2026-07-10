'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Plus,
  Send,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Megaphone,
  Edit,
  Trash2,
  Loader2,
  Search,
  Eye,
  EyeOff,
  User,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface NotificationRecord {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  userId: string | null
  createdAt: string
  user?: { id: string; name: string; email: string } | null
}

const typeIcons: Record<string, React.ElementType> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
}

const typeColors: Record<string, string> = {
  INFO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  SUCCESS: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  WARNING: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const typeLabels: Record<string, string> = {
  INFO: 'তথ্য',
  SUCCESS: 'সফলতা',
  WARNING: 'সতর্কতা',
  ERROR: 'ত্রুটি',
}

const emptyForm = {
  title: '',
  message: '',
  type: 'INFO',
  link: '',
  isRead: false,
}

const emptySendForm = {
  title: '',
  message: '',
  type: 'INFO',
  target: 'all',
}

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [sendForm, setSendForm] = useState(emptySendForm)
  const [sending, setSending] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (filterType !== 'all') params.set('type', filterType)
      const res = await fetch(`/api/admin/notifications?${params}`)
      if (res.ok) {
        const json = await res.json()
        const d = json.data
        setNotifications(Array.isArray(d?.data) ? d.data : [])
        setTotal(d?.pagination?.total || 0)
        setTotalPages(d?.pagination?.totalPages || 1)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [page, search, filterType])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications])
  const broadcastCount = useMemo(() => notifications.filter((n) => !n.userId).length, [notifications])
  const personalCount = useMemo(() => notifications.filter((n) => !!n.userId).length, [notifications])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (notif: NotificationRecord) => {
    setEditId(notif.id)
    setForm({
      title: notif.title,
      message: notif.message,
      type: notif.type,
      link: notif.link || '',
      isRead: notif.isRead,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং বার্তা আবশ্যক', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const body = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        link: form.link.trim() || null,
        isRead: form.isRead,
      }
      const res = editId
        ? await fetch('/api/admin/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...body }) })
        : await fetch('/api/admin/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, broadcast: true }) })
      if (res.ok) {
        toast({ title: editId ? 'নোটিফিকেশন আপডেট হয়েছে' : 'নোটিফিকেশন তৈরি হয়েছে' })
        setDialogOpen(false)
        fetchNotifications()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/notifications?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'নোটিফিকেশন মুছে ফেলা হয়েছে' }); setDeleteId(null); fetchNotifications() }
      else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const handleBulkDelete = async () => {
    if (bulkDeleteIds.length === 0) return
    try {
      const res = await fetch(`/api/admin/notifications?ids=${bulkDeleteIds.join(',')}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: `${bulkDeleteIds.length}টি নোটিফিকেশন মুছে ফেলা হয়েছে` })
        setBulkDeleteIds([])
        fetchNotifications()
      } else { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
  }

  const toggleRead = async (notif: NotificationRecord) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id, isRead: !notif.isRead }),
      })
      if (res.ok) fetchNotifications()
    } catch { /* */ }
  }

  const handleQuickSend = async () => {
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং বার্তা আবশ্যক', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const body: Record<string, unknown> = {
        title: sendForm.title.trim(),
        message: sendForm.message.trim(),
        type: sendForm.type,
        broadcast: sendForm.target === 'all',
      }
      const res = await fetch('/api/admin/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const json = await res.json()
        const sentCount = json.data?.sentCount || 1
        toast({ title: `${sentCount}টি নোটিফিকেশন পাঠানো হয়েছে` })
        setSendForm(emptySendForm)
        fetchNotifications()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setSending(false) }
  }

  const toggleSelectAll = () => {
    if (bulkDeleteIds.length === notifications.length) {
      setBulkDeleteIds([])
    } else {
      setBulkDeleteIds(notifications.map((n) => n.id))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-emerald-600" />
            নোটিফিকেশন ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            মোট {total}টি নোটিফিকেশন · পঠিত হয়নি {unreadCount}টি
          </p>
        </div>
        <div className="flex gap-2">
          {bulkDeleteIds.length > 0 && (
            <Button variant="destructive" size="sm" className="gap-2" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4" /> {bulkDeleteIds.length}টি মুছুন
            </Button>
          )}
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="h-4 w-4" /> নতুন নোটিফিকেশন
          </Button>
        </div>
      </div>

      {/* Quick Send */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Send className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">দ্রুত পাঠান</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="শিরোনাম" value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} />
            <div className="flex gap-2">
              <Select value={sendForm.type} onValueChange={(v) => setSendForm({ ...sendForm, type: v })}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">তথ্য</SelectItem>
                  <SelectItem value="SUCCESS">সফলতা</SelectItem>
                  <SelectItem value="WARNING">সতর্কতা</SelectItem>
                  <SelectItem value="ERROR">ত্রুটি</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sendForm.target} onValueChange={(v) => setSendForm({ ...sendForm, target: v })}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল</SelectItem>
                  <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Input placeholder="বার্তা লিখুন..." value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} className="flex-1" />
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 shrink-0" onClick={handleQuickSend} disabled={sending}>
              <Send className="h-4 w-4" /> {sending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="শিরোনাম বা বার্তা খুঁজুন..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="ধরন" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ধরন</SelectItem>
            <SelectItem value="INFO">তথ্য</SelectItem>
            <SelectItem value="SUCCESS">সফলতা</SelectItem>
            <SelectItem value="WARNING">সতর্কতা</SelectItem>
            <SelectItem value="ERROR">ত্রুটি</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-1">
            সব <Badge variant="secondary" className="ml-1 text-xs">{total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1">
            পঠিত হয়নি <Badge variant="secondary" className="ml-1 text-xs">{unreadCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-1">
            <Users className="h-3 w-3" /> ব্রডকাস্ট <Badge variant="secondary" className="ml-1 text-xs">{broadcastCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="personal" className="gap-1">
            <User className="h-3 w-3" /> ব্যক্তিগত <Badge variant="secondary" className="ml-1 text-xs">{personalCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {(['all', 'unread', 'broadcast', 'personal'] as const).map((tab) => {
          const filtered = notifications.filter((n) => {
            if (tab === 'unread') return !n.isRead
            if (tab === 'broadcast') return !n.userId
            if (tab === 'personal') return !!n.userId
            return true
          })

          return (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filtered.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" checked={bulkDeleteIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
                  <span className="text-xs text-muted-foreground">সব নির্বাচন করুন</span>
                </div>
              )}
              {filtered.map((notif, idx) => {
                const Icon = typeIcons[notif.type] || Info
                return (
                  <motion.div key={notif.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                    <Card className={`overflow-hidden transition-opacity ${!notif.isRead ? 'border-l-4 border-l-emerald-500' : 'opacity-75'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={bulkDeleteIds.includes(notif.id)} onChange={() => setBulkDeleteIds((prev) => prev.includes(notif.id) ? prev.filter((id) => id !== notif.id) : [...prev, notif.id])} className="mt-1 rounded border-gray-300" />
                          <div className={`p-2 rounded-lg shrink-0 ${typeColors[notif.type] || typeColors.INFO}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-sm">{notif.title}</h3>
                              <Badge variant="outline" className="text-xs shrink-0">{typeLabels[notif.type] || notif.type}</Badge>
                              {!notif.userId && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs shrink-0"><Megaphone className="h-3 w-3 mr-1" />ব্রডকাস্ট</Badge>}
                              {notif.userId && notif.user && <Badge variant="secondary" className="text-xs shrink-0"><User className="h-3 w-3 mr-1" />{notif.user.name || notif.user.email}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{notif.message}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{new Date(notif.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              {notif.link && <span className="text-emerald-600">{notif.link}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRead(notif)} title={notif.isRead ? 'পঠিত হিসেবে চিহ্নিত করুন' : 'পঠিত হয়নি হিসেবে চিহ্নিত করুন'}>
                              {notif.isRead ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(notif)} title="সম্পাদনা">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(notif.id)} title="মুছুন">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>কোনো নোটিফিকেশন নেই</p>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>পূর্ববর্তী</Button>
          <span className="text-sm text-muted-foreground">পৃষ্ঠা {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>পরবর্তী</Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              {editId ? 'নোটিফিকেশন সম্পাদনা' : 'নতুন নোটিফিকেশন তৈরি করুন'}
            </DialogTitle>
            <DialogDescription>
              {editId ? 'নোটিফিকেশনের তথ্য পরিবর্তন করুন' : 'ব্যবহারকারীদের নোটিফিকেশন পাঠান'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>শিরোনাম *</Label>
              <Input placeholder="নোটিফিকেশনের শিরোনাম" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>বার্তা *</Label>
              <Textarea placeholder="নোটিফিকেশনের বার্তা লিখুন..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ধরন</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">তথ্য</SelectItem>
                    <SelectItem value="SUCCESS">সফলতা</SelectItem>
                    <SelectItem value="WARNING">সতর্কতা</SelectItem>
                    <SelectItem value="ERROR">ত্রুটি</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>লিংক (ঐচ্ছিক)</Label>
                <Input placeholder="/premium বা https://..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              </div>
            </div>
            {editId && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label className="text-sm font-medium">পঠিত হিসেবে চিহ্নিত</Label>
                  <p className="text-xs text-muted-foreground">ব্যবহারকারীর কাছে পঠিত হিসেবে দেখাবে</p>
                </div>
                <Switch checked={form.isRead} onCheckedChange={(v) => setForm({ ...form, isRead: v })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleSave} disabled={saving || !form.title.trim() || !form.message.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট' : 'তৈরি করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              নোটিফিকেশন মুছুন
            </DialogTitle>
            <DialogDescription>আপনি কি নিশ্চিত যে এই নোটিফিকেশন মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleDelete}>মুছুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
