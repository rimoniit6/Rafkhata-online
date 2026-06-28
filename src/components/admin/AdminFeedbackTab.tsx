'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquareText, Send, Loader2, ChevronRight, ArrowLeft,
  Clock, CheckCircle2, XCircle, Search, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface FeedbackUser {
  id: string
  name: string | null
  email: string | null
  phone: string | null
}

interface Message {
  id: string
  senderId: string
  senderRole: 'user' | 'admin'
  message: string
  createdAt: string
  sender: { id: string; name: string | null; role: string }
}

interface FeedbackItem {
  id: string
  userId: string
  subject: string
  status: 'pending' | 'replied' | 'closed'
  createdAt: string
  updatedAt: string
  user: FeedbackUser
  messages: Message[]
  _count: { messages: number }
}

const toBengaliNum = (n: number) => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

const padNum = (n: number) => n.toString().padStart(2, '0')

const formatDateBn = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = toBengaliNum(d.getDate())
  const month = toBengaliNum(d.getMonth() + 1)
  const year = toBengaliNum(d.getFullYear())
  const hours = toBengaliNum(Number(padNum(d.getHours())))
  const mins = toBengaliNum(Number(padNum(d.getMinutes())))
  return `${day}/${month}/${year} ${hours}:${mins}`
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  replied: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const statusLabels: Record<string, string> = {
  pending: 'অপেক্ষমান',
  replied: 'উত্তর দেওয়া',
  closed: 'বন্ধ',
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  replied: CheckCircle2,
  closed: XCircle,
}

export default function AdminFeedbackTab() {
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      const res = await fetch(`/api/admin/feedback?${params}`)
      if (res.ok) {
        const json = await res.json()
        setFeedbacks(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [statusFilter, searchQuery])

  useEffect(() => { fetchFeedbacks() }, [fetchFeedbacks])

  const openThread = async (id: string) => {
    setSelectedId(id)
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/admin/feedback/${id}/messages`)
      if (res.ok) {
        const json = await res.json()
        setMessages(json.data?.messages || [])
      }
    } catch { /* */ }
    finally { setMessagesLoading(false) }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedId) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/admin/feedback/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      })
      if (res.ok) {
        const json = await res.json()
        setMessages(prev => [...prev, json.data])
        setReplyText('')
        fetchFeedbacks()
        toast({ title: 'উত্তর পাঠানো হয়েছে' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'উত্তর পাঠাতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally { setSendingReply(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        fetchFeedbacks()
        toast({ title: `স্ট্যাটাস "${statusLabels[status]}" করা হয়েছে` })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    }
  }

  const selectedFeedback = feedbacks.find(f => f.id === selectedId)

  if (selectedId && selectedFeedback) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setMessages([]) }}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{selectedFeedback.subject}</h3>
            <p className="text-xs text-muted-foreground">
              {selectedFeedback.user?.name || 'N/A'} · {selectedFeedback.user?.email}
            </p>
          </div>
          <Badge className={cn('text-xs', statusStyles[selectedFeedback.status])}>
            {statusLabels[selectedFeedback.status]}
          </Badge>
        </div>

        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex', msg.senderRole === 'admin' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-xl p-3',
                  msg.senderRole === 'admin'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-muted rounded-bl-sm',
                )}>
                  <p className="text-xs opacity-70 mb-1">
                    {msg.senderRole === 'admin' ? `অ্যাডমিন (${msg.sender?.name || ''})` : (msg.sender?.name || 'ব্যবহারকারী')}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-[10px] opacity-50 mt-1 text-right">{formatDateBn(msg.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {selectedFeedback.status !== 'closed' && (
            <>
              <Textarea
                className="min-h-[60px] text-sm flex-1"
                placeholder="উত্তর লিখুন..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <Button
                className="shrink-0 self-end"
                size="sm"
                onClick={handleReply}
                disabled={sendingReply || !replyText.trim()}
              >
                {sendingReply ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 self-end"
            onClick={() => updateStatus(selectedId, selectedFeedback.status === 'closed' ? 'pending' : 'closed')}
          >
            {selectedFeedback.status === 'closed' ? 'পুনরায় খুলুন' : 'বন্ধ করুন'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="size-4 text-emerald-600" />
            ব্যবহারকারী ফিডব্যাক
          </CardTitle>
          <CardDescription>ব্যবহারকারীদের মতামত ও অনুরোধ দেখুন এবং উত্তর দিন</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['', 'pending', 'replied', 'closed'].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  className={cn('text-xs', s === 'pending' && statusFilter === s && 'bg-amber-600')}
                  onClick={() => setStatusFilter(s)}
                >
                  {s ? statusLabels[s] : 'সব'}
                </Button>
              ))}
              <Button variant="ghost" size="icon" className="shrink-0" onClick={fetchFeedbacks} aria-label="রিফ্রেশ">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquareText className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">কোনো ফিডব্যাক নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {feedbacks.map((fb) => {
                const StatusIcon = statusIcons[fb.status]
                return (
                  <Card
                    key={fb.id}
                    className="cursor-pointer hover:shadow-md transition-all border-border/50"
                    onClick={() => openThread(fb.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{fb.subject}</h4>
                            {fb._count.messages > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                {toBengaliNum(fb._count.messages)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {fb.user?.name || 'N/A'} · {formatDateBn(fb.createdAt)}
                          </p>
                        </div>
                        <Badge className={cn('text-xs shrink-0', statusStyles[fb.status])}>
                          {StatusIcon && <StatusIcon className="size-3 mr-1" />}
                          {statusLabels[fb.status]}
                        </Badge>
                        <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
