'use client'

import { ArrowLeft, Edit, ListOrdered, Plus, Calendar, Timer, FileText, BarChart3, Trophy, Trash2, BookOpen, Crown, GraduationCap, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { CQExamPackageRecord, CQExamSetRecord } from '@/features/cq-exam/types'

const statusLabels: Record<string, string> = {
  'draft': 'ড্রাফট',
  'published': 'প্রকাশিত',
  'archived': 'আর্কাইভ',
  'completed': 'সম্পন্ন',
}

const statusColors: Record<string, string> = {
  'draft': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'published': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'archived': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  'completed': 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

interface CQPackageDetailProps {
  loading: boolean
  currentPackage: CQExamPackageRecord | null
  examSets: CQExamSetRecord[]
  onBack: () => void
  onEditPackage: (pkg: CQExamPackageRecord) => void
  onOpenBulkCreate: () => void
  onOpenCreateSet: () => void
  onOpenQuestionManager: (setId: string) => void
  onOpenSubmissions: (setId: string) => void
  onOpenRetakeRequests: (setId: string) => void
  onOpenLeaderboard: (setId: string, title: string) => void
  onOpenEditSet: (set: CQExamSetRecord) => void
  onDeleteSet: (setId: string) => void
}

export function CQPackageDetail({
  loading, currentPackage, examSets, onBack, onEditPackage, onOpenBulkCreate,
  onOpenCreateSet, onOpenQuestionManager, onOpenSubmissions, onOpenRetakeRequests, onOpenLeaderboard,
  onOpenEditSet, onDeleteSet
}: CQPackageDetailProps) {
  const totalQuestionsAcrossSets = examSets.reduce((sum, set) => sum + set.totalQuestions, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{currentPackage?.title || 'প্যাকেজ বিস্তারিত'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentPackage?.class?.name || ''} • {examSets.length}টি এক্সাম সেট
          </p>
        </div>
        {currentPackage && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onEditPackage(currentPackage)}
          >
            <Edit className="h-3.5 w-3.5" /> সম্পাদনা
          </Button>
        )}
      </div>

      {currentPackage && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">মূল্য</p>
                <p className="font-bold text-emerald-600">৳{currentPackage.price}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">স্ট্যাটাস</p>
                <Badge className={cn('text-xs', statusColors[currentPackage.status] || statusColors['draft'])}>
                  {statusLabels[currentPackage.status] || currentPackage.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">মোট সেট</p>
                <p className="font-semibold">{currentPackage.totalSets}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ক্রেতা</p>
                <p className="font-semibold">{currentPackage._count?.purchases || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className="text-xs gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <GraduationCap className="h-3 w-3" />
                {currentPackage.class?.name}
              </Badge>
              {currentPackage.isPremium && (
                <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 gap-1">
                  <Crown className="h-3 w-3" /> প্রিমিয়াম
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <ListOrdered className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট এক্সাম সেট</p>
              <p className="text-xl font-bold">{examSets.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট প্রশ্ন</p>
              <p className="text-xl font-bold">{totalQuestionsAcrossSets}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" /> এক্সাম সেটসমূহ
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30" size="sm" onClick={onOpenBulkCreate}>
            <ListOrdered className="h-4 w-4" /> বাল্ক ক্রিয়েট সেট
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={onOpenCreateSet}>
            <Plus className="h-4 w-4" /> এক্সাম সেট যোগ করুন
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : examSets.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">কোনো এক্সাম সেট নেই</p>
          <p className="text-sm text-muted-foreground mt-1">নতুন এক্সাম সেট তৈরি করুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {examSets.map((set) => (
            <Card key={set.id} className="border-border/50 hover:shadow-md transition-all overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{set.title}</h4>
                      <Badge className={cn('text-xs', statusColors[set.status] || statusColors['draft'])}>
                        {statusLabels[set.status] || set.status}
                      </Badge>
                      {(set as any).allowRetake && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          পুনরায় যোগ্য
                        </Badge>
                      )}
                    </div>
                    {set.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{set.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-xs gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(set.scheduledDate)}
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Timer className="h-3 w-3" />
                    {set.duration} মিনিট
                  </Badge>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <FileText className="h-3 w-3" />
                    {set.totalQuestions} প্রশ্ন
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {set.totalMarks} নম্বর
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>সময়: {set.startTime} - {set.endTime}</span>
                    {set._count && (
                      <>
                        <span>•</span>
                        <span>{set._count.submissions} জমা</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700"
                      onClick={() => onOpenQuestionManager(set.id)}
                    >
                      <ListOrdered className="h-3.5 w-3.5" /> প্রশ্ন
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => onOpenSubmissions(set.id)}
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> জমা
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700"
                      onClick={() => onOpenRetakeRequests(set.id)}
                    >
                      <User className="h-3.5 w-3.5" /> রিটেক অনুরোধ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700"
                      onClick={() => onOpenLeaderboard(set.id, set.title)}
                    >
                      <Trophy className="h-3.5 w-3.5" /> লিডারবোর্ড
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onOpenEditSet(set)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => onDeleteSet(set.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
