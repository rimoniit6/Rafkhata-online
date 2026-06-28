'use client'

import { ArrowLeft, Edit, ListOrdered, Plus, Calendar, Timer, FileQuestion, BarChart3, Trophy, UserCheck, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { 
  MCQExamPackageRecord, 
  MCQExamSetRecord 
} from '@/types/admin-mcq-exam'
import { 
  statusLabels, 
  statusColors, 
  formatDate 
} from './MCQExamConstants'

interface PackageDetailProps {
  loading: boolean
  currentPackage: MCQExamPackageRecord | null
  examSets: MCQExamSetRecord[]
  onBack: () => void
  onEditPackage: (pkg: MCQExamPackageRecord) => void
  onOpenBulkCreate: () => void
  onOpenCreateSet: () => void
  onOpenQuestionManager: (setId: string) => void
  onOpenResults: (setId: string) => void
  onOpenLeaderboard: (setId: string, title: string) => void
  onOpenRetakeRequests: (setId: string) => void
  onOpenEditSet: (set: MCQExamSetRecord) => void
  onDeleteSet: (setId: string) => void
}

export function PackageDetail({
  loading, currentPackage, examSets, onBack, onEditPackage, onOpenBulkCreate,
  onOpenCreateSet, onOpenQuestionManager, onOpenResults, onOpenLeaderboard,
  onOpenRetakeRequests, onOpenEditSet, onDeleteSet
}: PackageDetailProps) {
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
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-emerald-600" /> এক্সাম সেটসমূহ
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30" size="sm" onClick={onOpenBulkCreate}>
            <ListOrdered className="h-4 w-4" /> দ্রুত সেট তৈরি করুন
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={onOpenCreateSet}>
            <Plus className="h-4 w-4" /> নতুন সেট
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : examSets.length === 0 ? (
        <div className="text-center py-12">
          <ListOrdered className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
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
                    <FileQuestion className="h-3 w-3" />
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
                        <span>{set._count.results} ফলাফল</span>
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
                      onClick={() => onOpenResults(set.id)}
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> ফলাফল
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
                      size="sm"
                      className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700"
                      onClick={() => onOpenRetakeRequests(set.id)}
                    >
                      <UserCheck className="h-3.5 w-3.5" /> রিটেক
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
