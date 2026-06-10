'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Plus,
  Send,
  Info,
  AlertTriangle,
  CheckCircle,
  Megaphone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  announcement: Megaphone,
}

const typeColors: Record<string, string> = {
  info: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  success: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  announcement: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}

const typeLabels: Record<string, string> = { info: 'তথ্য', warning: 'সতর্কতা', success: 'সফলতা', announcement: 'ঘোষণা' }

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all' })
  const [sending, setSending] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications?limit=20')
      if (res.ok) {
        const json = await res.json()
        setNotifications(Array.isArray(json.data?.data) ? json.data.data : [])
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const handleSendNotification = async () => {
    if (!form.title || !form.message) {
      toast({ title: 'ত্রুটি', description: 'শিরোনাম এবং বার্তা আবশ্যক', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        message: form.message,
        type: form.type === 'announcement' ? 'info' : form.type,
        broadcast: form.target === 'all',
      }

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast({ title: 'নোটিফিকেশন পাঠানো হয়েছে' })
        setDialogOpen(false)
        setForm({ title: '', message: '', type: 'info', target: 'all' })
        fetchNotifications()
      } else {
        const json = await res.json()
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'ত্রুটি', variant: 'destructive' }) }
    finally { setSending(false) }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
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
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-emerald-600" /> নোটিফিকেশন ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground text-sm mt-1">ব্যবহারকারীদের নোটিফিকেশন পাঠান</p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> নতুন নোটিফিকেশন
        </Button>
      </div>

      {/* Quick Send Form */}
      <Card>
        <CardHeader><CardTitle className="text-base">দ্রুত নোটিফিকেশন পাঠান</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>শিরোনাম</Label><Input placeholder="নোটিফিকেশনের শিরোনাম..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>ধরন</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">তথ্য</SelectItem>
                    <SelectItem value="warning">সতর্কতা</SelectItem>
                    <SelectItem value="success">সফলতা</SelectItem>
                    <SelectItem value="announcement">ঘোষণা</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>টার্গেট</Label>
                <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল</SelectItem>
                    <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                    <SelectItem value="free">ফ্রি</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2"><Label>বার্তা</Label><Textarea placeholder="নোটিফিকেশনের বার্তা লিখুন..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} /></div>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSendNotification} disabled={sending}>
            <Send className="h-4 w-4" /> {sending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">নোটিফিকেশন ইতিহাস</h2>
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Info
            return (
              <motion.div key={notif.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${typeColors[notif.type] || typeColors.info}`}><Icon className="h-4 w-4" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{notif.title}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">{typeLabels[notif.type] || notif.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>টার্গেট: {notif.userId ? 'ব্যক্তিগত' : 'সকল'}</span>
                          <span>{new Date(notif.createdAt).toLocaleDateString('bn-BD')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
          {notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">কোনো নোটিফিকেশন নেই</div>
          )}
        </div>
      </div>

      {/* Create Dialog (mobile-friendly) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>নতুন নোটিফিকেশন</DialogTitle><DialogDescription>ব্যবহারকারীদের নোটিফিকেশন পাঠান</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>শিরোনাম *</Label><Input placeholder="শিরোনাম" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>বার্তা *</Label><Textarea placeholder="বার্তা লিখুন..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>ধরন</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">তথ্য</SelectItem><SelectItem value="warning">সতর্কতা</SelectItem><SelectItem value="success">সফলতা</SelectItem><SelectItem value="announcement">ঘোষণা</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>টার্গেট</Label>
                <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল</SelectItem><SelectItem value="premium">প্রিমিয়াম</SelectItem><SelectItem value="free">ফ্রি</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSendNotification} disabled={sending}>
              <Send className="h-4 w-4" /> {sending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
