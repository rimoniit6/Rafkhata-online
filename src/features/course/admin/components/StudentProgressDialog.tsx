'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Circle, User, Mail, Phone, Calendar, Crown, Award, BookOpen, PenSquare, FileQuestion, AlignLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'

const CONTENT_TYPE_LABEL: Record<string, string> = {
  LIVE: 'লাইভ ক্লাস',
  RECORDED: 'রেকর্ডেড ক্লাস',
}

interface ProgressItem {
  contentId: string
  title: string | null
  contentType: string
  displayOrder: number
  completed: boolean
  completedAt: string | null
}

interface ActivityProgress {
  total: number
  completed: number
}

interface StudentData {
  user: { id: string; name: string | null; email: string; avatar: string | null; phone: string | null }
  enrollment: { status: string; type: string; enrolledAt: string; completedAt: string | null } | null
  purchase: { purchasedAt: string; isActive: boolean } | null
  progress: ProgressItem[]
  totalContents: number
  completedCount: number
  progressPercent: number
  overallProgress?: ActivityProgress & { percent: number }
  breakdown?: {
    lessons: ActivityProgress
    assignments: ActivityProgress
    mcqExams: ActivityProgress
    cqExams: ActivityProgress
  }
}

interface Props {
  courseId: string
  userId: string
  userName: string
  open: boolean
  onClose: () => void
}

export default function StudentProgressDialog({ courseId, userId, userName, open, onClose }: Props) {
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    fetch(`/api/admin/courses?action=student-progress&courseId=${courseId}&userId=${userId}`)
      .then(r => r.json())
      .then(json => setData(json.data || json))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [open, userId, courseId])

  const statusColor = data?.enrollment?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
    data?.enrollment?.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
  const statusLabel = data?.enrollment?.status === 'ACTIVE' ? 'একটিভ' :
    data?.enrollment?.status === 'COMPLETED' ? 'সম্পন্ন' : 'নিষ্ক্রিয়'

  const overall = data?.overallProgress
  const bd = data?.breakdown

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{userName} — কোর্স অগ্রগতি</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !data ? (
          <div className="py-12 text-center text-muted-foreground">তথ্য লোড করা যায়নি</div>
        ) : (
          <div className="space-y-5">
            {/* User Info */}
            <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{data.user.name?.charAt(0) || data.user.email.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{data.user.name || 'নাম নেই'}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {data.user.email}
                </div>
                {data.user.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {data.user.phone}
                  </div>
                )}
              </div>
              <Badge className={statusColor}>{statusLabel}</Badge>
            </div>

            {/* Enrollment Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {data.enrollment && (
                <>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">এনরোল টাইপ</p>
                    <p className="font-medium mt-0.5 capitalize">{data.enrollment.type === 'FREE' ? 'ফ্রি' : data.enrollment.type === 'PAID' ? 'পেইড' : 'গ্রান্টেড'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">এনরোল তারিখ</p>
                    <p className="font-medium mt-0.5">{new Date(data.enrollment.enrolledAt).toLocaleDateString('bn-BD')}</p>
                  </div>
                </>
              )}
              {data.purchase && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">ক্রয় তারিখ</p>
                  <p className="font-medium mt-0.5">{new Date(data.purchase.purchasedAt).toLocaleDateString('bn-BD')}</p>
                </div>
              )}
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">মোট ক্লাস</p>
                <p className="font-medium mt-0.5">{data.totalContents}টি</p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">সামগ্রিক অগ্রগতি</span>
                <span className="text-sm font-bold">{overall ? overall.percent : data.progressPercent}%</span>
              </div>
              <Progress value={overall ? overall.percent : data.progressPercent} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">{overall ? `${overall.completed}/${overall.total}` : `${data.completedCount}/${data.totalContents}`} সম্পন্ন</p>
            </div>

            {/* Activity Breakdown */}
            {bd && (
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">কার্যকলাপ ভাঙ্গন</h4>
                <div className="grid grid-cols-2 gap-2">
                  <BreakdownCard icon={BookOpen} label="ক্লাস" total={bd.lessons.total} completed={bd.lessons.completed} />
                  <BreakdownCard icon={PenSquare} label="অ্যাসাইনমেন্ট" total={bd.assignments.total} completed={bd.assignments.completed} />
                  <BreakdownCard icon={FileQuestion} label="MCQ" total={bd.mcqExams.total} completed={bd.mcqExams.completed} />
                  <BreakdownCard icon={AlignLeft} label="CQ" total={bd.cqExams.total} completed={bd.cqExams.completed} />
                </div>
              </div>
            )}

            {/* Content Progress List */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">কন্টেন্ট তালিকা</p>
              {data.progress.map((item, idx) => {
                const typeInfo = { label: CONTENT_TYPE_LABEL[item.contentType] || item.contentType }
                return (
                  <div
                    key={item.contentId}
                    className={`flex items-center gap-3 rounded-lg border p-2.5 text-sm ${item.completed ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    {item.completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="flex-1 truncate">{item.title || `${typeInfo.label} #${idx + 1}`}</span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">{typeInfo.label}</Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function BreakdownCard({ icon: Icon, label, total, completed }: { icon: React.ElementType; label: string; total: number; completed: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="rounded-lg bg-muted/30 p-2.5 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{completed}/{total}</span>
        <span className="text-xs font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
