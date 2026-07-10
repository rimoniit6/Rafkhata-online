'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { fetchCsrfToken } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'
import { AnimatePresence,motion } from 'framer-motion'
import {
ArrowLeft,
CheckCircle2,
ChevronRight,
Clock,
Loader2,
MessageSquareText,Plus,Send,
XCircle
} from 'lucide-react'
import { useCallback,useEffect,useState } from 'react'

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
  subject: string
  status: 'pending' | 'replied' | 'closed'
  createdAt: string
  updatedAt: string
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'অপেক্ষমান', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  replied: { label: 'উত্তর দেওয়া', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  closed: { label: 'বন্ধ', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
}

export default function FeedbackSection() {
  const _user = useAuthUser()
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await fetch('/api/user/feedback')
      if (res.ok) {
        const json = await res.json()
        setFeedbacks(Array.isArray(json.data) ? json.data : [])
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchFeedbacks() }, [fetchFeedbacks])

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    try {
      const csrfToken = await fetchCsrfToken()
      const res = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      })
      if (res.ok) {
        toast({ title: 'ফিডব্যাক পাঠানো হয়েছে' })
        setSubject('')
        setMessage('')
        setShowForm(false)
        fetchFeedbacks()
      } else {
        toast({ title: 'ত্রুটি', description: 'পাঠাতে সমস্যা হয়েছে', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' })
    } finally { setSubmitting(false) }
  }

  const openThread = async (id: string) => {
    setSelectedId(id)
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/user/feedback/${id}/messages`)
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
      const csrfToken = await fetchCsrfToken()
      const res = await fetch(`/api/user/feedback/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) },
        body: JSON.stringify({ message: replyText.trim() }),
      })
      if (res.ok) {
        const json = await res.json()
        setMessages(prev => [...prev, json.data])
        setReplyText('')
        fetchFeedbacks()
      }
    } catch { /* */ }
    finally { setSendingReply(false) }
  }

  const selectedFeedback = feedbacks.find(f => f.id === selectedId)

  if (selectedId && selectedFeedback) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setMessages([]) }}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{selectedFeedback.subject}</h3>
            <p className="text-xs text-muted-foreground">
              {formatDateBn(selectedFeedback.createdAt)} · {toBengaliNum(selectedFeedback._count.messages)}টি বার্তা
            </p>
          </div>
          <Badge className={cn('text-xs', statusConfig[selectedFeedback.status]?.color)}>
            {statusConfig[selectedFeedback.status]?.label}
          </Badge>
        </div>

        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex', msg.senderRole === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-xl p-3',
                  msg.senderRole === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-muted rounded-bl-sm',
                )}>
                  <p className="text-xs opacity-70 mb-1">
                    {msg.senderRole === 'user' ? 'আপনি' : (msg.sender?.name || 'অ্যাডমিন')}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-[10px] opacity-50 mt-1 text-right">
                    {formatDateBn(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedFeedback.status !== 'closed' && (
          <div className="flex gap-2 pt-2">
            <Textarea
              className="min-h-[60px] text-sm"
              placeholder="আপনার উত্তর লিখুন..."
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
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">ফিডব্যাক ও অনুরোধ</h3>
          <p className="text-sm text-muted-foreground">
            আপনার মতামত বা কন্টেন্ট অনুরোধ জানান
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="size-4" />
            নতুন
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="বিষয় (যেমন: নতুন কন্টেন্ট অনুরোধ)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <Textarea
                  placeholder="বিস্তারিত লিখুন..."
                  className="min-h-[100px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                    বাতিল
                  </Button>
                  <Button size="sm" onClick={handleSubmit} disabled={submitting || !subject.trim() || !message.trim()}>
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    পাঠান
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquareText className="size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">কোনো ফিডব্যাক নেই</p>
          <p className="text-xs text-muted-foreground/60 mt-1">আপনার প্রথম ফিডব্যাক পাঠান</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feedbacks.map((fb) => {
            const StatusIcon = statusConfig[fb.status]?.icon
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
                        {fb._count.messages > 1 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            {toBengaliNum(fb._count.messages)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBn(fb.createdAt)}
                      </p>
                    </div>
                    <Badge className={cn('text-xs shrink-0', statusConfig[fb.status]?.color)}>
                      {StatusIcon && <StatusIcon className="size-3 mr-1" />}
                      {statusConfig[fb.status]?.label}
                    </Badge>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
